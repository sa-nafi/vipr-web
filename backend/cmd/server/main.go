package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sa-nafi/vipr-web/backend/internal/config"
	"github.com/sa-nafi/vipr-web/backend/internal/middleware"
	"github.com/sa-nafi/vipr-web/backend/internal/router"
	"github.com/sa-nafi/vipr-web/backend/internal/services"
)

func main() {
	// Initialize structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	slog.Info("Starting application")

	// Load configuration
	cfg := config.Load()

	slog.Info("Loaded configuration",
		"port", cfg.ServerPort,
		"vipr_bin", cfg.ViprBinPath,
		"max_concurrent", cfg.MaxConcurrentRuns,
		"compile_timeout", cfg.CompileTimeout,
		"exec_timeout", cfg.ExecTimeout,
	)

	// Initialize runner service
	runnerService := services.NewRunnerService(cfg)

	// Initialize router
	mux := http.NewServeMux()

	// Register routes
	router.RegisterRoutes(mux, runnerService, cfg)

	// Configure server with sufficient timeouts for compilation + execution
	addr := ":" + cfg.ServerPort
	srv := &http.Server{
		Addr:              addr,
		Handler:           middleware.LoggingMiddleware(middleware.CORS(cfg.AllowedOrigin)(mux)),
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("Server listening", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("HTTP server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	slog.Info("Received shutdown signal", "signal", sig.String())

	// Shutdown with a timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	slog.Info("Shutting down server gracefully...")
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server shutdown failed", "error", err)
		os.Exit(1)
	}

	slog.Info("Server stopped cleanly")
}
