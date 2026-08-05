<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<!-- Image Avatar -->
<picture>
  <source srcset="https://i.pravatar.cc/150?u=1" type="image/jpeg">
  <img src="https://i.pravatar.cc/150?u=1" alt="User avatar" class="avatar" />
</picture>

<!-- Initials Avatar -->
<div class="avatar color-group-primary">
  AB
</div>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Avatar</h1>
  <p class="text-neutral-11">
    A visual representation of a user, using <code>&lt;picture&gt;</code> and
    <code>&lt;img&gt;</code>
    natively with the <code>@utility avatar</code>.
  </p>

  <div class="flex gap-4 card">
    <picture>
      <source srcset="https://i.pravatar.cc/150?u=1" type="image/jpeg" />
      <img src="https://i.pravatar.cc/150?u=1" alt="User avatar" class="avatar" />
    </picture>

    <div class="color-group-primary avatar">AB</div>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="avatar.html" code={usageCode} lang="html" />
  </div>
</div>
