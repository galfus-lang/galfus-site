<script lang="ts">
  import { page } from '$app/state';
  import NavigationAppbar from '$lib/components/NavigationAppbar.svelte';

  let { children } = $props();

  const groups = [
    {
      name: 'Foundations',
      links: [
        { href: '/design-system/colors', label: 'Colors' },
        { href: '/design-system/typography', label: 'Typography' },
      ],
    },
    {
      name: 'Inputs & Actions',
      links: [
        { href: '/design-system/buttons', label: 'Button' },
        { href: '/design-system/inputs', label: 'Inputs' },
        { href: '/design-system/checkbox-radio', label: 'Checkbox & Radio' },
        { href: '/design-system/switch', label: 'Switch' },
        { href: '/design-system/select', label: 'Select' },
      ],
    },
    {
      name: 'Data Display',
      links: [
        { href: '/design-system/avatar', label: 'Avatar' },
        { href: '/design-system/badge', label: 'Badge' },
        { href: '/design-system/accordion', label: 'Accordion' },
        { href: '/design-system/table', label: 'Table' },
        { href: '/design-system/code', label: 'Code' },
      ],
    },
    {
      name: 'Navigation',
      links: [
        { href: '/design-system/breadcrumbs', label: 'Breadcrumbs' },
        { href: '/design-system/tabs', label: 'Tabs' },
        { href: '/design-system/pagination', label: 'Pagination' },
        { href: '/design-system/menu', label: 'Menu' },
        { href: '/design-system/dropdown-menu', label: 'Dropdown Menu' },
      ],
    },
    {
      name: 'Overlays & Feedback',
      links: [
        { href: '/design-system/popover', label: 'Popover' },
        { href: '/design-system/modal', label: 'Modal' },
        { href: '/design-system/alert', label: 'Alert' },
        { href: '/design-system/toast', label: 'Toast' },
      ],
    },
    {
      name: 'Layout',
      links: [
        { href: '/design-system/appbar', label: 'Appbar' },
        { href: '/design-system/toolbar', label: 'Toolbar' },
        { href: '/design-system/sidebar', label: 'Sidebar' },
        { href: '/design-system/card', label: 'Card' },
        { href: '/design-system/divider', label: 'Divider' },
      ],
    },
    {
      name: 'Attachments',
      links: [{ href: '/design-system/select-attach', label: 'Select Attach' }],
    },
  ];

  let currentLink = $derived(
    groups.flatMap((g) => g.links).find((l) => page.url.pathname === l.href),
  );
  let pageTitle = $derived(
    currentLink ? `${currentLink.label} - Galfus Design System` : 'Galfus Design System',
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta
    name="description"
    content="Explore the Galfus Design System to find documentation and examples for our UI components, typography, and styling."
  />
  <meta property="og:title" content={pageTitle} />
  <meta
    property="og:description"
    content="Explore the Galfus Design System to find documentation and examples for our UI components, typography, and styling."
  />
</svelte:head>

<div class="flex h-screen flex-col text-neutral-12">
  <NavigationAppbar />

  <div class="flex flex-1 overflow-hidden">
    <!-- Use a slightly darker glass sidebar by overriding the bg/border if needed, but let's use the core class -->
    <aside
      class="color-group-primary relative z-10 sidebar w-80 border-neutral-6/30 bg-neutral-1/30 backdrop-blur-md"
    >
      <a
        href="/design-system"
        class="sidebar-title font-sans transition-colors hover:text-primary-11"
      >
        Design System
      </a>

      <nav class="sidebar-nav overflow-y-auto pb-8">
        {#each groups as group}
          <div class="sidebar-group-title">{group.name}</div>
          {#each group.links as link}
            <a
              href={link.href}
              class="sidebar-link"
              aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
            >
              {link.label}
            </a>
          {/each}
        {/each}
      </nav>
    </aside>

    <main class="flex-1 overflow-y-auto p-10">
      {@render children()}
    </main>
  </div>
</div>
