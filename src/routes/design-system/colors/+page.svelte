<script lang="ts">
  const primaryColors = Array.from({length: 12}, (_, i) => i + 1);
  const neutralColors = Array.from({length: 12}, (_, i) => i + 1);

  function getPrimaryBg(num: number) {
    switch(num) {
      case 1: return 'bg-primary-1';
      case 2: return 'bg-primary-2';
      case 3: return 'bg-primary-3';
      case 4: return 'bg-primary-4';
      case 5: return 'bg-primary-5';
      case 6: return 'bg-primary-6';
      case 7: return 'bg-primary-7';
      case 8: return 'bg-primary-8';
      case 9: return 'bg-primary-9';
      case 10: return 'bg-primary-10';
      case 11: return 'bg-primary-11';
      case 12: return 'bg-primary-12';
      default: return 'bg-primary-1';
    }
  }

  function getNeutralBg(num: number) {
    switch(num) {
      case 1: return 'bg-neutral-1';
      case 2: return 'bg-neutral-2';
      case 3: return 'bg-neutral-3';
      case 4: return 'bg-neutral-4';
      case 5: return 'bg-neutral-5';
      case 6: return 'bg-neutral-6';
      case 7: return 'bg-neutral-7';
      case 8: return 'bg-neutral-8';
      case 9: return 'bg-neutral-9';
      case 10: return 'bg-neutral-10';
      case 11: return 'bg-neutral-11';
      case 12: return 'bg-neutral-12';
      default: return 'bg-neutral-1';
    }
  }
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Colors</h1>
  <p class="text-neutral-11">The color scales defined in our global CSS.</p>

  <div>
    <h2 class="text-2xl font-bold mb-4">Primary</h2>
    <div class="flex flex-wrap gap-4">
      {#each primaryColors as num}
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 rounded-md shadow-sm border border-neutral-5 {getPrimaryBg(num)}"></div>
          <span class="mt-2 text-sm text-neutral-11">{num}</span>
        </div>
      {/each}
    </div>
  </div>

  <div>
    <h2 class="text-2xl font-bold mb-4">Neutral</h2>
    <div class="flex flex-wrap gap-4">
      {#each neutralColors as num}
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 rounded-md shadow-sm border border-neutral-5 {getNeutralBg(num)}"></div>
          <span class="mt-2 text-sm text-neutral-11">{num}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
