<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';
  import '$lib/styles/global.css';

  let { children } = $props();
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Empty layout specifically for the embed so it doesn't have navbars or footers -->
{@render children()}
