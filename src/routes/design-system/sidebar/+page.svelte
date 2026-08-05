<script lang="ts">
  import {
    Hexagon,
    LayoutDashboard,
    FolderKanban,
    Users,
    Settings,
    ChevronRight,
    Bell,
  } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<aside class="sidebar color-group-primary">
  <div class="sidebar-title">
    <Hexagon size={24} class="text-primary-9" />
    Acme Corp
  </div>

  <nav aria-label="Sidebar Navigation" class="sidebar-nav">
    <div class="sidebar-group-title">Main</div>
    <a href="#" class="sidebar-link" aria-current="page">
      <LayoutDashboard size={18} />
      Overview
    </a>
    <a href="#" class="sidebar-link">
      <FolderKanban size={18} />
      Projects
      <div class="sidebar-trailing">
        <span class="badge color-group-neutral">12</span>
      </div>
    </a>
    <a href="#" class="sidebar-link">
      <Users size={18} />
      Team
    </a>

    <div class="sidebar-group-title">Settings</div>
    <a href="#" class="sidebar-link">
      <Settings size={18} />
      General
    </a>
    <a href="#" class="sidebar-link">
      <Bell size={18} />
      Notifications
      <div class="sidebar-trailing">
        <ChevronRight size={16} />
      </div>
    </a>
  </nav>
</aside>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Sidebar</h1>
  <p class="text-neutral-11">
    A side navigation area using <code>&lt;aside&gt;</code> and <code>&lt;nav&gt;</code> with
    <code>@utility sidebar-*</code> classes.
  </p>

  <div class="flex h-125 overflow-hidden rounded-md border border-neutral-4 bg-neutral-2">
    <aside class="color-group-primary sidebar">
      <div class="sidebar-title">
        <Hexagon size={24} class="text-primary-9" />
        Acme Corp
      </div>
      <nav aria-label="Sidebar Navigation" class="sidebar-nav">
        <div class="sidebar-group-title">Main</div>
        <a href="#" class="sidebar-link" aria-current="page">
          <LayoutDashboard size={18} />
          Overview
        </a>
        <a href="#" class="sidebar-link">
          <FolderKanban size={18} />
          Projects
          <div class="sidebar-trailing">
            <span class="color-group-neutral badge rounded-full px-2 py-0.5 text-xs font-bold"
              >12</span
            >
          </div>
        </a>
        <a href="#" class="sidebar-link">
          <Users size={18} />
          Team
        </a>

        <div class="sidebar-group-title">Settings</div>
        <a href="#" class="sidebar-link">
          <Settings size={18} />
          General
        </a>
        <a href="#" class="sidebar-link">
          <Bell size={18} />
          Notifications
          <div class="sidebar-trailing text-neutral-8">
            <ChevronRight size={16} />
          </div>
        </a>
      </nav>
    </aside>
    <main class="flex-1 p-6 text-neutral-11">Main content area</main>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="sidebar.html" code={usageCode} lang="html" />
  </div>
</div>
