<script lang="ts">
  import { page } from '$app/state';
  import PostCard from '$lib/components/blog/PostCard.svelte';

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
</svelte:head>

<main
  class="min-h-screen bg-primary-1 pt-24 pb-16 font-sans text-primary-12 selection:bg-primary-5"
>
  <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
    <div class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <a
          href="/"
          class="mb-4 inline-flex items-center text-sm font-medium text-primary-10 transition-colors hover:text-primary-11"
        >
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </a>
        <h1 class="mb-4 text-4xl font-black tracking-tight text-primary-12 sm:text-5xl">Blog</h1>
        <p class="max-w-2xl text-lg text-primary-11">
          News, tutorials, and deep-dives into the architecture of Galfus Script.
        </p>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary-10"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          bind:value={searchQuery}
          placeholder="Search articles..."
          class="block w-full rounded-xl border border-primary-5 bg-primary-2 py-3 pr-3 pl-10 leading-5 text-primary-12 placeholder-primary-10 transition-colors focus:border-primary-8 focus:ring-2 focus:ring-primary-8 focus:outline-none sm:text-sm"
        />
      </div>
    </div>

    {#if data.posts.length === 0}
      <div class="rounded-2xl border border-dashed border-primary-4 bg-primary-2 py-12 text-center">
        <p class="text-primary-11">No posts published yet. Stay tuned!</p>
      </div>
    {:else if filteredPosts.length === 0}
      <div class="py-24 text-center">
        <svg
          class="mx-auto mb-4 h-12 w-12 text-primary-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
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
        <div class="mt-16 flex items-center justify-between border-t border-primary-4 pt-6">
          <button
            onclick={prevPage}
            disabled={currentPage === 1}
            class="flex items-center rounded-lg px-4 py-2 text-sm font-medium {currentPage === 1
              ? 'cursor-not-allowed text-primary-8'
              : 'text-primary-12 transition-colors hover:bg-primary-3'}"
          >
            <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            Previous
          </button>

          <span class="text-sm text-primary-11">
            Page <span class="font-medium text-primary-12">{currentPage}</span> of
            <span class="font-medium text-primary-12">{totalPages}</span>
          </span>

          <button
            onclick={nextPage}
            disabled={currentPage === totalPages}
            class="flex items-center rounded-lg px-4 py-2 text-sm font-medium {currentPage ===
            totalPages
              ? 'cursor-not-allowed text-primary-8'
              : 'text-primary-12 transition-colors hover:bg-primary-3'}"
          >
            Next
            <svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</main>
