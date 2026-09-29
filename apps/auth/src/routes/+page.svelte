<script lang="ts">
  import Brand from '@galfus/design-system/components/svg/Brand.svelte';

  // Mocked state for testing
  let savedAccounts = $state([{ identifier: 'morbden@galfus.com', displayName: 'Morbden' }]);
  let email = $state('');
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <Brand class="text-primary h-12 w-auto fill-current" />

  <div class="text-center">
    <h1 class="text-2xl font-bold">Sign in to Galfus</h1>
    <p class="text-muted-foreground mt-2 text-sm">Enter your details to continue</p>
  </div>

  <div class="w-full space-y-4">
    {#if savedAccounts.length > 0}
      <div class="space-y-2">
        <p class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Recent Accounts
        </p>
        {#each savedAccounts as account}
          <a
            href="/challenge?hint={account.identifier}"
            class="btn h-auto w-full btn-outlined justify-start gap-4 py-3 text-left"
          >
            <div
              class="bg-group-4 text-group-11 avatar flex h-10 w-10 items-center justify-center rounded-full font-bold"
            >
              {account.displayName.charAt(0)}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-semibold">{account.displayName}</span>
              <span class="text-muted-foreground text-xs">{account.identifier}</span>
            </div>
          </a>
        {/each}
      </div>

      <div class="relative my-4 flex items-center py-2">
        <div class="border-border grow border-t"></div>
        <span class="bg-card text-muted-foreground px-2 text-xs">or use another</span>
        <div class="border-border grow border-t"></div>
      </div>
    {/if}

    <form action="/challenge" class="space-y-4">
      <div class="space-y-1">
        <label for="email" class="text-sm font-medium">Email or Username</label>
        <input
          id="email"
          name="hint"
          type="text"
          class="input-base w-full"
          placeholder="morbden@galfus.com"
          required
        />
      </div>

      <button type="submit" class="color-group-primary btn w-full btn-solid"> Continue </button>
    </form>

    <div class="relative my-4 flex items-center py-2">
      <div class="border-border grow border-t"></div>
      <span class="bg-card text-muted-foreground px-2 text-xs">or continue with</span>
      <div class="border-border grow border-t"></div>
    </div>

    <div class="flex flex-col gap-2">
      <button type="button" class="btn w-full btn-outlined">
        <span class="mr-2 icon-[simple-icons--google] text-[20px]"></span>
        Google
      </button>
      <button type="button" class="btn w-full btn-outlined">
        <span class="mr-2 icon-[simple-icons--github] text-[20px]"></span>
        GitHub
      </button>
    </div>
  </div>
</div>
