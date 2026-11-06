<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
  let isRecovery = $state(false);
</script>

<div class="flex w-full flex-col items-center justify-center space-y-6">
  <AuthCardHeader
    title={isRecovery
      ? translate('auth.label.recovery_code', data.locale)
      : translate('auth.title.two_step_verification', data.locale)}
    description={isRecovery
      ? undefined
      : translate('auth.description.two_step_verification', data.locale)}
    identifier={data.identifier}
    backHref="/?restart=1"
    backLabel={translate('auth.action.use_different_identity', data.locale)}
  />

  <div class="w-full space-y-4">
    {#if !isRecovery}
      <form
        method="POST"
        action="?/verify"
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
        class="space-y-6"
      >
        <fieldset disabled={isLoading} class="w-full min-w-0 space-y-6">
          <div class="space-y-2 text-center">
            <input
              id="otp"
              name="otp"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              autocomplete="one-time-code"
              class={cn(
                'placeholder:text-muted-foreground/30 mx-auto input-base w-44 text-center text-3xl font-bold tracking-[0.5em] placeholder:tracking-normal',
                form?.error && 'border-danger-9 focus:ring-danger-9',
              )}
              placeholder={translate('auth.placeholder.otp_code', data.locale)}
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
              : translate('auth.action.verify', data.locale)}
          </button>
        </fieldset>
      </form>
    {:else}
      <form
        method="POST"
        action="?/recovery"
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
        class="space-y-6"
      >
        <fieldset disabled={isLoading} class="w-full min-w-0 space-y-6">
          <div class="space-y-1">
            <label for="recoveryCode" class="text-sm font-medium">
              {translate('auth.label.recovery_code', data.locale)}
            </label>
            <input
              id="recoveryCode"
              name="recoveryCode"
              type="text"
              class={cn(
                'input-base w-full text-center font-mono tracking-widest uppercase',
                form?.error && 'border-danger-9 focus:ring-danger-9',
              )}
              placeholder={translate('auth.placeholder.recovery_code', data.locale)}
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
              : translate('auth.action.verify', data.locale)}
          </button>
        </fieldset>
      </form>
    {/if}

    <div class="pt-2 text-center">
      <button
        type="button"
        onclick={() => (isRecovery = !isRecovery)}
        disabled={isLoading}
        class="cursor-pointer text-xs link"
      >
        {isRecovery
          ? translate('auth.action.use_authenticator_app', data.locale)
          : translate('auth.action.use_recovery_code', data.locale)}
      </button>
    </div>
  </div>
</div>
