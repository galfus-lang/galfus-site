<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Popover</h1>
  <p class="text-neutral-11">A rich floating element utilizing the HTML Popover API.</p>

  <div class="card flex justify-center py-20 relative">
    <button popovertarget="my-popover" class="btn btn-primary">Toggle Popover</button>
    
    <div id="my-popover" popover="auto" class="m-0 mt-2 p-4 bg-neutral-1 border border-neutral-4 rounded-md shadow-xl text-neutral-12 w-64">
      <h3 class="font-bold mb-2">Popover Content</h3>
      <p class="text-sm text-neutral-11">This popup uses zero JavaScript for its toggle state. The browser handles click-outside automatically!</p>
    </div>
  </div>
</div>
