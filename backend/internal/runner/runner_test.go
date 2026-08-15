package runner_test

import (
	"context"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
	"github.com/sa-nafi/vipr-web/backend/internal/runner"
)

func findViprBinary(t *testing.T) string {
	t.Helper()

	// Check local path or workspace release path
	candidates := []string{
		"vipr",
		filepath.Join("..", "..", "..", "tmp", "vipr", "target", "release", "vipr"),
		filepath.Join("..", "..", "tmp", "vipr", "target", "release", "vipr"),
		"/home/tom/Documents/sa-nafi/vipr-web/tmp/vipr/target/release/vipr",
	}

	for _, cand := range candidates {
		absPath, err := filepath.Abs(cand)
		if err == nil {
			if _, statErr := os.Stat(absPath); statErr == nil {
				return absPath
			}
		}
		if _, err := exec.LookPath(cand); err == nil {
			return cand
		}
	}

	t.Skip("Vipr binary not found on system, skipping runner integration tests")
	return ""
}

func TestRunner_HelloWorld(t *testing.T) {
	viprBin := findViprBinary(t)

	cfg := config.LoadFromEnv()
	cfg.ViprBinPath = viprBin

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	r := runner.NewRunner(cfg, logger)

	code := `def main() -> void:
    print("Hello from Vipr integration test!")
`

	resp, err := r.Execute(context.Background(), models.RunRequest{
		Code: code,
	})
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	if resp.Status != models.StatusSuccess {
		t.Fatalf("expected status 'success', got '%s', stderr: %s", resp.Status, resp.Stderr)
	}

	if !strings.Contains(resp.Stdout, "Hello from Vipr integration test!") {
		t.Errorf("expected stdout to contain test greeting, got: %s", resp.Stdout)
	}
}

func TestRunner_WithStdin(t *testing.T) {
	viprBin := findViprBinary(t)

	cfg := config.LoadFromEnv()
	cfg.ViprBinPath = viprBin

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	r := runner.NewRunner(cfg, logger)

	code := `def main() -> void:
    let x, y: int
    input(x, y)
    print("Sum:", x + y)
`

	resp, err := r.Execute(context.Background(), models.RunRequest{
		Code:  code,
		Stdin: "15 25",
	})
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	if resp.Status != models.StatusSuccess {
		t.Fatalf("expected status 'success', got '%s', stderr: %s", resp.Status, resp.Stderr)
	}

	if !strings.Contains(resp.Stdout, "Sum: 40") {
		t.Errorf("expected stdout to contain 'Sum: 40', got: %s", resp.Stdout)
	}
}

func TestRunner_CompileError(t *testing.T) {
	viprBin := findViprBinary(t)

	cfg := config.LoadFromEnv()
	cfg.ViprBinPath = viprBin

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	r := runner.NewRunner(cfg, logger)

	// Type mismatch error
	code := `def main() -> void:
    let num: int = "cannot assign string"
`

	resp, err := r.Execute(context.Background(), models.RunRequest{
		Code: code,
	})
	if err != nil {
		t.Fatalf("Execute unexpected error: %v", err)
	}

	if resp.Status != models.StatusCompileError {
		t.Fatalf("expected status 'compile_error', got '%s'", resp.Status)
	}

	if !strings.Contains(resp.Stderr, "Type mismatch") {
		t.Errorf("expected stderr to contain 'Type mismatch', got: %s", resp.Stderr)
	}
}

func TestRunner_Timeout(t *testing.T) {
	viprBin := findViprBinary(t)

	cfg := config.LoadFromEnv()
	cfg.ViprBinPath = viprBin
	cfg.ExecTimeout = 1 * time.Second // Short timeout for test

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	r := runner.NewRunner(cfg, logger)

	// Infinite loop
	code := `def main() -> void:
    let count: int = 0
    while count >= 0:
        count = count + 1
`

	resp, err := r.Execute(context.Background(), models.RunRequest{
		Code: code,
	})
	if err != nil {
		t.Fatalf("Execute unexpected error: %v", err)
	}

	if resp.Status != models.StatusTimeout {
		t.Fatalf("expected status 'timeout', got '%s'", resp.Status)
	}
}
