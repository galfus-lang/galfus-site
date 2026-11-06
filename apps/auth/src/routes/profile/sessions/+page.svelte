<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { translate } from '@galfus/i18n';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';

  let { data } = $props();
  let isRevokingSessions = $state(false);
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.sessions', data.locale)}
    description={translate('profile.description.sessions', data.locale)}
    backHref="/profile/security"
    backLabel={translate('profile.action.back_to_security', data.locale)}
  />
  <form
    action="?/revokeOtherSessions"
    method="POST"
    use:enhance={() => {
      isRevokingSessions = true;
      return async ({ result, update }) => {
        if (result.type === 'success') {
          addToast({
            title: translate('profile.status.sessions_revoked', data.locale),
            description: translate('profile.status.sessions_revoked', data.locale),
            type: 'success',
            duration: 4000,
          });
        }
        try {
          await update();
        } finally {
          isRevokingSessions = false;
        }
      };
    }}
  >
    <fieldset disabled={isRevokingSessions} class="w-full min-w-0 space-y-3">
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
    </fieldset>
  </form>
</div>
