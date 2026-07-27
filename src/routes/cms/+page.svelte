<script lang="ts">
  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { init, type CmsConfig } from '@sveltia/cms';

  const config: CmsConfig = {
    load_config_file: false,

    backend: {
      name: 'github',
      repo: 'galfus-lang/galfus-site',
    },
    media_folder: '/static/cms/media',
    public_folder: '/cms/media',

    collections: [
      {
        name: 'posts',
        label: 'Posts',
        label_singular: 'Post',
        folder: '/src/lib/markdown/posts',
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Date', name: 'date', widget: 'datetime', type: 'date' },
          { label: 'Body', name: 'body', widget: 'richtext' },
        ],
      },
    ],
  };

  onMount(async () => {
    if (dev) {
      await init({ config });
    } else {
      await goto('/');
    }
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>
