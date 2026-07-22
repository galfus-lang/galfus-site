<script lang="ts">
  import { getPlayground, type Playground } from '$lib/wasm/galfus';
  import { onMount } from 'svelte';

  let playground = $state<Playground | null>(null);

  onMount(async () => {
    playground = await getPlayground();
  });
</script>

<p>
  Version: {playground?.getVersion()}
</p>
