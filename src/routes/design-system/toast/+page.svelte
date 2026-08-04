<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<output role="status" class="toast">
  <div class="toast-content">
    <div class="toast-title">Update available</div>
    <div class="toast-description">A new software version is ready.</div>
  </div>
  <button class="toast-action">Reload</button>
</output>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Toast</h1>
  <p class="text-neutral-11">Non-disruptive notifications using <code>&lt;output role="status"&gt;</code> and <code>@utility toast-*</code> classes.</p>

  <div class="card flex justify-center py-20 relative overflow-hidden">
    <!-- Notice: We use position absolute in the HTML itself to position the toast -->
    <output role="status" class="toast color-group-neutral absolute bottom-4 right-4">
      <div class="toast-content">
        <div class="toast-title">Update available</div>
        <div class="toast-description">A new software version is ready.</div>
      </div>
      <button class="toast-action">Reload</button>
    </output>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="toast.html" code={usageCode} lang="html" />
  </div>
</div>
