<script lang="ts">
  import GitHubStarButton from '$lib/GitHubStarButton.svelte';
  import PostCard from '$lib/components/blog/PostCard.svelte';

  let { data } = $props();

  const repoUrl = 'https://github.com/galfus-lang/galfus-script';
  const discussionsUrl = `${repoUrl}/discussions`;
</script>

<svelte:head>
  <title>Galfus Script | Small, Portable, Deterministic</title>
  <meta
    name="description"
    content="Galfus Script is a highly modular interpreted scripting language built around typed source code, an in-memory executable graph, and a deterministic VM runtime."
  />
</svelte:head>

<main class="min-h-screen bg-primary-2 font-sans text-primary-12 selection:bg-primary-5">
  <!-- Hero Section -->
  <section class="relative flex min-h-screen items-center overflow-hidden pt-20 pb-16">
    <div class="absolute inset-0 bg-(image:--gradient-hero) opacity-60"></div>

    <div
      class="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 sm:px-8 lg:grid-cols-2 lg:px-12"
    >
      <div class="flex max-w-2xl flex-col items-start text-left">
        <div
          class="mb-6 inline-flex items-center rounded-full border border-primary-6 bg-primary-3 px-3 py-1 text-sm font-medium text-primary-11"
        >
          <span class="mr-2 flex h-2 w-2 rounded-full bg-primary-9"></span>
          VM-First Scripting Language
        </div>

        <h1
          class="text-5xl leading-tight font-black tracking-tight text-primary-12 sm:text-6xl lg:text-7xl"
        >
          Small. Portable. <br /><span class="text-primary-11">Deterministic.</span>
        </h1>

        <p class="mt-6 max-w-xl text-lg leading-relaxed text-primary-11 sm:text-xl">
          A highly modular interpreted scripting language built around typed source code, an
          in-memory executable graph, and a deterministic VM runtime.
        </p>

        <div class="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-lg bg-primary-11 px-8 text-sm font-bold text-primary-1 shadow-[0_0_20px_rgba(var(--color-primary-11),0.3)] transition-colors hover:bg-primary-10 focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2"
          >
            View Documentation
          </a>

          <a
            href={discussionsUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-lg border border-primary-6 bg-primary-3/50 px-8 text-sm font-bold text-primary-11 transition-colors hover:border-primary-7 hover:bg-primary-4 focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2"
          >
            Join discussions
          </a>
        </div>

        <div class="mt-10 flex items-center gap-4">
          <GitHubStarButton owner="galfus-lang" repo="galfus-script" />
        </div>
      </div>

      <!-- Mascot Graphic -->
      <div class="relative flex justify-center lg:justify-end">
        <div class="relative aspect-square w-full max-w-lg">
          <div class="absolute inset-0 rounded-full bg-primary-9/20 blur-[100px]"></div>
          <img
            src="/images/char-transparent.png"
            alt="Fusy the Galfus Mascot"
            class="relative z-10 h-full w-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Code Example Section -->
  <section class="relative bg-primary-1 py-24">
    <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
      <div class="mb-16 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-primary-12 sm:text-4xl">
          Experience the Syntax
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-primary-11">
          Try Galfus Script directly in your browser. Our WebAssembly integration allows you to
          compile and execute code on the fly.
        </p>
      </div>

      <!-- Placeholder for WebComponent / iframe -->
      <div
        class="group relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-primary-5 bg-neutral-2 p-2 shadow-2xl"
      >
        <div
          class="absolute inset-0 bg-linear-to-r from-primary-4/10 to-primary-6/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        ></div>
        <div
          class="bg-black relative z-10 flex aspect-video w-full items-center justify-center rounded-xl border border-neutral-4/30 font-mono text-sm text-neutral-9"
        >
          <div class="flex flex-col items-center gap-4">
            <svg
              class="h-12 w-12 animate-pulse text-primary-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <p>Code Example WebComponent will be loaded here.</p>
            <p class="text-xs text-neutral-10">Waiting for WASM module integration...</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="relative border-t border-primary-3 bg-primary-2 py-24">
    <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
      <div class="mb-16 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-primary-12 sm:text-4xl">Core Features</h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-primary-11">
          Designed from the ground up to be safe, fast, and embeddable.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Feature 1 -->
        <div
          class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 transition-all duration-300 hover:border-primary-6 hover:shadow-lg hover:shadow-primary-9/10"
        >
          <div
            class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-4 text-primary-11 transition-colors group-hover:bg-primary-5"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          </div>
          <h3 class="mb-3 text-xl font-bold text-primary-12">VM-First & Portable</h3>
          <p class="leading-relaxed text-primary-11">
            Bytecode and interpreter structures dictate the design, making the VM highly portable.
            Easily embed Galfus in larger native applications like game engines or databases.
          </p>
        </div>

        <!-- Feature 2 -->
        <div
          class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 transition-all duration-300 hover:border-primary-6 hover:shadow-lg hover:shadow-primary-9/10"
        >
          <div
            class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-4 text-primary-11 transition-colors group-hover:bg-primary-5"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 class="mb-3 text-xl font-bold text-primary-12">Deterministic Memory</h3>
          <p class="leading-relaxed text-primary-11">
            No global garbage collector. Galfus utilizes an ownership graph built on Anchors and
            Edges, ensuring resources are released deterministically and safely.
          </p>
        </div>

        <!-- Feature 3 -->
        <div
          class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 transition-all duration-300 hover:border-primary-6 hover:shadow-lg hover:shadow-primary-9/10"
        >
          <div
            class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-4 text-primary-11 transition-colors group-hover:bg-primary-5"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 class="mb-3 text-xl font-bold text-primary-12">Type Safety</h3>
          <p class="leading-relaxed text-primary-11">
            Fully typed syntax with static type inference. Validate assignments, function calls, and
            expressions securely before execution.
          </p>
        </div>

        <!-- Feature 4 -->
        <div
          class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 transition-all duration-300 hover:border-primary-6 hover:shadow-lg hover:shadow-primary-9/10"
        >
          <div
            class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-4 text-primary-11 transition-colors group-hover:bg-primary-5"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h3 class="mb-3 text-xl font-bold text-primary-12">Modular Workspace</h3>
          <p class="leading-relaxed text-primary-11">
            Avoids magic conventions. Cross-module resolution supports local file imports, named
            imports, and explicit exported declarations.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Philosophy Section -->
  <section class="relative border-t border-primary-3 bg-primary-1 py-24">
    <div class="mx-auto max-w-4xl px-6 text-center sm:px-8">
      <div class="mb-6 inline-block rounded-full bg-primary-3 p-4">
        <svg class="h-8 w-8 text-primary-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <h2 class="mb-6 text-3xl font-bold tracking-tight text-primary-12 sm:text-4xl">
        Why "Galfus"?
      </h2>
      <p class="text-lg leading-relaxed text-primary-11">
        The name <strong>Galfus</strong> comes from <em>Galafus</em>, a figure from Pernambuco
        folklore associated with will-o'-the-wisp phenomena. The wandering flame represents a
        runtime that is small, lightweight, and able to float effortlessly across hosts and
        environments.
      </p>

      <div class="mt-12">
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center font-semibold text-primary-11 transition-colors hover:text-primary-12"
        >
          Explore the source code on GitHub
          <svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </a>
      </div>
    </div>
  </section>

  <!-- Latest Posts Section -->
  {#if data.posts && data.posts.length > 0}
    <section class="relative border-t border-primary-3 bg-primary-2 py-24">
      <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div class="mb-12 flex flex-col items-end justify-between gap-6 sm:flex-row">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-primary-12 sm:text-4xl">
              Latest from the Blog
            </h2>
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
          {#each data.posts as post}
            <PostCard {...post} />
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <footer class="border-t border-primary-4 bg-primary-2 py-8 text-center">
    <p class="text-sm text-primary-10">
      &copy; {new Date().getFullYear()} Galfus Script. Released under the MIT License.
    </p>
  </footer>
</main>
