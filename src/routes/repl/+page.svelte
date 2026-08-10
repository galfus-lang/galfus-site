<script lang="ts">
  import ReplCore from '$lib/components/repl/ReplCore.svelte';
</script>

<svelte:head>
  <title>Galfus REPL</title>
  <meta
    name="description"
    content="Try Galfus Script directly in your browser. Our WebAssembly integration allows you to compile and execute code on the fly."
  />
  <meta property="og:title" content="Galfus REPL" />
  <meta
    property="og:description"
    content="Try Galfus Script directly in your browser. Our WebAssembly integration allows you to compile and execute code on the fly."
  />
  <meta property="og:url" content="https://galfus.com/repl" />
</svelte:head>

<div class="h-[calc(100vh-64px)] w-full pt-16">
  <ReplCore />
</div>
