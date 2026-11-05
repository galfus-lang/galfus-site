<script lang="ts">
  import { translate } from '@galfus/i18n';

  let { data } = $props();

  $effect(() => {
    const timer = setTimeout(() => {
      window.location.href = data.destination;
    }, 1200);

    return () => clearTimeout(timer);
  });
</script>

<svelte:head>
  <meta http-equiv="refresh" content="3;url={data.destination}" />
</svelte:head>

<div class="flex w-full flex-col items-center justify-center space-y-6 text-center">
  <div
    class="flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-success-3 text-success-11"
  >
    <span class="icon-[lucide--check-circle-2] text-3xl"></span>
  </div>

  <div class="space-y-2">
    <h1 class="text-2xl font-bold">{translate('auth.title.success', data.locale)}</h1>
    <p class="text-muted-foreground text-sm">
      {translate('auth.description.success_redirecting', data.locale)}
    </p>
  </div>

  <div class="w-full pt-4">
    <a href={data.destination} class="btn w-full btn-solid color-group-primary">
      {translate('auth.action.continue', data.locale)}
      <span class="ml-2 icon-[lucide--arrow-right] icon-md"></span>
    </a>
  </div>
</div>
