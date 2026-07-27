<script lang="ts">
  import { onMount } from 'svelte';

  type RepositoryResponse = {
    stargazers_count: number;
  };

  let {
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
  } = $props();

  const repositoryUrl = $derived(`https://github.com/${owner}/${repo}`);

  let starCount = $state<number | null>(null);
  let isLoading = $state(true);

  const formatStars = (count: number) =>
    new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(count);

  onMount(async () => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        return;
      }

      const repository = (await response.json()) as RepositoryResponse;
      starCount = repository.stargazers_count;
    } finally {
      isLoading = false;
    }
  });
</script>

<a
  href={repositoryUrl}
  target="_blank"
  rel="noreferrer"
  aria-label="Star {owner}/{repo} on GitHub"
  class="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-blue-11/70 bg-blue-9 px-6 text-sm font-bold text-blue-1 shadow-[0_0_26px_color-mix(in_oklch,var(--color-blue-9)_35%,transparent)] transition hover:-translate-y-0.5 hover:bg-blue-12 focus:ring-2 focus:ring-blue-11 focus:ring-offset-2 focus:ring-offset-blue-2 focus:outline-none"
>
  <span aria-hidden="true" class="text-base leading-none">★</span>
  <span>Star on GitHub</span>
  <span
    class="min-w-12 rounded-sm bg-blue-1/15 px-2 py-1 text-center text-xs font-black text-blue-1 tabular-nums"
  >
    {#if starCount !== null}
      {formatStars(starCount)}
    {:else if isLoading}
      ...
    {:else}
      --
    {/if}
  </span>
</a>
