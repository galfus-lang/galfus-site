<script lang="ts">
  import PostCard from '$lib/components/blog/PostCard.svelte';
  let { posts } = $props<{ posts: any[] }>();
</script>

{#if posts && posts.length > 0}
  <section class="relative border-t border-primary-3 bg-primary-2 py-24">
    <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
      <div class="mb-12 flex flex-col items-end justify-between gap-6 sm:flex-row">
        <div>
          <h2 class="text-3xl font-bold text-primary-12 sm:text-4xl">Latest from the Blog</h2>
          <p class="mt-4 text-lg text-primary-11">Updates, tutorials, and deep-dives.</p>
        </div>
        <a
          href="/blog"
          class="inline-flex items-center justify-center rounded-lg border border-primary-5 bg-primary-3 px-6 py-3 text-sm font-bold text-primary-11 transition-colors hover:bg-primary-4"
        >
          View all posts
        </a>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each posts as post}
          <PostCard {...post} />
        {/each}
      </div>
    </div>
  </section>
{/if}
