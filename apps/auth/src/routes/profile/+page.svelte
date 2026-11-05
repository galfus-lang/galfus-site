<script lang="ts">
  import { deserialize, enhance } from '$app/forms';
  import { startRegistration } from '@simplewebauthn/browser';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import Brand from '@galfus/design-system/components/svg/Brand.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data } = $props();

  let activeTab = $state<'profile' | 'security' | 'identities'>('profile');
  let isUpdatingProfile = $state(false);
  let isChangingPassword = $state(false);
  let isPasskeyRegistering = $state(false);
  let removingPasskeyId = $state<string | null>(null);
  let isRevokingSessions = $state(false);

  async function handleAddPasskey() {
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
      });

      const result = deserialize(await response.text());
      const rawData = result.type === 'success' ? result.data : undefined;
      const options = rawData?.options;

      if (!options) {
        throw new Error('Failed to obtain passkey registration options');
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
        window.location.reload();
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
      isPasskeyRegistering = false;
    }
  }
</script>

<div class="@container w-full space-y-6">
  <!-- Header with Brand & Profile Summary -->
  <div class="flex items-center justify-between border-b pb-4">
    <div class="flex items-center space-x-3">
      <Brand class="text-primary h-8 w-auto fill-current" />
      <div>
        <h1 class="text-lg leading-tight font-bold">
          {data.profile.account.displayName || data.identifier}
        </h1>
        <p class="text-muted-foreground text-xs">{data.identifier}</p>
      </div>
    </div>

    <form action="?/logout" method="POST">
      <button type="submit" class="btn btn-outlined text-xs">
        {translate('profile.action.sign_out', data.locale)}
      </button>
    </form>
  </div>

  <!-- Navigation Tabs -->
  <div class="flex border-b text-xs font-medium">
    <button
      type="button"
      class={cn(
        'cursor-pointer border-b-2 px-3 py-2 transition-colors',
        activeTab === 'profile'
          ? 'border-primary text-primary font-bold'
          : 'text-muted-foreground hover:text-foreground border-transparent',
      )}
      onclick={() => (activeTab = 'profile')}
    >
      {translate('profile.title.personal_info', data.locale)}
    </button>
    <button
      type="button"
      class={cn(
        'cursor-pointer border-b-2 px-3 py-2 transition-colors',
        activeTab === 'security'
          ? 'border-primary text-primary font-bold'
          : 'text-muted-foreground hover:text-foreground border-transparent',
      )}
      onclick={() => (activeTab = 'security')}
    >
      {translate('profile.title.security', data.locale)}
    </button>
    <button
      type="button"
      class={cn(
        'cursor-pointer border-b-2 px-3 py-2 transition-colors',
        activeTab === 'identities'
          ? 'border-primary text-primary font-bold'
          : 'text-muted-foreground hover:text-foreground border-transparent',
      )}
      onclick={() => (activeTab = 'identities')}
    >
      {translate('profile.title.identities', data.locale)}
    </button>
  </div>

  <!-- Tab 1: Personal Info -->
  {#if activeTab === 'profile'}
    <div class="space-y-4">
      <div>
        <h2 class="text-sm font-semibold">
          {translate('profile.title.personal_info', data.locale)}
        </h2>
        <p class="text-muted-foreground text-xs">
          {translate('profile.description.personal_info', data.locale)}
        </p>
      </div>

      <form
        action="?/updateProfile"
        method="POST"
        use:enhance={() => {
          isUpdatingProfile = true;
          return async ({ result, update }) => {
            isUpdatingProfile = false;
            if (result.type === 'success') {
              addToast({
                title: translate('profile.status.updated_success', data.locale),
                description: translate('profile.status.updated_success', data.locale),
                type: 'success',
                duration: 4000,
              });
            } else if (result.type === 'failure' && result.data?.error) {
              addToast({
                title: translate('fields.error', data.locale),
                description: result.data.error as string,
                type: 'error',
                duration: 5000,
              });
            }
            await update();
          };
        }}
        class="space-y-3"
      >
        <div class="space-y-1">
          <label for="displayName" class="text-xs font-medium">
            {translate('profile.label.display_name', data.locale)}
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            class="input-base w-full"
            value={data.profile.account.displayName}
            required
            minlength="2"
            maxlength="100"
          />
        </div>

        <button
          type="submit"
          class={cn(
            'btn w-full btn-solid text-xs color-group-primary',
            isUpdatingProfile && 'is-loading',
          )}
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile
            ? translate('fields.please_wait', data.locale)
            : translate('profile.action.save_changes', data.locale)}
        </button>
      </form>
    </div>
  {/if}

  <!-- Tab 2: Security & Sign-in -->
  {#if activeTab === 'security'}
    <div class="space-y-6">
      <!-- Password Section -->
      <div class="space-y-3 border-b pb-4">
        <div>
          <h2 class="text-sm font-semibold">{translate('profile.title.password', data.locale)}</h2>
          <p class="text-muted-foreground text-xs">
            {translate('profile.description.password', data.locale)}
          </p>
        </div>

        <form
          action="?/changePassword"
          method="POST"
          use:enhance={() => {
            isChangingPassword = true;
            return async ({ result, update }) => {
              isChangingPassword = false;
              if (result.type === 'success') {
                addToast({
                  title: translate('profile.status.password_updated', data.locale),
                  description: translate('profile.status.password_updated', data.locale),
                  type: 'success',
                  duration: 4000,
                });
              } else if (result.type === 'failure' && result.data?.error) {
                addToast({
                  title: translate('fields.error', data.locale),
                  description: result.data.error as string,
                  type: 'error',
                  duration: 5000,
                });
              }
              await update();
            };
          }}
          class="space-y-3"
        >
          {#if data.profile.security.hasPassword}
            <div class="space-y-1">
              <label for="currentPassword" class="text-xs font-medium">
                {translate('profile.label.current_password', data.locale)}
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                class="input-base w-full text-xs"
                placeholder="••••••••"
                required
              />
            </div>
          {/if}

          <div class="space-y-1">
            <label for="newPassword" class="text-xs font-medium">
              {translate('profile.label.new_password', data.locale)}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              class="input-base w-full text-xs"
              placeholder="••••••••"
              required
              minlength="8"
            />
          </div>

          <div class="space-y-1">
            <label for="confirmNewPassword" class="text-xs font-medium">
              {translate('profile.label.confirm_new_password', data.locale)}
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              class="input-base w-full text-xs"
              placeholder="••••••••"
              required
              minlength="8"
            />
          </div>

          <button
            type="submit"
            class={cn('btn w-full btn-outlined text-xs', isChangingPassword && 'is-loading')}
            disabled={isChangingPassword}
          >
            {isChangingPassword
              ? translate('fields.please_wait', data.locale)
              : translate('profile.action.change_password', data.locale)}
          </button>
        </form>
      </div>

      <!-- Passkeys Section -->
      <div class="space-y-3 border-b pb-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold">
              {translate('profile.title.passkeys', data.locale)}
            </h2>
            <p class="text-muted-foreground text-xs">
              {translate('profile.description.passkeys', data.locale)}
            </p>
          </div>
          <button
            type="button"
            class={cn(
              'btn btn-solid text-xs color-group-primary',
              isPasskeyRegistering && 'is-loading',
            )}
            disabled={isPasskeyRegistering}
            onclick={handleAddPasskey}
          >
            {translate('profile.action.add_passkey', data.locale)}
          </button>
        </div>

        {#if data.profile.security.passkeys.length === 0}
          <p class="text-muted-foreground text-xs italic">
            {translate('profile.status.no_passkeys', data.locale)}
          </p>
        {:else}
          <div class="space-y-2">
            {#each data.profile.security.passkeys as passkey}
              <div class="bg-muted/30 flex items-center justify-between rounded border p-2 text-xs">
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
                      removingPasskeyId = null;
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
                      await update();
                    };
                  }}
                >
                  <input type="hidden" name="authenticatorId" value={passkey.id} />
                  <button
                    type="submit"
                    class="text-xs text-danger-9 hover:underline"
                    disabled={removingPasskeyId !== null}
                  >
                    {removingPasskeyId === passkey.id
                      ? translate('fields.please_wait', data.locale)
                      : translate('profile.action.remove_passkey', data.locale)}
                  </button>
                </form>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Two-Step Verification Section -->
      <div class="space-y-3 border-b pb-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold">
              {translate('profile.title.two_step', data.locale)}
            </h2>
            <p class="text-muted-foreground text-xs">
              {translate('profile.description.two_step', data.locale)}
            </p>
          </div>
          <span
            class={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              data.profile.security.mfa.enabled
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {data.profile.security.mfa.enabled
              ? translate('profile.status.enabled', data.locale)
              : translate('profile.status.disabled', data.locale)}
          </span>
        </div>
        <a href="/profile/mfa" class="btn w-full btn-outlined text-xs"
          >{translate('profile.action.manage_2fa', data.locale)}</a
        >
      </div>

      <!-- Revoke Other Sessions Section -->
      <div class="space-y-3">
        <div>
          <h2 class="text-sm font-semibold">{translate('profile.title.sessions', data.locale)}</h2>
          <p class="text-muted-foreground text-xs">
            {translate('profile.description.sessions', data.locale)}
          </p>
        </div>

        <form
          action="?/revokeOtherSessions"
          method="POST"
          use:enhance={() => {
            isRevokingSessions = true;
            return async ({ result, update }) => {
              isRevokingSessions = false;
              if (result.type === 'success') {
                addToast({
                  title: translate('profile.status.sessions_revoked', data.locale),
                  description: translate('profile.status.sessions_revoked', data.locale),
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
            class={cn(
              'btn w-full btn-outlined text-xs text-danger-9',
              isRevokingSessions && 'is-loading',
            )}
            disabled={isRevokingSessions}
          >
            {translate('profile.action.revoke_sessions', data.locale)}
          </button>
        </form>
      </div>
    </div>
  {/if}

  <!-- Tab 3: Connected Identities -->
  {#if activeTab === 'identities'}
    <div class="space-y-4">
      <div>
        <h2 class="text-sm font-semibold">{translate('profile.title.identities', data.locale)}</h2>
        <p class="text-muted-foreground text-xs">
          {translate('profile.description.identities', data.locale)}
        </p>
      </div>

      <div class="space-y-2">
        {#each data.profile.identities as identity}
          <div class="bg-muted/30 flex items-center justify-between rounded border p-2 text-xs">
            <div class="flex items-center space-x-2">
              <span class="text-primary icon-[lucide--user] icon-md"></span>
              <div>
                <p class="font-medium">{identity.identifier}</p>
                <p class="text-muted-foreground text-[10px]">
                  {identity.provider} ({identity.kind})
                </p>
              </div>
            </div>

            <span
              class="bg-success/20 text-success rounded-full px-2 py-0.5 text-[10px] font-semibold"
            >
              {identity.status}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
