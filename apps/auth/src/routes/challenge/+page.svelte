<script lang="ts">
  import { deserialize, enhance } from '$app/forms';
  import { startAuthentication } from '@simplewebauthn/browser';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
  let isPasskeyLoading = $state(false);

  async function handlePasskeyLogin() {
    isPasskeyLoading = true;
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
      isPasskeyLoading = false;
    }
  }
</script>

<div class="flex w-full flex-col items-center justify-center space-y-6">
  <div class="relative mb-2 flex w-full items-center justify-center">
    <a
      href="/?restart=1"
      class="text-muted-foreground hover:text-foreground btn absolute left-0 btn-icon btn-ghost"
      aria-label={translate('auth.action.use_different_identity', data.locale)}
    >
      <span class="icon-[lucide--arrow-left] icon-lg"></span>
    </a>

    <div
      class="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full"
    >
      <span class="icon-[lucide--user] icon-xl"></span>
    </div>
  </div>

  <div class="text-center">
    <h1 class="text-2xl font-bold">{translate('auth.title.welcome_back', data.locale)}</h1>
    <div
      class="border-border text-muted-foreground mt-4 inline-flex items-center rounded-full border px-4 py-1.5 text-sm"
    >
      {data.identifier}
    </div>
  </div>

  <div class="mt-6 w-full">
    {#if data.hasPasskey}
      <button
        type="button"
        onclick={handlePasskeyLogin}
        class={cn('btn w-full btn-solid color-group-primary', isPasskeyLoading && 'is-loading')}
        disabled={isPasskeyLoading}
      >
        <span class="mr-2 icon-[lucide--fingerprint] icon-lg"></span>
        {isPasskeyLoading
          ? translate('fields.please_wait', data.locale)
          : translate('auth.action.sign_in_with_passkey', data.locale)}
      </button>

      <div class="relative flex items-center py-5">
        <div class="border-border grow border-t"></div>
        <span class="text-muted-foreground mx-4 shrink-0 text-xs">
          {translate('auth.connective.or_use_password', data.locale)}
        </span>
        <div class="border-border grow border-t"></div>
      </div>
    {/if}

    <form
      action="?/password"
      method="POST"
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
      class="space-y-4"
    >
      {#if form?.error}
        <div
          class="rounded-lg border border-danger-9/30 bg-danger-1/10 p-3 text-xs font-medium text-danger-9"
        >
          {form.error}
        </div>
      {/if}
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
          class="text-muted-foreground hover:text-foreground text-xs"
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
    </form>
  </div>
</div>
