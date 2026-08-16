import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { EditorPane } from './components/EditorPane';
import { OutputPane } from './components/OutputPane';
import { DocsPage } from './components/DocsPage';
import { CODE_EXAMPLES, DEFAULT_EXAMPLE } from './constants/examples';
import { runViprCode, prewarmBackend } from './services/api';
import type { ExecutionResult, ExecutionStatus, ThemeMode } from './types';
import { Code2, Terminal, FileText, X } from 'lucide-react';

const STORAGE_KEY_CODE = 'vipr_editor_code';
const STORAGE_KEY_STDIN = 'vipr_editor_stdin';
const STORAGE_KEY_THEME = 'vipr_theme';
const STORAGE_KEY_EXAMPLE = 'vipr_selected_example';

export function App() {
  // Navigation view state
  const [activeView, setActiveView] = useState<'playground' | 'docs'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#docs') {
      return 'docs';
    }
    return 'playground';
  });

  // Mobile playground active tab ('editor' | 'output' | 'stdin')
  const [mobileTab, setMobileTab] = useState<'editor' | 'output' | 'stdin'>('editor');

  // Sync active view with window hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#docs') {
        setActiveView('docs');
      } else if (window.location.hash === '#playground' || window.location.hash === '') {
        setActiveView('playground');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (view: 'playground' | 'docs') => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'docs' ? '#docs' : '#playground';
    }
  };

  // Load saved theme or default to 'light'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (saved && ['light', 'night', 'dim', 'dark', 'emerald'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'light';
  });

  // Load saved code or default to first example
  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CODE);
      if (saved && saved.trim().length > 0) {
        return saved;
      }
    } catch {}
    return DEFAULT_EXAMPLE.code;
  });

  // Program standard input (stdin)
  const [stdin, setStdin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_STDIN) || '';
    } catch {}
    return '';
  });

  const [selectedExampleId, setSelectedExampleId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_EXAMPLE) || DEFAULT_EXAMPLE.id;
    } catch {}
    return DEFAULT_EXAMPLE.id;
  });

  const [executionResult, setExecutionResult] = useState<ExecutionResult>({
    status: 'idle',
    stdout: '',
    stderr: '',
  });

  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {}
  }, [theme]);

  // Pre-warm backend container on mount
  useEffect(() => {
    prewarmBackend();
  }, []);

  // Track custom loaded snippet baseline for reset
  const customSnippetRef = useRef<string | null>(null);

  // Save code changes to localStorage
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    try {
      localStorage.setItem(STORAGE_KEY_CODE, newCode);
    } catch {}
  }, []);

  // Save stdin changes to localStorage
  const handleStdinChange = useCallback((newStdin: string) => {
    setStdin(newStdin);
    try {
      localStorage.setItem(STORAGE_KEY_STDIN, newStdin);
    } catch {}
  }, []);

  // Handle selecting an example from dropdown
  const handleSelectExample = useCallback((exampleId: string) => {
    const example = CODE_EXAMPLES.find((ex) => ex.id === exampleId);
    if (example) {
      customSnippetRef.current = null;
      setCode(example.code);
      setSelectedExampleId(example.id);
      setMobileTab('editor');
      try {
        localStorage.setItem(STORAGE_KEY_CODE, example.code);
        localStorage.setItem(STORAGE_KEY_EXAMPLE, example.id);
      } catch {}
    }
  }, []);

  // Handle trying a snippet from the documentation
  const handleTrySnippetFromDocs = useCallback((snippetCode: string) => {
    customSnippetRef.current = snippetCode;
    setCode(snippetCode);
    setSelectedExampleId('custom');
    setMobileTab('editor');
    handleViewChange('playground');
    try {
      localStorage.setItem(STORAGE_KEY_CODE, snippetCode);
      localStorage.setItem(STORAGE_KEY_EXAMPLE, 'custom');
    } catch {}
  }, []);

  // Reset code to current selected example or loaded documentation snippet
  const handleResetCode = useCallback(() => {
    if (customSnippetRef.current) {
      setCode(customSnippetRef.current);
      try {
        localStorage.setItem(STORAGE_KEY_CODE, customSnippetRef.current);
      } catch {}
      return;
    }

    const example = CODE_EXAMPLES.find((ex) => ex.id === selectedExampleId) || DEFAULT_EXAMPLE;
    setCode(example.code);
    try {
      localStorage.setItem(STORAGE_KEY_CODE, example.code);
    } catch {}
  }, [selectedExampleId]);

  // Clear output terminal
  const handleClearOutput = useCallback(() => {
    setExecutionResult({
      status: 'idle',
      stdout: '',
      stderr: '',
    });
    setExecutionStatus('idle');
  }, []);

  // Run Vipr code with stdin
  const handleRun = useCallback(async () => {
    if (executionStatus === 'running' || executionStatus === 'waking_up') {
      return;
    }

    setExecutionStatus('running');
    // On mobile, auto-switch to output tab so the user sees results immediately
    setMobileTab('output');

    const result = await runViprCode(code, stdin, (statusUpdate) => {
      setExecutionStatus(statusUpdate);
    });

    setExecutionResult(result);
    setExecutionStatus(result.status);
  }, [code, stdin, executionStatus]);

  // Global shortcut for Ctrl+Enter / Cmd+Enter when outside monaco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (activeView === 'playground') {
          e.preventDefault();
          handleRun();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, activeView]);

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-base-300">
      {/* Top Header Ribbon */}
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        onRun={handleRun}
        isRunning={executionStatus === 'running' || executionStatus === 'waking_up'}
        onSelectExample={handleSelectExample}
        selectedExampleId={selectedExampleId}
        onClearOutput={handleClearOutput}
        onResetCode={handleResetCode}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Main View: Playground Grid or Documentation Page */}
      {activeView === 'playground' ? (
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
          {/* Mobile Tab Switcher (Visible only on < md) */}
          <div className="md:hidden flex items-center justify-around bg-base-200/95 border-b border-base-content/10 px-2 py-1 flex-none z-10 select-none">
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                mobileTab === 'editor'
                  ? 'bg-base-100 text-blue-800 dark:text-blue-400 font-semibold shadow-sm border border-base-content/10'
                  : 'text-base-content/75 hover:text-base-content'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>

            <button
              onClick={() => setMobileTab('output')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all relative ${
                mobileTab === 'output'
                  ? 'bg-base-100 text-blue-800 dark:text-blue-400 font-semibold shadow-sm border border-base-content/10'
                  : 'text-base-content/75 hover:text-base-content'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Output</span>
              {/* Execution Status Dot Indicator */}
              {executionStatus === 'running' || executionStatus === 'waking_up' ? (
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              ) : executionStatus === 'success' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ) : executionStatus === 'compile_error' || executionStatus === 'runtime_error' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              ) : null}
            </button>

            <button
              onClick={() => setMobileTab('stdin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                mobileTab === 'stdin'
                  ? 'bg-base-100 text-blue-800 dark:text-blue-400 font-semibold shadow-sm border border-base-content/10'
                  : 'text-base-content/75 hover:text-base-content'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Stdin</span>
              {stdin.trim().length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* Playground Panes Container */}
          <main className="flex-1 min-h-0 w-full grid grid-cols-1 md:grid-cols-2 gap-px bg-base-content/10 overflow-hidden">
            {/* Left Pane: Code Editor (On mobile, visible when mobileTab === 'editor') */}
            <section className={`h-full w-full min-w-0 min-h-0 overflow-hidden relative ${
              mobileTab === 'editor' ? 'block' : 'hidden md:block'
            }`}>
              <EditorPane
                code={code}
                onChange={handleCodeChange}
                onRun={handleRun}
                stdin={stdin}
                onStdinChange={handleStdinChange}
                theme={theme}
              />
            </section>

            {/* Right Pane: Console Output (On mobile, visible when mobileTab === 'output') */}
            <section className={`h-full w-full min-w-0 min-h-0 overflow-hidden relative ${
              mobileTab === 'output' ? 'block' : 'hidden md:block'
            }`}>
              <OutputPane
                result={executionResult}
                status={executionStatus}
                onClear={handleClearOutput}
                theme={theme}
              />
            </section>

            {/* Mobile Stdin Dedicated Tab (Visible only on < md when mobileTab === 'stdin') */}
            {mobileTab === 'stdin' && (
              <section className="h-full w-full min-w-0 min-h-0 overflow-y-auto bg-base-100 p-4 md:hidden flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-base-content/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span className="font-bold text-sm text-base-content">Standard Input (stdin)</span>
                  </div>
                  {stdin.length > 0 && (
                    <button
                      onClick={() => handleStdinChange('')}
                      className="btn btn-ghost btn-xs gap-1 text-error"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-base-content/75 font-sans">
                  Provide standard input passed line-by-line to <code className="px-1 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 text-[11px]">input()</code> calls in your Vipr program.
                </p>

                <textarea
                  value={stdin}
                  onChange={(e) => handleStdinChange(e.target.value)}
                  placeholder="Enter inputs here (e.g. numbers, text strings, each on a new line)..."
                  rows={8}
                  className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed bg-base-200/50 text-base-content placeholder:text-base-content/40 focus:border-blue-500 focus:outline-none resize-y flex-1"
                />

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setMobileTab('editor')}
                    className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Back to Code Editor</span>
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      ) : (
        <DocsPage
          theme={theme}
          onTrySnippet={handleTrySnippetFromDocs}
        />
      )}
    </div>
  );
}

export default App;

