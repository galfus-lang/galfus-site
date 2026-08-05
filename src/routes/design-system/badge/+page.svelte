<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<!-- Inline Badge -->
<span class="badge color-group-primary">
  Active
</span>

<!-- Notification Badge (Superscript) -->
<button class="relative btn btn-neutral">
  Notifications
  <sup class="badge-indicator color-group-danger">
    3
  </sup>
</button>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Badge</h1>
  <p class="text-neutral-11">
    A small indicator using <code>&lt;span&gt;</code> or <code>&lt;sup&gt;</code> with the
    <code>@utility badge</code>.
  </p>

  <div class="flex items-center gap-6 card">
    <div class="flex items-center gap-2">
      <span class="font-bold">Status:</span>
      <span class="color-group-primary badge"> Active </span>
    </div>

    <button class="btn-neutral btn relative">
      Notifications
      <sup class="color-group-danger badge-indicator"> 3 </sup>
    </button>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="badge.html" code={usageCode} lang="html" />
  </div>
</div>
