<script lang="ts">
  import { enhance } from '$app/forms';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let { data, form } = $props();
  let isLoading = $state(false);
</script>

<div class="flex w-full flex-col items-center justify-center space-y-6">
  <div class="relative mb-2 flex w-full items-center justify-center">
    <a
      href="/"
      class="text-muted-foreground hover:text-foreground btn absolute left-0 btn-icon btn-ghost"
      aria-label={translate('auth.action.use_different_identity', data.locale)}
    >
      <span class="icon-[lucide--arrow-left] icon-lg"></span>
    </a>

    <div
      class="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full"
    >
      <span class="icon-[lucide--user] icon-xl"></span>
    </div>
  </div>

  <div class="text-center">
    <h1 class="text-2xl font-bold">{translate('auth.title.welcome_back', data.locale)}</h1>
    <div
      class="border-border text-muted-foreground mt-4 inline-flex items-center rounded-full border px-4 py-1.5 text-sm"
    >
      {data.identifier}
    </div>
  </div>

  <div class="mt-6 w-full">
    {#if data.hasPasskey}
      <!-- The WebAuthn action is added with the passkey authentication flow. -->
      <button type="button" class="color-group-primary btn w-full btn-solid">
        <span class="mr-2 icon-[lucide--fingerprint] icon-lg"></span>
        {translate('auth.action.sign_in_with_passkey', data.locale)}
      </button>

      <div class="relative flex items-center py-5">
        <div class="border-border flex-grow border-t"></div>
        <span class="text-muted-foreground mx-4 flex-shrink-0 text-xs">
          {translate('auth.connective.or_use_password', data.locale)}
        </span>
        <div class="border-border flex-grow border-t"></div>
      </div>
    {/if}

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
              title: translate('auth.title.sign_in_failed', data.locale),
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
        <label for="password" class="text-sm font-medium">
          {translate('auth.label.password', data.locale)}
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
            required
          />
        </div>
      </div>

      <div class="mb-6 flex justify-start">
        <button type="button" class="text-muted-foreground hover:text-foreground text-xs">
          {translate('auth.action.forgot_password', data.locale)}
        </button>
      </div>

      <button
        type="submit"
        class={cn('color-group-primary btn w-full btn-solid', isLoading && 'is-loading')}
        disabled={isLoading}
      >
        {isLoading
          ? translate('fields.please_wait', data.locale)
          : translate('auth.action.sign_in', data.locale)}
      </button>
    </form>
  </div>
</div>
