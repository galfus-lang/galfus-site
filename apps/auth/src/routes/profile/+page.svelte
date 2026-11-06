<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import ProfileMenu from '$lib/components/ProfileMenu.svelte';
  import { translate } from '@galfus/i18n';

  let { data } = $props();
  let isSigningOut = $state(false);

  let sections = $derived([
    {
      href: '/profile/personal',
      icon: 'icon-[lucide--user-round]',
      title: translate('profile.title.personal_info', data.locale),
      description: translate('profile.description.personal_info', data.locale),
    },
    {
      href: '/profile/security',
      icon: 'icon-[lucide--shield-check]',
      title: translate('profile.title.security', data.locale),
      description: translate('profile.description.security', data.locale),
    },
    {
      href: '/profile/identities',
      icon: 'icon-[lucide--contact-round]',
      title: translate('profile.title.identities', data.locale),
      description: translate('profile.description.identities', data.locale),
    },
  ]);
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.page', data.locale)}
    description={translate('profile.description.page', data.locale)}
  />

  <div class="flex min-w-0 items-center gap-3">
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-3 text-primary-11"
    >
      <span class="icon-[lucide--user-round] icon-xl" aria-hidden="true"></span>
    </div>
    <div class="min-w-0">
      <p class="truncate font-bold">{data.profile.account.displayName || data.identifier}</p>
      <p class="truncate text-sm text-neutral-11">{data.identifier}</p>
    </div>
  </div>

  <ProfileMenu {sections} label={translate('profile.title.page', data.locale)} />

  <form
    action="?/logout"
    method="POST"
    class="border-t border-neutral-6 pt-4"
    use:enhance={() => {
      isSigningOut = true;
      return async ({ update }) => {
        try {
          await update();
        } finally {
          isSigningOut = false;
        }
      };
    }}
  >
    <button
      type="submit"
      disabled={isSigningOut}
      class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold link color-group-danger"
    >
      <span class="icon-[lucide--log-out] icon-md" aria-hidden="true"></span>
      {translate('profile.action.sign_out', data.locale)}
    </button>
  </form>
</div>
