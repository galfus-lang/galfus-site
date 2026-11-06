<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { translate } from '@galfus/i18n';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { startRegistration } from '@simplewebauthn/browser';

  let { data } = $props();
  let isPasskeyRegistering = $state(false);
  let removingPasskeyId = $state<string | null>(null);
  let currentPassword = $state('');

  async function handleAddPasskey(event: SubmitEvent) {
    event.preventDefault();
    if (isPasskeyRegistering || removingPasskeyId !== null) return;
    isPasskeyRegistering = true;
    try {
      if (!window.isSecureContext || !window.PublicKeyCredential) {
        addToast({
          title: translate('auth.title.sign_in_failed', data.locale),
          description: translate('error.auth.passkey.unavailable', data.locale),
          type: 'error',
          duration: 6000,
        });
        return;
      }
      const response = await fetch('?/passkeyRegistrationOptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({ currentPassword }),
      });

      const result = deserialize(await response.text());
      const rawData = result.type === 'success' ? result.data : undefined;
      const options = rawData?.options;

      if (!options) {
        addToast({
          title: translate('auth.title.sign_in_failed', data.locale),
          description:
            typeof rawData?.error === 'string'
              ? rawData.error
              : result.type === 'failure' && typeof result.data?.error === 'string'
                ? result.data.error
                : translate('error.auth.login.failed', data.locale),
          type: 'error',
        });
        return;
      }

      const attestation = await startRegistration({
        optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON'],
      });

      const form = new FormData();
      form.set('response', JSON.stringify(attestation));
      const verifyResponse = await fetch('?/verifyPasskeyRegistration', {
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

      if (verifyData?.success) {
        addToast({
          title: translate('profile.status.passkey_added', data.locale),
          description: translate('profile.status.passkey_added', data.locale),
          type: 'success',
          duration: 5000,
        });
        await invalidateAll();
      } else {
        const error =
          typeof verifyData?.error === 'string'
            ? verifyData.error
            : translate('error.auth.login.failed', data.locale);
        addToast({
          title: translate('auth.title.sign_in_failed', data.locale),
          description: error,
          type: 'error',
          duration: 6000,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      addToast({
        title: translate('auth.title.sign_in_failed', data.locale),
        description: translate(
          error?.name === 'NotAllowedError'
            ? 'error.auth.passkey.cancelled'
            : 'error.auth.login.failed',
          data.locale,
        ),
        type: 'error',
        duration: 6000,
      });
    } finally {
      currentPassword = '';
      isPasskeyRegistering = false;
    }
  }
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.passkeys', data.locale)}
    description={translate('profile.description.passkeys', data.locale)}
    backHref="/profile/security"
    backLabel={translate('profile.action.back_to_security', data.locale)}
  />
  <div class="space-y-4">
    <form onsubmit={handleAddPasskey}>
      <fieldset
        disabled={isPasskeyRegistering || removingPasskeyId !== null}
        class="w-full space-y-3"
      >
        <label for="passkey-password" class="block text-sm">
          {translate('profile.label.current_password', data.locale)}
        </label>
        <input
          id="passkey-password"
          type="password"
          bind:value={currentPassword}
          autocomplete="current-password"
          class="input-base w-full"
          required
        />
        <button
          type="submit"
          class={cn(
            'btn w-full btn-solid text-xs color-group-primary',
            isPasskeyRegistering && 'is-loading',
          )}
        >
          {isPasskeyRegistering
            ? translate('fields.please_wait', data.locale)
            : translate('profile.action.add_passkey', data.locale)}
        </button>
      </fieldset>
    </form>

    {#if data.profile.security.passkeys.length === 0}
      <p class="text-muted-foreground text-xs italic">
        {translate('profile.status.no_passkeys', data.locale)}
      </p>
    {:else}
      <div class="space-y-2">
        {#each data.profile.security.passkeys as passkey}
          <div
            class="flex items-center justify-between rounded-lg border border-neutral-6 bg-neutral-2/50 p-3 text-xs"
          >
            <div class="flex items-center space-x-2">
              <span class="text-primary icon-[lucide--fingerprint] icon-md"></span>
              <div>
                <p class="font-medium">
                  {passkey.label || translate('profile.label.passkey_default', data.locale)}
                </p>
                {#if passkey.deviceType === 'singleDevice' || passkey.deviceType === 'multiDevice'}
                  <p class="text-muted-foreground text-[10px]">
                    {translate(
                      passkey.deviceType === 'singleDevice'
                        ? 'profile.label.passkey_single_device'
                        : 'profile.label.passkey_multi_device',
                      data.locale,
                    )}
                  </p>
                {/if}
              </div>
            </div>

            <form
              action="?/removePasskey"
              method="POST"
              use:enhance={() => {
                removingPasskeyId = passkey.id;
                return async ({ result, update }) => {
                  if (result.type === 'success') {
                    addToast({
                      title: translate('profile.status.passkey_removed', data.locale),
                      description: translate('profile.status.passkey_removed', data.locale),
                      type: 'success',
                      duration: 4000,
                    });
                  } else if (result.type === 'failure' || result.type === 'error') {
                    addToast({
                      title: translate('auth.title.sign_in_failed', data.locale),
                      description:
                        result.type === 'failure' && typeof result.data?.error === 'string'
                          ? result.data.error
                          : translate('error.auth.passkey.remove_failed', data.locale),
                      type: 'error',
                      duration: 6000,
                    });
                  }
                  try {
                    await update();
                  } finally {
                    removingPasskeyId = null;
                  }
                };
              }}
            >
              <fieldset disabled={removingPasskeyId !== null || isPasskeyRegistering}>
                <input type="hidden" name="authenticatorId" value={passkey.id} />
                <button
                  type="submit"
                  class="cursor-pointer text-xs link color-group-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingPasskeyId === passkey.id
                    ? translate('fields.please_wait', data.locale)
                    : translate('profile.action.remove_passkey', data.locale)}
                </button>
              </fieldset>
            </form>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
