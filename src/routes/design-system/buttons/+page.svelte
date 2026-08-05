<script lang="ts">
  import { Save, ArrowRight, X } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<!-- Button Variants -->
<button class="btn btn-solid">Solid</button>
<button class="btn btn-soft">Soft</button>
<button class="btn btn-outlined">Outlined</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Disabled State -->
<button class="btn btn-solid" disabled>Disabled</button>

<!-- Icon Buttons (use 'btn-icon' to make it a perfect square) -->
<button class="btn btn-solid btn-icon" aria-label="Save">
  <Save size={20} />
</button>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Buttons</h1>
  <p class="text-neutral-11">
    Button components utilizing the <code>@utility btn</code> classes, styled automatically by their
    parent's <code>color-group</code>.
  </p>

  <div class="grid grid-cols-2 gap-8">
    <!-- Primary Color Group -->
    <div class="color-group-primary relative overflow-hidden card">
      <!-- Decorative background blur orb to show off the soft glass effect -->
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
      ></div>

      <div class="relative z-10 card-title">Primary Group</div>
      <div class="relative z-10 mt-4 flex flex-col gap-6 card-content">
        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid">Solid</button>
          <button class="btn btn-soft">Soft</button>
          <button class="btn btn-outlined">Outlined</button>
          <button class="btn btn-ghost">Ghost</button>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid" disabled>Disabled</button>
          <button class="btn btn-soft" disabled>Disabled</button>
          <button class="btn btn-outlined" disabled>Disabled</button>
          <button class="btn btn-ghost" disabled>Disabled</button>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid">
            <Save size={20} />
            Save
          </button>
          <button class="btn btn-soft">
            Next
            <ArrowRight size={20} />
          </button>
          <button class="btn btn-icon btn-outlined" aria-label="Close">
            <X size={20} />
          </button>
          <button class="btn btn-icon btn-ghost" aria-label="Cancel">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>

    <!-- Danger Color Group -->
    <div class="color-group-danger relative overflow-hidden card">
      <!-- Decorative background blur orb to show off the soft glass effect -->
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
      ></div>

      <div class="relative z-10 card-title">Danger Group</div>
      <div class="relative z-10 mt-4 flex flex-col gap-6 card-content">
        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid">Solid</button>
          <button class="btn btn-soft">Soft</button>
          <button class="btn btn-outlined">Outlined</button>
          <button class="btn btn-ghost">Ghost</button>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid" disabled>Disabled</button>
          <button class="btn btn-soft" disabled>Disabled</button>
          <button class="btn btn-outlined" disabled>Disabled</button>
          <button class="btn btn-ghost" disabled>Disabled</button>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <button class="btn btn-solid">
            <Save size={20} />
            Save
          </button>
          <button class="btn btn-soft">
            Next
            <ArrowRight size={20} />
          </button>
          <button class="btn btn-icon btn-outlined" aria-label="Close">
            <X size={20} />
          </button>
          <button class="btn btn-icon btn-ghost" aria-label="Cancel">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="buttons.html" code={usageCode} lang="html" />
  </div>
</div>
