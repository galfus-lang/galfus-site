<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { deserialize, enhance } from '$app/forms';
  import { startAuthentication } from '@simplewebauthn/browser';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
  let isPasskeyLoading = $state(false);

  async function handlePasskeyLogin() {
    isPasskeyLoading = true;
    let redirecting = false;
    try {
      const response = await fetch('?/passkeyOptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });
      const result = deserialize(await response.text());
      const rawData = result.type === 'success' ? result.data : undefined;
      const options = rawData?.options;

      if (!options) {
        throw new Error('Failed to obtain passkey options');
      }

      const assertion = await startAuthentication({
        optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'],
      });

      const form = new FormData();
      form.set('response', JSON.stringify(assertion));
      const verifyResponse = await fetch('?/passkeyVerify', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: form,
      });
      const verifyResult = deserialize(await verifyResponse.text());
      const verifyData =
        verifyResult.type === 'success' || verifyResult.type === 'failure'
          ? verifyResult.data
          : undefined;

      if (typeof verifyData?.redirectUrl === 'string') {
        redirecting = true;
        window.location.href = verifyData.redirectUrl;
      } else {
        const error =
          typeof verifyData?.error === 'string'
            ? verifyData.error
            : translate('auth.title.sign_in_failed', data.locale);
        addToast({
          title: translate('auth.title.sign_in_failed', data.locale),
          description: error,
          type: 'error',
          duration: 6000,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name !== 'NotAllowedError') {
        addToast({
          title: translate('auth.title.sign_in_failed', data.locale),
          description: translate('auth.title.sign_in_failed', data.locale),
          type: 'error',
          duration: 6000,
        });
      }
    } finally {
      if (!redirecting) isPasskeyLoading = false;
    }
  }
</script>

<div class="flex w-full flex-col items-center justify-center space-y-6">
  <AuthCardHeader
    title={translate('auth.title.welcome_back', data.locale)}
    identifier={data.identifier}
    backHref="/?restart=1"
    backLabel={translate('auth.action.use_different_identity', data.locale)}
  />

  <div class="mt-6 w-full">
    {#if data.hasPasskey}
      <button
        type="button"
        onclick={handlePasskeyLogin}
        class={cn('btn w-full btn-solid color-group-primary', isPasskeyLoading && 'is-loading')}
        disabled={isPasskeyLoading || isLoading}
      >
        <span class="mr-2 icon-[lucide--fingerprint] icon-lg"></span>
        {isPasskeyLoading
          ? translate('fields.please_wait', data.locale)
          : translate('auth.action.sign_in_with_passkey', data.locale)}
      </button>

      <div class="relative flex items-center py-5">
        <div class="grow border-t border-neutral-6"></div>
        <span class="text-muted-foreground mx-4 shrink-0 text-xs">
          {translate('auth.connective.or_use_password', data.locale)}
        </span>
        <div class="grow border-t border-neutral-6"></div>
      </div>
    {/if}

    <form
      action="?/password"
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
      <fieldset disabled={isLoading || isPasskeyLoading} class="w-full min-w-0 space-y-4">
        <div class="space-y-1">
          <label for="password" class="text-sm font-medium">
            {translate('auth.label.password', data.locale)}
          </label>
          <div class="input-group">
            <div class="input-icon">
              <span class="icon-[lucide--key] icon-md"></span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              maxlength="128"
              class={cn(
                'input-base w-full pl-10',
                form?.error && 'border-danger-9 focus:ring-danger-9',
              )}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div class="mb-6 flex justify-start">
          <a
            href={data.returnTo ? `/recover?rto=${encodeURIComponent(data.returnTo)}` : '/recover'}
            class="text-xs link"
          >
            {translate('auth.action.forgot_password', data.locale)}
          </a>
        </div>

        <button
          type="submit"
          class={cn('btn w-full btn-solid color-group-primary', isLoading && 'is-loading')}
          disabled={isLoading}
        >
          {isLoading
            ? translate('fields.please_wait', data.locale)
            : translate('auth.action.sign_in', data.locale)}
        </button>
      </fieldset>
    </form>
  </div>
</div>
