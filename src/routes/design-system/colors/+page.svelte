<script lang="ts">
  import { COLORS } from '$lib/styles/plugins/common';
  const levels = Array.from({ length: 12 }, (_, i) => i + 1);

  function getColorGroupClass(color: string) {
    switch (color) {
      case 'primary':
        return 'color-group-primary';
      case 'neutral':
        return 'color-group-neutral';
      case 'danger':
        return 'color-group-danger';
      case 'success':
        return 'color-group-success';
      case 'warning':
        return 'color-group-warning';
      case 'blue':
        return 'color-group-blue';
      case 'gray':
        return 'color-group-gray';
      case 'green':
        return 'color-group-green';
      case 'magenta':
        return 'color-group-magenta';
      case 'orange':
        return 'color-group-orange';
      case 'pink':
        return 'color-group-pink';
      case 'red':
        return 'color-group-red';
      case 'violet':
        return 'color-group-violet';
      case 'yellow':
        return 'color-group-yellow';
      default:
        return 'color-group-neutral';
    }
  }

  function getGroupBg(num: number) {
    switch (num) {
      case 1:
        return 'bg-group-1';
      case 2:
        return 'bg-group-2';
      case 3:
        return 'bg-group-3';
      case 4:
        return 'bg-group-4';
      case 5:
        return 'bg-group-5';
      case 6:
        return 'bg-group-6';
      case 7:
        return 'bg-group-7';
      case 8:
        return 'bg-group-8';
      case 9:
        return 'bg-group-9';
      case 10:
        return 'bg-group-10';
      case 11:
        return 'bg-group-11';
      case 12:
        return 'bg-group-12';
      default:
        return 'bg-group-1';
    }
  }
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
