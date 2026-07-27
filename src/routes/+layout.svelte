<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';

  import '$lib/styles/global.css';

  let { children } = $props();
</script>

{@render children()}
