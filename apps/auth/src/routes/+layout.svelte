<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';
  import '../app.css';

  import icon from '@galfus/assets/images/icon-128.png';
  import ogImage from '@galfus/assets/images/og-banner.jpg';
  import bgImage from '@galfus/assets/images/background.jpg';

  import { page } from '$app/state';
  import ToastSystem from '@galfus/design-system/components/ToastSystem.svelte';
  import { translate } from '@galfus/i18n';

  let { children, data } = $props();
</script>

<svelte:head>
  <link rel="shortcut icon" href={icon} />
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:image" content={ogImage} />
  <title>{translate('auth.title.application', data.locale)}</title>
</svelte:head>

<ToastSystem />

{#if page.error}
  {@render children()}
{:else}
  <div class="bg-background text-foreground flex min-h-screen flex-col font-sans">
    <main class="relative flex flex-1 flex-col items-center justify-center p-4">
      <div
        style="background-image: url({bgImage});"
        class="absolute inset-0 bg-cover bg-center opacity-50 select-none"
      ></div>

      <div class="card z-10 w-full max-w-md p-8 shadow-2xl">
        {@render children()}
      </div>
    </main>
  </div>
{/if}
