<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<div role="alert" class="alert color-group-danger">
  <div>
    <div class="alert-title">Error</div>
    <div class="alert-description">Something went wrong while connecting to the server.</div>
  </div>
</div>

<div role="alert" class="alert color-group-success">
  <div>
    <div class="alert-title">Success</div>
    <div class="alert-description">Your profile has been updated successfully.</div>
  </div>
</div>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Alert</h1>
  <p class="text-neutral-11">Important feedback using <code>&lt;div role="alert"&gt;</code> and <code>@utility alert-*</code> classes.</p>

  <div class="card flex flex-col gap-4">
    <div role="alert" class="alert color-group-danger">
      <div>
        <div class="alert-title">Error</div>
        <div class="alert-description">Something went wrong while connecting to the server.</div>
      </div>
    </div>

    <div role="alert" class="alert color-group-success">
      <div>
        <div class="alert-title">Success</div>
        <div class="alert-description">Your profile has been updated successfully.</div>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="alert.html" code={usageCode} lang="html" />
  </div>
</div>
