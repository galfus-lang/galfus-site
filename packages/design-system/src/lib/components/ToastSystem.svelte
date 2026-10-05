<script module lang="ts">
  import { generateId } from '@galfus/auth-utils';

  export type ToastType = 'info' | 'success' | 'warning' | 'error';

  export interface Toast {
    id: string;
    title: string;
    description?: string;
    type: ToastType;
    duration?: number;
  }

  // Reactive state using Svelte 5 runes outside the component!
  let toasts = $state<Toast[]>([]);

  export function addToast(toast: Omit<Toast, 'id'>) {
    const id = generateId();
    const newToast = { ...toast, id };
    toasts.push(newToast);

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
  }

  export function removeToast(id: string) {
    const index = toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }
</script>

<script lang="ts">
  import { cn } from '../utils/cn';
  import { fly, fade } from 'svelte/transition';

  // To allow customizing the container placement
  let { class: className } = $props<{ class?: string }>();

  function getIcon(type: ToastType) {
    switch (type) {
      case 'success':
        return 'icon-[lucide--check-circle]';
      case 'error':
        return 'icon-[lucide--alert-circle]';
      case 'warning':
        return 'icon-[lucide--alert-triangle]';
      default:
        return 'icon-[lucide--info]';
    }
  }

  function getColorGroup(type: ToastType) {
    switch (type) {
      case 'success':
        return 'color-group-success';
      case 'error':
        return 'color-group-danger';
      case 'warning':
        return 'color-group-warning';
      default:
        return 'color-group-primary';
    }
  }
</script>

<div
  class={cn('pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-3', className)}
>
  {#each toasts as toast (toast.id)}
    <div
      in:fly={{ y: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
      class={cn('pointer-events-auto toast relative', getColorGroup(toast.type))}
    >
      <span class={cn('icon-xl shrink-0', getIcon(toast.type))}></span>

      <div class="flex toast-content flex-col">
        <span class="toast-title">{toast.title}</span>
        {#if toast.description}
          <span class="toast-description">{toast.description}</span>
        {/if}
      </div>

      <button
        class="absolute top-2 right-2 toast-action p-1 opacity-50 hover:opacity-100"
        onclick={() => removeToast(toast.id)}
        aria-label="Close"
      >
        <span class="icon-[lucide--x] icon-sm"></span>
      </button>
    </div>
  {/each}
</div>
