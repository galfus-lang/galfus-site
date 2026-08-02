<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Toast</h1>
  <p class="text-neutral-11">Non-disruptive notifications using <code>&lt;output role="status"&gt;</code>.</p>

  <div class="card flex justify-center py-20 relative">
    <output role="status" class="absolute bottom-4 right-4 p-4 rounded-md shadow-xl bg-neutral-12 text-neutral-1 flex items-center gap-4 w-72">
      <div class="flex-1">
        <div class="font-bold text-sm">Update available</div>
        <div class="text-xs opacity-80">A new software version is ready.</div>
      </div>
      <button class="text-xs font-bold uppercase hover:underline">Reload</button>
    </output>
  </div>
</div>
