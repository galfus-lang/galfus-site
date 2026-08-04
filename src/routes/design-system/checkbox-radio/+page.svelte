<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Checkbox & Radio</h1>
  <p class="text-neutral-11">Native form controls styled completely via pure CSS using <code>@utility checkbox</code> and <code>@utility radio</code>.</p>

  <div class="grid grid-cols-2 gap-8">
    <div class="card color-group-primary relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-group-9 rounded-full opacity-10 blur-2xl pointer-events-none"></div>

      <fieldset class="relative z-10">
        <legend class="font-bold mb-4 text-group-12">Checkboxes (Primary)</legend>
        <div class="flex flex-col gap-4">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" class="checkbox" checked />
            <span class="text-neutral-12 group-hover:text-group-11 transition-colors">Remember device</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" class="checkbox" />
            <span class="text-neutral-12 group-hover:text-group-11 transition-colors">Subscribe to newsletter</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="card color-group-danger relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-group-9 rounded-full opacity-10 blur-2xl pointer-events-none"></div>

      <fieldset class="relative z-10">
        <legend class="font-bold mb-4 text-group-12">Radio Buttons (Danger)</legend>
        <div class="flex flex-col gap-4">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input type="radio" name="demo-radio" class="radio" checked />
            <span class="text-neutral-12 group-hover:text-group-11 transition-colors">Erase data</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input type="radio" name="demo-radio" class="radio" />
            <span class="text-neutral-12 group-hover:text-group-11 transition-colors">Keep data</span>
          </label>
        </div>
      </fieldset>
    </div>
  </div>
</div>
