<script lang="ts">
  import { X } from '@lucide/svelte';
  let dialog: HTMLDialogElement;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Modal</h1>
  <p class="text-neutral-11">A dialog box utilizing the native <code>&lt;dialog&gt;</code> element.</p>

  <div class="card flex justify-center py-10">
    <button class="btn btn-primary" onclick={() => dialog.showModal()}>Open Modal</button>
    
    <dialog bind:this={dialog} class="p-0 bg-transparent backdrop:bg-black/50 open:animate-in open:fade-in-0">
      <div class="bg-neutral-1 border border-neutral-4 rounded-lg shadow-2xl w-[400px] text-neutral-12 flex flex-col">
        <!-- Titlebar -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-neutral-4">
          <h2 class="text-lg font-bold m-0">Confirm Deletion</h2>
          <form method="dialog">
            <button class="btn btn-neutral btn-icon p-1.5 bg-transparent shadow-none" aria-label="Close">
              <X size={18} />
            </button>
          </form>
        </header>
        
        <!-- Content -->
        <div class="p-6">
          <p class="text-neutral-11 mb-6">This action cannot be undone. Are you sure you want to permanently delete this file?</p>
          <div class="flex justify-end gap-3">
            <form method="dialog">
              <button class="btn btn-neutral">Cancel</button>
            </form>
            <button class="btn btn-primary bg-red-500 hover:bg-red-600" onclick={() => dialog.close()}>Delete</button>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</div>
