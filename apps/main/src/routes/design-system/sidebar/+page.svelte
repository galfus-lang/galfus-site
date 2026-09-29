<script lang="ts">
  import Code from '@galfus/design-system/components/ui/Code.svelte';

  const usageCode = `<aside class="sidebar color-group-primary">
  <div class="sidebar-title">
    <span class="icon-[lucide--hexagon] text-[24px] text-primary-9" ></span>
    Acme Corp
  </div>

  <nav aria-label="Sidebar Navigation" class="sidebar-nav">
    <div class="sidebar-group-title">Main</div>
    <a href="#" class="sidebar-link" aria-current="page">
      <span class="icon-[lucide--layout-dashboard] text-[18px]" ></span>
      Overview
    </a>
    <a href="#" class="sidebar-link">
      <span class="icon-[lucide--folder-kanban] text-[18px]" ></span>
      Projects
      <div class="sidebar-trailing">
        <span class="badge color-group-neutral">12</span>
      </div>
    </a>
    <a href="#" class="sidebar-link">
      <span class="icon-[lucide--users] text-[18px]" ></span>
      Team
    </a>

    <div class="sidebar-group-title">Settings</div>
    <a href="#" class="sidebar-link">
      <span class="icon-[lucide--settings] text-[18px]" ></span>
      General
    </a>
    <a href="#" class="sidebar-link">
      <span class="icon-[lucide--bell] text-[18px]" ></span>
      Notifications
      <div class="sidebar-trailing">
        <span class="icon-[lucide--chevron-right] text-[16px]" ></span>
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
        <span class="icon-[lucide--hexagon] text-[24px] text-primary-9"></span>
        Acme Corp
      </div>
      <nav aria-label="Sidebar Navigation" class="sidebar-nav">
        <div class="sidebar-group-title">Main</div>
        <a href="#" class="sidebar-link" aria-current="page">
          <span class="icon-[lucide--layout-dashboard] text-[18px]"></span>
          Overview
        </a>
        <a href="#" class="sidebar-link">
          <span class="icon-[lucide--folder-kanban] text-[18px]"></span>
          Projects
          <div class="sidebar-trailing">
            <span class="color-group-neutral badge rounded-full px-2 py-0.5 text-xs font-bold"
              >12</span
            >
          </div>
        </a>
        <a href="#" class="sidebar-link">
          <span class="icon-[lucide--users] text-[18px]"></span>
          Team
        </a>

        <div class="sidebar-group-title">Settings</div>
        <a href="#" class="sidebar-link">
          <span class="icon-[lucide--settings] text-[18px]"></span>
          General
        </a>
        <a href="#" class="sidebar-link">
          <span class="icon-[lucide--bell] text-[18px]"></span>
          Notifications
          <div class="sidebar-trailing text-neutral-8">
            <span class="icon-[lucide--chevron-right] text-[16px]"></span>
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
