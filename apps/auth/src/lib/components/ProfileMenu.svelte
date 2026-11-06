<script lang="ts">
  let {
    sections,
    label,
  }: {
    sections: { href: string; icon: string; title: string; description: string; status?: string }[];
    label: string;
  } = $props();
</script>

<nav aria-label={label} class="space-y-2">
  {#each sections as section (section.href)}
    <a
      href={section.href}
      class="group flex items-center gap-3 rounded-lg border border-neutral-6/60 bg-neutral-2/40 p-3 transition-colors hover:border-primary-7 hover:bg-primary-3/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-9"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-3/70 text-primary-11"
      >
        <span class="{section.icon} icon-lg" aria-hidden="true"></span>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-bold text-primary-10 group-hover:text-primary-11"
          >{section.title}</span
        >
        <span class="mt-0.5 block text-xs leading-relaxed text-neutral-11"
          >{section.description}</span
        >
        {#if section.status}
          <span class="mt-1 block text-xs text-neutral-11">{section.status}</span>
        {/if}
      </span>
      <span
        class="icon-[lucide--chevron-right] shrink-0 icon-lg text-primary-10 group-hover:text-primary-11"
        aria-hidden="true"
      ></span>
    </a>
  {/each}
</nav>
