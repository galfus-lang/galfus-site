<script lang="ts">
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Inputs</h1>
  <p class="text-neutral-11">Input components utilizing the <code>@utility input-base</code> classes.</p>

  <div class="card">
    <div class="card-title">Text Input</div>
    <div class="card-content flex flex-col gap-6 mt-4">
      <label>
        <span class="block text-sm font-medium mb-1">Default</span>
        <input type="text" class="input-base" placeholder="Enter text..." />
      </label>
      
      <label>
        <span class="block text-sm font-medium mb-1">Disabled</span>
        <input type="text" class="input-base input-disabled" disabled value="Disabled value" />
      </label>

      <label>
        <span class="block text-sm font-medium mb-1">Error State</span>
        <input type="text" class="input-base input-error" value="Error value" />
      </label>
    </div>
  </div>
</div>
