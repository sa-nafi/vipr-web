# syntax=docker/dockerfile:1

# ---------------------------------------------------------
# Stage 1: Build the Go HTTP Runner Server
# ---------------------------------------------------------
FROM golang:1.24-bookworm AS builder

WORKDIR /src

# Cache dependencies
COPY go.mod ./
RUN go mod download || true

# Copy backend source
COPY . .

# Compile optimized static binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server \
    ./cmd/server

# ---------------------------------------------------------
# Stage 2: Minimal Runtime Container for Koyeb
# ---------------------------------------------------------
FROM debian:bookworm-slim AS runtime

ARG VIPR_VERSION=v0.3.0

# Install g++ (required for Vipr AOT C++ linking), ca-certificates, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    ca-certificates \
    curl \
    && curl -fsSL "https://github.com/sa-nafi/vipr/releases/download/${VIPR_VERSION}/vipr" -o /usr/local/bin/vipr \
    && chmod +x /usr/local/bin/vipr \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Create non-privileged user for sandbox security
RUN useradd -m -u 10001 appuser \
    && chmod 1777 /tmp

WORKDIR /app

# Copy Go server binary from builder stage
COPY --from=builder /app/server /app/server

# Environment configuration
ENV PORT=8080 \
    ENV=production \
    VIPR_BIN_PATH=/usr/local/bin/vipr \
    COMPILE_TIMEOUT_SEC=10 \
    EXEC_TIMEOUT_SEC=5 \
    MAX_CONCURRENT_RUNS=4

EXPOSE 8080

USER appuser

ENTRYPOINT ["/app/server"]
