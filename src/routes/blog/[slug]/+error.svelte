<script lang="ts">
  import { page } from '$app/state';
  import { FileQuestion } from '@lucide/svelte';
  import NavigationAppbar from '$lib/components/NavigationAppbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Post Not Found | Galfus Script</title>
</svelte:head>

<NavigationAppbar />

<main
  class="color-group-primary flex min-h-[calc(100vh-8rem)] items-center justify-center bg-primary-2 p-6 font-sans text-primary-12"
>
  <div class="mx-auto max-w-lg text-center">
    <!-- Icon or 404 Text -->
    <div class="mb-8 flex justify-center">
      <div
        class="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary-5 bg-primary-3 shadow-lg shadow-primary-9/20"
      >
        <FileQuestion size={40} class="text-primary-10" />
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
      <a href="/blog" class="btn h-12 w-full btn-solid px-8 text-base sm:w-auto">
        View All Posts
      </a>

      <a href="/" class="btn h-12 w-full btn-soft px-8 text-base sm:w-auto"> Back to Home </a>
    </div>

    <div class="mt-12 text-sm font-medium text-primary-8">
      Error code: {page.status}
    </div>
  </div>
</main>

<Footer />
