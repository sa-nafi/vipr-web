import type { Monaco } from '@monaco-editor/react';
import type { languages, editor } from 'monaco-editor';

export const VIPR_LANGUAGE_ID = 'vipr';

export const viprLanguageConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '/*', close: '*/', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  indentationRules: {
    increaseIndentPattern: /^.*:\s*$/,
    decreaseIndentPattern: /^\s*(elif|else|except|finally)\b.*:$/,
  },
};

export const viprMonarchTokensProvider: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.vipr',

  keywords: [
    'def',
    'let',
    'const',
    'return',
    'if',
    'else',
    'elif',
    'for',
    'while',
    'break',
    'continue',
    'pass',
    'and',
    'or',
    'not',
    'in',
    'true',
    'false',
    'print',
    'input',
  ],

  typeKeywords: [
    'int',
    'float',
    'bool',
    'char',
    'string',
    'void',
  ],

  builtins: [
    'len',
    'append',
    'range',
  ],

  operators: [
    '=', '+=', '-=', '*=', '/=',
    '==', '!=', '<', '>', '<=', '>=',
    '+', '-', '*', '/', '%',
    '->',
  ],

  // symbols and regexes
  symbols: /[=><!~?:&|+\-*/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // whitespace & comments
      { include: '@whitespace' },

      // arrows and colons
      [/->/, 'delimiter.arrow'],
      [/:/, 'delimiter.colon'],
      [/,/, 'delimiter.comma'],
      [/[{}()[\]]/, '@brackets'],

      // function calls and definitions
      [
        /[a-zA-Z_]\w*(?=\s*\()/,
        {
          cases: {
            '@keywords': 'keyword',
            '@builtins': 'support.function',
            '@default': 'entity.name.function',
          },
        },
      ],

      // builtins, types, and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@typeKeywords': 'type',
            '@builtins': 'support.function',
            '@default': 'identifier',
          },
        },
      ],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string_double' }],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

      // operators
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],
  },
};

export const registerViprLanguage = (monaco: Monaco) => {
  // Check if language already registered
  const registeredLanguages = monaco.languages.getLanguages();
  if (!registeredLanguages.some((lang: languages.ILanguageExtensionPoint) => lang.id === VIPR_LANGUAGE_ID)) {
    monaco.languages.register({ id: VIPR_LANGUAGE_ID });
  }

  monaco.languages.setLanguageConfiguration(VIPR_LANGUAGE_ID, viprLanguageConfiguration);
  monaco.languages.setMonarchTokensProvider(VIPR_LANGUAGE_ID, viprMonarchTokensProvider);

  // VS Code Dark+ Theme
  const darkTheme: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569cd6' }, // VS Code Blue
      { token: 'type', foreground: '4ec9b0' }, // VS Code Teal
      { token: 'entity.name.function', foreground: 'dcdcaa' }, // VS Code Yellow Function
      { token: 'support.function', foreground: 'dcdcaa' }, // VS Code Yellow Builtin
      { token: 'identifier', foreground: '9cdcfe' }, // VS Code Light Blue Identifier
      { token: 'number', foreground: 'b5cea8' }, // VS Code Light Green
      { token: 'number.float', foreground: 'b5cea8' },
      { token: 'string', foreground: 'ce9178' }, // VS Code Terracotta/Orange
      { token: 'string.quote', foreground: 'ce9178' },
      { token: 'string.escape', foreground: 'd7ba7d' }, // VS Code Gold
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' }, // VS Code Muted Green
      { token: 'operator', foreground: 'd4d4d4' },
      { token: 'delimiter.arrow', foreground: '569cd6' },
      { token: 'delimiter.colon', foreground: 'd4d4d4' },
    ],
    colors: {
      'editor.background': '#1e1e1e', // Classic VS Code Dark+
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editor.selectionBackground': '#264f78',
      'editor.lineHighlightBackground': '#282828',
      'editorCursor.foreground': '#aeafad',
      'editorWhitespace.foreground': '#3b3a32',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
    },
  };

  // VS Code Light+ Theme
  const lightTheme: editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0000ff' }, // VS Code Classic Blue
      { token: 'type', foreground: '267f99' }, // VS Code Cyan/Teal
      { token: 'entity.name.function', foreground: '795e26' }, // VS Code Brown/Gold Function
      { token: 'support.function', foreground: '795e26' },
      { token: 'identifier', foreground: '001080' }, // VS Code Navy Identifier
      { token: 'number', foreground: '098658' }, // VS Code Green
      { token: 'number.float', foreground: '098658' },
      { token: 'string', foreground: 'a31515' }, // VS Code Crimson
      { token: 'string.quote', foreground: 'a31515' },
      { token: 'string.escape', foreground: 'ee0000' },
      { token: 'comment', foreground: '008000', fontStyle: 'italic' }, // VS Code Green
      { token: 'operator', foreground: '000000' },
      { token: 'delimiter.arrow', foreground: '0000ff' },
      { token: 'delimiter.colon', foreground: '000000' },
    ],
    colors: {
      'editor.background': '#ffffff', // Classic VS Code Light+
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0b216f',
      'editor.selectionBackground': '#add6ff',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editorCursor.foreground': '#000000',
      'editorWhitespace.foreground': '#e3e4e6',
      'editorIndentGuide.background': '#d3d3d3',
      'editorIndentGuide.activeBackground': '#939393',
    },
  };

  monaco.editor.defineTheme('vipr-dark', darkTheme);
  monaco.editor.defineTheme('vipr-light', lightTheme);
};
