<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import { buildSelect } from '$lib/attachments/select.svelte';
  import Code from '$lib/components/ui/Code.svelte';
  
  const usageCode = `<script>
  import { buildSelect } from '$lib/attachments/select.svelte';
  
  const mySelect = buildSelect();
  let selectedValue = $state('Option 1');
</script>

<label class="block">
  <span class="input-label">Custom Select</span>
  <div class="input-group">
    <!-- Trigger -->
    <input
      {@attach mySelect.trigger}
      value={selectedValue}
      class="input-base cursor-pointer"
    />
    <div class="input-icon">
      <ChevronDown size={18} />
    </div>
  </div>
</label>

<!-- Popover Menu -->
<ul {@attach mySelect.popover} class="select-popover">
  <li>
    <button type="button" {@attach mySelect.item} onclick={() => selectedValue = 'Option 1'} class="select-item">
      Option 1
    </button>
  </li>
  <li>
    <button type="button" {@attach mySelect.item} onclick={() => selectedValue = 'Option 2'} class="select-item">
      Option 2
    </button>
  </li>
</ul>`;

  // Create attachment builders for our two selects
  const primarySelect = buildSelect();
  const magentaSelect = buildSelect();

  // State
  let primaryValue = $state('Option 1: The Flame');
  let magentaValue = $state('Module B');
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Select (Attachment)</h1>
  <p class="text-neutral-11">
    A custom Select built entirely natively without heavy components. Using the **Builder Pattern**
    with Svelte 5 <code>@attach</code>, a readonly <code>&lt;input&gt;</code> acts as the trigger
    and a
    <code>&lt;ul&gt;</code> popover acts as the menu.
  </p>

  <div class="grid grid-cols-2 gap-8">
    <div class="color-group-primary relative overflow-hidden card">
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
      ></div>

      <div class="relative z-10">
        <label class="block">
          <span class="input-label text-group-12">Primary Select</span>

          <div class="input-group max-w-xs">
            <!-- The Input Trigger -->
            <input
              {@attach primarySelect.trigger}
              value={primaryValue}
              class="input-base cursor-pointer"
            />
            <div class="input-icon">
              <ChevronDown size={18} />
            </div>
          </div>
        </label>

        <!-- The Custom Popover List -->
        <ul {@attach primarySelect.popover} class="select-popover">
          <li>
            <button
              type="button"
              {@attach primarySelect.item}
              onclick={() => (primaryValue = 'Option 1: The Flame')}
              class="select-item"
            >
              Option 1: The Flame
            </button>
          </li>
          <li>
            <button
              type="button"
              {@attach primarySelect.item}
              onclick={() => (primaryValue = 'Option 2: The Graph')}
              class="select-item"
            >
              Option 2: The Graph
            </button>
          </li>
          <li>
            <button
              type="button"
              {@attach primarySelect.item}
              onclick={() => (primaryValue = 'Option 3: The Wisp')}
              class="select-item"
            >
              Option 3: The Wisp
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="color-group-magenta relative overflow-hidden card">
      <div
        class="bg-group-9 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
      ></div>

      <div class="relative z-10">
        <label class="block">
          <span class="input-label text-group-12">Magenta Select</span>

          <div class="input-group max-w-xs">
            <!-- The Input Trigger -->
            <input
              {@attach magentaSelect.trigger}
              value={magentaValue}
              class="input-base cursor-pointer"
            />
            <div class="input-icon">
              <ChevronDown size={18} />
            </div>
          </div>
        </label>

        <!-- The Custom Popover List -->
        <ul {@attach magentaSelect.popover} class="select-popover">
          <li>
            <button
              type="button"
              {@attach magentaSelect.item}
              onclick={() => (magentaValue = 'Module A')}
              class="select-item"
            >
              Module A
            </button>
          </li>
          <li>
            <button
              type="button"
              {@attach magentaSelect.item}
              onclick={() => (magentaValue = 'Module B')}
              class="select-item"
            >
              Module B
            </button>
          </li>
          <li>
            <button
              type="button"
              {@attach magentaSelect.item}
              onclick={() => (magentaValue = 'Module C')}
              class="select-item"
            >
              Module C
            </button>
          </li>
          <li>
            <button
              type="button"
              {@attach magentaSelect.item}
              onclick={() => (magentaValue = 'Module D')}
              class="select-item"
            >
              Module D
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="select-attach.svelte" code={usageCode} lang="svelte" />
  </div>
</div>
