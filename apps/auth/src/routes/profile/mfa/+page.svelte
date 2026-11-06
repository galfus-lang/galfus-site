<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { enhance } from '$app/forms';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let pending = $state(false);
  let activated = $state(false);
  let setupData = $state<{ secret: string; qrCodeSvg: string; recoveryCodes: string[] } | null>(
    null,
  );
  let setup = $derived(setupData ?? form?.totpSetup ?? null);
  let recoveryCodes = $derived(setup?.recoveryCodes ?? form?.recoveryCodes);
</script>

<div class="@container mx-auto w-full max-w-xl space-y-6">
  <AuthCardHeader
    title={translate('profile.title.two_step', data.locale)}
    description={translate('profile.description.mfa_help', data.locale)}
    backHref="/profile/security"
    backLabel={translate('profile.action.back_to_security', data.locale)}
  />

  {#if (activated || form?.updatedField === 'mfa_enabled') && recoveryCodes}
    <div role="status" class="text-sm">{translate('profile.status.mfa_enabled', data.locale)}</div>
    <div class="space-y-2 rounded-lg border p-4">
      <p class="text-sm">{translate('profile.description.save_recovery_codes', data.locale)}</p>
      <div class="grid grid-cols-2 gap-2 font-mono text-sm">
        {#each recoveryCodes as code}<div>{code}</div>{/each}
      </div>
    </div>
    <a href="/profile" class="btn w-full btn-outlined link"
      >{translate('profile.action.back_to_profile', data.locale)}</a
    >
  {:else if data.profile.security.mfa.enabled}
    <p class="text-sm">{translate('profile.status.enabled', data.locale)}</p>
    <form
      action="?/disableTotp"
      method="POST"
      use:enhance={() => {
        pending = true;
        return async ({ update }) => {
          try {
            await update();
          } finally {
            pending = false;
          }
        };
      }}
      class="space-y-3"
    >
      <fieldset disabled={pending} class="w-full min-w-0 space-y-3">
        <label for="disable-password" class="block text-sm"
          >{translate('profile.label.current_password', data.locale)}</label
        >
        <input
          id="disable-password"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          class="input-base w-full"
          required
        />
        <label for="disable-code" class="block text-sm">
          {translate('profile.label.totp_code', data.locale)}
        </label>
        <input
          id="disable-code"
          name="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern={'[0-9]{6}'}
          minlength="6"
          maxlength="6"
          class="input-base w-full text-center font-mono"
          required
        />
        <button
          type="submit"
          class={cn('btn w-full btn-outlined text-danger-9', pending && 'is-loading')}
          disabled={pending}>{translate('profile.action.disable_2fa', data.locale)}</button
        >
      </fieldset>
    </form>
  {:else if !setup}
    <form
      action="?/setupTotp"
      method="POST"
      use:enhance={() => {
        pending = true;
        return async ({ result, update }) => {
          if (result.type === 'success' && result.data?.totpSetup)
            setupData = result.data.totpSetup as NonNullable<typeof setupData>;
          try {
            await update({ invalidateAll: false });
          } finally {
            pending = false;
          }
        };
      }}
      class="space-y-3"
    >
      <fieldset disabled={pending} class="w-full min-w-0 space-y-3">
        <label for="setup-password" class="block text-sm"
          >{translate('profile.label.current_password', data.locale)}</label
        >
        <input
          id="setup-password"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          class="input-base w-full"
          required
        />
        <button
          type="submit"
          class={cn('btn w-full btn-solid color-group-primary', pending && 'is-loading')}
          disabled={pending}>{translate('profile.action.setup_2fa', data.locale)}</button
        >
      </fieldset>
    </form>
  {:else}
    <div class="space-y-4 rounded-lg border p-4">
      <p class="text-sm">{translate('profile.description.scan_totp', data.locale)}</p>
      <div class="bg-white flex justify-center rounded p-3">{@html setup.qrCodeSvg}</div>
      <div class="space-y-1">
        <p class="text-muted-foreground text-xs">
          {translate('profile.label.totp_secret', data.locale)}
        </p>
        <p class="font-mono text-sm break-all select-all">{setup.secret}</p>
      </div>
      <p class="text-sm">{translate('profile.description.save_recovery_codes', data.locale)}</p>
      <div class="grid grid-cols-2 gap-2 font-mono text-sm">
        {#each setup.recoveryCodes as code}<div>{code}</div>{/each}
      </div>
      <form
        action="?/activateTotp"
        method="POST"
        use:enhance={() => {
          pending = true;
          return async ({ result, update }) => {
            if (result.type === 'success') activated = true;
            try {
              await update({ reset: false, invalidateAll: false });
            } finally {
              pending = false;
            }
          };
        }}
        class="space-y-3"
      >
        <fieldset disabled={pending} class="w-full min-w-0 space-y-3">
          <label for="totp-code" class="block text-sm"
            >{translate('profile.label.totp_code', data.locale)}</label
          >
          <input
            id="totp-code"
            name="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern={'[0-9]{6}'}
            maxlength="6"
            minlength="6"
            class="input-base w-full text-center font-mono"
            required
          />
          <button
            type="submit"
            class={cn('btn w-full btn-solid color-group-primary', pending && 'is-loading')}
            disabled={pending}>{translate('profile.action.confirm_enable', data.locale)}</button
          >
        </fieldset>
      </form>
    </div>
  {/if}
</div>
