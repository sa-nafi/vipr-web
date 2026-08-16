import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { 
  BookOpen, 
  Code2, 
  Copy, 
  Check, 
  Play, 
  Layers, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  Hash,
  Menu,
  X
} from 'lucide-react';
import type { ThemeMode } from '../types';

interface DocsPageProps {
  theme: ThemeMode;
  onTrySnippet: (code: string) => void;
}

interface DocSection {
  id: string;
  title: string;
  badge?: string;
}

const DOC_SECTIONS: DocSection[] = [
  { id: 'overview', title: '1. Overview & Philosophy' },
  { id: 'program-structure', title: '2. Program Structure' },
  { id: 'primitive-types', title: '3. Primitive Types' },
  { id: 'variables-constants', title: '4. Variables & Constants' },
  { id: 'arrays-builtins', title: '5. Arrays & Built-in Functions' },
  { id: 'input-output', title: '6. Input and Output' },
  { id: 'operators', title: '7. Operators & Expressions' },
  { id: 'control-flow', title: '8. Control Flow (If / Elif / Else)' },
  { id: 'loops', title: '9. Loops (While & Range For)' },
  { id: 'functions', title: '10. Functions & Signatures' },
  { id: 'scope-comments', title: '11. Scope & Comments' },
  { id: 'complete-example', title: '12. Complete Example Program' },
  { id: 'compiler-cli', title: '13. Compiler & CLI Guide' },
];

