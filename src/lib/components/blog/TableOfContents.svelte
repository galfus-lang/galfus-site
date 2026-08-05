<script lang="ts">
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils/cn';

  type TocItem = { id: string; text: string; level: number };
  let { toc = [] }: { toc: TocItem[] } = $props();

  let activeId = $state('');

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 },
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      toc.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.unobserve(el);
      });
      observer.disconnect();
    };
  });
</script>

{#if toc.length > 0}
  <aside
    class="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-64 scrollbar-thin scrollbar-thumb-primary-5 overflow-y-auto pr-4 lg:block"
  >
    <h4 class="mb-4 text-sm font-bold tracking-wider text-primary-12 uppercase">On this page</h4>
    <ul class="space-y-3 border-l-2 border-primary-4">
      {#each toc as item}
        <li class="relative" style="padding-left: {(item.level - 2) * 1}rem;">
          <a
            href="#{item.id}"
            class={cn(
              'block pl-4 text-sm transition-colors',
              activeId === item.id
                ? 'font-bold text-primary-11'
                : 'text-primary-10 hover:text-primary-11',
            )}
          >
            {item.text}
          </a>
          {#if activeId === item.id}
            <div
              class="absolute top-0 bottom-0 -left-0.5 w-0.5 bg-primary-9 transition-all duration-300"
            ></div>
          {/if}
        </li>
      {/each}
    </ul>
  </aside>
{/if}
