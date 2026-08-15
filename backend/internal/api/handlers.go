package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/middleware"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
	"github.com/sa-nafi/vipr-web/backend/internal/runner"
)

const AppVersion = "0.3.0"

// Handler holds API dependencies.
type Handler struct {
	cfg       *config.Config
	logger    *slog.Logger
	runner    *runner.Runner
	startTime time.Time
}

// NewHandler creates a new Handler instance.
func NewHandler(cfg *config.Config, logger *slog.Logger, r *runner.Runner) *Handler {
	return &Handler{
		cfg:       cfg,
		logger:    logger,
		runner:    r,
		startTime: time.Now(),
	}
}

// RegisterRoutes sets up the routing table on http.ServeMux using Go 1.22+ patterns.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", h.HandleHealth)
	mux.HandleFunc("GET /healthz", h.HandleHealth)
	mux.HandleFunc("GET /", h.HandleRoot)
	mux.HandleFunc("POST /api/run", h.HandleRun)
}

// HandleHealth handles health check requests.
func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(h.startTime).Truncate(time.Second).String()

	resp := models.HealthResponse{
		Status:    "healthy",
		Version:   AppVersion,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    uptime,
	}

	writeJSON(w, http.StatusOK, resp)
}

// HandleRoot provides a simple landing summary.
func (h *Handler) HandleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	h.HandleHealth(w, r)
}

// HandleRun processes Vipr execution requests.
func (h *Handler) HandleRun(w http.ResponseWriter, r *http.Request) {
	reqID := middleware.GetRequestID(r.Context())

	// 1. Limit request body size to prevent memory exhaustion attacks
	r.Body = http.MaxBytesReader(w, r.Body, h.cfg.MaxCodeSizeBytes+h.cfg.MaxStdinSizeBytes+4096)

	var req models.RunRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		h.logger.Warn("invalid run request payload",
			slog.String("request_id", reqID),
			slog.Any("error", err),
		)
		writeJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Error: fmt.Sprintf("Invalid JSON request body: %v", err),
		})
		return
	}

	// 2. Validate code field
	trimmedCode := strings.TrimSpace(req.Code)
	if trimmedCode == "" {
		writeJSON(w, http.StatusOK, models.RunResponse{
			Status:     models.StatusCompileError,
			Stderr:     "Error: Code cannot be empty. Please enter a valid Vipr program.",
			DurationMs: 0,
		})
		return
	}

	if int64(len(req.Code)) > h.cfg.MaxCodeSizeBytes {
		writeJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Error: fmt.Sprintf("Code size (%d bytes) exceeds maximum limit of %d bytes", len(req.Code), h.cfg.MaxCodeSizeBytes),
		})
		return
	}

	if int64(len(req.Stdin)) > h.cfg.MaxStdinSizeBytes {
		writeJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Error: fmt.Sprintf("Stdin size (%d bytes) exceeds maximum limit of %d bytes", len(req.Stdin), h.cfg.MaxStdinSizeBytes),
		})
		return
	}

	// 3. Delegate execution to the Runner
	result, err := h.runner.Execute(r.Context(), req)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			h.logger.Info("client aborted execution request", slog.String("request_id", reqID))
			return
		}
		h.logger.Error("runner execution error",
			slog.String("request_id", reqID),
			slog.Any("error", err),
		)
		writeJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Error: fmt.Sprintf("Internal execution failure: %v", err),
		})
		return
	}

	h.logger.Info("execution completed",
		slog.String("request_id", reqID),
		slog.String("status", result.Status),
		slog.Int64("duration_ms", result.DurationMs),
		slog.Int("stdout_len", len(result.Stdout)),
		slog.Int("stderr_len", len(result.Stderr)),
	)

	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}
