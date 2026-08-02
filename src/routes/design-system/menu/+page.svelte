<script lang="ts">
  import { User, Settings, LogOut } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Menu</h1>
  <p class="text-neutral-11">A list of choices using the native <code>&lt;menu&gt;</code> element with icons.</p>

  <div class="card max-w-xs">
    <menu class="flex flex-col m-0 p-0">
      <li>
        <button class="w-full text-left px-4 py-2 hover:bg-neutral-3 rounded-md flex items-center gap-3">
          <User size={18} class="text-neutral-11" />
          Profile
        </button>
      </li>
      <li>
        <button class="w-full text-left px-4 py-2 hover:bg-neutral-3 rounded-md flex items-center gap-3">
          <Settings size={18} class="text-neutral-11" />
          Settings
        </button>
      </li>
      <li role="separator" class="h-px bg-neutral-4 my-1"></li>
      <li>
        <button class="w-full text-left px-4 py-2 hover:bg-red-500/10 rounded-md flex items-center gap-3 text-red-500">
          <LogOut size={18} />
          Log out
        </button>
      </li>
    </menu>
  </div>
</div>
