export const usageCode = `<script>
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
