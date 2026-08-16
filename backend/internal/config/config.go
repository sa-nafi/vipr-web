package config

import (
	"os"
	"strings"
	"time"
)

// Config holds the application configuration.
type Config struct {
	ServerPort        string
	AllowedOrigin     string
	ViprBinPath       string
	CompileTimeout    time.Duration
	ExecTimeout       time.Duration
	MaxConcurrentRuns int
	MaxCodeSizeBytes  int64
	MaxStdinSizeBytes int64
	MaxOutputBytes    int64
}

// Load loads configuration with sensible defaults.
func Load() *Config {
	return &Config{
		ServerPort:        getEnv("PORT", "8080"),
		AllowedOrigin:     getEnv("ALLOWED_ORIGIN", "*"),
		ViprBinPath:       "vipr",
		CompileTimeout:    10 * time.Second,
		ExecTimeout:       5 * time.Second,
		MaxConcurrentRuns: 3,
		MaxCodeSizeBytes:  64 * 1024,  // 64 KB
		MaxStdinSizeBytes: 64 * 1024,  // 64 KB
		MaxOutputBytes:    256 * 1024, // 256 KB
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return defaultValue
}
