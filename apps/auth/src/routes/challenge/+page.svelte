<script lang="ts">
  import { page } from '$app/state';

  let hint = $derived(page.url.searchParams.get('hint') || 'unknown@galfus.com');
  let password = $state('');

  // Mocked state to decide whether to show Passkey prompt
  let hasPasskey = $state(true);
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <div class="flex w-full items-center justify-between">
    <a href="/" class="btn btn-icon btn-ghost" aria-label="Back">
      <span class="icon-[lucide--arrow-left] text-[20px]"></span>
    </a>
    <div
      class="bg-primary/10 text-primary avatar flex h-12 w-12 items-center justify-center rounded-full font-bold"
    >
      <span class="icon-[lucide--user] text-[24px]"></span>
    </div>
    <div class="w-10"></div>
    <!-- Spacer for centering -->
  </div>

  <div class="text-center">
    <h1 class="text-2xl font-bold">Welcome back</h1>
    <div
      class="border-border bg-muted/30 text-muted-foreground mt-2 inline-flex items-center rounded-full border px-3 py-1 text-sm"
    >
      {hint}
    </div>
  </div>

  <div class="w-full space-y-4">
    {#if hasPasskey}
      <button class="color-group-primary btn w-full btn-solid py-4 text-base">
        <span class="icon-[lucide--fingerprint] text-[20px]"></span>
        Sign in with Passkey
      </button>

      <div class="relative my-4 flex items-center py-2">
        <div class="border-border flex-grow border-t"></div>
        <span class="bg-card text-muted-foreground px-2 text-xs">or use password</span>
        <div class="border-border flex-grow border-t"></div>
      </div>
    {/if}

    <form action="/mfa" class="space-y-4">
      <!-- Hidden input to pass hint forward -->
      <input type="hidden" name="hint" value={hint} />

      <div class="space-y-1">
        <label for="password" class="text-sm font-medium">Password</label>
        <div class="relative">
          <div class="text-muted-foreground absolute inset-y-0 left-0 flex items-center pl-3">
            <span class="icon-[lucide--key-round] text-[16px]"></span>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            class="input-base w-full pl-10"
            placeholder="••••••••"
            required
            autofocus={!hasPasskey}
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <a href="#" class="text-primary text-xs font-medium hover:underline">Forgot password?</a>
      </div>

      <button type="submit" class="color-group-primary btn w-full btn-solid"> Continue </button>
    </form>
  </div>
</div>
