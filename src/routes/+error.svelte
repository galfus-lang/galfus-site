<script lang="ts">
  import { page } from '$app/state';
  import { OctagonAlert } from '@lucide/svelte';
  import NavigationAppbar from '$lib/components/NavigationAppbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Error {page.status} | Galfus Script</title>
</svelte:head>

<NavigationAppbar />

<main
  class="color-group-danger flex min-h-[calc(100vh-8rem)] items-center justify-center bg-primary-2 p-6 font-sans text-primary-12"
>
  <div class="mx-auto max-w-lg text-center">
    <div class="mb-8 flex justify-center">
      <div
        class="relative flex h-24 w-24 items-center justify-center rounded-full border border-danger-5 bg-danger-3 text-danger-10 shadow-lg shadow-danger-9/20"
      >
        <OctagonAlert size={40} />
      </div>
    </div>

    <h1 class="mb-4 text-4xl font-black text-danger-12 sm:text-5xl">Error {page.status}</h1>

    <p class="mb-8 text-lg leading-relaxed text-danger-11">
      {page.error?.message || 'An unexpected error occurred while trying to process your request.'}
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a href="/" class="btn h-12 w-full btn-solid px-8 text-base sm:w-auto"> Return Home </a>
    </div>
  </div>
</main>

<Footer />
