<script lang="ts">
  import { getPlayground, type Playground } from '$lib/wasm/galfus';
  import { onMount } from 'svelte';
  import Editor from '$lib/components/Editor.svelte';
  import Terminal from '$lib/components/Terminal.svelte';

  let playground = $state<Playground | null>(null);
  let code = $state(
    'import { println } from \'std/io\' \n\nexport fn main(args: [[u8]]): i32 {\n  println("Hello, Galfus!")\n\n  return 0\n}\n',
  );
  let terminal: ReturnType<typeof Terminal> | undefined = $state();

  onMount(async () => {
    playground = await getPlayground();

    // Configura o callback para as saídas do Galfus
    playground.setWriteCallback((msg: string | Uint8Array) => {
      if (terminal) {
        if (typeof msg === 'string') {
          // O terminal geralmente precisa de \r\n em vez de \n puro para quebrar linha certo
          terminal.write(msg.replace(/\n/g, '\r\n'));
        } else {
          // Caso envie Uint8Array
          const str = new TextDecoder().decode(msg);
          terminal.write(str.replace(/\n/g, '\r\n'));
        }
      }
    });

    playground.setConfig('[module]\nname = "my-app"\ntarget = "app"\nentry = "main.gfs"\n');
  });

  function handleTerminalData(data: string) {
    // Quando o usuário digita no terminal (stdin)
    if (playground) {
      const bytes = new TextEncoder().encode(data);
      playground.sendReadData(bytes);
    }
  }

  function runCode() {
    if (!playground || !terminal) return;

    terminal.clear();
    terminal.write('\x1b[32m$ Running Galfus...\x1b[0m\r\n');

    try {
      // Define o código fonte
      playground.setSource('main.gfs', code);

      // 1. Check (Typechecking / Parsing)
      const resultCheckRaw = playground.check();
      const resultCheck = JSON.parse(resultCheckRaw);

      if (!resultCheck.is_valid) {
        terminal.write('\r\n\x1b[31m[Check Error]\x1b[0m\r\n');
        // diagnostics pode vir como string do Rust Debug
        const diag =
          typeof resultCheck.diagnostics === 'string'
            ? resultCheck.diagnostics.replace(/\n/g, '\r\n')
            : JSON.stringify(resultCheck.diagnostics, null, 2).replace(/\n/g, '\r\n');
        terminal.write(`\x1b[33m${diag}\x1b[0m\r\n`);
        return; // Interrompe se o check falhar
      }

      // 2. Compile
      const resultCompileRaw = playground.compile();
      const resultCompile = JSON.parse(resultCompileRaw);

      if (!resultCompile.ok) {
        terminal.write('\r\n\x1b[31m[Compile Error]\x1b[0m\r\n');
        terminal.write(`\x1b[33m${String(resultCompile.error).replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
        return; // Interrompe se a compilação falhar
      }

      // 3. Run
      const resultRunRaw = playground.run('[]');
      const resultRun = JSON.parse(resultRunRaw);

      if (resultRun.error) {
        terminal.write('\r\n\x1b[31m[Runtime Error]\x1b[0m\r\n');
        terminal.write(`\x1b[33m${String(resultRun.error).replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
      } else {
        // Se houver algum output retornado no json que não foi capturado pelo callback
        if (resultRun.output && resultRun.output.trim() !== '') {
          // terminal.write(resultRun.output.replace(/\n/g, '\r\n'));
        }
        terminal.write(
          `\r\n\x1b[32m$ Execution finished (exit code ${resultRun.exit_code}).\x1b[0m\r\n`,
        );
      }
    } catch (e: any) {
      terminal.write(`\r\n\x1b[31mFatal Error: ${e.toString().replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
    }
  }
</script>

<svelte:head>
  <title>Galfus REPL</title>
</svelte:head>

<div class="flex h-screen flex-col bg-zinc-950 text-zinc-300">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-3">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold tracking-wide text-indigo-400">Galfus REPL</h1>
      <span class="text-sm text-zinc-500">
        {#if playground}
          v{playground.getVersion()}
        {:else}
          Loading engine...
        {/if}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={runCode}
        disabled={!playground}
        class="flex items-center gap-2 rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg
        >
        Run
      </button>
      <button
        onclick={() => terminal?.clear()}
        class="rounded bg-zinc-800 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
      >
        Clear
      </button>
    </div>
  </header>

  <!-- Main Content: Split View -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Left: Editor -->
    <div class="flex-1 border-r border-zinc-800">
      <Editor bind:code />
    </div>

    <!-- Right: Terminal -->
    <div class="flex-1 bg-[#1e1e1e] p-2">
      <Terminal bind:this={terminal} onData={handleTerminalData} />
    </div>
  </main>
</div>
