<script lang="ts">
  import { enhance } from '$app/forms';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
  let isResending = $state(false);
</script>

<div class="flex w-full flex-col items-center justify-center space-y-6">
  <div class="relative mb-2 flex w-full items-center justify-center">
    <a
      href="/"
      class="text-muted-foreground hover:text-foreground btn absolute left-0 btn-icon btn-ghost"
      aria-label={translate('auth.action.use_different_identity', data.locale)}
    >
      <span class="icon-[lucide--arrow-left] icon-lg"></span>
    </a>

    <div
      class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full font-bold"
    >
      {#if data.channel === 'sms'}
        <span class="icon-[lucide--smartphone] icon-xl"></span>
      {:else}
        <span class="icon-[lucide--mail] icon-xl"></span>
      {/if}
    </div>
  </div>

  <div class="text-center">
    <h1 class="text-2xl font-bold">{translate('auth.title.mfa_pass', data.locale)}</h1>
    <p class="text-muted-foreground mt-2 text-sm">
      {translate('auth.description.mfa_pass', data.locale, {
        destination: data.destination,
      })}
    </p>
  </div>

  <div class="w-full space-y-4">
    {#if form?.error}
      <div
        class="rounded-lg border border-danger-9/30 bg-danger-1/10 p-3 text-xs font-medium text-danger-9"
      >
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      action="?/verify"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          isLoading = false;
          let errorMessage: string | undefined;

          if (result.type === 'failure' && typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (result.type === 'error') {
            errorMessage =
              typeof result.error === 'object' && result.error && 'message' in result.error
                ? String(result.error.message)
                : translate('error.auth.login.failed', data.locale);
          }

          if (errorMessage) {
            addToast({
              title: translate('auth.title.sign_in_failed', data.locale),
              description: errorMessage,
              type: 'error',
              duration: 6000,
            });
          }
          await update();
        };
      }}
      class="space-y-6"
    >
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
        class={cn('color-group-primary btn w-full btn-solid', isLoading && 'is-loading')}
        disabled={isLoading}
      >
        {isLoading
          ? translate('fields.please_wait', data.locale)
          : translate('auth.action.verify', data.locale)}
      </button>
    </form>

    <div class="pt-2 text-center">
      <form
        method="POST"
        action="?/resend"
        use:enhance={() => {
          isResending = true;
          return async ({ result, update }) => {
            isResending = false;
            if (result.type === 'success') {
              addToast({
                title: translate('auth.action.resend_code', data.locale),
                description: 'Code resent successfully',
                type: 'success',
                duration: 4000,
              });
            }
            await update();
          };
        }}
      >
        <button
          type="submit"
          class="text-muted-foreground hover:text-foreground text-xs transition-colors"
          disabled={isResending}
        >
          {isResending
            ? translate('fields.please_wait', data.locale)
            : translate('auth.action.resend_code', data.locale)}
        </button>
      </form>
    </div>
  </div>
</div>
