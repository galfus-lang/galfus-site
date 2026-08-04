<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<button popovertarget="my-popover" class="btn btn-primary color-group-primary">Toggle Popover</button>

<div id="my-popover" popover="auto" class="popover">
  <h3 class="popover-title">Popover Content</h3>
  <p class="popover-description">This popup uses zero JavaScript for its toggle state. The browser handles click-outside automatically!</p>
</div>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Popover</h1>
  <p class="text-neutral-11">A rich floating element utilizing the HTML Popover API and <code>@utility popover-*</code> classes.</p>

  <div class="card flex justify-center py-20 relative">
    <button popovertarget="my-popover" class="btn btn-solid color-group-primary">Toggle Popover</button>

    <div id="my-popover" popover="auto" class="popover">
      <h3 class="popover-title">Popover Content</h3>
      <p class="popover-description">This popup uses zero JavaScript for its toggle state. The browser handles click-outside automatically!</p>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="popover.html" code={usageCode} lang="html" />
  </div>
</div>
