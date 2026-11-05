<script lang="ts">
  import { enhance } from '$app/forms';
  import { addToast } from '@galfus/design-system/components/ToastSystem.svelte';
  import Brand from '@galfus/design-system/components/svg/Brand.svelte';
  import { cn } from '@galfus/design-system/utils/cn';
  import { translate } from '@galfus/i18n';

  let isLoading = $state(false);
  let { data, form } = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <Brand class="text-primary h-12 w-auto fill-current" />

  <div class="text-center">
    <h1 class="text-2xl font-bold">{translate('auth.title.recover', data.locale)}</h1>
    <p class="text-muted-foreground mt-2 text-sm">
      {translate('auth.description.recover', data.locale)}
    </p>
  </div>

  <div class="w-full space-y-4">
    {#if form?.success}
      <div class="bg-primary/10 border-primary/20 text-foreground rounded-lg border p-4 text-sm">
        <p class="font-medium">{translate('auth.description.recover_sent', data.locale)}</p>
      </div>

      <a href="/" class="btn w-full btn-outlined">
        {translate('auth.action.back_to_sign_in', data.locale)}
      </a>
    {:else}
      {#if form?.error}
        <div
          class="rounded-lg border border-danger-9/30 bg-danger-1/10 p-3 text-xs font-medium text-danger-9"
        >
          {form.error}
        </div>
      {/if}

      <form
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
                  : translate('auth.title.sign_in_failed', data.locale);
            }

            if (errorMessage) {
              addToast({
                title: translate('auth.title.sign_in_failed', data.locale),
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
          <label for="identifier" class="text-sm font-medium">
            {translate('auth.label.identity', data.locale)}
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            class={cn('input-base w-full', form?.error && 'border-danger-9 focus:ring-danger-9')}
            placeholder={translate('auth.placeholder.identity', data.locale)}
            value={form?.identifier ?? ''}
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
          />
        </div>

        <button
          type="submit"
          class={cn('btn w-full btn-solid color-group-primary', isLoading && 'is-loading')}
          disabled={isLoading}
        >
          {isLoading
            ? translate('fields.please_wait', data.locale)
            : translate('auth.action.send_instructions', data.locale)}
        </button>

        <div class="text-center">
          <a href="/" class="text-muted-foreground hover:text-foreground text-xs">
            {translate('auth.action.back_to_sign_in', data.locale)}
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
