<script lang="ts">
  import { getPlayground, type Playground } from '$lib/wasm/galfus';
  import { onMount } from 'svelte';
  import Editor from '$lib/components/Editor.svelte';
  import Terminal from '$lib/components/Terminal.svelte';

  let playground = $state<Playground | null>(null);
  const scripts = import.meta.glob('./scripts/*.gfs', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  let selectedScript = $state('./scripts/hello-world.gfs');
  let code = $state(scripts['./scripts/hello-world.gfs'] || '');

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

  let runId = 0;
  let isRunning = false;
  let resolveRead: (() => void) | null = null;

  let inputBuffer = '';

  function handleTerminalData(data: string) {
    if (!playground || !terminal) return;

    // Apenas processa a entrada se estivermos esperando por uma leitura
    if (!resolveRead) return;

    if (data === '\r') {
      // Enter pressionado: escreve a quebra de linha visualmente
      terminal.write('\r\n');
      // Envia os dados acumulados (com quebra de linha) para a VM
      console.log(inputBuffer);
      const bytes = new TextEncoder().encode(inputBuffer + '\n');
      playground.sendReadData(bytes);
      inputBuffer = '';

      // Libera a VM
      resolveRead();
      resolveRead = null;
    } else if (data === '\x7f') {
      // Backspace pressionado
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        terminal.write('\b \b'); // Apaga visualmente no xterm
      }
    } else {
      // Outro caractere digitado
      inputBuffer += data;
      terminal.write(data); // Echo local para o usuário ver o que digita
    }
  }

  async function runCode() {
    if (!playground || !terminal) return;

    // Cancela qualquer execução anterior
    runId++;
    const currentRunId = runId;
    isRunning = true;
    resolveRead = null;

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

      // 3. Run -> Start e Step loop
      const startRaw = playground.start('[]');
      const startResult = JSON.parse(startRaw);

      if (!startResult.ok) {
        terminal.write('\r\n\x1b[31m[Runtime Error]\x1b[0m\r\n');
        terminal.write(`\x1b[33m${String(startResult.error).replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
        isRunning = false;
        return;
      }

      while (currentRunId === runId) {
        const stepRaw = playground.step();
        const resultStep = JSON.parse(stepRaw);

        if (resultStep.error) {
          terminal.write('\r\n\x1b[31m[Runtime Error]\x1b[0m\r\n');
          terminal.write(`\x1b[33m${String(resultStep.error).replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
          break;
        }

        if (resultStep.status === 'completed') {
          terminal.write(
            `\r\n\x1b[32m$ Execution finished (exit code ${resultStep.exit_code}).\x1b[0m\r\n`,
          );
          break;
        }

        if (resultStep.status === 'pending_read') {
          // Foca o terminal para garantir que o xterm esteja em modo de entrada
          terminal.focus();
          // Pausa a execução assíncrona até que algo seja digitado e o Enter seja pressionado
          await new Promise<void>((r) => {
            resolveRead = r;
          });
        } else if (resultStep.status === 'running') {
          // Cede tempo para o navegador redesenhar a tela (Evita congelamentos)
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }
    } catch (e: any) {
      terminal.write(`\r\n\x1b[31mFatal Error: ${e.toString().replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
    } finally {
      if (currentRunId === runId) {
        isRunning = false;
        resolveRead = null;
      }
    }
  }
</script>

<svelte:head>
  <title>Galfus REPL</title>
</svelte:head>

<div class="flex h-screen flex-col bg-primary-3 text-primary-12">
  <!-- Header -->
  <header
    class="flex items-center justify-between border-b border-primary-6 bg-primary-3 px-6 py-3"
  >
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold tracking-wide text-primary-11">Galfus REPL</h1>
      <span class="text-sm">
        {#if playground}
          v{playground.getVersion()}
        {:else}
          Loading engine...
        {/if}
      </span>
    </div>

    <div class="flex items-center gap-4">
      <select
        value={selectedScript}
        onchange={(e) => {
          selectedScript = (e.target as HTMLSelectElement).value;
          code = scripts[selectedScript] || '';
        }}
        class="rounded border border-primary-6 bg-primary-2 px-3 py-1.5 text-sm text-primary-11 outline-none transition-colors focus:border-primary-8"
      >
        {#each Object.keys(scripts) as path}
          <option value={path}>{path.replace('./scripts/', '')}</option>
        {/each}
      </select>

      <div class="flex items-center gap-2">
        <button
          onclick={runCode}
          disabled={!playground}
          class="flex items-center gap-2 rounded bg-primary-6 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-5 disabled:opacity-50"
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
          class="rounded bg-primary-8 px-3 py-1.5 text-sm font-semibold hover:bg-primary-7 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content: Split View -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Left: Editor -->
    <div class="flex-1 border-r border-primary-8">
      <Editor bind:code />
    </div>

    <!-- Right: Terminal -->
    <div class="flex-1 bg-[#1e1e1e] p-2">
      <Terminal bind:this={terminal} onData={handleTerminalData} />
    </div>
  </main>
</div>
