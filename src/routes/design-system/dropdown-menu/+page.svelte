<script lang="ts">
  import { SquarePen, Copy, Trash2 } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Dropdown Menu</h1>
  <p class="text-neutral-11">A contextual menu using the modern HTML Popover API with icons.</p>

  <div class="card flex justify-center py-20 relative">
    <button popovertarget="my-dropdown" class="btn btn-neutral">Open Options</button>
    
    <menu id="my-dropdown" popover="auto" class="m-0 p-1.5 mt-2 bg-neutral-1 border border-neutral-4 rounded-md shadow-lg flex-col w-48 text-neutral-12">
      <li>
        <button class="w-full text-left px-3 py-1.5 hover:bg-neutral-3 rounded flex items-center gap-3 text-sm">
          <SquarePen size={16} class="text-neutral-11" />
          Edit
        </button>
      </li>
      <li>
        <button class="w-full text-left px-3 py-1.5 hover:bg-neutral-3 rounded flex items-center gap-3 text-sm">
          <Copy size={16} class="text-neutral-11" />
          Duplicate
        </button>
      </li>
      <li role="separator" class="h-px bg-neutral-4 my-1.5"></li>
      <li>
        <button class="w-full text-left px-3 py-1.5 hover:bg-red-500/10 rounded flex items-center gap-3 text-sm text-red-500">
          <Trash2 size={16} />
          Delete
        </button>
      </li>
    </menu>
  </div>
</div>
