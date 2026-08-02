<script lang="ts">
  import { Menu, User, Hexagon } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Appbar</h1>
  <p class="text-neutral-11">The top application bar using a semantic <code>&lt;header&gt;</code> and <code>&lt;nav&gt;</code>.</p>

  <div class="border border-neutral-4 rounded-md overflow-hidden bg-neutral-2">
    <header class="flex items-center justify-between p-4 bg-neutral-1 border-b border-neutral-4">
      <div class="flex items-center gap-4">
        <button class="btn btn-neutral btn-icon" aria-label="Open Menu">
          <Menu size={20} />
        </button>
        <div class="font-bold text-lg flex items-center gap-2">
          <Hexagon size={24} class="text-primary-9" />
          My App
        </div>
      </div>
      
      <nav aria-label="Main Navigation">
        <ul class="flex gap-4">
          <li><a href="#" class="text-neutral-11 hover:text-neutral-12">Home</a></li>
          <li><a href="#" class="text-neutral-11 hover:text-neutral-12">Dashboard</a></li>
        </ul>
      </nav>
      
      <div>
        <button class="btn btn-neutral btn-icon rounded-full" aria-label="User Profile">
          <User size={20} />
        </button>
      </div>
    </header>
    <div class="p-8 text-neutral-11">Page Content Area...</div>
  </div>
</div>
