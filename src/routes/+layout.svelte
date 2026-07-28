<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';

  import '$lib/styles/global.css';

  import GTM from '$lib/seo/GTM.svelte';
  import { dev } from '$app/environment';

  let { children } = $props();
</script>

{#if !dev}
  <GTM />
{/if}

{@render children()}
