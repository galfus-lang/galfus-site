<script lang="ts">
  import { X } from '@lucide/svelte';
  import Code from '$lib/components/ui/Code.svelte';

  let dialog: HTMLDialogElement;

  const usageCode = `<button class="btn btn-solid color-group-primary" onclick={() => dialog.showModal()}>Open Modal</button>

<dialog bind:this={dialog} class="modal open:animate-in open:fade-in-0">
  <div class="modal-content">
    <header class="modal-header">
      <h2 class="modal-title">Confirm Deletion</h2>
      <form method="dialog">
        <button class="btn btn-ghost btn-icon color-group-neutral" aria-label="Close">
          <X size={18} />
        </button>
      </form>
    </header>

    <div class="modal-body">
      <p class="text-neutral-11">This action cannot be undone. Are you sure you want to permanently delete this file?</p>
      <div class="modal-footer">
        <form method="dialog">
          <button class="btn btn-outlined color-group-neutral">Cancel</button>
        </form>
        <button class="btn btn-solid color-group-danger" onclick={() => dialog.close()}>Delete</button>
      </div>
    </div>
  </div>
</dialog>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Modal</h1>
  <p class="text-neutral-11">
    A dialog box utilizing the native <code>&lt;dialog&gt;</code> element with
    <code>@utility modal-*</code> classes.
  </p>

  <div class="card flex justify-center py-10">
    <button class="color-group-primary btn btn-solid" onclick={() => dialog.showModal()}
      >Open Modal</button
    >

    <dialog bind:this={dialog} class="modal">
      <div class="modal-content">
        <!-- Titlebar -->
        <header class="modal-header">
          <h2 class="modal-title">Confirm Deletion</h2>
          <form method="dialog">
            <button class="color-group-neutral btn btn-icon btn-ghost" aria-label="Close">
              <X size={18} />
            </button>
          </form>
        </header>

        <!-- Content -->
        <div class="modal-body">
          <p class="text-neutral-11">
            This action cannot be undone. Are you sure you want to permanently delete this file?
          </p>
          <div class="modal-footer">
            <form method="dialog">
              <button class="color-group-neutral btn btn-outlined">Cancel</button>
            </form>
            <button class="color-group-danger btn btn-solid" onclick={() => dialog.close()}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </dialog>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="modal.html" code={usageCode} lang="html" />
  </div>
</div>
