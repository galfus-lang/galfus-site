<script lang="ts">
  import NavigationAppbar from '@galfus/design-system/components/NavigationAppbar.svelte';
  import Footer from '@galfus/design-system/components/Footer.svelte';
  import bgImage from '@galfus/assets/images/background.jpg';
</script>

<svelte:head>
  <title>Galfus Identity</title>
</svelte:head>

<div class="bg-background text-foreground flex min-h-screen flex-col font-sans">
  <NavigationAppbar />
  <main class="relative flex flex-1 flex-col items-center justify-center p-4">
    <!-- Dynamic Background -->
    <div
      style="background-image: url({bgImage});"
      class="absolute inset-0 bg-cover bg-center opacity-50 select-none"
    ></div>

    <div class="border-border bg-card z-10 w-full max-w-md rounded-lg border p-6 shadow-sm">
      <h1 class="mb-6 text-center text-2xl font-bold">Sign In</h1>
      <p class="text-muted-foreground text-center">The authentication UI will be built here.</p>
    </div>
  </main>
  <Footer />
</div>
