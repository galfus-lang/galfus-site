<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Checkbox & Radio</h1>
  <p class="text-neutral-11">Form controls using <code>&lt;fieldset&gt;</code>, <code>&lt;legend&gt;</code>, and <code>&lt;input&gt;</code>.</p>

  <div class="grid grid-cols-2 gap-8">
    <div class="card">
      <fieldset>
        <legend class="font-bold mb-4">Checkboxes</legend>
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="w-4 h-4 rounded border-neutral-4 text-primary-9 focus:ring-primary-9" checked />
            <span>Option A</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="w-4 h-4 rounded border-neutral-4 text-primary-9 focus:ring-primary-9" />
            <span>Option B</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="card">
      <fieldset>
        <legend class="font-bold mb-4">Radio Buttons</legend>
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2">
            <input type="radio" name="demo-radio" class="w-4 h-4 border-neutral-4 text-primary-9 focus:ring-primary-9" checked />
            <span>Option A</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" name="demo-radio" class="w-4 h-4 border-neutral-4 text-primary-9 focus:ring-primary-9" />
            <span>Option B</span>
          </label>
        </div>
      </fieldset>
    </div>
  </div>
</div>
