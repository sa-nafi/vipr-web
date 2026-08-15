import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { EditorPane } from './components/EditorPane';
import { OutputPane } from './components/OutputPane';
import { DocsPage } from './components/DocsPage';
import { CODE_EXAMPLES, DEFAULT_EXAMPLE } from './constants/examples';
import { runViprCode, prewarmBackend } from './services/api';
import type { ExecutionResult, ExecutionStatus, ThemeMode } from './types';

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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-base-300">
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
        <main className="flex-1 min-h-0 w-full grid grid-cols-1 md:grid-cols-2 gap-px bg-base-content/10 overflow-hidden">
          {/* Left / Top Pane: Editor */}
          <section className="h-full w-full min-w-0 min-h-0 overflow-hidden relative">
            <EditorPane
              code={code}
              onChange={handleCodeChange}
              onRun={handleRun}
              stdin={stdin}
              onStdinChange={handleStdinChange}
              theme={theme}
            />
          </section>

          {/* Right / Bottom Pane: Terminal Output */}
          <section className="h-full w-full min-w-0 min-h-0 overflow-hidden relative">
            <OutputPane
              result={executionResult}
              status={executionStatus}
              onClear={handleClearOutput}
              theme={theme}
            />
          </section>
        </main>
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
