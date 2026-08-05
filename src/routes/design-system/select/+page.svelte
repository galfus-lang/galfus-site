<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<!-- Native Select (styled with input-base) -->
<label class="block" for="demo-select">
  <span class="input-label">Choose an option</span>
  <select id="demo-select" class="input-base cursor-pointer">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </select>
</label>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Select</h1>
  <p class="text-neutral-11">
    A dropdown list using native <code>&lt;select&gt;</code>, <code>&lt;optgroup&gt;</code>, and
    <code>&lt;option&gt;</code>.
  </p>

  <div class="card max-w-sm">
    <label class="block" for="demo-select">
      <span class="input-label">Choose an option</span>
      <select id="demo-select" class="input-base cursor-pointer">
        <option value="">Select a fruit...</option>
        <optgroup label="Citrus">
          <option value="orange">Orange</option>
          <option value="lemon">Lemon</option>
        </optgroup>
        <optgroup label="Berries">
          <option value="strawberry">Strawberry</option>
          <option value="blueberry">Blueberry</option>
        </optgroup>
      </select>
    </label>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="select.html" code={usageCode} lang="html" />
  </div>
</div>
