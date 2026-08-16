package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
)

// RunnerService coordinates the sandboxed compilation and execution of Vipr code.
type RunnerService struct {
	cfg       *config.Config
	semaphore chan struct{}
}

// NewRunnerService initializes the runner service with concurrency throttling.
func NewRunnerService(cfg *config.Config) *RunnerService {
	return &RunnerService{
		cfg:       cfg,
		semaphore: make(chan struct{}, cfg.MaxConcurrentRuns),
	}
}

// Execute handles code compilation and execution with timeouts, concurrency limits, and memory safety.
func (s *RunnerService) Execute(ctx context.Context, req models.RunRequest) (models.RunResponse, error) {
	// Acquire concurrency slot (prevents OOM crashes under burst traffic on free tier instances)
	select {
	case s.semaphore <- struct{}{}:
		defer func() { <-s.semaphore }()
	case <-ctx.Done():
		return models.RunResponse{
			Status: "timeout",
			Stderr: "Server busy: timed out waiting for an execution slot. Please retry shortly.",
		}, ctx.Err()
	}

	start := time.Now()

	// 1. Create a unique isolated temporary directory
	tempDir, err := os.MkdirTemp("", "vipr-run-*")
	if err != nil {
		slog.Error("Failed to create temporary sandbox directory", "error", err)
		return models.RunResponse{
			Status: "runtime_error",
			Stderr: "Internal server error: unable to create execution sandbox.",
		}, err
	}
	defer func() {
		if remErr := os.RemoveAll(tempDir); remErr != nil {
			slog.Warn("Failed to clean up temp directory", "dir", tempDir, "error", remErr)
		}
	}()

	// 2. Write user code to main.vipr inside temp directory
	sourceFile := filepath.Join(tempDir, "main.vipr")
	if err := os.WriteFile(sourceFile, []byte(req.Code), 0600); err != nil {
		slog.Error("Failed to write source file", "path", sourceFile, "error", err)
		return models.RunResponse{
			Status: "runtime_error",
			Stderr: "Internal server error: unable to write source file.",
		}, err
	}

	binaryName := "main_bin"
	binaryPath := filepath.Join(tempDir, binaryName)

	// 3. Phase 1: Compile Vipr code to native binary via Vipr CLI
	compileCtx, compileCancel := context.WithTimeout(ctx, s.cfg.CompileTimeout)
	defer compileCancel()

	compileCmd := exec.CommandContext(compileCtx, s.cfg.ViprBinPath, "main.vipr", "-o", binaryName)
	compileCmd.Dir = tempDir // Crucial: Isolates temp_vipr_output.cpp and outputs inside tempDir

	compileStdout := newBoundedBuffer(int(s.cfg.MaxOutputBytes))
	compileStderr := newBoundedBuffer(int(s.cfg.MaxOutputBytes))
	compileCmd.Stdout = compileStdout
	compileCmd.Stderr = compileStderr

	compileErr := compileCmd.Run()
	if compileCtx.Err() == context.DeadlineExceeded {
		slog.Warn("Compilation timed out", "timeout", s.cfg.CompileTimeout)
		return models.RunResponse{
			Status:     "timeout",
			Stderr:     fmt.Sprintf("Compilation timed out (exceeded %v limit).", s.cfg.CompileTimeout),
			DurationMs: time.Since(start).Milliseconds(),
		}, nil
	}

	if compileErr != nil {
		errOutput := strings.TrimSpace(compileStderr.String())
		if errOutput == "" {
			errOutput = strings.TrimSpace(compileStdout.String())
		}
		if errOutput == "" {
			errOutput = fmt.Sprintf("Compilation failed: %v", compileErr)
		}

		return models.RunResponse{
			Status:     "compile_error",
			Stderr:     errOutput,
			DurationMs: time.Since(start).Milliseconds(),
		}, nil
	}

	// 4. Phase 2: Execute compiled native binary
	execCtx, execCancel := context.WithTimeout(ctx, s.cfg.ExecTimeout)
	defer execCancel()

	execCmd := exec.CommandContext(execCtx, binaryPath)
	execCmd.Dir = tempDir

	if req.Stdin != "" {
		execCmd.Stdin = strings.NewReader(req.Stdin)
	}

	execStdout := newBoundedBuffer(int(s.cfg.MaxOutputBytes))
	execStderr := newBoundedBuffer(int(s.cfg.MaxOutputBytes))
	execCmd.Stdout = execStdout
	execCmd.Stderr = execStderr

	execErr := execCmd.Run()
	durationMs := time.Since(start).Milliseconds()

	if execCtx.Err() == context.DeadlineExceeded {
		slog.Warn("Execution timed out", "timeout", s.cfg.ExecTimeout)
		return models.RunResponse{
			Status:     "timeout",
			Stdout:     execStdout.String(),
			Stderr:     fmt.Sprintf("Execution timed out (exceeded %v limit). Check for infinite loops or long-running operations.", s.cfg.ExecTimeout),
			DurationMs: durationMs,
		}, nil
	}

	if execErr != nil {
		stderrOutput := strings.TrimSpace(execStderr.String())
		var exitErr *exec.ExitError
		if errors.As(execErr, &exitErr) {
			if stderrOutput == "" {
				stderrOutput = fmt.Sprintf("Runtime error: process exited with code %d", exitErr.ExitCode())
			}
		} else if stderrOutput == "" {
			stderrOutput = fmt.Sprintf("Runtime error: %v", execErr)
		}

		return models.RunResponse{
			Status:     "runtime_error",
			Stdout:     execStdout.String(),
			Stderr:     stderrOutput,
			DurationMs: durationMs,
		}, nil
	}

	return models.RunResponse{
		Status:     "success",
		Stdout:     execStdout.String(),
		Stderr:     execStderr.String(),
		DurationMs: durationMs,
	}, nil
}

// boundedBuffer prevents unbounded memory growth by capping written bytes.
type boundedBuffer struct {
	buf   bytes.Buffer
	limit int
	total int
}

func newBoundedBuffer(limit int) *boundedBuffer {
	if limit <= 0 {
		limit = 262144 // 256 KB default
	}
	return &boundedBuffer{limit: limit}
}

func (b *boundedBuffer) Write(p []byte) (int, error) {
	b.total += len(p)
	remaining := b.limit - b.buf.Len()
	if remaining > 0 {
		if len(p) > remaining {
			b.buf.Write(p[:remaining])
		} else {
			b.buf.Write(p)
		}
	}
	return len(p), nil
}

func (b *boundedBuffer) String() string {
	str := b.buf.String()
	if b.total > b.limit {
		str += fmt.Sprintf("\n[Output truncated: exceeded maximum limit of %d bytes]", b.limit)
	}
	return str
}
