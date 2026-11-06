<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import ProfileMenu from '$lib/components/ProfileMenu.svelte';
  import { translate } from '@galfus/i18n';

  let { data } = $props();

  let sections = $derived([
    {
      href: '/profile/password',
      icon: 'icon-[lucide--key-round]',
      title: translate('profile.title.password', data.locale),
      description: translate('profile.description.password', data.locale),
    },
    {
      href: '/profile/passkeys',
      icon: 'icon-[lucide--fingerprint]',
      title: translate('profile.title.passkeys', data.locale),
      description: translate('profile.description.passkeys', data.locale),
    },
    {
      href: '/profile/mfa',
      icon: 'icon-[lucide--shield-check]',
      title: translate('profile.title.two_step', data.locale),
      description: translate('profile.description.two_step', data.locale),
      status: translate(
        data.profile.security.mfa.enabled ? 'profile.status.enabled' : 'profile.status.disabled',
        data.locale,
      ),
    },
    {
      href: '/profile/sessions',
      icon: 'icon-[lucide--monitor-smartphone]',
      title: translate('profile.title.sessions', data.locale),
      description: translate('profile.description.sessions', data.locale),
    },
  ]);
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.security', data.locale)}
    description={translate('profile.description.security', data.locale)}
    backHref="/profile"
    backLabel={translate('profile.action.back_to_profile', data.locale)}
  />
  <ProfileMenu {sections} label={translate('profile.title.security', data.locale)} />
</div>
