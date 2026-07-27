<script lang="ts">
  import ReplCore from '$lib/components/repl/ReplCore.svelte';
  import { onMount } from 'svelte';

  let initialCode = $state('');
  let loaded = $state(false);

  onMount(() => {
    // Check if there is a base64 encoded code snippet in the URL hash
    const hash = window.location.hash;
    if (hash && hash.startsWith('#code=')) {
      try {
        const encoded = hash.replace('#code=', '');
        initialCode = decodeURIComponent(encoded);
      } catch (e) {
        console.error('Failed to decode initial code from URL hash', e);
      }
    }
    loaded = true;
  });
</script>

<svelte:head>
  <title>Galfus Embed</title>
</svelte:head>

<!-- We only render the core once we've checked the hash so initialCode is ready -->
{#if loaded}
  <div class="m-0 h-screen w-screen overflow-hidden bg-primary-3 p-0">
    <ReplCore isEmbed={true} {initialCode} />
  </div>
{/if}
