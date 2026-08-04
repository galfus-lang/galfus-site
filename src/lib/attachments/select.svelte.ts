import { ulid } from 'ulid';

export function buildSelect() {
  const id = ulid();
  const anchorName = `--select-${id}`;
  const popoverId = `select-popover-${id}`;
  
  let triggerNode: HTMLInputElement | null = null;
  let popoverNode: HTMLElement | null = null;
  
  // Use Svelte 5 Rune for reactive state
  let isOpen = $state(false);

  // Helper to get all focusable options in the popover
  const getItems = () => {
    if (!popoverNode) return [];
    return Array.from(popoverNode.querySelectorAll<HTMLElement>('[role="option"]'));
  };

  const trigger = (node: HTMLInputElement) => {
    triggerNode = node;
    node.readOnly = true;
    node.style.cursor = 'pointer';
    node.style.setProperty('anchor-name', anchorName);
    
    // A11y: Combobox roles and attributes
    node.setAttribute('role', 'combobox');
    node.setAttribute('aria-haspopup', 'listbox');
    node.setAttribute('aria-controls', popoverId);
    node.setAttribute('aria-autocomplete', 'none');
    // Set initial expanded state
    node.setAttribute('aria-expanded', String(isOpen));

    // Update aria-expanded reactively whenever isOpen changes
    $effect(() => {
      node.setAttribute('aria-expanded', String(isOpen));
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        if (!isOpen && popoverNode && typeof popoverNode.showPopover === 'function') {
          popoverNode.showPopover();
        }
      } else if (e.key === 'Escape') {
        if (isOpen && popoverNode && typeof popoverNode.hidePopover === 'function') {
          popoverNode.hidePopover();
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      // Only HTMLButtonElement triggers popover natively, so we trigger it manually for input
      if (popoverNode && typeof popoverNode.showPopover === 'function') {
        if (isOpen) {
          popoverNode.hidePopover();
        } else {
          popoverNode.showPopover();
        }
      }
    };

    node.addEventListener('keydown', onKeyDown);
    node.addEventListener('click', onClick);

    return () => {
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('click', onClick);
      triggerNode = null;
    };
  };

  const popover = (node: HTMLElement) => {
    popoverNode = node;
    node.id = popoverId;
    node.setAttribute('popover', 'auto');
    node.style.setProperty('position-anchor', anchorName);
    
    // A11y: Listbox role
    node.setAttribute('role', 'listbox');
    
    // Listen to native toggle event to update our rune state
    const onToggle = (e: Event) => {
      isOpen = (e as any).newState === 'open';
      if (isOpen) {
        // When opened, move focus to the first item for keyboard navigation
        const items = getItems();
        if (items.length > 0) {
          items[0].focus();
        }
      }
    };
    node.addEventListener('toggle', onToggle);
    
    // Inherit color-group from the trigger's parent tree
    if (triggerNode) {
      let parent = triggerNode.parentElement;
      while(parent) {
        const match = Array.from(parent.classList).find(c => c.startsWith('color-group-'));
        if (match) {
          node.classList.add(match);
          break;
        }
        parent = parent.parentElement;
      }
    }

    return () => {
      node.removeEventListener('toggle', onToggle);
      popoverNode = null;
    };
  };

  const item = (node: HTMLElement) => {
    // A11y: Option role and make it ignored by Tab (but programmatically focusable)
    node.setAttribute('role', 'option');
    node.setAttribute('tabindex', '-1');

    const onClick = () => {
      if (popoverNode && typeof popoverNode.hidePopover === 'function') {
        popoverNode.hidePopover();
      }
      if (triggerNode) {
        triggerNode.focus(); // Return focus to trigger after selection
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const items = getItems();
      const index = items.indexOf(node);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = items[index + 1] || items[0];
        next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = items[index - 1] || items[items.length - 1];
        prev.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        node.click(); // Trigger the select logic
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClick(); // Close and return focus
      }
    };
    
    const onPointerEnter = () => {
      // Sync mouse hover with focus so keyboard and mouse don't highlight different items
      node.focus();
    };
    
    node.addEventListener('click', onClick);
    node.addEventListener('keydown', onKeyDown);
    node.addEventListener('pointerenter', onPointerEnter);
    
    return () => {
      node.removeEventListener('click', onClick);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('pointerenter', onPointerEnter);
    };
  };

  return { trigger, popover, item };
}
