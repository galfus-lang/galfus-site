<script lang="ts">
  import { User, Settings, LogOut } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<menu class="menu">
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Profile
      <span class="menu-shortcut">⇧⌘P</span>
    </button>
  </li>
  <li>
    <button class="menu-item">
      <!-- Icon here -->
      Settings
      <span class="menu-shortcut">⌘,</span>
    </button>
  </li>
  <li role="separator" class="menu-separator"></li>
  <li>
    <button class="menu-item menu-item-danger">
      <!-- Icon here -->
      Log out
      <span class="menu-shortcut">⌥⇧Q</span>
    </button>
  </li>
</menu>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Menu</h1>
  <p class="text-neutral-11">
    A list of choices using the native <code>&lt;menu&gt;</code> element with
    <code>@utility menu-*</code> classes.
  </p>

  <div class="card max-w-xs">
    <menu class="menu">
      <li>
        <button class="menu-item">
          <User size={18} class="text-neutral-11" />
          Profile
          <span class="menu-shortcut">⇧⌘P</span>
        </button>
      </li>
      <li>
        <button class="menu-item">
          <Settings size={18} class="text-neutral-11" />
          Settings
          <span class="menu-shortcut">⌘,</span>
        </button>
      </li>
      <li role="separator" class="menu-separator"></li>
      <li>
        <button class="menu-item menu-item-danger">
          <LogOut size={18} />
          Log out
          <span class="menu-shortcut">⌥⇧Q</span>
        </button>
      </li>
    </menu>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="menu.html" code={usageCode} lang="html" />
  </div>
</div>
