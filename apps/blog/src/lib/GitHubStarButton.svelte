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
  class="btn h-9 btn-soft gap-2 px-3 text-sm"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    ><polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
    ></polygon></svg
  >
  <span class="hidden font-semibold sm:inline">Star on GitHub</span>
  <span
    class="flex min-w-[2rem] items-center justify-center rounded bg-primary-12/10 px-1.5 py-0.5 text-xs font-bold tabular-nums"
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
