<script lang="ts">
  import { Search, Mail } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Inputs</h1>
  <p class="text-neutral-11">Input components utilizing the <code>@utility input-base</code> classes.</p>

  <div class="card color-group-primary">
    <div class="card-title">Text Input</div>
    <div class="card-content flex flex-col gap-6 mt-4">
      <label>
        <span class="block text-sm font-medium mb-1">Default</span>
        <input type="text" class="input-base w-full max-w-sm" placeholder="Enter text..." />
      </label>
      
      <label>
        <span class="block text-sm font-medium mb-1">With Leading Icon</span>
        <div class="relative w-full max-w-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-11">
            <Search size={18} />
          </div>
          <input type="text" class="input-base w-full pl-10" placeholder="Search..." />
        </div>
      </label>

      <label>
        <span class="block text-sm font-medium mb-1">With Trailing Icon</span>
        <div class="relative w-full max-w-sm">
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-11">
            <Mail size={18} />
          </div>
          <input type="email" class="input-base w-full pr-10" placeholder="Email address" />
        </div>
      </label>
      
      <label>
        <span class="block text-sm font-medium mb-1">Disabled</span>
        <input type="text" class="input-base input-disabled w-full max-w-sm" disabled value="Disabled value" />
      </label>
    </div>
  </div>
</div>
