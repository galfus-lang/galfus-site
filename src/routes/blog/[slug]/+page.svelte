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
        <a
          href="/blog"
          class="mb-6 inline-flex items-center text-sm font-medium text-primary-10 transition-colors hover:text-primary-11"
        >
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Blog
        </a>

        <time class="mb-4 block text-sm font-semibold tracking-wider text-primary-10 uppercase"
          >{formattedDate}</time
        >
        <h1
          class="mb-6 text-4xl leading-tight font-black tracking-tight text-primary-12 sm:text-5xl"
        >
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
