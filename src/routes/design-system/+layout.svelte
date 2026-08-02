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
      name: 'Layout',
      links: [
        { href: '/design-system/appbar', label: 'Appbar' },
        { href: '/design-system/toolbar', label: 'Toolbar' },
        { href: '/design-system/sidebar', label: 'Sidebar' },
        { href: '/design-system/card', label: 'Card' },
        { href: '/design-system/divider', label: 'Divider' },
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
      name: 'Data Display',
      links: [
        { href: '/design-system/avatar', label: 'Avatar' },
        { href: '/design-system/badge', label: 'Badge' },
        { href: '/design-system/accordion', label: 'Accordion' },
        { href: '/design-system/table', label: 'Table' },
      ]
    }
  ];
</script>

<div class="flex h-screen bg-neutral-1 text-neutral-12">
  <aside class="w-64 border-r border-neutral-4 p-6 flex flex-col gap-6 overflow-y-auto">
    <a href="/design-system" class="text-xl font-bold font-sans hover:text-primary-9">Design System</a>
    
    <nav class="flex flex-col gap-6">
      {#each groups as group}
        <div>
          <h2 class="text-xs font-bold text-neutral-11 uppercase tracking-wider mb-2">{group.name}</h2>
          <ul class="flex flex-col gap-1">
            {#each group.links as link}
              <li>
                <a 
                  href={link.href} 
                  class={cn(
                    'block px-3 py-1.5 rounded-md hover:bg-neutral-3 text-sm',
                    page.url.pathname === link.href ? 'bg-neutral-4 font-medium text-primary-11' : 'text-neutral-12'
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
