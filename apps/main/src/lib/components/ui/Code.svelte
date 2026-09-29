<script lang="ts">
  import { getHighlighter, shikiTheme } from '$lib/utils/shiki';
  import { onMount } from 'svelte';

  let {
    code = '',
    lang = 'html',
    label = 'Code',
  } = $props<{
    code?: string;
    lang?: string;
    label?: string;
  }>();

  let htmlStr = $state('');
  let copied = $state(false);

  async function setHtml() {
    const hl = await getHighlighter();
    try {
      htmlStr = hl.codeToHtml(code, { lang, theme: shikiTheme });
    } catch (e) {
      htmlStr = `<pre><code class="language-${lang}">${code}</code></pre>`;
    }
  }

  $effect(() => {
    code;
    lang;
    setHtml();
  });

  onMount(() => {
    setHtml();
  });

  function copyCode() {
    navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div
  class="code-window mb-8 overflow-hidden rounded-xl border border-neutral-6/30 bg-neutral-2 shadow-sm"
>
  <!-- Title Bar -->
  <div
    class="flex items-center justify-between border-b border-neutral-6/30 bg-neutral-3/50 px-4 py-2.5 backdrop-blur-md"
  >
    <div class="flex items-center gap-2 text-sm font-medium text-neutral-11">
      <span class="icon-[lucide--code] text-[16px]"></span>
      <span>{label}</span>
    </div>
    <button
      class="btn btn-icon h-8 w-8 btn-ghost rounded-md text-neutral-11 transition-colors hover:bg-neutral-4/50 hover:text-neutral-12"
      onclick={copyCode}
      aria-label="Copy code"
      title="Copy to clipboard"
    >
      {#if copied}
        <span class="icon-[lucide--check] text-[16px] text-success-9"></span>
      {:else}
        <span class="icon-[lucide--copy] text-[16px]"></span>
      {/if}
    </button>
  </div>

  <!-- Code Content -->
  <div class="overflow-x-auto p-4 text-sm">
    {#if htmlStr}
      <!-- Fade in the highlighted code smoothly -->
      <div class="animate-in fade-in duration-300">
        {@html htmlStr}
      </div>
    {:else}
      <!-- Loading Skeleton/Raw Code fallback -->
      <pre class="opacity-30 blur-[2px] transition-all"><code class="text-neutral-11">{code}</code
        ></pre>
    {/if}
  </div>
</div>
