<script lang="ts">
  import { Search, Mail, AlertCircle } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';
  
  const usageCode = `<!-- Basic Input -->
<label class="block">
  <span class="input-label">Label</span>
  <input type="text" class="input-base" placeholder="..." />
</label>

<!-- With Leading Icon -->
<label class="block">
  <span class="input-label">Search</span>
  <div class="input-group">
    <div class="input-icon">
      <!-- Icon Component here -->
    </div>
    <input type="text" class="input-base" placeholder="Search..." />
  </div>
</label>

<!-- With Trailing Icon -->
<label class="block">
  <span class="input-label">Email</span>
  <div class="input-group">
    <input type="email" class="input-base" placeholder="Email address" />
    <div class="input-icon">
      <!-- Icon Component here -->
    </div>
  </div>
</label>

<!-- Error State -->
<input type="text" class="input-base input-error" />

<!-- Disabled State -->
<input type="text" class="input-base input-disabled" disabled />`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Inputs</h1>
  <p class="text-neutral-11">Input components utilizing the <code>@utility input-base</code>, <code>@utility input-group</code>, <code>@utility input-icon</code>, and <code>@utility input-label</code> classes.</p>

  <div class="card color-group-primary">
    <div class="card-title">Text Input</div>
    <div class="card-content flex flex-col gap-6 mt-4">
      <label class="block">
        <span class="input-label">Default</span>
        <input type="text" class="input-base max-w-sm" placeholder="Enter text..." />
      </label>
      
      <label class="block">
        <span class="input-label">With Leading Icon</span>
        <div class="input-group max-w-sm">
          <div class="input-icon">
            <Search size={18} />
          </div>
          <input type="text" class="input-base" placeholder="Search..." />
        </div>
      </label>

      <label class="block">
        <span class="input-label">With Trailing Icon</span>
        <div class="input-group max-w-sm">
          <input type="email" class="input-base" placeholder="Email address" />
          <div class="input-icon">
            <Mail size={18} />
          </div>
        </div>
      </label>
      
      <label class="block">
        <span class="input-label">With Both Icons</span>
        <div class="input-group max-w-sm">
          <div class="input-icon">
            <Search size={18} />
          </div>
          <input type="text" class="input-base" placeholder="Search email..." />
          <div class="input-icon">
            <Mail size={18} />
          </div>
        </div>
      </label>
      
      <label class="block">
        <span class="input-label">With Helper Text</span>
        <input type="text" class="input-base max-w-sm" placeholder="Enter username" />
        <span class="block text-xs text-neutral-11 mt-1.5">Only lowercase letters and numbers are allowed.</span>
      </label>

      <label class="block">
        <span class="input-label">Error State</span>
        <div class="input-group max-w-sm">
          <input type="email" class="input-base input-error" value="invalid-email" />
          <div class="input-icon text-danger-11">
            <AlertCircle size={18} />
          </div>
        </div>
        <span class="block text-xs text-danger-11 mt-1.5">Please enter a valid email address.</span>
      </label>

      <label class="block">
        <span class="input-label">Disabled</span>
        <input type="text" class="input-base input-disabled max-w-sm" disabled value="Disabled value" />
      </label>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="inputs.html" code={usageCode} lang="html" />
  </div>
</div>
