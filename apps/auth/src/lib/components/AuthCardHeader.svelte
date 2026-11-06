<script lang="ts">
  import Brand from '@galfus/design-system/components/svg/Brand.svelte';

  let {
    title,
    description,
    identifier,
    backHref,
    backLabel,
  }: {
    title: string;
    description?: string;
    identifier?: string;
    backHref?: string;
    backLabel?: string;
  } = $props();
</script>

<header class="w-full border-b border-neutral-6 pb-5">
  <div class="flex items-center gap-3">
    {#if backHref && backLabel}
      <a
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm link focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span class="icon-[lucide--arrow-left] icon-lg" aria-hidden="true"></span>
      </a>
    {/if}
    <h1 class="min-w-0 flex-1 text-lg leading-tight font-bold">{title}</h1>
    <Brand class="h-8 w-auto shrink-0 fill-current text-primary-9" />
  </div>
  {#if description}
    <p class="mt-3 text-sm text-neutral-11">{description}</p>
  {/if}
  {#if identifier}
    <p class="mt-2 text-sm font-semibold break-all text-neutral-12">{identifier}</p>
  {/if}
</header>
