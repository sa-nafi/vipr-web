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
  ChevronDown,
  MoreVertical
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
    <header className="flex-none bg-base-200/95 backdrop-blur border-b border-base-content/10 px-2.5 sm:px-4 py-2 z-30 select-none">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
        {/* Left Section: Logo & Preset Examples */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-shrink">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => onViewChange('playground')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none flex-shrink-0"
            title="Vipr Playground"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-base sm:text-lg">
              <span className="font-mono tracking-tighter">V</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-base-content font-sans">
                Vipr <span className="vipr-gradient-text hidden xs:inline">{activeView === 'docs' ? 'Docs' : 'Playground'}</span>
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-4 w-px bg-base-content/15 mx-0.5" />

          {/* Example Snippets Dropdown (Only in Playground view) */}
          {activeView === 'playground' && (
            <div className="dropdown dropdown-bottom">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-xs sm:btn-sm btn-ghost gap-1 sm:gap-1.5 font-normal border border-base-content/15 hover:border-base-content/30 px-2 sm:px-2.5"
                title="Load example snippet"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span className="text-xs font-medium hidden sm:inline">Examples</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-40 menu p-2 shadow-2xl bg-base-200 border border-base-content/10 rounded-box w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm mt-1 max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden left-0 sm:left-auto"
              >
                <li className="menu-title text-[10px] sm:text-[11px] uppercase tracking-wider text-base-content/60 px-2 py-1">
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
                      className={`flex flex-col items-start gap-0.5 py-2 px-2.5 sm:px-3 text-left rounded-lg transition-colors w-full ${
                        selectedExampleId === ex.id
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-400 font-semibold border-l-2 border-blue-700 dark:border-blue-500'
                          : 'hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium">{ex.title}</span>
                        <span className="text-[10px] opacity-60 font-mono px-1 py-0.2 rounded bg-base-100/60">
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

        {/* Center / Action Section: Run Button & Quick Reset (Playground View) */}
        {activeView === 'playground' && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Run Button */}
            <button
              onClick={onRun}
              disabled={isRunning}
              className={`btn btn-xs sm:btn-sm gap-1.5 font-medium px-3 sm:px-4 shadow-md transition-all duration-200 border-none ${
                isRunning
                  ? 'btn-disabled opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-blue-500/25'
              }`}
              title="Compile and run (Ctrl+Enter / ⌘+Enter)"
            >
              {isRunning ? (
                <>
                  <span className="loading loading-spinner loading-xs text-current" />
                  <span className="text-xs">Running</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-semibold">Run</span>
                  <kbd className="hidden lg:inline-flex kbd kbd-xs bg-white/20 text-white border-none font-mono text-[10px] px-1 py-0.5 ml-0.5">
                    Ctrl+↵
                  </kbd>
                </>
              )}
            </button>

            {/* Desktop Reset Button */}
            <button
              onClick={onResetCode}
              disabled={isRunning}
              className="btn btn-sm btn-ghost btn-square border border-base-content/15 hover:border-base-content/30 hidden md:inline-flex"
              title="Reset code to example default"
            >
              <RotateCcw className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
            </button>

            {/* Desktop Clear Console Button */}
            <button
              onClick={onClearOutput}
              className="btn btn-sm btn-ghost border border-base-content/15 hover:border-base-content/30 gap-1.5 px-2.5 hidden lg:inline-flex"
              title="Clear output console"
            >
              <Trash2 className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs font-normal">Clear</span>
            </button>
          </div>
        )}

        {/* Right Section: View Switcher, Theme & More Menu */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Navigation View Switcher [Playground | Docs] */}
          <div className="join bg-base-300/60 p-0.5 rounded-lg border border-base-content/10">
            <button
              onClick={() => onViewChange('playground')}
              className={`btn btn-xs join-item font-medium transition-all gap-1 px-2 sm:px-2.5 ${
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
              className={`btn btn-xs join-item font-medium transition-all gap-1 px-2 sm:px-2.5 ${
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

          {/* Theme Toggle Button (Visible on all screens) */}
          <button
            onClick={toggleTheme}
            className="btn btn-xs sm:btn-sm btn-ghost btn-square border border-base-content/15 hover:border-base-content/30"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
            )}
          </button>

          {/* Desktop GitHub Link */}
          <a
            href="https://github.com/sa-nafi/vipr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost gap-1.5 border border-base-content/15 hover:border-base-content/30 text-xs px-2.5 hidden md:inline-flex"
            title="View Vipr on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            <span>GitHub</span>
          </a>

          {/* Mobile Overflow Menu for Secondary Actions */}
          <div className="dropdown dropdown-end md:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-xs btn-ghost btn-square border border-base-content/15"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5 opacity-80" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-40 menu p-2 shadow-2xl bg-base-200 border border-base-content/10 rounded-box w-48 mt-1"
            >
              {activeView === 'playground' && (
                <>
                  <li>
                    <button
                      onClick={() => {
                        onResetCode();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                      className="flex items-center gap-2 text-xs py-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Code</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onClearOutput();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                      className="flex items-center gap-2 text-xs py-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Output</span>
                    </button>
                  </li>
                  <div className="divider my-1 opacity-20" />
                </>
              )}
              <li>
                <a
                  href="https://github.com/sa-nafi/vipr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub Repo</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

