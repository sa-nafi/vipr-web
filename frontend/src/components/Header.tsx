import type { FC } from 'react';
import { 
  Play, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Code2, 
  BookOpen,
  Sun, 
  Moon, 
  ChevronDown
} from 'lucide-react';
import { CODE_EXAMPLES } from '../constants/examples';
import type { ThemeMode } from '../types';

interface HeaderProps {
  activeView: 'playground' | 'docs';
  onViewChange: (view: 'playground' | 'docs') => void;
  onRun: () => void;
  isRunning: boolean;
  onSelectExample: (exampleId: string) => void;
  selectedExampleId: string;
  onClearOutput: () => void;
  onResetCode: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Header: FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onRun,
  isRunning,
  onSelectExample,
  selectedExampleId,
  onClearOutput,
  onResetCode,
  theme,
  onThemeChange,
}) => {
  const isDark = theme !== 'light';

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDark ? 'light' : 'night';
    onThemeChange(nextTheme);
  };

  return (
    <header className="flex-none bg-base-200/90 backdrop-blur border-b border-base-content/10 px-4 py-2.5 z-20">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
        {/* Left: Branding & Examples Dropdown */}
        <div className="flex items-center gap-3 justify-self-start min-w-0">
          <div 
            onClick={() => onViewChange('playground')}
            className="flex items-center gap-2 cursor-pointer select-none"
            title="Vipr Playground"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
              <span className="font-mono tracking-tighter">V</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-base-content font-sans">
                  Vipr <span className="vipr-gradient-text">{activeView === 'docs' ? 'Docs' : 'Playground'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-5 w-px bg-base-content/15 mx-1" />

          {/* Example Snippets Dropdown (Only in Playground view) */}
          {activeView === 'playground' && (
            <div className="dropdown dropdown-bottom">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-sm btn-ghost gap-1.5 font-normal border border-base-content/15 hover:border-base-content/30"
                title="Load example snippet"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                <span className="hidden md:inline text-xs font-medium">Examples</span>
                <span className="md:hidden text-xs">Snippet</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-30 menu flex-nowrap p-2 shadow-2xl bg-base-200 border border-base-content/10 rounded-box w-72 md:w-80 mt-1 max-h-96 overflow-y-auto overflow-x-hidden"
              >
                <li className="menu-title text-[11px] uppercase tracking-wider text-base-content/60 px-2 py-1">
                  Preset Code Examples
                </li>
                {CODE_EXAMPLES.map((ex) => (
                  <li key={ex.id} className="w-full">
                    <button
                      onClick={() => {
                        onSelectExample(ex.id);
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                      className={`flex flex-col items-start gap-0.5 py-2 px-3 text-left rounded-lg transition-colors w-full ${
                        selectedExampleId === ex.id
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-400 font-semibold border-l-2 border-blue-700 dark:border-blue-500'
                          : 'hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium">{ex.title}</span>
                        <span className="text-[10px] opacity-60 font-mono px-1 py-0.5 rounded bg-base-100/50">
                          {ex.category}
                        </span>
                      </div>
                      <span className="text-[11px] opacity-70 font-normal line-clamp-1">
                        {ex.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Center / Action: Primary Run Button & Actions */}
        <div className="flex items-center gap-2 justify-self-center">
          {activeView === 'playground' && (
            <>
              {/* Run Button */}
              <button
                onClick={onRun}
                disabled={isRunning}
                className={`btn btn-sm gap-2 font-medium px-4 shadow-md transition-all duration-200 border-none ${
                  isRunning
                    ? 'btn-disabled opacity-70'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-blue-500/25'
                }`}
                title="Compile and run (Ctrl+Enter / ⌘+Enter)"
              >
                {isRunning ? (
                  <>
                    <span className="loading loading-spinner loading-xs text-current" />
                    <span className="text-xs">Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs">Run</span>
                    <kbd className="hidden lg:inline-flex kbd kbd-xs bg-white/20 text-white border-none font-mono text-[10px] px-1 py-0.5">
                      Ctrl+↵
                    </kbd>
                  </>
                )}
              </button>

              {/* Reset Code Button */}
              <button
                onClick={onResetCode}
                disabled={isRunning}
                className="btn btn-sm btn-ghost btn-square border border-base-content/15 hover:border-base-content/30"
                title="Reset code to example default"
              >
                <RotateCcw className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
              </button>

              {/* Clear Console Button */}
              <button
                onClick={onClearOutput}
                className="btn btn-sm btn-ghost border border-base-content/15 hover:border-base-content/30 gap-1.5 px-2.5 hidden sm:flex"
                title="Clear output console"
              >
                <Trash2 className="w-3.5 h-3.5 opacity-70" />
                <span className="text-xs font-normal">Clear</span>
              </button>
            </>
          )}
        </div>

        {/* Right: [theme][switch][github] */}
        <div className="flex items-center gap-2 justify-self-end">
          {/* 1. Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-ghost btn-square border border-base-content/15 hover:border-base-content/30"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
          </button>

          {/* 2. Navigation View Switcher [Playground | Docs] */}
          <div className="join bg-base-300/60 p-0.5 rounded-lg border border-base-content/10">
            <button
              onClick={() => onViewChange('playground')}
              className={`btn btn-xs join-item font-medium transition-all gap-1 ${
                activeView === 'playground'
                  ? 'bg-base-100 text-blue-800 dark:text-blue-400 shadow-sm border border-base-content/10 font-semibold'
                  : 'btn-ghost text-base-content/75 hover:text-base-content'
              }`}
              title="Switch to Interactive Playground"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Playground</span>
            </button>
            <button
              onClick={() => onViewChange('docs')}
              className={`btn btn-xs join-item font-medium transition-all gap-1 ${
                activeView === 'docs'
                  ? 'bg-base-100 text-blue-800 dark:text-blue-400 shadow-sm border border-base-content/10 font-semibold'
                  : 'btn-ghost text-base-content/75 hover:text-base-content'
              }`}
              title="Switch to Language Documentation"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>
          </div>

          {/* 3. GitHub Repo External Link */}
          <a
            href="https://github.com/sa-nafi/vipr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost gap-1.5 border border-base-content/15 hover:border-base-content/30 text-xs px-2.5"
            title="View Vipr on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
