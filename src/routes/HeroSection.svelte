<script lang="ts">
  import NavigationAppbar from '$lib/components/NavigationAppbar.svelte';
  const repoUrl = 'https://github.com/galfus-lang/galfus-script';
  const discussionsUrl = `${repoUrl}/discussions`;
</script>

<NavigationAppbar />

<section
  class="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pt-8 pb-16 lg:pt-0"
>
  <!-- Dynamic Backgrounds -->
  <div
    class="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-10 mix-blend-screen"
  ></div>
  <div class="absolute inset-0 bg-(image:--gradient-hero) opacity-60"></div>

  <!-- Floating glow orbs -->
  <div class="absolute top-1/4 left-0 h-96 w-96 rounded-full bg-primary-9/20 blur-[120px]"></div>
  <div
    class="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-primary-10/20 blur-[120px]"
  ></div>

  <div
    class="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-12"
  >
    <!-- Left Column: Copy & CTAs -->
    <div class="flex max-w-2xl flex-col items-start text-left">
      <div
        class="mb-8 inline-flex items-center rounded-full border border-primary-6 bg-primary-3/40 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-11 shadow-lg backdrop-blur-md transition-all hover:bg-primary-4/50 hover:shadow-primary-9/20"
      >
        <span
          class="mr-3 flex h-2 w-2 rounded-full bg-primary-9 shadow-[0_0_10px_rgba(var(--color-primary-9),1)]"
        ></span>
        VM-First Scripting Language
      </div>

      <h1
        class="text-5xl leading-tight font-black tracking-tight text-primary-12 sm:text-6xl lg:text-7xl"
      >
        Small. Portable. <br />
        <span class="bg-linear-to-r from-primary-9 to-primary-11 bg-clip-text text-transparent">
          Deterministic.
        </span>
      </h1>

      <p class="mt-6 max-w-xl text-lg leading-relaxed text-primary-11 sm:text-xl">
        A highly modular interpreted scripting language built around typed source code, an in-memory
        executable graph, and a deterministic VM runtime.
      </p>

      <div class="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          class="color-group-primary btn btn-solid"
        >
          View Documentation
        </a>

        <a
          href={discussionsUrl}
          target="_blank"
          rel="noreferrer"
          class="color-group-primary btn btn-soft"
        >
          Join Discussions
        </a>
      </div>
    </div>

    <!-- Right Column: Code Example inside a sleek window -->
    <div class="relative w-full pt-10 lg:pt-0">
      <!-- Glow behind the code -->
      <div
        class="absolute -inset-1 rounded-4xl bg-linear-to-tr from-primary-7 to-primary-11 opacity-40 blur-2xl"
      ></div>

      <!-- Sleek Terminal/Editor Window -->
      <div
        class="relative flex flex-col overflow-hidden rounded-2xl border border-primary-5 bg-primary-1/90 shadow-2xl backdrop-blur-xl"
      >
        <!-- Window Header -->
        <div
          class="flex items-center justify-between border-b border-primary-4 bg-primary-2/80 px-4 py-3"
        >
          <div class="flex gap-2">
            <div class="bg-red-500/80 h-3 w-3 rounded-full"></div>
            <div class="bg-yellow-500/80 h-3 w-3 rounded-full"></div>
            <div class="bg-green-500/80 h-3 w-3 rounded-full"></div>
          </div>
          <div class="font-mono text-xs text-primary-10">main.gfs</div>
          <div class="w-12"></div>
        </div>

        <!-- REPL Content -->
        <div class="w-full">
          <galfus-repl>
            {`import { println } from 'std/io'

export fn main(args: [[u8]]): i32 {
  println("Hello from the Galfus Embed!")
  println("Try changing this code and pressing Run.")
  return 0
}
`}
          </galfus-repl>
        </div>
      </div>
    </div>
  </div>
</section>
