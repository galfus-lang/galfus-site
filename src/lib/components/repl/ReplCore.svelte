<script lang="ts">
  import { getPlayground, type Playground } from '$lib/wasm/galfus';
  import { onMount } from 'svelte';
  import Editor from '$lib/components/Editor.svelte';
  import Terminal from '$lib/components/Terminal.svelte';
  import { cn } from '$lib/utils/cn';

  let { initialCode = '', isEmbed = false } = $props<{ initialCode?: string; isEmbed?: boolean }>();

  let playground = $state<Playground | null>(null);
  const scripts = import.meta.glob('../../../routes/repl/scripts/*.gfs', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  let selectedScript = $state('../../../routes/repl/scripts/hello-world.gfs');
  let code = $state(initialCode || scripts['../../../routes/repl/scripts/hello-world.gfs'] || '');

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

    if (initialCode) {
      code = initialCode;
    }
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

<div
  class={cn(
    'color-group-primary flex h-full w-full flex-col text-primary-12',
    isEmbed ? 'bg-transparent' : 'bg-primary-1',
  )}
>
  <!-- Header -->
  <header
    class={cn(
      'flex flex-wrap items-center justify-between gap-4 border-b border-primary-4 px-4 py-3',
      isEmbed ? 'bg-primary-2/30 backdrop-blur-md' : 'bg-primary-2',
    )}
  >
    <div class="flex items-center gap-3">
      {#if !isEmbed}
        <h1 class="text-xl font-bold tracking-tight text-primary-12">Galfus REPL</h1>
      {/if}
      <span
        class="rounded-md bg-primary-3 px-2 py-1 text-xs font-medium text-primary-10 ring-1 ring-primary-5"
      >
        {#if playground}
          v{playground.getVersion()}
        {:else}
          Loading engine...
        {/if}
      </span>
    </div>

    <div class="flex items-center gap-3">
      {#if !initialCode}
        <select
          value={selectedScript}
          onchange={(e) => {
            selectedScript = (e.target as HTMLSelectElement).value;
            code = scripts[selectedScript] || '';
          }}
          class="input h-9 min-w-32 bg-primary-2 px-3 py-1 text-sm sm:max-w-xs"
        >
          {#each Object.keys(scripts) as path}
            <option value={path}>{path.replace('../../../routes/repl/scripts/', '')}</option>
          {/each}
        </select>
      {/if}

      <div class="flex items-center gap-2">
        <button
          onclick={runCode}
          disabled={!playground || isRunning}
          class="btn h-9 btn-solid px-4 text-sm font-bold shadow-md shadow-primary-9/20 transition-all hover:shadow-primary-9/40"
        >
          {#if isRunning}
            <svg
              class="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              ><circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path></svg
            >
            Running
          {:else}
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
          {/if}
        </button>
        <button
          onclick={() => terminal?.clear()}
          class="btn hidden h-9 btn-soft px-3 text-sm font-semibold sm:inline-flex"
        >
          Clear
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content: Split View -->
  <main class="flex flex-1 flex-col overflow-hidden sm:flex-row">
    <!-- Left: Editor -->
    <div
      class="min-h-[50%] flex-1 border-b border-primary-5 bg-primary-1/50 backdrop-blur-md sm:min-h-0 sm:border-r sm:border-b-0"
    >
      <Editor bind:code />
    </div>

    <!-- Right: Terminal -->
    <div
      class="relative min-h-[50%] flex-1 bg-[#1e1e1e]/95 p-2 shadow-inner backdrop-blur-xl sm:min-h-0"
    >
      <Terminal bind:this={terminal} onData={handleTerminalData} />
    </div>
  </main>
</div>
