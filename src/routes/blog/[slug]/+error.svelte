<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Post Not Found | Galfus Script</title>
</svelte:head>

<main
  class="flex min-h-screen items-center justify-center bg-primary-1 p-6 font-sans text-primary-12"
>
  <div class="mx-auto max-w-lg text-center">
    <!-- Icon or 404 Text -->
    <div class="mb-8 flex justify-center">
      <div
        class="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary-5 bg-primary-3 shadow-lg shadow-primary-9/20"
      >
        <svg
          class="h-10 w-10 text-primary-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <h1 class="mb-4 text-4xl font-black text-primary-12 sm:text-5xl">Post Not Found</h1>

    <p class="mb-8 text-lg leading-relaxed text-primary-11">
      Oops! The article you are looking for doesn't exist, or it hasn't been published yet. Check
      back later or return to the blog index to read our available posts.
    </p>

    <!-- Action Buttons -->
    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href="/blog"
        class="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary-11 px-8 text-sm font-bold text-primary-1 shadow-[0_0_20px_rgba(var(--color-primary-11),0.3)] transition-colors hover:bg-primary-10 focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2 sm:w-auto"
      >
        View All Posts
      </a>

      <a
        href="/"
        class="inline-flex h-12 w-full items-center justify-center rounded-lg border border-primary-6 bg-primary-3/50 px-8 text-sm font-bold text-primary-11 transition-colors hover:border-primary-7 hover:bg-primary-4 focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2 sm:w-auto"
      >
        Back to Home
      </a>
    </div>

    <div class="mt-12 text-sm font-medium text-primary-8">
      Error code: {page.status}
    </div>
  </div>
</main>
