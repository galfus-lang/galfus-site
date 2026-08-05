<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<hr class="divider" />`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Divider</h1>
  <p class="text-neutral-11">
    A thematic break using the semantic <code>&lt;hr&gt;</code> tag with
    <code>@utility divider</code> class.
  </p>

  <div class="rounded-md border border-neutral-4 p-6">
    <p>Some content above the divider.</p>
    <hr class="divider" />
    <p>Some content below the divider.</p>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="divider.html" code={usageCode} lang="html" />
  </div>
</div>
