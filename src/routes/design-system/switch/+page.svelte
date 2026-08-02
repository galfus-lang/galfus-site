<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Switch</h1>
  <p class="text-neutral-11">A toggle switch using the modern semantic <code>&lt;input type="checkbox" role="switch"&gt;</code>.</p>

  <div class="card max-w-sm">
    <label class="flex items-center justify-between cursor-pointer">
      <span class="font-medium">Enable notifications</span>
      <!-- Note: Using raw classes here. A real switch often requires some custom CSS for the track/thumb -->
      <input type="checkbox" role="switch" class="appearance-none w-11 h-6 bg-neutral-4 rounded-full relative checked:bg-primary-9 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform checked:after:translate-x-5" />
    </label>
  </div>
</div>
