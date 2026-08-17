<script lang="ts">
  import ReplCore from '$lib/components/repl/ReplCore.svelte';
  let { data } = $props();
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

<div class="h-dvh w-full">
  <ReplCore latestTag={data.latestTag} latestVersion={data.latestVersion} />
</div>
