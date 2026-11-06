<script module lang="ts">
  type MessageType = 'info' | 'success' | 'warning' | 'error';
  type Message = { title: string; description?: string; type: MessageType; duration?: number };

  let message = $state<Message | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  export function addToast(next: Message) {
    clearTimeout(timer);
    message = next;
    if (next.type !== 'error' && next.duration !== 0) {
      timer = setTimeout(clearMessage, next.duration ?? 5000);
    }
  }

  function clearMessage() {
    clearTimeout(timer);
    message = null;
  }
</script>

<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let {
    error,
    errorKey,
    errorTitle,
    closeLabel,
  }: { error?: string; errorKey: unknown; errorTitle: string; closeLabel: string } = $props();

  let dismissedErrorKey = $state.raw<unknown>(null);
  let mounted = $state(false);
  let reduceMotion = $state(false);
  let visible = $derived(
    message ??
      (error && errorKey !== dismissedErrorKey
        ? { title: errorTitle, description: error, type: 'error' as const }
        : null),
  );

  afterNavigate(() => {
    clearMessage();
    dismissedErrorKey = null;
  });

  onMount(() => {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mounted = true;
  });

  function dismiss() {
    dismissedErrorKey = errorKey;
    clearMessage();
  }
</script>

<div class="pointer-events-none absolute top-full right-0 left-0 z-0 pt-2" aria-live="polite">
  {#if visible}
    <div
      in:fly={{ y: -8, duration: reduceMotion ? 0 : 180 }}
      role={visible.type === 'error' ? 'alert' : 'status'}
      class:message-error={visible.type === 'error'}
      class:message-success={visible.type === 'success'}
      class:message-warning={visible.type === 'warning'}
      class="message-drawer pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-xl"
    >
      <span
        class={visible.type === 'error'
          ? 'icon-[lucide--circle-alert] shrink-0 icon-lg'
          : visible.type === 'success'
            ? 'icon-[lucide--circle-check] shrink-0 icon-lg'
            : 'icon-[lucide--info] shrink-0 icon-lg'}
        aria-hidden="true"
      ></span>
      <div class="min-w-0 flex-1 text-sm">
        <p class="font-bold">{visible.title}</p>
        {#if visible.description && visible.description !== visible.title}
          <p class="mt-1 break-words">{visible.description}</p>
        {/if}
      </div>
      {#if mounted}
        <button
          type="button"
          onclick={dismiss}
          aria-label={closeLabel}
          class="cursor-pointer rounded-sm opacity-75 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span class="icon-[lucide--x] icon-md" aria-hidden="true"></span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .message-drawer {
    color: var(--color-primary-12);
    border-color: var(--color-primary-6);
    background: var(--color-primary-2);
  }
  .message-error {
    color: var(--color-danger-12);
    border-color: var(--color-danger-6);
    background: var(--color-danger-2);
  }
  .message-success {
    color: var(--color-success-12);
    border-color: var(--color-success-6);
    background: var(--color-success-2);
  }
  .message-warning {
    color: var(--color-warning-12);
    border-color: var(--color-warning-6);
    background: var(--color-warning-2);
  }
</style>
