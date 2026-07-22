<script lang="ts">
  import GitHubStarButton from '$lib/GitHubStarButton.svelte';

  const discussionsUrl = 'https://github.com/vulppi-dev/galfus-script/discussions';
</script>

<svelte:head>
  <title>Galfus Script | Coming Soon</title>
  <meta
    name="description"
    content="The Galfus Script website is coming soon. Follow the project on the official repository."
  />
</svelte:head>

<main class="min-h-screen overflow-hidden bg-blue-2 text-blue-12">
  <section class="relative flex min-h-screen items-center">
    <div class="absolute inset-0 bg-(image:--gradient-hero)"></div>

    <div
      class="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,500px)] lg:px-12"
    >
      <div class="max-w-3xl">
        <p class="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-11">
          Galfus Script
        </p>

        <h1
          class="max-w-4xl text-5xl font-black leading-[0.95] text-blue-12 sm:text-6xl lg:text-7xl"
        >
          The website is coming soon.
        </h1>

        <p class="mt-6 max-w-2xl text-lg leading-8 text-blue-12/80 sm:text-xl">
          We are preparing the official Galfus Script landing page. In the meantime, follow the
          project development on the repository.
        </p>

        <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <GitHubStarButton owner="vulppi-dev" repo="galfus-script" />

          <a
            href={discussionsUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-md border border-blue-12/20 bg-blue-12/5 px-6 text-sm font-bold text-blue-12 transition hover:-translate-y-0.5 hover:border-blue-11/70 hover:bg-blue-12/10 focus:outline-none focus:ring-2 focus:ring-blue-11 focus:ring-offset-2 focus:ring-offset-blue-2"
          >
            Join discussions
          </a>

          <span
            class="inline-flex h-12 items-center justify-center rounded-md border border-blue-12/15 px-5 text-sm font-medium text-blue-12/80"
          >
            vulppi-dev/galfus-script
          </span>
        </div>
      </div>
    </div>
  </section>
</main>
