<script lang="ts">
  import Container from './Container.svelte';
  import Preview from './Preview.svelte';
  let {
    preview,
    title,
    introduction,
    action,
    url,
    expiration,
    disclaimer,
  }: {
    preview: string;
    title: string;
    introduction: string;
    action: string;
    url: string;
    expiration: string;
    disclaimer: string;
  } = $props();
</script>

<Preview text={preview} />
<Container>
  <p style="margin: 0 0 24px; color: #a35c00; font-size: 20px; font-weight: bold;">Galfus</p>
  <h1 style="margin: 0 0 16px; font-size: 24px;">{title}</h1>
  <p style="margin: 0 0 24px;">{introduction}</p>
  <p style="margin: 0 0 24px;">
    <a href={url} style="color: #8a4d00; font-weight: bold;">{action}</a>
  </p>
  <p style="margin: 0 0 24px;">{expiration}</p>
  <p style="margin: 0; color: #5f6368; font-size: 14px;">{disclaimer}</p>
</Container>
