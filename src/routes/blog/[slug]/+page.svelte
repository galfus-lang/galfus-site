<script lang="ts">
  import TableOfContents from '$lib/components/blog/TableOfContents.svelte';
  import NavigationAppbar from '$lib/components/NavigationAppbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { ChevronRight, Search } from '@lucide/svelte';

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

<NavigationAppbar />

<main
  class="min-h-screen bg-primary-2 pt-16 pb-16 font-sans text-primary-12 selection:bg-primary-5"
>
  <div class="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 sm:px-8 lg:flex-row lg:px-12">
    <!-- Main Content -->
    <article class="max-w-4xl flex-1">
      <header class="mb-12">
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <ol class="breadcrumbs">
            <li>
              <a href="/" class="breadcrumb-link">Home</a>
            </li>
            <li>
              <ChevronRight size={16} class="text-primary-8" />
            </li>
            <li>
              <a href="/blog" class="breadcrumb-link">Blog</a>
            </li>
            <li>
              <ChevronRight size={16} class="text-primary-8" />
            </li>
            <li class="breadcrumb-active" aria-current="page">Post</li>
          </ol>

          <form action="/blog" method="GET" class="color-group-primary input-group sm:w-64">
            <div class="input-icon">
              <Search size={18} />
            </div>
            <input type="text" name="q" placeholder="Search articles..." class="input-base" />
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

<Footer />
