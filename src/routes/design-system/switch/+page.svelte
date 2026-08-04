<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';
  
  const usageCode = `<!-- Basic Switch -->
<label class="switch-group">
  <input type="checkbox" class="switch" />
  <div>
    <div class="switch-label">Toggle Title</div>
    <div class="switch-description">Description text goes here.</div>
  </div>
</label>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Switch</h1>
  <p class="text-neutral-11">A beautiful glowing toggle component using <code>@utility switch-group</code>, <code>@utility switch-label</code>, and <code>@utility switch-description</code>.</p>

  <div class="color-group-primary card">
    <div class="card-title">Theme Switches</div>
    <div class="mt-4 flex flex-col gap-6 card-content">
      <label class="switch-group">
        <input type="checkbox" class="switch" checked />
        <div>
          <div class="switch-label">Smooth animations</div>
          <div class="switch-description">Enable fluid transitions for design elements.</div>
        </div>
      </label>

      <label class="switch-group">
        <input type="checkbox" class="switch" />
        <div>
          <div class="switch-label">Bold focus rings</div>
          <div class="switch-description">
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
