<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Accordion</h1>
  <p class="text-neutral-11">An expandable list built with the incredibly powerful, JS-free native <code>&lt;details&gt;</code> and <code>&lt;summary&gt;</code> tags.</p>

  <div class="card max-w-lg">
    <details class="group border-b border-neutral-4 last:border-0">
      <summary class="cursor-pointer font-medium py-3 outline-none flex justify-between items-center group-open:text-primary-9">
        Is this accessible by default?
        <span class="transition-transform group-open:rotate-180">↓</span>
      </summary>
      <div class="pb-3 text-neutral-11 text-sm">
        Yes! Because it uses native HTML details/summary, it is fully accessible to screen readers and keyboard navigation out of the box.
      </div>
    </details>

    <details class="group border-b border-neutral-4 last:border-0">
      <summary class="cursor-pointer font-medium py-3 outline-none flex justify-between items-center group-open:text-primary-9">
        Can I style the marker?
        <span class="transition-transform group-open:rotate-180">↓</span>
      </summary>
      <div class="pb-3 text-neutral-11 text-sm">
        Yes, you can use the ::marker pseudo-element or simply hide it and use a custom span (like the arrow here).
      </div>
    </details>
  </div>
</div>
