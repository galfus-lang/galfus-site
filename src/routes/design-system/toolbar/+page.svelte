<script lang="ts">
  import { Bold, Italic, Underline, AlignLeft, AlignCenter } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Toolbar</h1>
  <p class="text-neutral-11">A grouping of controls using <code>&lt;menu role="toolbar"&gt;</code>.</p>

  <div class="border border-neutral-4 rounded-md p-4 bg-neutral-2">
    <menu role="toolbar" aria-label="Text Formatting" class="flex items-center gap-1 m-0 p-1.5 bg-neutral-1 border border-neutral-4 rounded-md w-max">
      <li>
        <button type="button" class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Bold">
          <Bold size={18} />
        </button>
      </li>
      <li>
        <button type="button" class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Italic">
          <Italic size={18} />
        </button>
      </li>
      <li>
        <button type="button" class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Underline">
          <Underline size={18} />
        </button>
      </li>
      <li aria-hidden="true" class="w-px h-5 bg-neutral-5 mx-1"></li>
      <li>
        <button type="button" class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Align Left">
          <AlignLeft size={18} />
        </button>
      </li>
      <li>
        <button type="button" class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Align Center">
          <AlignCenter size={18} />
        </button>
      </li>
    </menu>
  </div>
</div>
