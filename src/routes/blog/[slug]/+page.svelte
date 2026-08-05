<script lang="ts">
  import TableOfContents from '$lib/components/blog/TableOfContents.svelte';

  let { data } = $props();

  const formattedDate = new Date(data.metadata.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
</script>

<svelte:head>
  <title>{data.metadata.title} | Galfus Script</title>
  {#if data.metadata.description}
    <meta name="description" content={data.metadata.description} />
  {/if}
</svelte:head>

<main
  class="min-h-screen bg-primary-1 pt-24 pb-24 font-sans text-primary-12 selection:bg-primary-5"
>
  <div class="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 sm:px-8 lg:flex-row lg:px-12">
    <!-- Main Content -->
    <article class="max-w-4xl flex-1">
      <header class="mb-12">
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <nav class="flex items-center text-sm font-medium text-primary-10">
            <a href="/" class="transition-colors hover:text-primary-11">Home</a>
            <svg
              class="mx-2 h-4 w-4 text-primary-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <a href="/blog" class="transition-colors hover:text-primary-11">Blog</a>
          </nav>

          <form action="/blog" method="GET" class="relative w-full sm:w-64">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-10"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              placeholder="Search articles..."
              class="block w-full rounded-lg border border-primary-5 bg-primary-2 py-2 pr-3 pl-9 leading-5 text-primary-12 placeholder-primary-10 transition-colors focus:border-primary-8 focus:ring-2 focus:ring-primary-8 focus:outline-none sm:text-sm"
            />
          </form>
        </div>

        <time class="mb-4 block text-sm font-semibold tracking-wider text-primary-10 uppercase"
          >{formattedDate}</time
        >
        <h1 class="mb-6 text-4xl leading-tight font-black text-primary-12 sm:text-5xl">
          {data.metadata.title}
        </h1>

        {#if data.metadata.thumbnail}
          <div
            class="mb-10 aspect-video w-full overflow-hidden rounded-2xl border border-primary-4 bg-primary-2 shadow-lg"
          >
            <img
              src={data.metadata.thumbnail}
              alt={data.metadata.title}
              class="h-full w-full object-cover"
            />
          </div>
        {/if}
      </header>

      <div
        class="prose-primary prose max-w-none prose-invert prose-a:text-primary-11 hover:prose-a:text-primary-12 prose-pre:border prose-pre:border-primary-4 prose-pre:bg-neutral-2"
      >
        <!-- Render parsed HTML here safely -->
        {@html data.html}
      </div>
    </article>

    <!-- Sidebar / TOC -->
    <TableOfContents toc={data.toc} />
  </div>
</main>
