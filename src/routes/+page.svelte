<script lang="ts">
  import HeroSection from './HeroSection.svelte';
  import FeaturesSection from './FeaturesSection.svelte';
  import PhilosophySection from './PhilosophySection.svelte';
  import LatestPostsSection from './LatestPostsSection.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Galfus Script | Small, Portable, Deterministic</title>
  <meta
    name="description"
    content="Galfus Script is a highly modular interpreted scripting language built around typed source code, an in-memory executable graph, and a deterministic VM runtime."
  />
  <script src="/embed.js"></script>
</svelte:head>

<main class="min-h-screen bg-primary-2 font-sans text-primary-12 selection:bg-primary-5">
  <HeroSection />
  <FeaturesSection />
  <PhilosophySection />
  <LatestPostsSection posts={data.posts} />
  <Footer />
</main>
