<script lang="ts">
  import { page } from '$app/state';
  import { cn } from '$lib/utils/cn';
  
  let { children } = $props();

  const groups = [
    {
      name: 'Foundations',
      links: [
        { href: '/design-system/colors', label: 'Colors' },
        { href: '/design-system/typography', label: 'Typography' },
      ]
    },
    {
      name: 'Inputs & Actions',
      links: [
        { href: '/design-system/buttons', label: 'Button' },
        { href: '/design-system/inputs', label: 'Inputs' },
        { href: '/design-system/checkbox-radio', label: 'Checkbox & Radio' },
        { href: '/design-system/switch', label: 'Switch' },
        { href: '/design-system/select', label: 'Select' },
      ]
    },
    {
      name: 'Data Display',
      links: [
        { href: '/design-system/avatar', label: 'Avatar' },
        { href: '/design-system/badge', label: 'Badge' },
        { href: '/design-system/accordion', label: 'Accordion' },
        { href: '/design-system/table', label: 'Table' },
      ]
    },
    {
      name: 'Navigation',
      links: [
        { href: '/design-system/breadcrumbs', label: 'Breadcrumbs' },
        { href: '/design-system/tabs', label: 'Tabs' },
        { href: '/design-system/pagination', label: 'Pagination' },
        { href: '/design-system/menu', label: 'Menu' },
        { href: '/design-system/dropdown-menu', label: 'Dropdown Menu' },
      ]
    },
    {
      name: 'Overlays & Feedback',
      links: [
        { href: '/design-system/tooltip', label: 'Tooltip' },
        { href: '/design-system/popover', label: 'Popover' },
        { href: '/design-system/modal', label: 'Modal' },
        { href: '/design-system/alert', label: 'Alert' },
        { href: '/design-system/toast', label: 'Toast' },
      ]
    },
    {
      name: 'Layout',
      links: [
        { href: '/design-system/appbar', label: 'Appbar' },
        { href: '/design-system/toolbar', label: 'Toolbar' },
        { href: '/design-system/sidebar', label: 'Sidebar' },
        { href: '/design-system/card', label: 'Card' },
        { href: '/design-system/divider', label: 'Divider' },
      ]
    }
  ];
</script>

<div class="flex h-screen text-neutral-12">
  <!-- Use a slightly darker glass sidebar -->
  <aside class="w-64 border-r border-neutral-6/30 bg-neutral-1/30 backdrop-blur-md p-6 flex flex-col gap-6 overflow-y-auto">
    <a href="/design-system" class="text-xl font-bold font-sans hover:text-primary-11 transition-colors">Design System</a>
    
    <nav class="flex flex-col gap-6 color-group-primary">
      {#each groups as group}
        <div>
          <h2 class="text-xs font-bold text-neutral-11 uppercase tracking-wider mb-2">{group.name}</h2>
          <ul class="flex flex-col gap-1">
            {#each group.links as link}
              <li>
                <a 
                  href={link.href} 
                  class={cn(
                    'block px-3 py-1.5 rounded-md text-sm transition-all',
                    page.url.pathname === link.href 
                      ? 'bg-group-9/20 border border-group-9 text-group-12 shadow-[0_0_15px_0_color-mix(in_srgb,var(--color-g-9)_40%,transparent)]' 
                      : 'text-neutral-11 hover:text-neutral-12 hover:bg-neutral-4/30 border border-transparent'
                  )}
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>
  </aside>

  <main class="flex-1 p-10 overflow-y-auto">
    {@render children()}
  </main>
</div>
