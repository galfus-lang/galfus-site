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
    title={translate('auth.title.sign_in', data.locale)}
    description={translate('auth.description.sign_in', data.locale)}
  />

  <div class="w-full space-y-4">
    {#if data.passwordReset}
      <p class="text-sm">{translate('auth.description.password_reset_complete', data.locale)}</p>
    {/if}

    <form
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          let errorMessage: string | undefined;

          if (result.type === 'failure' && typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (result.type === 'error') {
            errorMessage = translate('error.auth.identity.lookup_failed', data.locale);
          }

          if (errorMessage) {
            addToast({
              title: translate('auth.title.identity_failed', data.locale),
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
            : translate('fields.continue', data.locale)}
        </button>
      </fieldset>
    </form>

    <!-- Temporarily hidden for later implementation -->
    {#if false}
      <div class="relative my-4 flex items-center py-2">
        <div class="grow border-t border-neutral-6"></div>
        <span class="bg-card text-muted-foreground px-2 text-xs">
          {translate('auth.connective.or_continue_with', data.locale)}
        </span>
        <div class="grow border-t border-neutral-6"></div>
      </div>

      <div class="flex flex-col gap-2">
        <button type="button" class="btn w-full btn-outlined">
          <span class="mr-2 icon-[simple-icons--google] icon-lg"></span>
          Google
        </button>
        <button type="button" class="btn w-full btn-outlined">
          <span class="mr-2 icon-[simple-icons--github] icon-lg"></span>
          GitHub
        </button>
      </div>
    {/if}
  </div>
</div>
