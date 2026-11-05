<script lang="ts">
  import Container from './Container.svelte';
  import Preview from './Preview.svelte';

  let {
    preview,
    title,
    introduction,
    code,
    expiration,
    disclaimer,
  }: {
    preview: string;
    title: string;
    introduction: string;
    code: string;
    expiration: string;
    disclaimer: string;
  } = $props();
</script>

<Preview text={preview} />
<Container>
  <p style="margin: 0 0 24px; color: #a35c00; font-size: 20px; font-weight: bold;">Galfus</p>
  <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.25;">{title}</h1>
  <p style="margin: 0 0 16px;">{introduction}</p>
  <p style="margin: 0 0 16px; font-size: 32px; font-weight: bold; letter-spacing: 0.15em;">
    {code}
  </p>
  <p style="margin: 0 0 24px;">{expiration}</p>
  <p style="margin: 0; color: #5f6368; font-size: 14px;">{disclaimer}</p>
</Container>
