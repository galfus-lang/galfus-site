<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { translate } from '@galfus/i18n';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';

  let { data } = $props();
  let isChangingPassword = $state(false);
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.password', data.locale)}
    description={translate('profile.description.password', data.locale)}
    backHref="/profile/security"
    backLabel={translate('profile.action.back_to_security', data.locale)}
  />
  <form
    action="?/changePassword"
    method="POST"
    use:enhance={() => {
      isChangingPassword = true;
      return async ({ result, update }) => {
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
        try {
          await update();
        } finally {
          isChangingPassword = false;
        }
      };
    }}
    class="space-y-3"
  >
    <fieldset disabled={isChangingPassword} class="w-full min-w-0 space-y-3">
      {#if data.profile.security.hasPassword}
        <div class="space-y-1">
          <label for="currentPassword" class="text-xs font-medium">
            {translate('profile.label.current_password', data.locale)}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autocomplete="current-password"
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
          autocomplete="new-password"
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
          autocomplete="new-password"
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
    </fieldset>
  </form>
</div>
