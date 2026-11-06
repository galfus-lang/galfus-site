<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { translate } from '@galfus/i18n';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';

  let { data } = $props();
  let isUpdatingProfile = $state(false);
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.personal_info', data.locale)}
    description={translate('profile.description.personal_info', data.locale)}
    backHref="/profile"
    backLabel={translate('profile.action.back_to_profile', data.locale)}
  />
  <form
    action="?/updateProfile"
    method="POST"
    use:enhance={() => {
      isUpdatingProfile = true;
      return async ({ result, update }) => {
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
        try {
          await update();
        } finally {
          isUpdatingProfile = false;
        }
      };
    }}
    class="space-y-3"
  >
    <fieldset disabled={isUpdatingProfile} class="w-full min-w-0 space-y-3">
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
    </fieldset>
  </form>
</div>
