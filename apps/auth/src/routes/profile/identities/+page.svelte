<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { translate } from '@galfus/i18n';

  let { data } = $props();
</script>

<div class="@container w-full space-y-6">
  <AuthCardHeader
    title={translate('profile.title.identities', data.locale)}
    description={translate('profile.description.identities', data.locale)}
    backHref="/profile"
    backLabel={translate('profile.action.back_to_profile', data.locale)}
  />
  <div class="space-y-2">
    {#each data.profile.identities as identity}
      <div
        class="flex items-center justify-between rounded-lg border border-neutral-6 bg-neutral-2/50 p-3 text-xs"
      >
        <div class="flex items-center space-x-2">
          <span class="text-primary icon-[lucide--user] icon-md"></span>
          <div>
            <p class="font-medium">{identity.identifier}</p>
            <p class="text-muted-foreground text-[10px]">
              {identity.provider} ({identity.kind})
            </p>
          </div>
        </div>

        <span class="bg-success/20 text-success rounded-full px-2 py-0.5 text-[10px] font-semibold">
          {identity.status}
        </span>
      </div>
    {/each}
  </div>
</div>
