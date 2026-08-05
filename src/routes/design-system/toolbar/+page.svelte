<script lang="ts">
  import { Bold, Italic, Underline, AlignLeft, AlignCenter } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<menu role="toolbar" aria-label="Text Formatting" class="toolbar">
  <li>
    <button type="button" class="btn btn-ghost btn-icon color-group-neutral" aria-label="Bold">
      <Bold size={18} />
    </button>
  </li>
  <li>
    <button type="button" class="btn btn-ghost btn-icon color-group-neutral" aria-label="Italic">
      <Italic size={18} />
    </button>
  </li>
  <li>
    <button type="button" class="btn btn-ghost btn-icon color-group-neutral" aria-label="Underline">
      <Underline size={18} />
    </button>
  </li>
  <li aria-hidden="true" class="toolbar-divider"></li>
  <li>
    <button type="button" class="btn btn-ghost btn-icon color-group-neutral" aria-label="Align Left">
      <AlignLeft size={18} />
    </button>
  </li>
  <li>
    <button type="button" class="btn btn-ghost btn-icon color-group-neutral" aria-label="Align Center">
      <AlignCenter size={18} />
    </button>
  </li>
</menu>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Toolbar</h1>
  <p class="text-neutral-11">
    A grouping of controls using <code>&lt;menu role="toolbar"&gt;</code> with
    <code>@utility toolbar-*</code> classes.
  </p>

  <div class="rounded-md border border-neutral-4 bg-neutral-2 p-4">
    <menu role="toolbar" aria-label="Text Formatting" class="toolbar">
      <li>
        <button type="button" class="color-group-neutral btn btn-icon btn-ghost" aria-label="Bold">
          <Bold size={18} />
        </button>
      </li>
      <li>
        <button
          type="button"
          class="color-group-neutral btn btn-icon btn-ghost"
          aria-label="Italic"
        >
          <Italic size={18} />
        </button>
      </li>
      <li>
        <button
          type="button"
          class="color-group-neutral btn btn-icon btn-ghost"
          aria-label="Underline"
        >
          <Underline size={18} />
        </button>
      </li>
      <li aria-hidden="true" class="toolbar-divider"></li>
      <li>
        <button
          type="button"
          class="color-group-neutral btn btn-icon btn-ghost"
          aria-label="Align Left"
        >
          <AlignLeft size={18} />
        </button>
      </li>
      <li>
        <button
          type="button"
          class="color-group-neutral btn btn-icon btn-ghost"
          aria-label="Align Center"
        >
          <AlignCenter size={18} />
        </button>
      </li>
    </menu>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="toolbar.html" code={usageCode} lang="html" />
  </div>
</div>
