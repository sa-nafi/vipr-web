export type ExecutionStatus = 
  | 'idle'
  | 'running'
  | 'waking_up'
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'network_error';

export interface RunApiResponse {
  status: 'success' | 'compile_error' | 'runtime_error' | 'timeout';
  stdout?: string;
  stderr?: string;
  duration_ms?: number;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  durationMs?: number;
  timestamp?: string;
  errorMessage?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  category: 'Basics' | 'Data Structures' | 'Algorithms';
  code: string;
}

export type ThemeMode = 'night' | 'dim' | 'dark' | 'light' | 'emerald';
