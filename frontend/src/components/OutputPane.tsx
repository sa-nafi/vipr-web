import { useState } from 'react';
import type { FC } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Server,
  Zap
} from 'lucide-react';
import type { ExecutionResult, ExecutionStatus, ThemeMode } from '../types';

interface OutputPaneProps {
  result: ExecutionResult;
  status: ExecutionStatus;
  onClear: () => void;
  theme?: ThemeMode;
}

export const OutputPane: FC<OutputPaneProps> = ({
  result,
  status,
  onClear,
  theme = 'light',
}) => {
  const [copied, setCopied] = useState(false);

  const isLight = theme === 'light';
  const fullOutput = result.stdout || result.stderr || '';

  const handleCopy = async () => {
    if (!fullOutput) return;
    try {
      await navigator.clipboard.writeText(fullOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Status Badge Component
  const renderStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-sky-100 text-sky-800 border-sky-300'
              : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
            }`}>
            <span className="loading loading-spinner loading-xs" />
            <span>Compiling & Running</span>
          </div>
        );
      case 'waking_up':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] animate-pulse ${isLight
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
            <Server className="w-3 h-3 animate-spin" />
            <span>Waking up server...</span>
          </div>
        );
      case 'success':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>
              {result.durationMs !== undefined
                ? `Executed in ${result.durationMs}ms`
                : 'Execution succeeded'}
            </span>
          </div>
        );
      case 'compile_error':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
            <AlertCircle className="w-3 h-3" />
            <span>Compilation Error</span>
          </div>
        );
      case 'runtime_error':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
            <AlertCircle className="w-3 h-3" />
            <span>Runtime Error</span>
          </div>
        );
      case 'timeout':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
            <Clock className="w-3 h-3" />
            <span>Execution Timed Out</span>
          </div>
        );
      case 'network_error':
        return (
          <div className={`badge badge-sm gap-1.5 py-2 font-mono text-[11px] ${isLight
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
            <AlertCircle className="w-3 h-3" />
            <span>Backend Unreachable</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="badge badge-ghost badge-sm gap-1.5 py-2 font-mono text-[11px] opacity-60">
            <Zap className={`w-3 h-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            <span>Ready</span>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden relative ${isLight ? 'bg-slate-50' : 'bg-base-100'}`}>
      {/* Terminal Header */}
      <div className={`flex-none h-10 flex items-center justify-between px-3 border-b select-none ${isLight
          ? 'bg-slate-200/70 border-slate-300/80 text-slate-700'
          : 'bg-base-200/80 border-base-content/10 text-base-content/80'
        }`}>
        <div className="flex items-center gap-3">
          {/* Traffic light decorative dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-base-content/80'
            }`}>
            <Terminal className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            <span>CONSOLE OUTPUT</span>
          </div>
        </div>

        {/* Action Controls & Status */}
        <div className="flex items-center gap-2">
          {renderStatusBadge()}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!fullOutput}
            className={`btn btn-ghost btn-xs gap-1 font-mono text-[11px] border disabled:opacity-30 ${isLight
                ? 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white/60'
                : 'border-base-content/10 hover:border-base-content/25'
              }`}
            title="Copy output to clipboard"
          >
            {copied ? (
              <>
                <Check className={`w-3 h-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                <span className={isLight ? 'text-blue-600' : 'text-blue-400'}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 opacity-70" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Clear Button */}
          <button
            onClick={onClear}
            disabled={!fullOutput && status === 'idle'}
            className={`btn btn-ghost btn-xs btn-square border disabled:opacity-30 ${isLight
                ? 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white/60'
                : 'border-base-content/10 hover:border-base-content/25'
              }`}
            title="Clear output"
          >
            <Trash2 className="w-3 h-3 opacity-70 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Terminal Output Content Area */}
      <div className={`flex-1 w-full p-4 overflow-y-auto font-mono text-xs md:text-sm ${isLight
          ? 'bg-slate-50 text-slate-900 selection:bg-blue-200 selection:text-blue-950'
          : 'bg-neutral-950 text-neutral-100 selection:bg-blue-500/30 selection:text-blue-200'
        }`}>
        {/* Loading / Compiling State */}
        {(status === 'running' || status === 'waking_up') && (
          <div className={`flex flex-col items-center justify-center h-full gap-3 py-12 ${isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}>
            <div className="relative">
              <span className={`loading loading-spinner loading-lg ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <Flame className={`w-4 h-4 absolute inset-0 m-auto animate-pulse ${isLight ? 'text-blue-600' : 'text-blue-300'
                }`} />
            </div>
            <div className="text-center space-y-1">
              <p className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                Compiling Vipr & Executing Binary...
              </p>
              {status === 'waking_up' && (
                <p className={`text-xs font-sans max-w-sm ${isLight ? 'text-amber-700 font-medium' : 'text-amber-400/90'}`}>
                  Container cold start detected (free tier instance warming up). Execution will finish shortly.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Idle / Initial Welcome State */}
        {status === 'idle' && !fullOutput && (
          <div className={`flex flex-col items-center justify-center h-full gap-4 py-8 select-none ${isLight ? 'text-slate-600' : 'text-neutral-400'
            }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${isLight
                ? 'bg-white border-slate-200 text-blue-600 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-blue-400/80'
              }`}>
              <Terminal className="w-6 h-6" />
            </div>
            <div className="text-center max-w-xs space-y-1">
              <p className={`font-medium text-sm ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                Ready to Execute
              </p>
              <p className={`text-xs font-sans ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                Click the <span className={`font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>Run</span> button or press{' '}
                <kbd className={`kbd kbd-xs font-mono ${isLight
                    ? 'bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}>
                  Ctrl+Enter
                </kbd>{' '}
                to compile and execute your Vipr code.
              </p>
            </div>
            <div className={`grid grid-cols-2 gap-2 text-[11px] font-sans mt-2 ${isLight ? 'text-slate-700' : 'text-neutral-300'
              }`}>
              <div className={`p-2 rounded border flex items-center gap-1.5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900/60 border-neutral-800/80'
                }`}>
                <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>✓</span> Ahead-of-time C++ backend
              </div>
              <div className={`p-2 rounded border flex items-center gap-1.5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900/60 border-neutral-800/80'
                }`}>
                <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>✓</span> Strict type system
              </div>
            </div>
          </div>
        )}

        {/* Output Text Rendering */}
        {status !== 'running' && status !== 'waking_up' && (result.stdout || result.stderr) && (
          <div className="space-y-3">
            {/* Standard Output */}
            {result.stdout && (
              <div className="space-y-1">
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400/80'
                  }`}>
                  Standard Output
                </div>
                <pre className={`whitespace-pre-wrap font-mono leading-relaxed p-3 rounded-lg border ${isLight
                    ? 'bg-blue-50/80 border-blue-200 text-blue-950 shadow-sm'
                    : 'bg-neutral-900/40 border-blue-500/10 text-blue-200/90'
                  }`}>
                  {result.stdout}
                </pre>
              </div>
            )}

            {/* Standard Error / Compilation Diagnostics */}
            {result.stderr && (
              <div className="space-y-1">
                <div className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${isLight ? 'text-rose-700' : 'text-rose-400/80'
                  }`}>
                  <AlertCircle className="w-3 h-3" />
                  <span>Diagnostics & Errors</span>
                </div>
                <pre className={`whitespace-pre-wrap font-mono leading-relaxed p-3 rounded-lg border ${isLight
                    ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-sm'
                    : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                  }`}>
                  {result.stderr}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className={`flex-none h-7 flex items-center justify-between px-3 border-t text-[11px] font-mono select-none ${isLight
          ? 'bg-slate-200/70 border-slate-300/80 text-slate-700'
          : 'bg-base-200/80 border-base-content/10 text-base-content/75'
        }`}>
        <div className="flex items-center gap-2">
          <span>Exit code: {status === 'success' ? '0' : status === 'idle' ? '-' : '1'}</span>
          {result.durationMs !== undefined && (
            <span>• Time: {result.durationMs}ms</span>
          )}
        </div>
        {result.timestamp && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-60" />
            <span>{result.timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
};
