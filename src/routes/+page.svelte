<script lang="ts">
  import GitHubStarButton from '$lib/GitHubStarButton.svelte';

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

<main class="min-h-screen bg-primary-2 text-primary-12 selection:bg-primary-5 font-sans">
  <!-- Hero Section -->
  <section class="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
    <div class="absolute inset-0 bg-(image:--gradient-hero) opacity-60"></div>
    
    <div class="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-16 z-10">
      <div class="flex flex-col items-start text-left max-w-2xl">
        <div class="inline-flex items-center rounded-full border border-primary-6 bg-primary-3 px-3 py-1 text-sm font-medium text-primary-11 mb-6">
          <span class="flex h-2 w-2 rounded-full bg-primary-9 mr-2"></span>
          VM-First Scripting Language
        </div>
        
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-primary-12">
          Small. Portable. <br/><span class="text-primary-11">Deterministic.</span>
        </h1>
        
        <p class="mt-6 text-lg sm:text-xl text-primary-11 leading-relaxed max-w-xl">
          A highly modular interpreted scripting language built around typed source code, an in-memory executable graph, and a deterministic VM runtime.
        </p>
        
        <div class="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-lg bg-primary-11 px-8 text-sm font-bold text-primary-1 hover:bg-primary-10 transition-colors focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2 shadow-[0_0_20px_rgba(var(--color-primary-11),0.3)]"
          >
            View Documentation
          </a>
          
          <a
            href={discussionsUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-lg border border-primary-6 bg-primary-3/50 px-8 text-sm font-bold text-primary-11 hover:bg-primary-4 hover:border-primary-7 transition-colors focus:ring-2 focus:ring-primary-11 focus:ring-offset-2 focus:ring-offset-primary-2"
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
        <div class="relative w-full max-w-lg aspect-square">
          <div class="absolute inset-0 bg-primary-9/20 blur-[100px] rounded-full"></div>
          <img 
            src="/images/char-transparent.png" 
            alt="Fusy the Galfus Mascot" 
            class="relative z-10 w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Code Example Section -->
  <section class="py-24 bg-primary-1 relative">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-primary-12 tracking-tight">Experience the Syntax</h2>
        <p class="mt-4 text-lg text-primary-11 max-w-2xl mx-auto">
          Try Galfus Script directly in your browser. Our WebAssembly integration allows you to compile and execute code on the fly.
        </p>
      </div>
      
      <!-- Placeholder for WebComponent / iframe -->
      <div class="w-full max-w-5xl mx-auto rounded-2xl border border-primary-5 bg-neutral-2 p-2 shadow-2xl overflow-hidden relative group">
        <div class="absolute inset-0 bg-linear-to-r from-primary-4/10 to-primary-6/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="w-full aspect-video bg-black rounded-xl flex items-center justify-center font-mono text-neutral-9 text-sm relative z-10 border border-neutral-4/30">
          <div class="flex flex-col items-center gap-4">
            <svg class="w-12 h-12 text-primary-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <p>Code Example WebComponent will be loaded here.</p>
            <p class="text-xs text-neutral-10">Waiting for WASM module integration...</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="py-24 bg-primary-2 relative border-t border-primary-3">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-primary-12 tracking-tight">Core Features</h2>
        <p class="mt-4 text-lg text-primary-11 max-w-2xl mx-auto">
          Designed from the ground up to be safe, fast, and embeddable.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Feature 1 -->
        <div class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 hover:border-primary-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-9/10">
          <div class="h-12 w-12 rounded-lg bg-primary-4 flex items-center justify-center mb-6 text-primary-11 group-hover:bg-primary-5 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-primary-12 mb-3">VM-First & Portable</h3>
          <p class="text-primary-11 leading-relaxed">
            Bytecode and interpreter structures dictate the design, making the VM highly portable. Easily embed Galfus in larger native applications like game engines or databases.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 hover:border-primary-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-9/10">
          <div class="h-12 w-12 rounded-lg bg-primary-4 flex items-center justify-center mb-6 text-primary-11 group-hover:bg-primary-5 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-primary-12 mb-3">Deterministic Memory</h3>
          <p class="text-primary-11 leading-relaxed">
            No global garbage collector. Galfus utilizes an ownership graph built on Anchors and Edges, ensuring resources are released deterministically and safely.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 hover:border-primary-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-9/10">
          <div class="h-12 w-12 rounded-lg bg-primary-4 flex items-center justify-center mb-6 text-primary-11 group-hover:bg-primary-5 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-primary-12 mb-3">Type Safety</h3>
          <p class="text-primary-11 leading-relaxed">
            Fully typed syntax with static type inference. Validate assignments, function calls, and expressions securely before execution.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="group rounded-2xl border border-primary-4 bg-primary-3 p-8 hover:border-primary-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-9/10">
          <div class="h-12 w-12 rounded-lg bg-primary-4 flex items-center justify-center mb-6 text-primary-11 group-hover:bg-primary-5 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-primary-12 mb-3">Modular Workspace</h3>
          <p class="text-primary-11 leading-relaxed">
            Avoids magic conventions. Cross-module resolution supports local file imports, named imports, and explicit exported declarations.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Philosophy Section -->
  <section class="py-24 bg-primary-1 relative border-t border-primary-3">
    <div class="max-w-4xl mx-auto px-6 sm:px-8 text-center">
      <div class="inline-block p-4 rounded-full bg-primary-3 mb-6">
        <svg class="w-8 h-8 text-primary-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 class="text-3xl sm:text-4xl font-bold text-primary-12 tracking-tight mb-6">Why "Galfus"?</h2>
      <p class="text-lg text-primary-11 leading-relaxed">
        The name <strong>Galfus</strong> comes from <em>Galafus</em>, a figure from Pernambuco folklore associated with will-o'-the-wisp phenomena. The wandering flame represents a runtime that is small, lightweight, and able to float effortlessly across hosts and environments.
      </p>
      
      <div class="mt-12">
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center text-primary-11 hover:text-primary-12 font-semibold transition-colors"
        >
          Explore the source code on GitHub
          <svg class="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  </section>
  
  <footer class="py-8 bg-primary-2 border-t border-primary-4 text-center">
    <p class="text-primary-10 text-sm">
      &copy; {new Date().getFullYear()} Galfus Script. Released under the MIT License.
    </p>
  </footer>
</main>
