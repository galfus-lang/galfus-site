<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<article class="card">
  <header class="card-title">Card Title</header>
  <div class="card-content">
    <p>This is the content of the card.</p>
  </div>
  <footer class="card-footer">
    <button class="btn btn-outlined color-group-neutral">Cancel</button>
    <button class="btn btn-solid color-group-primary">Save</button>
  </footer>
</article>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Card</h1>
  <p class="text-neutral-11">
    A container for related content, semantically an <code>&lt;article&gt;</code> or
    <code>&lt;section&gt;</code>
    with <code>@utility card-*</code> classes.
  </p>

  <article class="card max-w-sm">
    <header class="card-title">Card Title</header>
    <div class="card-content">
      <p>
        This is the content of the card. It's marked up as an article since it represents an
        independent piece of content.
      </p>
    </div>
    <footer class="card-footer">
      <button class="color-group-neutral btn btn-outlined">Cancel</button>
      <button class="color-group-primary btn btn-solid">Save</button>
    </footer>
  </article>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="card.html" code={usageCode} lang="html" />
  </div>
</div>
