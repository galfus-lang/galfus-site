<script lang="ts">
  import { page } from '$app/state';
  import { ShieldCheck, ArrowLeft } from 'lucide-svelte';

  let hint = $derived(page.url.searchParams.get('hint') || 'unknown@galfus.com');
  let otp = $state('');
</script>

<div class="flex flex-col items-center justify-center space-y-6">
  <div class="flex w-full items-center justify-between">
    <button onclick={() => history.back()} class="btn btn-icon btn-ghost" aria-label="Back">
      <ArrowLeft size={20} />
    </button>
    <div
      class="bg-primary/10 text-primary avatar flex h-12 w-12 items-center justify-center rounded-full font-bold"
    >
      <ShieldCheck size={24} />
    </div>
    <div class="w-10"></div>
    <!-- Spacer for centering -->
  </div>

  <div class="text-center">
    <h1 class="text-2xl font-bold">Two-step verification</h1>
    <p class="text-muted-foreground mt-2 text-sm">
      Enter the 6-digit code from your authenticator app.
    </p>
  </div>

  <div class="w-full space-y-4">
    <form action="#" class="space-y-6">
      <div class="space-y-2 text-center">
        <!-- A simple large input for the OTP -->
        <input
          id="otp"
          name="otp"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          autocomplete="one-time-code"
          class="placeholder:text-muted-foreground/30 mx-auto input-base w-40 text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal"
          placeholder="000000"
          bind:value={otp}
          required
          autofocus
        />
      </div>

      <button type="submit" class="color-group-primary btn w-full btn-solid"> Verify </button>
    </form>

    <div class="pt-4 text-center">
      <button class="btn btn-ghost text-sm"> Try another way </button>
    </div>
  </div>
</div>
