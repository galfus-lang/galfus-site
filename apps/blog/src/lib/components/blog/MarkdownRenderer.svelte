<script lang="ts">
  import Code from '@galfus/design-system/components/ui/Code.svelte';
  import { marked } from 'marked';

  let { tokens = [] } = $props<{ tokens: any[] }>();
</script>

{#snippet renderToken(token: any)}
  {#if token.type === 'heading'}
    <svelte:element
      this={`h${token.depth}`}
      id={token.id}
      class="group relative mt-10 mb-4 font-bold text-primary-12 {token.depth === 2
        ? 'text-3xl'
        : 'text-2xl'}"
    >
      {@html marked.parseInline(token.text)}
      <a
        href={`#${token.id}`}
        class="absolute -left-6 hidden text-primary-8 opacity-0 transition-opacity group-hover:opacity-100 md:block"
        aria-hidden="true">#</a
      >
    </svelte:element>
  {:else if token.type === 'paragraph'}
    <p class="mb-6 text-lg leading-relaxed text-primary-12/90">
      {@html marked.parseInline(token.text)}
    </p>
  {:else if token.type === 'list'}
    <svelte:element
      this={token.ordered ? 'ol' : 'ul'}
      class="{token.ordered
        ? 'list-decimal'
        : 'list-disc'} mb-6 ml-6 space-y-2 text-lg text-primary-12/90"
    >
      {#each token.items as item}
        {@render renderToken(item)}
      {/each}
    </svelte:element>
  {:else if token.type === 'list_item'}
    <li>
      {#if token.task}
        <input type="checkbox" checked={token.checked} disabled />
      {/if}
      {#if token.tokens && token.tokens.some( (t: any) => ['paragraph', 'blockquote', 'list', 'code', 'heading', 'html'].includes(t.type) )}
        {#each token.tokens as subToken}
          {@render renderToken(subToken)}
        {/each}
      {:else}
        {@html marked.parseInline(token.text)}
      {/if}
    </li>
  {:else if token.type === 'blockquote'}
    <blockquote
      class="my-8 rounded-r-lg border-l-4 border-primary-8 bg-primary-2/50 py-3 pr-4 pl-6 text-lg text-primary-11 italic"
    >
      {#if token.tokens && token.tokens.some( (t: any) => ['paragraph', 'blockquote', 'list', 'code', 'heading', 'html'].includes(t.type) )}
        {#each token.tokens as subToken}
          {@render renderToken(subToken)}
        {/each}
      {:else}
        {@html marked.parseInline(token.text)}
      {/if}
    </blockquote>
  {:else if token.type === 'code'}
    <Code code={token.text} lang={token.lang} label={token.lang || 'code'} />
  {:else if token.type === 'youtube'}
    <div
      class="my-8 aspect-video w-full overflow-hidden rounded-xl border border-primary-5 bg-neutral-2 shadow-lg"
    >
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${token.videoId}`}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  {:else if token.type === 'html' || token.type === 'space'}
    {@html token.text || token.raw}
  {:else if token.type === 'hr'}
    <hr class="my-8 border-neutral-6/30" />
  {:else}
    <!-- fallback for inline tokens or unknown -->
    {@html token.raw}
  {/if}
{/snippet}

{#each tokens as token}
  {@render renderToken(token)}
{/each}
