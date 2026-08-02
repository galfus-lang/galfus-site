<script lang="ts">
  import { Save, ArrowRight, X } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Buttons</h1>
  <p class="text-neutral-11">Button components utilizing the <code>@utility btn</code> and <code>@utility btn-icon</code> classes.</p>

  <div class="card">
    <div class="card-title">Primary Variants</div>
    <div class="card-content flex items-center gap-4 mt-4">
      <button class="btn btn-primary">Default</button>
      <button class="btn btn-primary">
        <Save size={20} />
        Save
      </button>
      <button class="btn btn-primary">
        Next
        <ArrowRight size={20} />
      </button>
      <button class="btn btn-primary btn-icon" aria-label="Close">
        <X size={20} />
      </button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Neutral Variants</div>
    <div class="card-content flex items-center gap-4 mt-4">
      <button class="btn btn-neutral">Default</button>
      <button class="btn btn-neutral">
        <Save size={20} />
        Save
      </button>
      <button class="btn btn-neutral">
        Next
        <ArrowRight size={20} />
      </button>
      <button class="btn btn-neutral btn-icon" aria-label="Close">
        <X size={20} />
      </button>
    </div>
  </div>
</div>
