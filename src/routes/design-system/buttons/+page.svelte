<script lang="ts">
  import { Save, ArrowRight, X } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Buttons</h1>
  <p class="text-neutral-11">Button components utilizing the <code>@utility btn</code> classes, styled automatically by their parent's <code>color-group</code>.</p>

  <div class="grid gap-8 grid-cols-2">
    <!-- Primary Color Group -->
    <div class="card color-group-primary">
      <div class="card-title">Primary Group</div>
      <div class="card-content flex flex-col gap-6 mt-4">
        <div class="flex items-center gap-4">
          <button class="btn btn-solid">Solid</button>
          <button class="btn btn-soft">Soft</button>
          <button class="btn btn-outline">Outline</button>
        </div>
        <div class="flex items-center gap-4">
          <button class="btn btn-solid">
            <Save size={20} />
            Save
          </button>
          <button class="btn btn-soft">
            Next
            <ArrowRight size={20} />
          </button>
          <button class="btn btn-outline btn-icon" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>

    <!-- Neutral Color Group -->
    <div class="card color-group-neutral">
      <div class="card-title">Neutral Group</div>
      <div class="card-content flex flex-col gap-6 mt-4">
        <div class="flex items-center gap-4">
          <button class="btn btn-solid">Solid</button>
          <button class="btn btn-soft">Soft</button>
          <button class="btn btn-outline">Outline</button>
        </div>
        <div class="flex items-center gap-4">
          <button class="btn btn-solid">
            <Save size={20} />
            Save
          </button>
          <button class="btn btn-soft">
            Next
            <ArrowRight size={20} />
          </button>
          <button class="btn btn-outline btn-icon" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
