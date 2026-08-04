<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<details class="accordion group">
  <summary class="accordion-trigger">
    Is this accessible by default?
    <span class="accordion-icon"><ChevronDown size={18} /></span>
  </summary>
  <div class="accordion-content">
    Yes! Because it uses native HTML details/summary, it is fully accessible out of the box.
  </div>
</details>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Accordion</h1>
  <p class="text-neutral-11">An expandable list built with the incredibly powerful, JS-free native <code>&lt;details&gt;</code> and <code>&lt;summary&gt;</code> tags using the <code>@utility accordion</code>.</p>

  <div class="card max-w-lg">
    <details class="accordion group">
      <summary class="accordion-trigger">
        Is this accessible by default?
        <span class="accordion-icon"><ChevronDown size={18} /></span>
      </summary>
      <div class="accordion-content">
        Yes! Because it uses native HTML details/summary, it is fully accessible to screen readers and keyboard navigation out of the box.
      </div>
    </details>

    <details class="accordion group">
      <summary class="accordion-trigger">
        Can I style the marker?
        <span class="accordion-icon"><ChevronDown size={18} /></span>
      </summary>
      <div class="accordion-content">
        Yes, you can use the ::marker pseudo-element or simply hide it and use a custom span (like the arrow here).
      </div>
    </details>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="accordion.html" code={usageCode} lang="html" />
  </div>
</div>
