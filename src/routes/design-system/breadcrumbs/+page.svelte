<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs">
    <li>
      <a href="#" class="breadcrumb-link">Home</a>
    </li>
    <li aria-hidden="true">/</li>
    <li>
      <a href="#" class="breadcrumb-link">Design System</a>
    </li>
    <li aria-hidden="true">/</li>
    <li aria-current="page" class="breadcrumb-active">
      Breadcrumbs
    </li>
  </ol>
</nav>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Breadcrumbs</h1>
  <p class="text-neutral-11">
    A navigation trail using <code>&lt;nav aria-label="Breadcrumb"&gt;</code> and
    <code>&lt;ol&gt;</code>
    styled with <code>@utility breadcrumb-*</code> classes.
  </p>

  <div class="card">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumbs">
        <li>
          <a href="#" class="breadcrumb-link">Home</a>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <a href="#" class="breadcrumb-link">Design System</a>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="breadcrumb-active">Breadcrumbs</li>
      </ol>
    </nav>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="breadcrumbs.html" code={usageCode} lang="html" />
  </div>
</div>
