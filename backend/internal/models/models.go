package models

// Execution status constants matching the frontend contracts.
const (
	StatusSuccess      = "success"
	StatusCompileError = "compile_error"
	StatusRuntimeError = "runtime_error"
	StatusTimeout      = "timeout"
)

// RunRequest represents the payload sent by the frontend editor.
type RunRequest struct {
	Code  string `json:"code"`
	Stdin string `json:"stdin"`
}

// RunResponse represents the execution results returned to the client.
type RunResponse struct {
	Status     string `json:"status"`
	Stdout     string `json:"stdout"`
	Stderr     string `json:"stderr"`
	DurationMs int64  `json:"duration_ms"`
}

// HealthResponse represents the health check diagnostic data.
type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
	Uptime    string `json:"uptime"`
}

// ErrorResponse represents an API error structure.
type ErrorResponse struct {
	Error string `json:"error"`
}
