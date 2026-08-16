package router

import (
	"net/http"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/handlers"
	"github.com/sa-nafi/vipr-web/backend/internal/services"
)

// RegisterRoutes sets up the HTTP endpoints on the ServeMux.
func RegisterRoutes(mux *http.ServeMux, runner *services.RunnerService, cfg *config.Config) {
	runHandler := handlers.NewRunHandler(runner, cfg)

	// Health check endpoint for cloud monitoring and frontend pre-warming
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// Vipr code execution endpoint
	mux.HandleFunc("POST /api/run", runHandler.HandleRun)
}
