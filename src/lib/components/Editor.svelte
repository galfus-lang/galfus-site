<script lang="ts">
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import {
    bracketMatching,
    foldGutter,
    foldKeymap,
    indentOnInput,
    StreamLanguage,
  } from '@codemirror/language';
  import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode';
  import { EditorState } from '@codemirror/state';
  import { oneDark } from '@codemirror/theme-one-dark';
  import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
  } from '@codemirror/view';
  import { onMount } from 'svelte';

  let { code = $bindable(), onChange } = $props<{
    code?: string;
    onChange?: (value: string) => void;
  }>();

  let editorContainer: HTMLElement;
  let view: EditorView;

  // Translation of Galfus TextMate grammar to simpleMode
  const galfusMode = simpleMode({
    start: [
      // Strings
      { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: 'string' },
      { regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: 'string' },
      { regex: /`(?:[^\\]|\\.)*?(?:`|$)/, token: 'string' },

      // Decorators
      { regex: /@[A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*\b/, token: 'meta' },

      // Keywords
      {
        regex:
          /\b(?:if|else|for|loop|break|continue|return|match|instanceof|typeof|transaction|rollback|import|from|export|fn|var|const|struct|enum|choice|constraint|type|external|weak|in|satisfies|new|copy|self)\b/,
        token: 'keyword',
      },

      // Types
      { regex: /\b(?:bool|i8|i16|i32|i64|u8|u16|u32|u64|f32|f64)\b/, token: 'type' },
      { regex: /\b[A-Z][A-Za-z0-9_]*\b/, token: 'type' }, // Nominal types starting with uppercase

      // Constants
      { regex: /\b(?:true|false|null)\b/, token: 'atom' },

      // Numbers
      { regex: /\b\d[\d_]*\.(?!\.)\d[\d_]*(?:[eE][+-]?\d[\d_]*)?\b/, token: 'number' }, // floats
      { regex: /\b\d[\d_]*\b/, token: 'number' }, // integers

      // Comments
      { regex: /\/\/.*/, token: 'comment' },
      { regex: /\/\*/, token: 'comment', next: 'comment' },

      // Operators
      {
        regex: /\.\.\.|\.\.|::|\?\?=|[=!]=|<=|>=|=>|[\+\-\*\/%]=|&&|\|\||!|<|>|\?\?|[\+\-\*\/%]/,
        token: 'operator',
      },

      // Function Calls
      { regex: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(?:<[^>\n]+>\s*)?\()/, token: 'variable-2' },

      // Identifiers
      { regex: /\b[A-Za-z_][A-Za-z0-9_]*\b/, token: 'variable' },
      { regex: /(?<![A-Za-z0-9_])_(?![A-Za-z0-9_])/, token: 'variable-3' }, // Wildcard _
    ],
    comment: [
      { regex: /.*?\*\//, token: 'comment', next: 'start' },
      { regex: /.*/, token: 'comment' },
    ],
    languageData: {
      commentTokens: {
        line: '//',
        block: { open: '/*', close: '*/' },
      },
    },
  });

  const galfusLanguage = StreamLanguage.define(galfusMode);

  onMount(() => {
    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
        galfusLanguage,
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            code = update.state.doc.toString();
            onChange?.(code);
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: editorContainer,
    });

    return () => {
      view.destroy();
    };
  });
</script>

<div
  bind:this={editorContainer}
  class="h-full w-full overflow-hidden [&>.cm-editor]:h-full [&>.cm-editor]:w-full [&>.cm-editor]:outline-none"
></div>
