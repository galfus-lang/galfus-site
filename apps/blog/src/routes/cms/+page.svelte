<script lang="ts">
  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { init, type CmsConfig } from '@sveltia/cms';
  import { onMount } from 'svelte';

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
        extension: 'md',
        format: 'frontmatter',
        slug: '{{year}}-{{month}}-{{day}}-{{slug}}',
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Description', name: 'description', widget: 'text', required: false },
          { label: 'Date', name: 'date', widget: 'datetime', type: 'date' },
          { label: 'Thumbnail', name: 'thumbnail', widget: 'image', required: false },
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
  <title>CMS | Galfus Script</title>
  <meta name="robots" content="noindex" />
</svelte:head>
