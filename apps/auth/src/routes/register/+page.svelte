<script lang="ts">
  import AuthCardHeader from '$lib/components/AuthCardHeader.svelte';
  import { enhance } from '$app/forms';
  import { addToast } from '$lib/components/AuthMessageDrawer.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
  let isResending = $state(false);
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <AuthCardHeader
    title={translate('auth.title.create_account', data.locale)}
    identifier={data.identifier}
    backHref="/?restart=1"
    backLabel={translate('auth.action.use_different_email', data.locale)}
  />

  <div class="w-full">
    <p class="text-muted-foreground mb-4 text-sm">
      {translate('auth.description.registration_code', data.locale)}
    </p>
    {#if form?.sent}
      <p class="mb-4 text-sm">
        {translate('auth.description.registration_code_sent', data.locale)}
      </p>
    {/if}

    <form
      action="?/register"
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          let errorMessage: string | undefined;

          if (result.type === 'failure' && typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (result.type === 'error') {
            errorMessage = translate('error.auth.registration.failed', data.locale);
          }

          if (errorMessage) {
            addToast({
              title: translate('auth.title.registration_failed', data.locale),
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
      <fieldset disabled={isLoading || isResending} class="w-full min-w-0 space-y-4">
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
          class={cn('btn w-full btn-solid color-group-primary', isLoading && 'is-loading')}
          disabled={isLoading}
        >
          {isLoading
            ? translate('fields.please_wait', data.locale)
            : translate('auth.action.sign_up', data.locale)}
        </button>
      </fieldset>
    </form>
    <form
      action="?/resend"
      method="POST"
      class="mt-4 text-center"
      use:enhance={() => {
        isResending = true;
        return async ({ update }) => {
          try {
            await update({ reset: false });
          } finally {
            isResending = false;
          }
        };
      }}
    >
      <button
        type="submit"
        disabled={isResending || isLoading}
        class="cursor-pointer text-sm link hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >{translate('auth.action.resend_code', data.locale)}</button
      >
    </form>
  </div>
</div>
