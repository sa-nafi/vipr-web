import type { CodeExample } from '../types';

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Basic Vipr program entry point with main function and print statement',
    category: 'Basics',
    code: `// Welcome to the Vipr Playground!
// Vipr is a fast, statically typed, compiled language with Pythonic syntax.

def main() -> void:
    print("Hello, Vipr!")
    print("Compiled and running at native speed.")
`,
  },
  {
    id: 'factorial-recursion',
    title: 'Factorial / Recursion',
    description: 'Recursive mathematical computation with typed arguments and returns',
    category: 'Algorithms',
    code: `// Recursive factorial calculation in Vipr

def factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def main() -> void:
    let n: int = 6
    let result: int = factorial(n)
    print("Factorial of ", n, " is ", result)
    
    // Test with multiple values
    print("--- First 5 factorials ---")
    let i: int = 1
    while i <= 5:
        print("!", i, " = ", factorial(i))
        i += 1
`,
  },
  {
    id: 'strings-and-arrays',
    title: 'Strings & Arrays',
    description: 'Demonstrating len(), append(), indexing, and string concatenation',
    category: 'Data Structures',
    code: `// Strings and Arrays in Vipr

def process_array(arr: int[]) -> void:
    let size: int = len(arr)
    print("Initial array length:", size)
    
    // Append dynamically
    append(arr, 99)
    print("Appended element 99. New length:", len(arr))

def main() -> void:
    // String concatenation and len()
    let greeting: string = "Hello"
    let language: string = "Vipr"
    let full_message: string = greeting + ", " + language + " Playground!"
    print(full_message)
    print("Message character count:", len(full_message))
    print("")

    // Array literals, indexing, and modification
    let numbers: int[] = [10, 20, 30, 40]
    print("Original first element:", numbers[0])
    
    numbers[0] = 42
    print("Modified first element:", numbers[0])
    
    process_array(numbers)
`,
  },
  {
    id: 'multi-assignment-and-loops',
    title: 'Multi-Assignment & Loops',
    description: 'Simultaneous variable swapping (a, b = b, a) and iterative while / for loops',
    category: 'Basics',
    code: `// Multi-assignment and loops in Vipr

def main() -> void:
    // Multi-variable declaration and initialization
    let a, b: int = 10, 20
    print("Before swap: a =", a, ", b =", b)
    
    // Simultaneous swap without temporary variable
    a, b = b, a
    print("After swap:  a =", a, ", b =", b)
    print("")

    // Fibonacci sequence using multi-assignment & while loop
    print("=== Fibonacci Series ===")
    let f1, f2: int = 0, 1
    let count: int = 0
    
    while count < 8:
        print("Term", count, ":", f1)
        f1, f2 = f2, f1 + f2
        count += 1
`,
  },
  {
    id: 'control-flow-and-types',
    title: 'Control Flow & Logic',
    description: 'If-elif-else branches, comparisons, and boolean logic',
    category: 'Algorithms',
    code: `// Control flow & logic in Vipr

const MAX_SCORE: int = 100

def get_grade(score: int) -> string:
    if score >= 90 and score <= MAX_SCORE:
        return "Grade A"
    elif score >= 80:
        return "Grade B"
    elif score >= 70:
        return "Grade C"
    elif score >= 60:
        return "Grade D"
    else:
        return "Grade F"

def main() -> void:
    let scores: int[] = [95, 82, 74, 58]
    let i: int = 0
    
    while i < len(scores):
        let current_score: int = scores[i]
        print("Score", current_score, "->", get_grade(current_score))
        i += 1
`,
  },
];

export const DEFAULT_EXAMPLE = CODE_EXAMPLES[0];
