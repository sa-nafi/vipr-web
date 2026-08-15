import type { RunApiResponse, ExecutionResult } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';

let activeAbortController: AbortController | null = null;

/**
 * Pre-warm the backend container or check health
 */
export async function prewarmBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    // Health pre-warm failed silently (backend may be sleeping or offline)
    return false;
  }
}

/**
 * Execute Vipr code on the remote backend runner
 */
export async function runViprCode(
  code: string,
  stdin: string = '',
  onStatusChange?: (status: 'running' | 'waking_up') => void
): Promise<ExecutionResult> {
  // Cancel previous running request if any
  if (activeAbortController) {
    activeAbortController.abort('New execution triggered');
    activeAbortController = null;
  }

  const controller = new AbortController();
  activeAbortController = controller;

  // Track if execution takes longer than 3s to notify user that backend may be waking up (cold start)
  const wakeupTimer = setTimeout(() => {
    if (activeAbortController === controller) {
      onStatusChange?.('waking_up');
    }
  }, 3000);

  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ code, stdin: stdin || '' }),
      signal: controller.signal,
    });

    clearTimeout(wakeupTimer);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // Not JSON
      }

      return {
        status: 'runtime_error',
        stdout: parsedError?.stdout || '',
        stderr: parsedError?.stderr || parsedError?.error || `HTTP ${response.status} ${response.statusText}\n${errorText}`,
        durationMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    const data = (await response.json()) as RunApiResponse;
    const duration = data.duration_ms !== undefined ? data.duration_ms : Math.round(performance.now() - startTime);

    return {
      status: data.status,
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      durationMs: duration,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    clearTimeout(wakeupTimer);

    if (err?.name === 'AbortError') {
      return {
        status: 'idle',
        stdout: '',
        stderr: 'Execution cancelled.',
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    return {
      status: 'network_error',
      stdout: '',
      stderr: `Network Error: Unable to connect to backend runner at ${API_BASE_URL}.\nMake sure the backend server is running.\n\nDetails: ${err?.message || err}`,
      errorMessage: err?.message || 'Connection failed',
      timestamp: new Date().toLocaleTimeString(),
    };
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}
