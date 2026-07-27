<script lang="ts">
  import { onMount } from 'svelte';

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
      { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 }
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
  <aside class="sticky top-24 hidden lg:block w-64 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary-5">
    <h4 class="font-bold text-primary-12 mb-4 text-sm uppercase tracking-wider">On this page</h4>
    <ul class="space-y-3 border-l-2 border-primary-4">
      {#each toc as item}
        <li class="relative" style="padding-left: {(item.level - 2) * 1}rem;">
          <a
            href="#{item.id}"
            class="block pl-4 text-sm transition-colors {activeId === item.id ? 'text-primary-11 font-bold' : 'text-primary-10 hover:text-primary-11'}"
          >
            {item.text}
          </a>
          {#if activeId === item.id}
            <div class="absolute left-[-2px] top-0 bottom-0 w-0.5 bg-primary-9 transition-all duration-300"></div>
          {/if}
        </li>
      {/each}
    </ul>
  </aside>
{/if}
