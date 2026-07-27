<script lang="ts">
  let { title, description, date, slug, thumbnail } = $props<{
    title: string;
    description?: string;
    date: string;
    slug: string;
    thumbnail?: string;
  }>();

  let formattedDate = $derived(new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
</script>

<a href="/blog/{slug}" class="group block h-full rounded-2xl border border-primary-4 bg-primary-2 overflow-hidden hover:border-primary-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-9/10">
  {#if thumbnail}
    <div class="w-full h-48 bg-primary-3 overflow-hidden border-b border-primary-4">
      <img src={thumbnail} alt={title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
  {/if}
  <div class="p-6 flex flex-col h-full {thumbnail ? '' : 'pt-8'}">
    <time class="text-xs font-semibold text-primary-10 uppercase tracking-wider mb-2">{formattedDate}</time>
    <h3 class="text-xl font-bold text-primary-12 mb-3 group-hover:text-primary-11 transition-colors line-clamp-2">{title}</h3>
    {#if description}
      <p class="text-primary-11 leading-relaxed line-clamp-3 mb-6">{description}</p>
    {/if}
    <div class="mt-auto pt-4 flex items-center text-primary-10 group-hover:text-primary-11 font-medium text-sm">
      Read article
      <svg class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>
  </div>
</a>
