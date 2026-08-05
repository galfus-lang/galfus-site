<script lang="ts">
  import Brand from '$lib/components/svg/Brand.svelte';
  import GitHubStarButton from '$lib/GitHubStarButton.svelte';
</script>

<header class="color-group-primary sticky top-0 z-50 appbar w-full">
  <a href="/" class="group appbar-title">
    <div class="relative flex items-center justify-center">
      <Brand size={40} class="text-group-9 relative z-10" />
    </div>
    <span class="text-group-12 group-hover:text-group-10 transition-colors">Galfus</span>
  </a>

  <nav>
    <ul class="appbar-nav">
      <li>
        <a href="/" class="appbar-link">Home</a>
      </li>
      <li>
        <a href="/blog" class="appbar-link">Blog</a>
      </li>
      <li>
        <a href="/design-system" class="appbar-link">Design System</a>
      </li>
      <li>
        <GitHubStarButton owner="galfus-lang" repo="galfus-script" />
      </li>
    </ul>
  </nav>
</header>
