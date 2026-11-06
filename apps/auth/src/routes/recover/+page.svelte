<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let isLoading = $state(false);
  let { data, form } = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <AuthCardHeader
    title={translate('auth.title.recover', data.locale)}
    description={translate('auth.description.recover', data.locale)}
    backHref="/?restart=1"
    backLabel={translate('auth.action.back_to_sign_in', data.locale)}
  />

  <div class="w-full space-y-4">
    {#if form?.success}
      <div class="bg-primary/10 border-primary/20 text-foreground rounded-lg border p-4 text-sm">
        <p class="font-medium">{translate('auth.description.recover_sent', data.locale)}</p>
      </div>

      <a href="/" class="btn w-full btn-outlined link">
        {translate('auth.action.back_to_sign_in', data.locale)}
      </a>
    {:else}
      <form
        method="POST"
        use:enhance={() => {
          isLoading = true;
          return async ({ result, update }) => {
            let errorMessage: string | undefined;

            if (result.type === 'failure' && typeof result.data?.error === 'string') {
              errorMessage = result.data.error;
            } else if (result.type === 'error') {
              errorMessage = translate('error.auth.login.failed', data.locale);
            }

            if (errorMessage) {
              addToast({
                title: translate('auth.title.sign_in_failed', data.locale),
                description: errorMessage,
                type: 'error',
                duration: 6000,
              });
            }
            try {
              await update();
            } finally {
              isLoading = false;
            }
          };
        }}
        class="space-y-4"
      >
        <fieldset disabled={isLoading} class="w-full min-w-0 space-y-4">
          <div class="space-y-1">
            <label for="identifier" class="text-sm font-medium">
              {translate('auth.label.identity', data.locale)}
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              class={cn('input-base w-full', form?.error && 'border-danger-9 focus:ring-danger-9')}
              placeholder={translate('auth.placeholder.identity', data.locale)}
              value={form?.identifier ?? ''}
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              required
            />
          </div>

          <button
            type="submit"
            class={cn('btn w-full btn-solid color-group-primary', isLoading && 'is-loading')}
            disabled={isLoading}
          >
            {isLoading
              ? translate('fields.please_wait', data.locale)
              : translate('auth.action.send_instructions', data.locale)}
          </button>
        </fieldset>
      </form>
    {/if}
  </div>
</div>
