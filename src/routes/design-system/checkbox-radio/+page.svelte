<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<!-- Checkbox -->
<label class="check-group">
  <input type="checkbox" class="checkbox" />
  <span class="check-label">Label text</span>
</label>

<!-- Radio -->
<label class="check-group">
  <input type="radio" class="radio" name="options" />
  <span class="check-label">Label text</span>
</label>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Checkbox & Radio</h1>
  <p class="text-neutral-11">
    Native form controls styled via pure CSS using <code>@utility checkbox</code>,
    <code>@utility radio</code>, <code>@utility check-group</code>, and
    <code>@utility check-label</code>.
  </p>

  <div class="grid grid-cols-2 gap-8">
    <div class="color-group-primary relative overflow-hidden card">
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
      ></div>

      <fieldset class="relative z-10">
        <legend class="text-group-12 mb-4 font-bold">Checkboxes (Primary)</legend>
        <div class="flex flex-col gap-4">
          <label class="check-group">
            <input type="checkbox" class="checkbox" checked />
            <span class="check-label">Remember device</span>
          </label>
          <label class="check-group">
            <input type="checkbox" class="checkbox" />
            <span class="check-label">Subscribe to newsletter</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="color-group-danger relative overflow-hidden card">
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
      ></div>

      <fieldset class="relative z-10">
        <legend class="text-group-12 mb-4 font-bold">Radio Buttons (Danger)</legend>
        <div class="flex flex-col gap-4">
          <label class="check-group">
            <input type="radio" name="demo-radio" class="radio" checked />
            <span class="check-label">Erase data</span>
          </label>
          <label class="check-group">
            <input type="radio" name="demo-radio" class="radio" />
            <span class="check-label">Keep data</span>
          </label>
        </div>
      </fieldset>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="checkbox-radio.html" code={usageCode} lang="html" />
  </div>
</div>
