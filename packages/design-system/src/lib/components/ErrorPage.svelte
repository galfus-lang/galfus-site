<script lang="ts">
  import NavigationAppbar from './NavigationAppbar.svelte';

  let {
    status = 500,
    message = 'Um erro inesperado ocorreu. Por favor, tente novamente mais tarde.',
    showAppbar = true,
  } = $props();
</script>

<div class="bg-background text-foreground flex min-h-screen flex-col color-group-primary">
  {#if showAppbar}
    <NavigationAppbar />
  {/if}

  <main class="flex flex-1 items-center justify-center p-6">
    <div class="card flex max-w-md flex-col items-center p-12 text-center">
      <div
        class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-group-3 text-group-11"
      >
        <span class="icon-[lucide--alert-triangle] icon-3xl"></span>
      </div>

      <h1 class="mb-2 text-5xl font-black text-group-12">{status}</h1>
      <h2 class="mb-6 text-xl font-semibold text-group-11">Ops! Algo deu errado.</h2>

      <p class="mb-8 text-sm text-group-10">
        {message}
      </p>

      <div class="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button onclick={() => window.history.back()} class="btn btn-outlined">
          <span class="mr-2 icon-[lucide--arrow-left] icon-lg"></span>
          Voltar
        </button>
        <a href="/" class="btn btn-solid">
          <span class="mr-2 icon-[lucide--home] icon-lg"></span>
          Página Inicial
        </a>
      </div>
    </div>
  </main>
</div>
