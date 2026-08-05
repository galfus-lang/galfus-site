<script lang="ts">
  import { Menu, User, Hexagon } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<header class="appbar">
  <div class="flex items-center gap-4">
    <button class="btn btn-ghost btn-icon color-group-neutral" aria-label="Open Menu">
      <Menu size={20} />
    </button>
    <div class="appbar-title">
      <Hexagon size={24} class="text-primary-9" />
      My App
    </div>
  </div>

  <nav aria-label="Main Navigation">
    <ul class="appbar-nav">
      <li><a href="#" class="appbar-link">Home</a></li>
      <li><a href="#" class="appbar-link">Dashboard</a></li>
    </ul>
  </nav>

  <div>
    <button class="btn btn-ghost btn-icon rounded-full color-group-neutral" aria-label="User Profile">
      <User size={20} />
    </button>
  </div>
</header>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Appbar</h1>
  <p class="text-neutral-11">
    The top application bar using a semantic <code>&lt;header&gt;</code> and
    <code>&lt;nav&gt;</code>
    with <code>@utility appbar-*</code> classes.
  </p>

  <div class="overflow-hidden rounded-md border border-neutral-4 bg-neutral-2">
    <header class="appbar">
      <div class="flex items-center gap-4">
        <button class="color-group-neutral btn btn-icon btn-ghost" aria-label="Open Menu">
          <Menu size={20} />
        </button>
        <div class="appbar-title">
          <Hexagon size={24} class="text-primary-9" />
          My App
        </div>
      </div>

      <nav aria-label="Main Navigation">
        <ul class="appbar-nav">
          <li><a href="#" class="appbar-link">Home</a></li>
          <li><a href="#" class="appbar-link">Dashboard</a></li>
        </ul>
      </nav>

      <div>
        <button
          class="color-group-neutral btn btn-icon btn-ghost rounded-full"
          aria-label="User Profile"
        >
          <User size={20} />
        </button>
      </div>
    </header>
    <div class="p-8 text-neutral-11">Page Content Area...</div>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="appbar.html" code={usageCode} lang="html" />
  </div>
</div>
