package api_test

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sa-nafi/vipr-web/backend/internal/api"
	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/middleware"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
	"github.com/sa-nafi/vipr-web/backend/internal/runner"
)

func setupTestServer(t *testing.T) http.Handler {
	t.Helper()

	cfg := config.LoadFromEnv()
	cfg.ViprBinPath = "nonexistent_for_mock"

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	r := runner.NewRunner(cfg, logger)
	handler := api.NewHandler(cfg, logger, r)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	return middleware.Chain(
		mux,
		middleware.RequestID,
		middleware.CORS(cfg.CorsAllowedOrigins),
		middleware.Recoverer(logger),
	)
}

func TestHealthEndpoint(t *testing.T) {
	handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp models.HealthResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response JSON: %v", err)
	}

	if resp.Status != "healthy" {
		t.Errorf("expected status 'healthy', got '%s'", resp.Status)
	}
	if resp.Version != api.AppVersion {
		t.Errorf("expected version '%s', got '%s'", api.AppVersion, resp.Version)
	}
}

func TestCorsPreflight(t *testing.T) {
	handler := setupTestServer(t)

	// 1. Test allowed localhost
	reqLocal := httptest.NewRequest(http.MethodOptions, "/api/run", nil)
	reqLocal.Header.Set("Origin", "http://localhost:5173")
	wLocal := httptest.NewRecorder()

	handler.ServeHTTP(wLocal, reqLocal)

	if wLocal.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", wLocal.Code)
	}
	if wLocal.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Errorf("expected Allow-Origin 'http://localhost:5173', got '%s'", wLocal.Header().Get("Access-Control-Allow-Origin"))
	}

	// 2. Test allowed production domain
	reqProd := httptest.NewRequest(http.MethodOptions, "/api/run", nil)
	reqProd.Header.Set("Origin", "https://vipr.numenlabs.tech")
	wProd := httptest.NewRecorder()

	handler.ServeHTTP(wProd, reqProd)

	if wProd.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", wProd.Code)
	}
	if wProd.Header().Get("Access-Control-Allow-Origin") != "https://vipr.numenlabs.tech" {
		t.Errorf("expected Allow-Origin 'https://vipr.numenlabs.tech', got '%s'", wProd.Header().Get("Access-Control-Allow-Origin"))
	}

	// 3. Test disallowed domain
	reqDisallowed := httptest.NewRequest(http.MethodOptions, "/api/run", nil)
	reqDisallowed.Header.Set("Origin", "https://unauthorized-domain.com")
	wDisallowed := httptest.NewRecorder()

	handler.ServeHTTP(wDisallowed, reqDisallowed)

	if wDisallowed.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Errorf("expected no Allow-Origin for unauthorized domain, got '%s'", wDisallowed.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestRunEndpoint_EmptyCode(t *testing.T) {
	handler := setupTestServer(t)

	body, _ := json.Marshal(models.RunRequest{
		Code: "",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 for empty code response, got %d", w.Code)
	}

	var resp models.RunResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response JSON: %v", err)
	}

	if resp.Status != models.StatusCompileError {
		t.Errorf("expected status 'compile_error', got '%s'", resp.Status)
	}
}

func TestRunEndpoint_MalformedJSON(t *testing.T) {
	handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/api/run", bytes.NewReader([]byte("{invalid-json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for malformed json, got %d", w.Code)
	}
}
