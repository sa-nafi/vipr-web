# Vipr Web Playground

An interactive web playground for the **[Vipr](https://github.com/sa-nafi/vipr)** programming language — a compiled, statically-typed language with Python-like ergonomics and C++ native speed.

---

## Features

- **Monaco Code Editor**: Full-featured IDE experience with custom Vipr syntax highlighting, bracket matching, keyword completion, and line numbers.
- **Ahead-of-Time Native Execution**: Compiles Vipr source code into C++ and links it into a native binary via `g++` on an isolated backend runner.
- **Interactive Stdin & Console Output**: Supports standard input (`stdin`) streaming, formatted standard output (`stdout`), and detailed compiler diagnostics (`stderr`).
- **Curated Code Examples**: Preloaded programs demonstrating loops, recursion, dynamic arrays, string operations, and algorithms.
- **Integrated Language Documentation**: Built-in reference manual covering syntax, control flow, types, functions, arrays, and standard libraries.
- **Robust Sandboxing & Resource Guardrails**:
  - Process concurrency throttling (optimized for 512MB RAM free-tier hosting)
  - Context-bounded execution timeouts (10s compilation / 5s execution)
  - Memory-safe bounded stdout buffers (256 KB limit to prevent browser/server freezes)
  - Request payload caps (~132 KB)
  - Unprivileged non-root execution (`appuser`, UID 10001)

---

## Architecture

```
vipr-web/
├── frontend/             # React + Vite + TypeScript + Monaco Editor (Cloudflare Pages)
│   ├── src/
│   │   ├── components/   # Header, EditorPane, OutputPane, DocsPage
│   │   ├── monaco/       # Custom Vipr Monaco tokenizer & grammar
│   │   ├── constants/    # Curated code examples
│   │   └── services/     # API runner client & pre-warming
│   └── package.json
└── backend/              # Go Execution Engine (Render Docker Service)
    ├── cmd/server/       # HTTP server entrypoint & graceful shutdown
    ├── internal/
    │   ├── config/       # Zero-dependency configuration loader
    │   ├── handlers/     # /health & /api/run endpoints
    │   ├── middleware/   # CORS & request logging
    │   ├── models/       # RunRequest & RunResponse data contracts
    │   └── services/     # Sandboxed execution & bounded buffer management
    ├── Dockerfile        # Multi-stage build (Go + Ubuntu 24.04 runtime + Vipr CLI)
    └── go.mod            # 100% Go Standard Library (0 external dependencies)
```

---

## Getting Started

### Prerequisites

- **Frontend**: Node.js 18+ and `npm`
- **Backend (Docker)**: Docker / Docker Desktop

---

### 1. Running the Backend

#### Option A: Using Docker (Recommended)
```bash
cd backend
docker build -t vipr-backend .
docker run -p 8080:8080 vipr-backend
```

#### Option B: Running Natively with Go
```bash
cd backend
go run ./cmd/server
```

Test the health check:
```bash
curl http://localhost:8080/health
# Response: {"status":"ok"}
```

---

### 2. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### `GET /health`
Performs a liveness health check (used for cloud monitoring and frontend container pre-warming).

**Response:**
```json
{
  "status": "ok"
}
```

---

### `POST /api/run`
Compiles and executes Vipr source code in an isolated temporary sandbox.

**Request Body:**
```json
{
  "code": "def main() -> void:\n    print(\"Hello, Vipr!\")\n",
  "stdin": ""
}
```

**Response (`200 OK`):**
```json
{
  "status": "success",
  "stdout": "Hello, Vipr!\n",
  "stderr": "",
  "duration_ms": 182
}
```

**Possible `status` values:**
- `success`: Code compiled and executed successfully with exit code 0.
- `compile_error`: Compiler error in user code (diagnostics provided in `stderr`).
- `runtime_error`: Program crashed or exited with a non-zero code.
- `timeout`: Compilation (>10s) or execution (>5s) time limit exceeded.

---

## Running Tests

Run the backend test suite (unit and execution integration tests):

```bash
cd backend
go test -v ./...
```
