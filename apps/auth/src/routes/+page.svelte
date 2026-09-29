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
            class="border-border hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-3 transition-colors"
          >
            <div
              class="bg-primary/10 text-primary avatar flex h-10 w-10 items-center justify-center rounded-full font-bold"
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
        <div class="border-border flex-grow border-t"></div>
        <span class="bg-card text-muted-foreground px-2 text-xs">or use another</span>
        <div class="border-border flex-grow border-t"></div>
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
          bind:value={email}
          required
        />
      </div>

      <button type="submit" class="color-group-primary btn w-full btn-solid"> Continue </button>
    </form>

    <div class="relative my-4 flex items-center py-2">
      <div class="border-border flex-grow border-t"></div>
      <span class="bg-card text-muted-foreground px-2 text-xs">or continue with</span>
      <div class="border-border flex-grow border-t"></div>
    </div>

    <div class="flex flex-col gap-2">
      <button type="button" class="btn w-full btn-outlined">
        <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        Google
      </button>
      <button type="button" class="btn w-full btn-outlined">
        <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
        GitHub
      </button>
    </div>
  </div>
</div>
