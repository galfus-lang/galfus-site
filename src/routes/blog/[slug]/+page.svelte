<script lang="ts">
  import TableOfContents from '$lib/components/blog/TableOfContents.svelte';
  
  let { data } = $props();

  const formattedDate = new Date(data.metadata.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
</script>

<svelte:head>
  <title>{data.metadata.title} | Galfus Script</title>
  {#if data.metadata.description}
    <meta name="description" content={data.metadata.description} />
  {/if}
</svelte:head>

<main class="min-h-screen bg-primary-1 text-primary-12 selection:bg-primary-5 font-sans pt-24 pb-24">
  <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-12 relative">
    
    <!-- Main Content -->
    <article class="flex-1 max-w-4xl">
      <header class="mb-12">
        <a href="/blog" class="inline-flex items-center text-sm font-medium text-primary-10 hover:text-primary-11 transition-colors mb-6">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Blog
        </a>
        
        <time class="block text-sm font-semibold text-primary-10 uppercase tracking-wider mb-4">{formattedDate}</time>
        <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-primary-12 mb-6 leading-tight">
          {data.metadata.title}
        </h1>
        
        {#if data.metadata.thumbnail}
          <div class="w-full aspect-video rounded-2xl overflow-hidden bg-primary-2 border border-primary-4 mb-10 shadow-lg">
            <img src={data.metadata.thumbnail} alt={data.metadata.title} class="w-full h-full object-cover" />
          </div>
        {/if}
      </header>

      <div class="prose prose-invert prose-primary max-w-none prose-pre:bg-neutral-2 prose-pre:border prose-pre:border-primary-4 prose-a:text-primary-11 hover:prose-a:text-primary-12">
        <!-- Render parsed HTML here safely -->
        {@html data.html}
      </div>
    </article>

    <!-- Sidebar / TOC -->
    <TableOfContents toc={data.toc} />
    
  </div>
</main>
