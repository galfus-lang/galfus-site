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
    <h1 class="text-2xl font-bold">{translate('auth.title.sign_in', data.locale)}</h1>
    <p class="text-muted-foreground mt-2 text-sm">
      {translate('auth.description.sign_in', data.locale)}
    </p>
  </div>

  <div class="w-full space-y-4">
    <form
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          isLoading = false;
          if (result.type === 'failure' && result.data?.error) {
            addToast({
              title: translate('auth.title.identity_failed', data.locale),
              description: result.data.error as string,
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
        class={cn('color-group-primary btn w-full btn-solid', isLoading && 'is-loading')}
        disabled={isLoading}
      >
        {isLoading
          ? translate('fields.please_wait', data.locale)
          : translate('fields.continue', data.locale)}
      </button>
    </form>

    <!-- Temporarily hidden for later implementation -->
    {#if false}
      <div class="relative my-4 flex items-center py-2">
        <div class="border-border grow border-t"></div>
        <span class="bg-card text-muted-foreground px-2 text-xs">
          {translate('auth.connective.or_continue_with', data.locale)}
        </span>
        <div class="border-border grow border-t"></div>
      </div>

      <div class="flex flex-col gap-2">
        <button type="button" class="btn w-full btn-outlined">
          <span class="mr-2 icon-[simple-icons--google] icon-lg"></span>
          Google
        </button>
        <button type="button" class="btn w-full btn-outlined">
          <span class="mr-2 icon-[simple-icons--github] icon-lg"></span>
          GitHub
        </button>
      </div>
    {/if}
  </div>
</div>
