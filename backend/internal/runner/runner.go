package runner

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
)

// Runner manages the compilation and sandboxed execution of Vipr programs.
type Runner struct {
	cfg       *config.Config
	logger    *slog.Logger
	semaphore chan struct{}
}

// NewRunner instantiates a Runner with concurrency controls.
func NewRunner(cfg *config.Config, logger *slog.Logger) *Runner {
	return &Runner{
		cfg:       cfg,
		logger:    logger,
		semaphore: make(chan struct{}, cfg.MaxConcurrentRuns),
	}
}

// CheckEnvironment verifies that the Vipr compiler and G++ are installed and accessible.
func (r *Runner) CheckEnvironment() error {
	// 1. Check Vipr compiler
	viprPath, err := exec.LookPath(r.cfg.ViprBinPath)
	if err != nil {
		return fmt.Errorf("vipr compiler binary not found at '%s': %w", r.cfg.ViprBinPath, err)
	}

	// 2. Check g++ compiler
	gppPath, err := exec.LookPath("g++")
	if err != nil {
		return fmt.Errorf("g++ compiler not found in PATH: %w", err)
	}

	r.logger.Info("compiler environment verified",
		slog.String("vipr_bin", viprPath),
		slog.String("g++_bin", gppPath),
		slog.Int("max_concurrent_runs", r.cfg.MaxConcurrentRuns),
	)
	return nil
}

// Execute handles the complete workflow: write temp file -> compile -> execute binary -> cleanup.
func (r *Runner) Execute(ctx context.Context, req models.RunRequest) (*models.RunResponse, error) {
	// Acquire semaphore slot for resource concurrency limiting
	select {
	case r.semaphore <- struct{}{}:
		defer func() { <-r.semaphore }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	startTime := time.Now()

	// 1. Create an isolated temporary working directory
	tmpDir, err := os.MkdirTemp("", "vipr_run_*")
	if err != nil {
		r.logger.Error("failed to create temporary execution directory", slog.Any("error", err))
		return nil, fmt.Errorf("failed to create sandbox directory: %w", err)
	}
	// Guarantee cleanup of all created artifacts and binaries
	defer func() {
		if removeErr := os.RemoveAll(tmpDir); removeErr != nil {
			r.logger.Warn("failed to cleanup temp directory",
				slog.String("path", tmpDir),
				slog.Any("error", removeErr),
			)
		}
	}()

	sourcePath := filepath.Join(tmpDir, "main.vipr")
	binaryPath := filepath.Join(tmpDir, "main_bin")

	// 2. Write source code to disk
	if err := os.WriteFile(sourcePath, []byte(req.Code), 0600); err != nil {
		r.logger.Error("failed to write source file", slog.Any("error", err))
		return nil, fmt.Errorf("failed to write source file: %w", err)
	}

	// 3. Phase 1: Compile with Vipr Compiler
	compileCtx, compileCancel := context.WithTimeout(ctx, r.cfg.CompileTimeout)
	defer compileCancel()

	compileCmd := exec.CommandContext(compileCtx, r.cfg.ViprBinPath, sourcePath, "-o", binaryPath)
	compileCmd.Dir = tmpDir

	var compileStdout, compileStderr bytes.Buffer
	compileCmd.Stdout = limitWriter(&compileStdout, r.cfg.MaxOutputBytes)
	compileCmd.Stderr = limitWriter(&compileStderr, r.cfg.MaxOutputBytes)

	compileErr := compileCmd.Run()
	if compileCtx.Err() == context.DeadlineExceeded {
		return &models.RunResponse{
			Status:     models.StatusTimeout,
			Stderr:     fmt.Sprintf("Compilation timed out after %v", r.cfg.CompileTimeout),
			DurationMs: time.Since(startTime).Milliseconds(),
		}, nil
	}

	if compileErr != nil {
		// Compilation failed (syntax, type mismatch, semantic error, or g++ linker error)
		var errOutput string
		if compileStderr.Len() > 0 {
			errOutput = compileStderr.String()
		} else if compileStdout.Len() > 0 {
			errOutput = compileStdout.String()
		} else {
			errOutput = compileErr.Error()
		}

		return &models.RunResponse{
			Status:     models.StatusCompileError,
			Stderr:     cleanDiagnostics(errOutput, tmpDir),
			DurationMs: time.Since(startTime).Milliseconds(),
		}, nil
	}

	// 4. Phase 2: Execute Compiled Native Binary
	execCtx, execCancel := context.WithTimeout(ctx, r.cfg.ExecTimeout)
	defer execCancel()

	execCmd := exec.CommandContext(execCtx, binaryPath)
	execCmd.Dir = tmpDir

	// Attach standard input (stdin) if provided
	if req.Stdin != "" {
		execCmd.Stdin = strings.NewReader(req.Stdin)
	}

	var execStdout, execStderr bytes.Buffer
	execCmd.Stdout = limitWriter(&execStdout, r.cfg.MaxOutputBytes)
	execCmd.Stderr = limitWriter(&execStderr, r.cfg.MaxOutputBytes)

	execStartTime := time.Now()
	execErr := execCmd.Run()
	execDurationMs := time.Since(execStartTime).Milliseconds()

	// Check for execution timeout (e.g. infinite loop)
	if execCtx.Err() == context.DeadlineExceeded {
		return &models.RunResponse{
			Status:     models.StatusTimeout,
			Stdout:     execStdout.String(),
			Stderr:     fmt.Sprintf("Execution timed out after %v (limit exceeded)", r.cfg.ExecTimeout),
			DurationMs: execDurationMs,
		}, nil
	}

	// Check for runtime error / crash / non-zero exit code
	if execErr != nil {
		var exitErr *exec.ExitError
		stderrMsg := execStderr.String()
		if errors.As(execErr, &exitErr) {
			if stderrMsg == "" {
				stderrMsg = fmt.Sprintf("Process exited with code %d", exitErr.ExitCode())
			}
		} else if stderrMsg == "" {
			stderrMsg = execErr.Error()
		}

		return &models.RunResponse{
			Status:     models.StatusRuntimeError,
			Stdout:     execStdout.String(),
			Stderr:     stderrMsg,
			DurationMs: execDurationMs,
		}, nil
	}

	// 5. Execution Succeeded
	return &models.RunResponse{
		Status:     models.StatusSuccess,
		Stdout:     execStdout.String(),
		Stderr:     execStderr.String(),
		DurationMs: execDurationMs,
	}, nil
}

// limitWriter creates an io.Writer that limits written bytes to prevent buffer bloat.
func limitWriter(w io.Writer, limit int64) io.Writer {
	return &boundedWriter{w: w, remaining: limit}
}

type boundedWriter struct {
	w         io.Writer
	remaining int64
}

func (bw *boundedWriter) Write(p []byte) (n int, err error) {
	if bw.remaining <= 0 {
		return len(p), nil // Silently discard extra output past limit
	}
	toWrite := p
	if int64(len(p)) > bw.remaining {
		toWrite = p[:bw.remaining]
	}
	written, err := bw.w.Write(toWrite)
	bw.remaining -= int64(written)
	if err != nil {
		return written, err
	}
	return len(p), nil // Return len(p) to prevent io.ErrShortWrite in io.Copy
}

// cleanDiagnostics strips internal temporary directory paths from compiler output for clean UX.
func cleanDiagnostics(diag string, tmpDir string) string {
	if tmpDir == "" {
		return diag
	}
	cleaned := strings.ReplaceAll(diag, tmpDir+"/", "")
	cleaned = strings.ReplaceAll(diag, tmpDir, "")
	return strings.TrimSpace(cleaned)
}
