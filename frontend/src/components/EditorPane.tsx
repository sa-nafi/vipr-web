import { useRef, useEffect, useState, useCallback } from 'react';
import type { FC } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { registerViprLanguage, VIPR_LANGUAGE_ID } from '../monaco/viprLanguage';
import type { ThemeMode } from '../types';
import { Code, CheckCircle2, FileText, Terminal, ChevronDown, ChevronUp, X } from 'lucide-react';

interface EditorPaneProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  stdin: string;
  onStdinChange: (value: string) => void;
  theme: ThemeMode;
}

export const EditorPane: FC<EditorPaneProps> = ({
  code,
  onChange,
  onRun,
  stdin,
  onStdinChange,
  theme,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
  const [lineCount, setLineCount] = useState(1);
  const [isSaved, setIsSaved] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isStdinOpen, setIsStdinOpen] = useState(false);

  // Auto-expand stdin if code contains input( statement or if stdin is non-empty
  useEffect(() => {
    if (stdin && stdin.trim().length > 0) {
      setIsStdinOpen(true);
    }
  }, [stdin]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      editorRef.current = null;
    };
  }, []);

  // Check window width for responsive minimap
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEditorBeforeMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco;
    registerViprLanguage(monaco);
  }, []);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          onRun();
        }
      );

      // Track cursor position
      editor.onDidChangeCursorPosition((e) => {
        setCursorPos({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Update line count
      const model = editor.getModel();
      if (model) {
        setLineCount(model.getLineCount());
        model.onDidChangeContent(() => {
          setLineCount(model.getLineCount());
          setIsSaved(false);
          // Debounced save indicator reset
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => setIsSaved(true), 800);
        });
      }

      // Focus editor on mount
      editor.focus();
    },
    [onRun]
  );

  const monacoTheme = theme === 'light' ? 'vipr-light' : 'vipr-dark';

  return (
    <div className="flex flex-col h-full w-full bg-base-100 overflow-hidden relative">
      {/* Pane Header Tab Bar */}
      <div className="flex-none h-10 flex items-center justify-between px-3 bg-base-200/80 border-b border-base-content/10 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-base-300/80 font-mono text-blue-800 dark:text-blue-400 text-xs border border-base-content/10 font-medium">
            <FileText className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            <span>main.vipr</span>
          </div>
          <span className="text-[11px] text-base-content/75 font-mono">
            Tab: 4 spaces
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-[11px] font-mono text-base-content/75">
            <CheckCircle2 className={`w-3 h-3 text-blue-600 dark:text-blue-400 transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-30'}`} />
            <span>{isSaved ? 'Autosaved' : 'Saving...'}</span>
          </div>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full min-h-0 relative">
        <Editor
          height="100%"
          defaultLanguage={VIPR_LANGUAGE_ID}
          language={VIPR_LANGUAGE_ID}
          value={code}
          theme={monacoTheme}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorDidMount}
          onChange={(value) => {
            onChange(value || '');
          }}
          options={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            lineHeight: 22,
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            minimap: {
              enabled: !isMobile,
              side: 'right',
              maxColumn: 80,
              renderCharacters: false,
            },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            automaticLayout: true,
            bracketPairColorization: {
              enabled: true,
            },
            padding: {
              top: 12,
              bottom: 12,
            },
            renderLineHighlight: 'all',
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Custom Stdin Input Drawer */}
      <div className="flex-none bg-base-200/95 border-t border-base-content/10 select-none">
        <div 
          onClick={() => setIsStdinOpen(!isStdinOpen)}
          className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-base-300/50 transition-colors text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span className="font-semibold text-xs text-base-content">Program Input (stdin)</span>
            {stdin.trim().length > 0 && (
              <span className="badge badge-xs badge-info bg-blue-500/20 text-blue-800 dark:text-blue-300 border-none font-mono text-[10px] px-1.5">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-base-content/75">
            {stdin.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStdinChange('');
                }}
                className="btn btn-ghost btn-xs h-5 min-h-0 px-1 gap-1 text-[10px] hover:text-error"
                title="Clear stdin input"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <span className="text-[11px] font-sans opacity-70">
              {isStdinOpen ? 'Collapse' : 'Expand'}
            </span>
            {isStdinOpen ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 opacity-70" />
            )}
          </div>
        </div>

        {isStdinOpen && (
          <div className="p-2.5 pt-1 border-t border-base-content/5">
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter standard input (stdin) passed to input() statements (e.g. 25, multiple lines, etc.)..."
              rows={3}
              className="textarea textarea-bordered textarea-sm w-full font-mono text-xs leading-relaxed bg-base-100 text-base-content placeholder:text-base-content/40 focus:border-blue-500 focus:outline-none resize-y"
            />
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="flex-none h-7 flex items-center justify-between px-3 bg-base-200/80 border-t border-base-content/10 text-[11px] font-mono text-base-content/75 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Code className="w-3 h-3 text-blue-800 dark:text-blue-400" />
            <span>Vipr (AOT)</span>
          </span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>{code.length} chars</span>
          <span className="text-base-content/90 font-medium">
            Ln {cursorPos.lineNumber}, Col {cursorPos.column}
          </span>
        </div>
      </div>
    </div>
  );
};
