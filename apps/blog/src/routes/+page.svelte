<script lang="ts">
  import { page } from '$app/state';
  import PostCard from '$lib/components/blog/PostCard.svelte';
  import Footer from '@galfus/design-system/components/Footer.svelte';
  import NavigationAppbar from '@galfus/design-system/components/NavigationAppbar.svelte';

  let { data } = $props();

  let searchQuery = $state(page.url.searchParams.get('q') || '');
  let currentPage = $state(1);
  const itemsPerPage = 6;

  // Reset pagination when search changes
  $effect(() => {
    if (searchQuery !== undefined) {
      currentPage = 1;
    }
  });

  let filteredPosts = $derived(
    data.posts.filter((post) => {
      const q = searchQuery.toLowerCase();
      const titleMatch = post.title?.toLowerCase().includes(q);
      const descMatch = post.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    }),
  );

  let totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / itemsPerPage)));

  let paginatedPosts = $derived(
    filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
  );

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
</script>

<svelte:head>
  <title>Blog | Galfus Script</title>
  <meta
    name="description"
    content="Read the latest news, tutorials, and updates about Galfus Script."
  />
  <meta property="og:title" content="Blog | Galfus Script" />
  <meta
    property="og:description"
    content="Read the latest news, tutorials, and updates about Galfus Script."
  />
  <meta property="og:url" content="https://galfus.com/blog" />
</svelte:head>

<NavigationAppbar />

<main
  class="min-h-screen bg-primary-2 pt-16 pb-16 font-sans text-primary-12 selection:bg-primary-5"
>
  <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
    <div class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <ol class="mb-6 breadcrumbs">
          <li>
            <a href="/" class="breadcrumb-link">Home</a>
          </li>
          <li>
            <span class="icon-[lucide--chevron-right] icon-sm text-primary-8"></span>
          </li>
          <li class="breadcrumb-active" aria-current="page">Blog</li>
        </ol>
        <h1 class="mb-4 text-4xl font-black text-primary-12 sm:text-5xl">Blog</h1>
        <p class="max-w-2xl text-lg text-primary-11">
          News, tutorials, and deep-dives into the architecture of Galfus Script.
        </p>
      </div>

      <!-- Search Input -->
      <div class="color-group-primary input-group mt-6 md:mt-0 md:w-80">
        <div class="input-icon">
          <span class="icon-[lucide--search] icon-md"></span>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search articles..."
          class="input-base"
        />
      </div>
    </div>

    {#if data.posts.length === 0}
      <div class="rounded-2xl border border-dashed border-primary-4 bg-primary-2 py-12 text-center">
        <p class="text-primary-11">No posts published yet. Stay tuned!</p>
      </div>
    {:else if filteredPosts.length === 0}
      <div class="py-24 text-center">
        <div class="mx-auto mb-4 flex justify-center text-primary-8">
          <span class="icon-[lucide--search] icon-3xl"></span>
        </div>
        <h3 class="text-lg font-medium text-primary-12">No articles found</h3>
        <p class="mt-1 text-primary-10">Try adjusting your search term.</p>
        <button
          onclick={() => (searchQuery = '')}
          class="mt-6 font-medium text-primary-11 hover:text-primary-12"
        >
          Clear search
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each paginatedPosts as post}
          <PostCard {...post} />
        {/each}
      </div>

      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div class="mt-16 flex justify-center border-t border-primary-4 pt-6">
          <nav aria-label="Pagination">
            <ul class="color-group-primary pagination">
              <li>
                <button
                  onclick={prevPage}
                  disabled={currentPage === 1}
                  class="pagination-item"
                  aria-label="Previous page"
                >
                  <span class="icon-[lucide--chevron-left] icon-md"></span>
                </button>
              </li>

              {#each Array(totalPages) as _, i}
                <li>
                  <button
                    onclick={() => (currentPage = i + 1)}
                    class="pagination-item"
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                  >
                    {i + 1}
                  </button>
                </li>
              {/each}

              <li>
                <button
                  onclick={nextPage}
                  disabled={currentPage === totalPages}
                  class="pagination-item"
                  aria-label="Next page"
                >
                  <span class="icon-[lucide--chevron-right] icon-md"></span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      {/if}
    {/if}
  </div>
</main>

<Footer />
