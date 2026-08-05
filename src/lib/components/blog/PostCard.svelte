<script lang="ts">
  import { cn } from '$lib/utils/cn';

  let { title, description, date, slug, thumbnail } = $props<{
    title: string;
    description?: string;
    date: string;
    slug: string;
    thumbnail?: string;
  }>();

  let formattedDate = $derived(
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  );
</script>

<a
  href="/blog/{slug}"
  class="group block h-full overflow-hidden rounded-2xl border border-primary-4 bg-primary-2 transition-all duration-300 hover:border-primary-6 hover:shadow-lg hover:shadow-primary-9/10"
>
  {#if thumbnail}
    <div class="h-48 w-full overflow-hidden border-b border-primary-4 bg-primary-3">
      <img
        src={thumbnail}
        alt={title}
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  {/if}
  <div class={cn('flex h-full flex-col p-6', !thumbnail && 'pt-8')}>
    <time class="mb-2 text-xs font-semibold tracking-wider text-primary-10 uppercase"
      >{formattedDate}</time
    >
    <h3
      class="mb-3 line-clamp-2 text-xl font-bold text-primary-12 transition-colors group-hover:text-primary-11"
    >
      {title}
    </h3>
    {#if description}
      <p class="mb-6 line-clamp-3 leading-relaxed text-primary-11">{description}</p>
    {/if}
    <div
      class="mt-auto flex items-center pt-4 text-sm font-medium text-primary-10 group-hover:text-primary-11"
    >
      Read article
      <svg
        class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    </div>
  </div>
</a>
