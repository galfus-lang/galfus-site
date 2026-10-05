<script lang="ts">
  import Code from '@galfus/design-system/components/ui/Code.svelte';

  const usageCode = `<button popovertarget="my-dropdown" class="btn btn-neutral">Open Options</button>

<menu id="my-dropdown" popover="auto" class="dropdown-content">
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Edit
      <span class="menu-shortcut">⌘E</span>
    </button>
  </li>
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Duplicate
      <span class="menu-shortcut">⌘D</span>
    </button>
  </li>
  <li role="separator" class="menu-separator"></li>
  <li>
    <button class="menu-item menu-item-danger">
      <!-- Icon here -->
      Delete
      <span class="menu-shortcut">⌘⌫</span>
    </button>
  </li>
</menu>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Dropdown Menu</h1>
  <p class="text-neutral-11">
    A contextual menu using the modern HTML Popover API and <code>@utility dropdown-content</code> classes.
  </p>

  <div class="card relative flex justify-center py-20">
    <button popovertarget="my-dropdown" class="btn-neutral btn">Open Options</button>

    <menu id="my-dropdown" popover="auto" class="dropdown-content">
      <li>
        <button class="menu-item">
          <span class="icon-[lucide--square-pen] icon-md text-neutral-11"></span>
          Edit
          <span class="menu-shortcut">⌘E</span>
        </button>
      </li>
      <li>
        <button class="menu-item">
          <span class="icon-[lucide--copy] icon-md text-neutral-11"></span>
          Duplicate
          <span class="menu-shortcut">⌘D</span>
        </button>
      </li>
      <li role="separator" class="menu-separator"></li>
      <li>
        <button class="menu-item menu-item-danger">
          <span class="icon-md icon-[lucide--trash-2]"></span>
          Delete
          <span class="menu-shortcut">⌘⌫</span>
        </button>
      </li>
    </menu>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="dropdown-menu.html" code={usageCode} lang="html" />
  </div>
</div>
