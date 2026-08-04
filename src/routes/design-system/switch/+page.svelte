<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';
  
  const usageCode = `<!-- Basic Switch -->
<label class="flex cursor-pointer items-center gap-4">
  <input type="checkbox" class="switch" />
  <div>
    <div class="font-medium text-neutral-12">Toggle Title</div>
    <div class="text-sm text-neutral-11">Description text goes here.</div>
  </div>
</label>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Switch</h1>
  <p class="text-neutral-11">A beautiful glowing toggle component.</p>

  <div class="color-group-primary card">
    <div class="card-title">Theme Swithes</div>
    <div class="mt-4 flex flex-col gap-6 card-content">
      <label class="flex cursor-pointer items-center gap-4">
        <input type="checkbox" class="switch" checked />
        <div>
          <div class="font-medium text-neutral-12">Smooth animations</div>
          <div class="text-sm text-neutral-11">Enable fluid transitions for design elements.</div>
        </div>
      </label>

      <label class="flex cursor-pointer items-center gap-4">
        <input type="checkbox" class="switch" />
        <div>
          <div class="font-medium text-neutral-12">Bold focus rings</div>
          <div class="text-sm text-neutral-11">
            Increase visibility of selected layers and tools.
          </div>
        </div>
      </label>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="switch.html" code={usageCode} lang="html" />
  </div>
</div>
