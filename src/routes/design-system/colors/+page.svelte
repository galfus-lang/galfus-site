<script lang="ts">
  import { getColorGroupClass, getGroupBg, COLORS } from '$lib/utils/color';
  const levels = Array.from({ length: 12 }, (_, i) => i + 1);
</script>

<div class="flex flex-col gap-12">
  <div>
    <h1 class="mb-2 text-3xl font-bold">Colors</h1>
    <p class="text-neutral-11">The comprehensive color scales defined in our design system.</p>
  </div>

  {#each COLORS as color}
    <div class={getColorGroupClass(color)}>
      <h2 class="text-group-12 mb-4 text-xl font-bold capitalize">{color}</h2>
      <div class="flex flex-wrap gap-4">
        {#each levels as num}
          <div class="flex flex-col items-center">
            <div
              class="border-group-5 h-16 w-16 rounded-md border shadow-sm {getGroupBg(num)}"
            ></div>
            <span class="text-group-11 mt-2 font-mono text-xs">{num}</span>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
