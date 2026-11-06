<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let isLoading = $state(false);
  let { data, form } = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <AuthCardHeader
    title={translate('auth.title.upsert_password', data.locale)}
    description={translate('auth.description.upsert_password', data.locale)}
    backHref="/?restart=1"
    backLabel={translate('auth.action.back_to_sign_in', data.locale)}
  />

  <div class="w-full space-y-4">
    <form
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          let errorMessage: string | undefined;

          if (result.type === 'failure' && typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (result.type === 'error') {
            errorMessage = translate('error.auth.login.failed', data.locale);
          }

          if (errorMessage) {
            addToast({
              title: translate('auth.title.sign_in_failed', data.locale),
              description: errorMessage,
              type: 'error',
              duration: 6000,
            });
          }
          try {
            await update();
          } finally {
            isLoading = false;
          }
        };
      }}
      class="space-y-4"
    >
      <fieldset disabled={isLoading} class="w-full min-w-0 space-y-4">
        <div class="space-y-1">
          <label for="password" class="text-sm font-medium">
            {translate('auth.label.new_password', data.locale)}
          </label>
          <div class="input-group">
            <div class="input-icon">
              <span class="icon-[lucide--key] icon-md"></span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              class={cn(
                'input-base w-full pl-10',
                form?.error && 'border-danger-9 focus:ring-danger-9',
              )}
              placeholder="••••••••"
              autocomplete="new-password"
              required
              minlength="8"
              maxlength="128"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label for="confirmPassword" class="text-sm font-medium">
            {translate('auth.label.confirm_password', data.locale)}
          </label>
          <div class="input-group">
            <div class="input-icon">
              <span class="icon-[lucide--key] icon-md"></span>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              class={cn(
                'input-base w-full pl-10',
                form?.error && 'border-danger-9 focus:ring-danger-9',
              )}
              placeholder="••••••••"
              autocomplete="new-password"
              required
              minlength="8"
              maxlength="128"
            />
          </div>
        </div>

        <button
          type="submit"
          class={cn('btn w-full btn-solid color-group-primary', isLoading && 'is-loading')}
          disabled={isLoading}
        >
          {isLoading
            ? translate('fields.please_wait', data.locale)
            : translate('auth.action.reset_password', data.locale)}
        </button>
      </fieldset>
    </form>
  </div>
</div>
