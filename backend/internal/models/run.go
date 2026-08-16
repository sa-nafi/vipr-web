package models

// RunRequest represents the incoming JSON payload for POST /api/run.
type RunRequest struct {
	Code  string `json:"code"`
	Stdin string `json:"stdin"`
}

// RunResponse represents the execution result returned to the client.
type RunResponse struct {
	Status     string `json:"status"` // "success", "compile_error", "runtime_error", "timeout"
	Stdout     string `json:"stdout,omitempty"`
	Stderr     string `json:"stderr,omitempty"`
	DurationMs int64  `json:"duration_ms"`
}
