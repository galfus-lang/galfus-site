<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import { getColorGroupClass, type Colors } from '$lib/utils/color';
  import { Blocks, Box, Cpu, ShieldCheck } from '@lucide/svelte';

  type FeatureContent = { title: string; content: string; icon: any; group?: Colors };
</script>

{#snippet feature({ group = 'primary', title, content, icon: Icon }: FeatureContent)}
  <div
    class={cn(
      'card flex flex-col p-8 transition-transform hover:-translate-y-1',
      getColorGroupClass(group),
    )}
  >
    <div
      class="bg-group-4 text-group-11 group-hover:bg-group-5 mb-6 flex h-12 w-12 items-center justify-center rounded-lg transition-colors"
    >
      <Icon size={24} />
    </div>
    <h3 class="text-group-12 mb-3 text-xl font-bold">{title}</h3>
    <p class="text-group-11 leading-relaxed">
      {content}
    </p>
  </div>
{/snippet}

<section class="relative border-t border-primary-3 bg-primary-2 py-24">
  <div class="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
    <div class="mb-16 text-center">
      <h2 class="text-3xl font-bold text-primary-12 sm:text-4xl">Core Features</h2>
      <p class="mx-auto mt-4 max-w-2xl text-lg text-primary-11">
        Designed from the ground up to be safe, fast, and embeddable.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {@render feature({
        group: 'pink',
        title: 'VM-First & Portable',
        content:
          'Bytecode and interpreter structures dictate the design, making the VM highly portable. Easily embed Galfus in larger native applications like game engines or databases.',
        icon: Box,
      })}

      <!-- Feature 2 -->
      {@render feature({
        group: 'green',
        title: 'Deterministic Memory',
        content:
          'No global garbage collector. Galfus utilizes an ownership graph built on Anchors and Edges, ensuring resources are released deterministically and safely.',
        icon: Cpu,
      })}

      <!-- Feature 3 -->
      {@render feature({
        group: 'blue',
        title: 'Type Safety',
        content:
          'Fully typed syntax with static type inference. Validate assignments, function calls, and expressions securely before execution.',
        icon: ShieldCheck,
      })}

      <!-- Feature 4 -->
      {@render feature({
        group: 'violet',
        title: 'Modular Workspace',
        content:
          'Avoids magic conventions. Cross-module resolution supports local file imports, named imports, and explicit exported declarations.',
        icon: Blocks,
      })}
    </div>
  </div>
</section>
