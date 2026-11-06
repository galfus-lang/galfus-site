<script lang="ts">
  import '@fontsource/fira-code';
  import '@fontsource/nunito';
  import '../app.css';

  import icon from '@galfus/assets/images/icon-128.png';

  import { page } from '$app/state';
  import { translate } from '@galfus/i18n';

  import AuthBgEffect from '$lib/components/AuthBgEffect.svelte';
  import AuthMessageDrawer from '$lib/components/AuthMessageDrawer.svelte';

  let { children, data } = $props();
  let error = $derived(
    typeof page.form?.error === 'string'
      ? page.form.error
      : page.data.transactionError
        ? translate(page.data.transactionError, data.locale)
        : !page.form?.sent && page.data.delivery === 'failed'
          ? translate('error.auth.registration.delivery_failed', data.locale)
          : !page.form?.sent && page.data.delivery === 'limited'
            ? translate('error.auth.registration.resend_limited', data.locale)
            : undefined,
  );
</script>

<svelte:head>
  <link rel="shortcut icon" href={icon} />
  <title>{translate('auth.title.application', data.locale)}</title>
</svelte:head>

{#if page.error}
  {@render children()}
{:else}
  <div class="bg-background text-foreground flex min-h-screen flex-col font-sans">
    <main class="relative flex flex-1 flex-col items-center justify-center p-4">
      <AuthBgEffect />

      <div class="relative z-10 w-full max-w-md">
        <div class="card z-10 w-full p-8 shadow-2xl">
          {@render children()}
        </div>
        <AuthMessageDrawer
          {error}
          errorKey={page.form ?? page.data}
          errorTitle={translate('fields.error', data.locale)}
          closeLabel={translate('fields.close', data.locale)}
        />
      </div>
    </main>
  </div>
{/if}
