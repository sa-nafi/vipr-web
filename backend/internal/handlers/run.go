package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/models"
	"github.com/sa-nafi/vipr-web/backend/internal/services"
	"github.com/sa-nafi/vipr-web/backend/internal/utils"
)

// RunHandler handles code execution requests.
type RunHandler struct {
	runner *services.RunnerService
	cfg    *config.Config
}

// NewRunHandler creates a new RunHandler instance.
func NewRunHandler(runner *services.RunnerService, cfg *config.Config) *RunHandler {
	return &RunHandler{
		runner: runner,
		cfg:    cfg,
	}
}

// HandleRun handles the POST /api/run HTTP endpoint.
func (h *RunHandler) HandleRun(w http.ResponseWriter, r *http.Request) {
	// Guardrail: enforce maximum request payload size
	maxBytes := h.cfg.MaxCodeSizeBytes + h.cfg.MaxStdinSizeBytes + 4096
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

	var req models.RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request payload too large.")
			return
		}
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON request payload.")
		return
	}

	// Validate code presence
	if strings.TrimSpace(req.Code) == "" {
		utils.WriteJSON(w, http.StatusOK, models.RunResponse{
			Status: "compile_error",
			Stderr: "Error: No code provided to compile.",
		})
		return
	}

	// Execute via RunnerService
	resp, _ := h.runner.Execute(r.Context(), req)
	utils.WriteJSON(w, http.StatusOK, resp)
}