export const DocsPage: FC<DocsPageProps> = ({ theme, onTrySnippet }) => {
  const isLight = theme === 'light';
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const isClickScrollingRef = useRef(false);

  // Scroll-spy: track active chapter heading on scroll
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    let ticking = false;

    const calculateActiveSection = () => {
      if (isClickScrollingRef.current) return;

      const mainRect = mainEl.getBoundingClientRect();
      const triggerY = mainRect.top + 140;

      let currentId = DOC_SECTIONS[0].id;
      for (const sec of DOC_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            currentId = sec.id;
          }
        }
      }
      setActiveSection(currentId);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    calculateActiveSection();

    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setIsMobileSidebarOpen(false);

    const targetEl = document.getElementById(id);
    const mainEl = mainRef.current;
    if (targetEl && mainEl) {
      isClickScrollingRef.current = true;
      const targetOffset = targetEl.offsetTop - mainEl.offsetTop - 16;
      mainEl.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });

      // Re-enable scroll-spy after smooth scroll finishes
      setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 600);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const CodeSnippetBlock: FC<{ code: string; id: string; title?: string; canRun?: boolean }> = ({
    code,
    id,
    title,
    canRun = true,
  }) => {
    const isCopied = copiedId === id;

    return (
      <div className={`my-4 rounded-xl border overflow-hidden shadow-sm ${
        isLight ? 'bg-slate-900 border-slate-700/60' : 'bg-neutral-950 border-neutral-800'
      }`}>
        <div className={`flex items-center justify-between px-3 sm:px-4 py-2 border-b select-none text-xs font-mono gap-2 ${
          isLight ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80 flex-shrink-0" />
            <span className="font-medium text-slate-200 truncate">{title || 'Vipr Source'}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleCopy(code, id)}
              className="btn btn-ghost btn-xs gap-1 text-slate-300 hover:text-white hover:bg-slate-700/60 px-2"
              title="Copy code to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 font-sans text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-sans text-[11px] hidden xs:inline">Copy</span>
                </>
              )}
            </button>
            {canRun && (
              <button
                onClick={() => onTrySnippet(code)}
                className="btn btn-xs btn-primary bg-blue-600 hover:bg-blue-700 text-white gap-1 font-sans text-[11px] border-none shadow-sm px-2 sm:px-2.5"
                title="Load into Playground Editor"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Try in Playground</span>
                <span className="sm:hidden">Try</span>
              </button>
            )}
          </div>
        </div>
        <pre className="p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-100 selection:bg-blue-500/30">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col md:flex-row min-h-0 w-full overflow-hidden relative ${isLight ? 'bg-slate-50' : 'bg-base-300'}`}>
      {/* Mobile Sidebar Toggle Button */}
      <div className={`md:hidden flex items-center justify-between px-4 py-2 border-b z-10 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-base-200 border-base-content/10 text-base-content'
      }`}>
        <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
          <BookOpen className="w-4 h-4" />
          <span>Documentation Index</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="btn btn-ghost btn-xs btn-square"
          aria-label="Toggle Table of Contents"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 md:static md:w-64 lg:w-72 flex-shrink-0 flex flex-col border-r transition-transform duration-200 ease-in-out select-none shadow-2xl md:shadow-none
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isLight ? 'bg-white border-slate-200/80 text-slate-700' : 'bg-base-200 border-base-content/10 text-base-content'}
      `}>
        <div className={`flex-none p-4 border-b ${isLight ? 'border-slate-200/60 bg-slate-100/50' : 'border-base-content/10 bg-base-300/40'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 font-bold text-sm text-base-content">
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Language Guide</span>
            </div>
            <div className="badge badge-sm badge-outline border-blue-700/40 dark:border-blue-500/40 text-blue-800 dark:text-blue-400 font-mono text-[10px]">
              v0.3.0
            </div>
          </div>
          <p className="text-[11px] text-base-content/75 font-sans">
            Official specifications & compiler documentation.
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {DOC_SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              onClick={(e) => handleSectionClick(e, sec.id)}
              aria-current={activeSection === sec.id ? 'location' : undefined}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === sec.id
                  ? 'bg-blue-500/15 text-blue-800 dark:text-blue-400 font-semibold border-l-2 border-blue-700 dark:border-blue-500 shadow-sm'
                  : 'text-base-content/75 hover:bg-base-300 hover:text-base-content'
              }`}
            >
              <span className="line-clamp-1">{sec.title}</span>
              <ChevronRight className={`w-3 h-3 opacity-50 ${activeSection === sec.id ? 'opacity-100 text-blue-600 dark:text-blue-400' : ''}`} />
            </a>
          ))}
        </nav>

        <div className={`flex-none p-3 border-t text-xs ${isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-base-content/10 bg-base-300/60 text-base-content/70'}`}>
          <a
            href="https://github.com/sa-nafi/vipr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded hover:bg-base-200 transition-colors text-blue-800 dark:text-blue-400 font-medium"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Documentation Content Area */}
      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 lg:p-12 scroll-smooth max-w-4xl space-y-12">
        {/* Section 1: Overview */}
        <section id="overview" className="space-y-4 pt-2">
          <div className="space-y-2 border-b pb-4 border-base-content/10">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Hash className="w-4 h-4" />
              <span>Section 1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
              The Official Vipr Language Guide <span className="text-blue-700 dark:text-blue-400 font-mono text-lg font-normal">v0.3.0</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-base-content/85 font-sans">
              <strong>Vipr</strong> is a fast, statically typed, ahead-of-time (AOT) compiled programming language designed for simplicity, readability, and learning. Drawing inspiration from Python and Rust, Vipr features a clean indentation-based syntax, mandatory type annotations, and strict block scoping.
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs ${isLight ? 'text-slate-700' : 'text-base-content/80'}`}>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                Native AOT Speed
              </div>
              <p className="opacity-80 leading-relaxed font-sans">
                Compiles directly to optimized C++11 and machine code via g++.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Pythonic Syntax
              </div>
              <p className="opacity-80 leading-relaxed font-sans">
                Clean whitespace indentation with colon-based blocks and no semicolons.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                Strict Type System
              </div>
              <p className="opacity-80 leading-relaxed font-sans">
                Explicit static types for compile-time safety and self-documenting code.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Program Structure */}
        <section id="program-structure" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">2.</span>
              Program Structure
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Every executable Vipr program must define a <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">main</code> function returning <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-xs">void</code>. This is the entry point where execution begins.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-structure"
            title="main.vipr"
            code={`def main() -> void:
    print("Hello, Vipr!")
    print("Compiled and running at native speed.")`}
          />
        </section>

        {/* Section 3: Primitive Types */}
        <section id="primitive-types" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">3.</span>
              Primitive Types
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Vipr features mandatory type declarations for all variables and functions. The built-in primitives are:
            </p>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
            <table className="table table-sm w-full text-xs font-sans">
              <thead>
                <tr className={`${isLight ? 'bg-slate-100 text-slate-800' : 'bg-base-300 text-base-content'}`}>
                  <th className="font-semibold font-mono">Type</th>
                  <th className="font-semibold">Description</th>
                  <th className="font-semibold font-mono">Memory Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-content/10">
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">bool</td>
                  <td>Boolean logical value (<code className="font-mono">true</code> or <code className="font-mono">false</code>)</td>
                  <td className="font-mono opacity-80">1 byte</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">int</td>
                  <td>32-bit signed integer (<code className="font-mono">-2147483648</code> to <code className="font-mono">2147483647</code>)</td>
                  <td className="font-mono opacity-80">32-bit (4 bytes)</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">float</td>
                  <td>32-bit IEEE-754 single-precision floating point</td>
                  <td className="font-mono opacity-80">32-bit (4 bytes)</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">char</td>
                  <td>Single ASCII character literal enclosed in single quotes</td>
                  <td className="font-mono opacity-80">8-bit (1 byte)</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">string</td>
                  <td>Dynamic text string; maps natively to <code className="font-mono">std::string</code> and supports <code className="font-mono">+</code> concatenation</td>
                  <td className="font-mono opacity-80">Dynamic</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold text-blue-700 dark:text-blue-400">void</td>
                  <td>Used exclusively as return type for functions that produce no value</td>
                  <td className="font-mono opacity-80">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Variables & Constants */}
        <section id="variables-constants" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">4.</span>
              Variables & Constants
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Declare mutable variables with <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">let</code> and immutable constants with <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">const</code>. Vipr supports multiple declarations and simultaneous assignment on a single line.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-variables"
            title="Variables & Multi-Assignment"
            code={`def main() -> void:
    // Single variable with initialization
    let name: string = "Alice"
    let age: int = 25

    // Multiple declaration and assignment
    let x, y: float = 1.5, 2.0
    print("Initial x:", x, "y:", y)

    // Simultaneous swap without temporary variable
    x, y = y, x
    print("Swapped x:", x, "y:", y)

    // Immutable constant (must be initialized immediately)
    const PI: float = 3.14159
    print("PI:", PI)`}
          />
        </section>

        {/* Section 5: Arrays & Built-ins */}
        <section id="arrays-builtins" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">5.</span>
              Arrays & Data Structure Built-ins
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Vipr arrays are declared using <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-xs">type[]</code> and map to native <code className="font-mono text-xs">std::vector&lt;T&gt;</code>.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
            <h3 className="font-bold text-sm text-base-content">Built-in Functions:</h3>
            <ul className="list-disc list-inside space-y-1 text-base-content/85 font-sans">
              <li><code className="font-mono font-bold text-blue-700 dark:text-blue-400">len(arr)</code>: Returns the integer length of a <code className="font-mono">string</code> or <code className="font-mono">array</code>.</li>
              <li><code className="font-mono font-bold text-blue-700 dark:text-blue-400">append(arr, item)</code>: Dynamically pushes an element to the end of the array.</li>
            </ul>
          </div>

          <CodeSnippetBlock
            id="snippet-arrays"
            title="Arrays & len() / append()"
            code={`def main() -> void:
    // Array literals and index access
    let numbers: int[] = [10, 20, 30, 40]
    print("Original first element:", numbers[0])
    print("Array size:", len(numbers))

    // Modification
    numbers[0] = 99
    print("Updated first element:", numbers[0])

    // Dynamic append
    append(numbers, 500)
    print("New length after append:", len(numbers))`}
          />
        </section>

        {/* Section 6: Input and Output */}
        <section id="input-output" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">6.</span>
              Input and Output Statements
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Interactive console operations are handled via <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">print</code> and <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">input</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-bold text-blue-700 dark:text-blue-400 mb-1 font-mono">print(arg1, arg2, ...)</div>
              <p className="text-base-content/80 font-sans leading-relaxed">
                Outputs values sequentially to the console, automatically followed by a newline.
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-bold text-blue-700 dark:text-blue-400 mb-1 font-mono">input(var1, var2, ...)</div>
              <p className="text-base-content/80 font-sans leading-relaxed">
                Reads whitespace-delimited user inputs from stdin directly into pre-declared variables.
              </p>
            </div>
          </div>

          <CodeSnippetBlock
            id="snippet-io"
            title="Input & Output"
            code={`def main() -> void:
    let item_name: string = "Widget"
    let price: float = 19.95
    let quantity: int = 3

    print("Order Summary for: ", item_name)
    print("Total cost: $", price * quantity)`}
          />
        </section>

        {/* Section 7: Operators */}
        <section id="operators" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">7.</span>
              Operators & Precedence
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Standard arithmetic, comparison, compound assignment, and logical keyword operators:
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono ${isLight ? 'text-slate-700' : 'text-base-content/80'}`}>
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-bold font-sans text-xs text-blue-700 dark:text-blue-400 mb-1">Arithmetic & Assignment</div>
              <p className="opacity-90">+ , - , * , / , %</p>
              <p className="opacity-90">= , += , -= , *= , /=</p>
            </div>
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
              <div className="font-bold font-sans text-xs text-blue-700 dark:text-blue-400 mb-1">Comparison & Logical</div>
              <p className="opacity-90">== , != , &lt; , &gt; , &lt;= , &gt;=</p>
              <p className="opacity-90 text-blue-700 dark:text-blue-400 font-bold">and , or , not</p>
            </div>
          </div>
        </section>

        {/* Section 8: Control Flow */}
        <section id="control-flow" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">8.</span>
              Control Flow (If / Elif / Else)
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Conditional logic uses Python-style blocks terminated with a colon <code className="font-mono text-xs">:</code>. Parentheses are not required.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-control-flow"
            title="If / Elif / Else"
            code={`def main() -> void:
    let score: int = 85

    if score >= 90:
        print("Grade: A (Excellent)")
    elif score >= 80:
        print("Grade: B (Good)")
    elif score >= 70:
        print("Grade: C (Average)")
    else:
        print("Grade: F (Needs Improvement)")`}
          />
        </section>

        {/* Section 9: Loops */}
        <section id="loops" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">9.</span>
              Loops (While & Range-based For)
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Vipr provides while loops and strictly typed <code className="font-mono text-xs">range(start, end, step)</code> for loops.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-loops"
            title="While and Range-based For Loops"
            code={`def main() -> void:
    // While loop
    print("--- While Loop Countdown ---")
    let count: int = 3
    while count > 0:
        print(count)
        count -= 1
    print("Liftoff!")
    print("")

    // Range For Loop: range(start, end, step)
    print("--- Range For Loop (even numbers) ---")
    for i: int in range(0, 10, 2):
        print("i =", i)`}
          />
        </section>

        {/* Section 10: Functions */}
        <section id="functions" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">10.</span>
              Functions & Signatures
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Functions are defined with <code className="px-1.5 py-0.5 rounded bg-base-200 font-mono text-blue-700 dark:text-blue-400 font-semibold text-xs">def</code>, typed arguments, return arrow <code className="font-mono text-xs">-&gt;</code>, and a return type annotation.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-functions"
            title="Function Signatures & Recursion"
            code={`// Function returning an integer
def factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

// Void function with string argument
def greet(name: string) -> void:
    print("Hello, ", name, "!")

def main() -> void:
    greet("Vipr Developer")
    let result: int = factorial(5)
    print("Factorial of 5 is:", result)`}
          />
        </section>

        {/* Section 11: Scope & Comments */}
        <section id="scope-comments" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">11.</span>
              Scope & Comments
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              Vipr enforces strict block scoping. Variables declared inside an indented block are invisible outside of it.
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-comments"
            title="Comments & Block Scope"
            code={`// Single-line comment begins with two slashes

/*
  Multi-line block comments
  are enclosed with slash-star
*/

def main() -> void:
    let outer_var: int = 100

    if outer_var > 50:
        let inner_var: int = 42
        print("Inner scope has access to:", inner_var, "and", outer_var)
    
    // inner_var is out of scope here`}
          />
        </section>

        {/* Section 12: Complete Example */}
        <section id="complete-example" className="space-y-4 pt-4 border-t border-base-content/10">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">12.</span>
              Complete Example Program
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              A comprehensive program showcasing functions, arrays, conditionals, and math operations together:
            </p>
          </div>

          <CodeSnippetBlock
            id="snippet-complete"
            title="complete_demo.vipr"
            code={`const MAX_LIMIT: int = 100

def add(a: int, b: int) -> int:
    return a + b

def calculate_stats(scores: int[]) -> void:
    print("Analyzing", len(scores), "scores...")
    let total: int = 0
    let i: int = 0

    while i < len(scores):
        total += scores[i]
        i += 1

    print("Sum total:", total)
    print("Average:", total / len(scores))

def main() -> void:
    let a, b: int = 45, 60
    let sum: int = add(a, b)
    print("Sum of", a, "and", b, "is:", sum)

    if sum > MAX_LIMIT:
        print("Status: Exceeds maximum limit!")
    else:
        print("Status: Within acceptable range.")

    let test_scores: int[] = [85, 92, 78, 90]
    calculate_stats(test_scores)`}
          />
        </section>

        {/* Section 13: Compiler & CLI */}
        <section id="compiler-cli" className="space-y-4 pt-4 border-t border-base-content/10 pb-16">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">13.</span>
              Compiler & CLI Guide
            </h2>
            <p className="text-sm text-base-content/85 leading-relaxed">
              The Vipr compiler translates source code into optimized C++11 and calls <code className="font-mono text-xs">g++</code> for native machine compilation.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-3 text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-base-200 border-base-content/10'}`}>
            <h3 className="font-bold text-sm text-base-content">Compiler CLI Flags:</h3>
            <ul className="space-y-2 font-mono text-base-content/85">
              <li className="flex items-start gap-2">
                <span className="badge badge-sm badge-outline border-blue-700/40 text-blue-700 dark:text-blue-400 font-bold">-o &lt;name&gt;</span>
                <span className="font-sans">Specify the compiled output binary name.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="badge badge-sm badge-outline border-blue-700/40 text-blue-700 dark:text-blue-400 font-bold">--emit-cpp</span>
                <span className="font-sans">Preserves the generated C++ translation file instead of deleting it.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="badge badge-sm badge-outline border-blue-700/40 text-blue-700 dark:text-blue-400 font-bold">--dump-ast</span>
                <span className="font-sans">Prints the Abstract Syntax Tree (AST) to stdout for compiler diagnostics.</span>
              </li>
            </ul>
          </div>

          <CodeSnippetBlock
            id="snippet-cli-usage"
            title="Terminal CLI Command"
            canRun={false}
            code={`# Compile and emit native binary
vipr main.vipr -o my_app --emit-cpp

# Execute compiled binary
./my_app`}
          />
        </section>
      </main>
    </div>
  );
};
