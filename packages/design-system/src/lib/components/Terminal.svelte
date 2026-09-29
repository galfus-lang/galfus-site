<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'xterm/css/xterm.css';
  import type { Terminal as TerminalType } from 'xterm';
  import type { FitAddon as FitAddonType } from 'xterm-addon-fit';

  let { onData } = $props<{
    onData?: (data: string) => void;
  }>();

  let terminalContainer: HTMLElement;
  let term: TerminalType;
  let fitAddon: FitAddonType;

  let dispose: (() => void) | null = null;

  export function write(data: string) {
    if (term) term.write(data);
  }

  export function clear() {
    if (term) term.clear();
  }

  export function focus() {
    if (term) term.focus();
  }

  onMount(async () => {
    const { Terminal } = await import('xterm');
    const { FitAddon } = await import('xterm-addon-fit');

    term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e', // Dark theme matching CodeMirror
        foreground: '#cccccc',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainer);
    fitAddon.fit();

    const dataListener = term.onData((data) => {
      onData?.(data);
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalContainer);

    dispose = () => {
      resizeObserver.disconnect();
      dataListener.dispose();
      term.dispose();
    };
  });

  onDestroy(() => {
    dispose?.();
  });
</script>

<div bind:this={terminalContainer} class="h-full w-full overflow-hidden"></div>
