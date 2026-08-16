package utils

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// WriteJSON writes a JSON response to the ResponseWriter.
func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("Failed to write JSON response", "error", err, "status", status)
	}
}

// ErrorResponse represents a standard error format.
type ErrorResponse struct {
	Error string `json:"error"`
}

// WriteError writes a JSON error response to the ResponseWriter.
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, ErrorResponse{Error: message})
}
