<script lang="ts">
  import { SquarePen, Copy, Trash2 } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<button popovertarget="my-dropdown" class="btn btn-neutral">Open Options</button>

<menu id="my-dropdown" popover="auto" class="dropdown-content">
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Edit
    </button>
  </li>
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Duplicate
    </button>
  </li>
  <li role="separator" class="menu-separator"></li>
  <li>
    <button class="menu-item menu-item-danger">
      <!-- Icon here -->
      Delete
    </button>
  </li>
</menu>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Dropdown Menu</h1>
  <p class="text-neutral-11">A contextual menu using the modern HTML Popover API and <code>@utility dropdown-content</code> classes.</p>

  <div class="card flex justify-center py-20 relative">
    <button popovertarget="my-dropdown" class="btn btn-neutral">Open Options</button>

    <menu id="my-dropdown" popover="auto" class="dropdown-content">
      <li>
        <button class="menu-item">
          <SquarePen size={18} class="text-neutral-11" />
          Edit
        </button>
      </li>
      <li>
        <button class="menu-item">
          <Copy size={18} class="text-neutral-11" />
          Duplicate
        </button>
      </li>
      <li role="separator" class="menu-separator"></li>
      <li>
        <button class="menu-item menu-item-danger">
          <Trash2 size={18} />
          Delete
        </button>
      </li>
    </menu>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="dropdown-menu.html" code={usageCode} lang="html" />
  </div>
</div>
