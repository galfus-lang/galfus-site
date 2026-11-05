<script lang="ts">
  import { enhance } from '$app/forms';
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
  let isRevokingSessions = $state(false);

  // TOTP setup state
  let totpSetupData = $state<{
    secret: string;
    qrCodeSvg: string;
    recoveryCodes: string[];
  } | null>(null);
  let isTotpSetupLoading = $state(false);
  let isTotpActivating = $state(false);
  let isTotpDisabling = $state(false);
  let showRecoveryCodes = $state(false);

  async function handleAddPasskey() {
    isPasskeyRegistering = true;
    try {
      const response = await fetch('?/passkeyRegistrationOptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const result = await response.json();
      const rawData = typeof result?.data === 'string' ? JSON.parse(result.data) : result?.data;
      const options = rawData?.options;

      if (!options) {
        throw new Error('Failed to obtain passkey registration options');
      }

      const attestation = await startRegistration({ optionsJSON: options });

      const verifyResponse = await fetch('?/verifyPasskeyRegistration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ response: attestation }),
      });

      const verifyResult = await verifyResponse.json();
      const verifyData =
        typeof verifyResult?.data === 'string' ? JSON.parse(verifyResult.data) : verifyResult?.data;

      if (verifyData?.success) {
        addToast({
          title: translate('profile.status.passkey_added', data.locale),
          description: translate('profile.status.passkey_added', data.locale),
          type: 'success',
          duration: 5000,
        });
        window.location.reload();
      } else {
        const error = verifyData?.error || 'Passkey registration failed.';
        addToast({
          title: 'Passkey error',
          description: error,
          type: 'error',
          duration: 6000,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name !== 'NotAllowedError') {
        addToast({
          title: 'Passkey error',
          description: error?.message || 'Could not register passkey.',
          type: 'error',
          duration: 6000,
        });
      }
    } finally {
      isPasskeyRegistering = false;
    }
  }

  async function handleStartTotpSetup() {
    isTotpSetupLoading = true;
    try {
      const response = await fetch('?/setupTotp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });
      const result = await response.json();
      const rawData = typeof result?.data === 'string' ? JSON.parse(result.data) : result?.data;
      if (rawData?.totpSetup) {
        totpSetupData = rawData.totpSetup;
      }
    } catch (err) {
      addToast({
        title: '2FA Error',
        description: 'Failed to start 2FA setup.',
        type: 'error',
        duration: 5000,
      });
    } finally {
      isTotpSetupLoading = false;
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
                title: 'Error',
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
            'color-group-primary btn w-full btn-solid text-xs',
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
                  title: 'Error',
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
              'color-group-primary btn btn-solid text-xs',
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
                    <p class="font-medium">{passkey.label || 'Passkey'}</p>
                    <p class="text-muted-foreground text-[10px]">
                      {passkey.deviceType || 'device'}
                    </p>
                  </div>
                </div>

                <form
                  action="?/removePasskey"
                  method="POST"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === 'success') {
                        addToast({
                          title: translate('profile.status.passkey_removed', data.locale),
                          description: translate('profile.status.passkey_removed', data.locale),
                          type: 'success',
                          duration: 4000,
                        });
                      }
                      await update();
                    };
                  }}
                >
                  <input type="hidden" name="authenticatorId" value={passkey.id} />
                  <button type="submit" class="text-xs text-danger-9 hover:underline">
                    {translate('profile.action.remove_passkey', data.locale)}
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

        {#if data.profile.security.mfa.enabled}
          <form
            action="?/disableTotp"
            method="POST"
            use:enhance={() => {
              isTotpDisabling = true;
              return async ({ result, update }) => {
                isTotpDisabling = false;
                if (result.type === 'success') {
                  addToast({
                    title: translate('profile.status.mfa_disabled', data.locale),
                    description: translate('profile.status.mfa_disabled', data.locale),
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
                isTotpDisabling && 'is-loading',
              )}
              disabled={isTotpDisabling}
            >
              {translate('profile.action.disable_2fa', data.locale)}
            </button>
          </form>
        {:else if !totpSetupData}
          <button
            type="button"
            class={cn('btn w-full btn-outlined text-xs', isTotpSetupLoading && 'is-loading')}
            disabled={isTotpSetupLoading}
            onclick={handleStartTotpSetup}
          >
            {translate('profile.action.setup_2fa', data.locale)}
          </button>
        {:else}
          <!-- TOTP Enrollment in progress -->
          <div class="bg-muted/20 space-y-3 rounded-lg border p-3 text-xs">
            <p class="font-medium">Scan QR code in Authenticator App:</p>
            <div class="bg-white flex justify-center rounded p-2">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html totpSetupData.qrCodeSvg}
            </div>
            <div class="space-y-1">
              <span class="text-muted-foreground text-[10px]">
                {translate('profile.label.totp_secret', data.locale)}:
              </span>
              <p class="bg-background rounded border p-1 text-center font-mono select-all">
                {totpSetupData.secret}
              </p>
            </div>

            <!-- Recovery Codes Preview -->
            <div class="space-y-1">
              <button
                type="button"
                class="text-primary text-[11px] hover:underline"
                onclick={() => (showRecoveryCodes = !showRecoveryCodes)}
              >
                {showRecoveryCodes ? 'Hide recovery codes' : 'View emergency recovery codes'}
              </button>
              {#if showRecoveryCodes}
                <div
                  class="bg-background grid grid-cols-2 gap-1 rounded border p-2 font-mono text-[10px]"
                >
                  {#each totpSetupData.recoveryCodes as code}
                    <div>{code}</div>
                  {/each}
                </div>
              {/if}
            </div>

            <form
              action="?/activateTotp"
              method="POST"
              use:enhance={() => {
                isTotpActivating = true;
                return async ({ result, update }) => {
                  isTotpActivating = false;
                  if (result.type === 'success') {
                    totpSetupData = null;
                    addToast({
                      title: translate('profile.status.mfa_enabled', data.locale),
                      description: translate('profile.status.mfa_enabled', data.locale),
                      type: 'success',
                      duration: 4000,
                    });
                  } else if (result.type === 'failure' && result.data?.error) {
                    addToast({
                      title: 'Error',
                      description: result.data.error as string,
                      type: 'error',
                      duration: 5000,
                    });
                  }
                  await update();
                };
              }}
              class="space-y-2 pt-2"
            >
              <input
                type="hidden"
                name="recoveryCodes"
                value={JSON.stringify(totpSetupData.recoveryCodes)}
              />
              <div class="space-y-1">
                <label for="totpCode" class="font-medium">
                  {translate('profile.label.totp_code', data.locale)}
                </label>
                <input
                  id="totpCode"
                  name="code"
                  type="text"
                  class="input-base w-full text-center font-mono text-sm tracking-widest"
                  placeholder="000000"
                  maxlength="6"
                  required
                />
              </div>

              <div class="flex space-x-2">
                <button
                  type="button"
                  class="btn flex-1 btn-outlined text-xs"
                  onclick={() => (totpSetupData = null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class={cn(
                    'color-group-primary btn flex-1 btn-solid text-xs',
                    isTotpActivating && 'is-loading',
                  )}
                  disabled={isTotpActivating}
                >
                  Confirm & Activate
                </button>
              </div>
            </form>
          </div>
        {/if}
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
