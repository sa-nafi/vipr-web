package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoadDotEnv(t *testing.T) {
	tmpDir := t.TempDir()
	envPath := filepath.Join(tmpDir, ".env")
	err := os.WriteFile(envPath, []byte("TEST_ENV_KEY=hello_world\n# comment\nOTHER_KEY=\"val_123\"\n"), 0644)
	if err != nil {
		t.Fatalf("failed to create temp .env: %v", err)
	}

	// Change working directory to tmpDir during test
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get cwd: %v", err)
	}
	defer func() { _ = os.Chdir(cwd) }()

	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("failed to chdir to tmpDir: %v", err)
	}

	loadDotEnv()

	if val := os.Getenv("TEST_ENV_KEY"); val != "hello_world" {
		t.Errorf("expected TEST_ENV_KEY to be hello_world, got %q", val)
	}
	if val := os.Getenv("OTHER_KEY"); val != "val_123" {
		t.Errorf("expected OTHER_KEY to be val_123, got %q", val)
	}
}

func TestLoadFromEnvDefaults(t *testing.T) {
	cfg := LoadFromEnv()
	if cfg.Port == "" {
		t.Errorf("expected default Port to be set, got empty")
	}
	if cfg.CompileTimeout != 10*time.Second {
		t.Errorf("expected default CompileTimeout to be 10s, got %v", cfg.CompileTimeout)
	}
	if cfg.ExecTimeout != 5*time.Second {
		t.Errorf("expected default ExecTimeout to be 5s, got %v", cfg.ExecTimeout)
	}
}
