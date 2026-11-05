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
    <p class="text-muted-foreground mb-4 text-sm">
      {translate('auth.description.registration_code', data.locale)}
    </p>
    {#if !form?.sent && data.delivery === 'failed'}
      <p class="mb-4 text-sm text-danger-9">
        {translate('error.auth.registration.delivery_failed', data.locale)}
      </p>
    {:else if !form?.sent && data.delivery === 'limited'}
      <p class="mb-4 text-sm text-danger-9">
        {translate('error.auth.registration.resend_limited', data.locale)}
      </p>
    {/if}
    {#if form?.sent}
      <p class="mb-4 text-sm">
        {translate('auth.description.registration_code_sent', data.locale)}
      </p>
    {/if}
    {#if form?.error}
      <div
        class="mb-4 rounded-lg border border-danger-9/30 bg-danger-1/10 p-3 text-xs font-medium text-danger-9"
      >
        {form.error}
      </div>
    {/if}

    <form
      action="?/register"
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          isLoading = false;
          let errorMessage: string | undefined;

          if (result.type === 'failure' && typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (result.type === 'error') {
            errorMessage =
              typeof result.error === 'object' && result.error && 'message' in result.error
                ? String(result.error.message)
                : translate('auth.title.registration_failed', data.locale);
          }

          if (errorMessage) {
            addToast({
              title: translate('auth.title.registration_failed', data.locale),
              description: errorMessage,
              type: 'error',
              duration: 6000,
            });
          }
          await update();
        };
      }}
      class="space-y-4"
    >
      <div class="space-y-1">
        <label for="code" class="text-sm font-medium"
          >{translate('auth.label.registration_code', data.locale)}</label
        >
        <input
          id="code"
          name="code"
          type="text"
          inputmode="numeric"
          pattern={'[0-9]{6}'}
          minlength="6"
          maxlength="6"
          autocomplete="one-time-code"
          class="input-base w-full"
          required
        />
      </div>
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
          value={form?.fullName ?? ''}
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
    </form>
    <form action="?/resend" method="POST" class="mt-4 text-center">
      <button type="submit" class="text-sm text-primary-10 hover:underline"
        >{translate('auth.action.resend_code', data.locale)}</button
      >
    </form>
    <div class="mt-4 text-center">
      <a href="/?restart=1" class="text-sm text-primary-10 hover:underline"
        >{translate('auth.action.use_different_email', data.locale)}</a
      >
    </div>
  </div>
</div>
