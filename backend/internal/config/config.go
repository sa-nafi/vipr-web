package config

import (
	"bufio"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Config holds all server and runner configuration options.
type Config struct {
	Port               string
	ViprBinPath        string
	CompileTimeout     time.Duration
	ExecTimeout        time.Duration
	MaxCodeSizeBytes   int64
	MaxStdinSizeBytes  int64
	MaxOutputBytes     int64
	MaxConcurrentRuns  int
	CorsAllowedOrigins []string
	LogLevel           slog.Level
	Env                string
}

// LoadFromEnv parses environment variables with production-ready defaults and loads .env if present.
func LoadFromEnv() *Config {
	loadDotEnv()

	port := getEnv("PORT", "8080")
	viprBin := resolveViprBinary(getEnv("VIPR_BIN_PATH", "vipr"))

	compileTimeoutSec := getEnvAsInt("COMPILE_TIMEOUT_SEC", 10)
	execTimeoutSec := getEnvAsInt("EXEC_TIMEOUT_SEC", 5)

	maxCodeSize := getEnvAsInt64("MAX_CODE_SIZE_BYTES", 64*1024)   // 64 KB
	maxStdinSize := getEnvAsInt64("MAX_STDIN_SIZE_BYTES", 64*1024) // 64 KB
	maxOutput := getEnvAsInt64("MAX_OUTPUT_BYTES", 256*1024)       // 256 KB

	maxConcurrent := getEnvAsInt("MAX_CONCURRENT_RUNS", 4)

	defaultOrigins := "https://vipr.numenlabs.tech,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
	rawCors := getEnv("CORS_ALLOWED_ORIGINS", defaultOrigins)
	var origins []string
	for _, o := range strings.Split(rawCors, ",") {
		trimmed := strings.TrimSpace(o)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	if len(origins) == 0 {
		origins = strings.Split(defaultOrigins, ",")
	}

	env := getEnv("ENV", "development")
	logLevelStr := strings.ToLower(getEnv("LOG_LEVEL", "info"))
	var logLevel slog.Level
	switch logLevelStr {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	return &Config{
		Port:               port,
		ViprBinPath:        viprBin,
		CompileTimeout:     time.Duration(compileTimeoutSec) * time.Second,
		ExecTimeout:        time.Duration(execTimeoutSec) * time.Second,
		MaxCodeSizeBytes:   maxCodeSize,
		MaxStdinSizeBytes:  maxStdinSize,
		MaxOutputBytes:     maxOutput,
		MaxConcurrentRuns:  maxConcurrent,
		CorsAllowedOrigins: origins,
		LogLevel:           logLevel,
		Env:                env,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	valStr := getEnv(key, "")
	if valStr == "" {
		return defaultVal
	}
	val, err := strconv.Atoi(valStr)
	if err != nil || val <= 0 {
		return defaultVal
	}
	return val
}

func getEnvAsInt64(key string, defaultVal int64) int64 {
	valStr := getEnv(key, "")
	if valStr == "" {
		return defaultVal
	}
	val, err := strconv.ParseInt(valStr, 10, 64)
	if err != nil || val <= 0 {
		return defaultVal
	}
	return val
}

// loadDotEnv parses .env files from the current and parent directories without third-party dependencies.
func loadDotEnv() {
	paths := []string{".env", "../.env"}
	for _, path := range paths {
		file, err := os.Open(path)
		if err != nil {
			continue
		}
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				v = strings.Trim(v, `"'`)

				// Only set if not already present in process environment
				if _, exists := os.LookupEnv(k); !exists {
					_ = os.Setenv(k, v)
				}
			}
		}

		if err := scanner.Err(); err != nil {
			slog.Warn("failed to fully read env file", "path", path, "error", err)
		}

		file.Close()
		break
	}
}

// resolveViprBinary determines the absolute path or checks local repository builds.
func resolveViprBinary(configuredPath string) string {
	// 1. If explicitly configured with a relative or absolute path
	if strings.Contains(configuredPath, string(filepath.Separator)) || strings.HasPrefix(configuredPath, ".") {
		if abs, err := filepath.Abs(configuredPath); err == nil {
			if _, err := os.Stat(abs); err == nil {
				return abs
			}
		}
		return configuredPath
	}

	// 2. Check if available in system PATH
	if path, err := exec.LookPath(configuredPath); err == nil {
		return path
	}

	// 3. Fallback: check standard repository build paths for local developer convenience
	localCandidates := []string{
		"../tmp/vipr/target/release/vipr",
		"tmp/vipr/target/release/vipr",
		"../tmp/vipr/target/debug/vipr",
		"tmp/vipr/target/debug/vipr",
	}

	for _, candidate := range localCandidates {
		if abs, err := filepath.Abs(candidate); err == nil {
			if _, err := os.Stat(abs); err == nil {
				return abs
			}
		}
	}

	return configuredPath
}
