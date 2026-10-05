<script lang="ts">
  import { enhance } from '$app/forms';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import Brand from '@galfus/design-system/components/svg/Brand.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <Brand class="text-primary h-12 w-auto fill-current" />

  <div class="text-center">
    <h1 class="text-2xl font-bold">{translate('auth.title.create_account', data.locale)}</h1>
    <p class="text-muted-foreground mt-2 text-sm">
      <span class="text-foreground font-semibold">{data.identifier}</span>
    </p>
  </div>

  <div class="w-full">
    <form
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          isLoading = false;
          const error =
            result.type === 'failure' && typeof result.data?.error === 'string'
              ? result.data.error
              : undefined;

          if (error) {
            addToast({
              title: translate('auth.title.registration_failed', data.locale),
              description: error,
              type: 'error',
              duration: 6000,
            });
          }
          await update();
        };
      }}
      class="space-y-4"
    >
      <input type="hidden" name="state" value={data.stateToken} />

      <div class="space-y-1">
        <label for="fullName" class="text-sm font-medium">
          {translate('auth.label.full_name', data.locale)}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          class={cn('input-base w-full', form?.error && 'border-danger-9 focus:ring-danger-9')}
          placeholder={translate('auth.placeholder.full_name', data.locale)}
          value={
            form?.fullName ?? ''
          }
          autocomplete="name"
          minlength="2"
          maxlength="100"
          required
        />
      </div>

      <div class="space-y-1">
        <label for="password" class="text-sm font-medium">
          {translate('auth.label.create_password', data.locale)}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          class={cn('input-base w-full', form?.error && 'border-danger-9 focus:ring-danger-9')}
          placeholder="••••••••"
          required
          minlength="8"
          maxlength="128"
          autocomplete="new-password"
        />
      </div>

      <div class="space-y-1">
        <label for="confirmPassword" class="text-sm font-medium">
          {translate('auth.label.confirm_password', data.locale)}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          class={cn('input-base w-full', form?.error && 'border-danger-9 focus:ring-danger-9')}
          placeholder="••••••••"
          required
          minlength="8"
          maxlength="128"
          autocomplete="new-password"
        />
      </div>

      <button
        type="submit"
        class={cn('color-group-primary btn w-full btn-solid', isLoading && 'is-loading')}
        disabled={isLoading}
      >
        {isLoading
          ? translate('fields.please_wait', data.locale)
          : translate('auth.action.sign_up', data.locale)}
      </button>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-primary-10 hover:underline">
          {translate('auth.action.use_different_email', data.locale)}
        </a>
      </div>
    </form>
  </div>
</div>
