package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/handlers"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
	"github.com/sa-nafi/vipr-web/backend/internal/services"
)

func setupTestRunner(t *testing.T) (*handlers.RunHandler, *config.Config) {
	cfg := config.Load()

	// Use faster timeouts for tests
	cfg.CompileTimeout = 5 * time.Second
	cfg.ExecTimeout = 3 * time.Second

	// In local test environments without global vipr in PATH, locate local build if available
	if _, err := exec.LookPath(cfg.ViprBinPath); err != nil {
		for _, p := range []string{"../../../tmp/vipr/target/release/vipr", "../../tmp/vipr/target/release/vipr", "tmp/vipr/target/release/vipr"} {
			if abs, err := filepath.Abs(p); err == nil {
				if _, err := os.Stat(abs); err == nil {
					cfg.ViprBinPath = abs
					break
				}
			}
		}
	}

	runner := services.NewRunnerService(cfg)
	handler := handlers.NewRunHandler(runner, cfg)
	return handler, cfg
}

func TestHealthCheck(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handlers.HealthCheck(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	if body["status"] != "ok" {
		t.Errorf("Expected status 'ok', got '%s'", body["status"])
	}
}

func TestRunHandler_EmptyCode(t *testing.T) {
	handler, _ := setupTestRunner(t)

	payload := models.RunRequest{
		Code: "",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	var resp models.RunResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "compile_error" {
		t.Errorf("Expected status 'compile_error', got '%s'", resp.Status)
	}
}

func TestRunHandler_InvalidJSON(t *testing.T) {
	handler, _ := setupTestRunner(t)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader([]byte("{invalid-json")))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestRunHandler_CompileSuccess(t *testing.T) {
	handler, cfg := setupTestRunner(t)

	// Only run if Vipr executable is found
	if cfg.ViprBinPath == "" {
		t.Skip("Vipr binary not configured, skipping integration execution test")
	}

	code := `def main() -> void:
    print("Vipr is running!")
`
	payload := models.RunRequest{
		Code: code,
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp models.RunResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "success" {
		t.Errorf("Expected status 'success', got '%s'. Stderr: %s", resp.Status, resp.Stderr)
	}

	if !bytes.Contains([]byte(resp.Stdout), []byte("Vipr is running!")) {
		t.Errorf("Expected stdout to contain 'Vipr is running!', got: %s", resp.Stdout)
	}
}

func TestRunHandler_StdinInput(t *testing.T) {
	handler, cfg := setupTestRunner(t)

	if cfg.ViprBinPath == "" {
		t.Skip("Vipr binary not configured, skipping integration execution test")
	}

	code := `def main() -> void:
    let x: int
    input(x)
    print("Received number:", x * 2)
`
	payload := models.RunRequest{
		Code:  code,
		Stdin: "21\n",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp models.RunResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "success" {
		t.Errorf("Expected status 'success', got '%s'. Stderr: %s", resp.Status, resp.Stderr)
	}

	if !bytes.Contains([]byte(resp.Stdout), []byte("Received number: 42")) {
		t.Errorf("Expected stdout to contain 'Received number: 42', got: %s", resp.Stdout)
	}
}

func TestRunHandler_CompileError(t *testing.T) {
	handler, cfg := setupTestRunner(t)

	if cfg.ViprBinPath == "" {
		t.Skip("Vipr binary not configured, skipping integration execution test")
	}

	// Invalid syntax code
	code := `def main() -> void:
    let a: int = "cannot assign string to int"
`
	payload := models.RunRequest{
		Code: code,
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	var resp models.RunResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "compile_error" {
		t.Errorf("Expected status 'compile_error', got '%s'", resp.Status)
	}

	if resp.Stderr == "" {
		t.Errorf("Expected non-empty stderr diagnostic message")
	}
}

func TestRunHandler_ExecutionTimeout(t *testing.T) {
	handler, cfg := setupTestRunner(t)

	if cfg.ViprBinPath == "" {
		t.Skip("Vipr binary not configured, skipping integration execution test")
	}

	// Short timeout for test speed
	cfg.ExecTimeout = 1 * time.Second

	// Code with infinite loop
	code := `def main() -> void:
    while true:
        pass
`
	payload := models.RunRequest{
		Code: code,
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRun(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	var resp models.RunResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "timeout" {
		t.Errorf("Expected status 'timeout', got '%s'", resp.Status)
	}
}
