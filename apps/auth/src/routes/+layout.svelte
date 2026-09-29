<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';
  import '@galfus/design-system/styles/global.css';

  import icon from '@galfus/assets/images/icon-128.png';
  import ogImage from '@galfus/assets/images/og-banner.jpg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="shortcut icon" href={icon} />
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children()}
