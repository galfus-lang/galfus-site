<script lang="ts">
  import Code from '@galfus/design-system/components/ui/Code.svelte';

  const jsCode = `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`;

  const galfusCode = `import { println } from 'std/io'

export fn main(args: [[u8]]): i32 {
  println("Hello from Galfus!")
  
  // Create an array and map over it
  const numbers = [1, 2, 3, 4, 5]
  const doubled = numbers.map(fn (n: i32): i32 => n * 2)
  
  return 0
}`;

  const htmlCode = `<div class="card">
  <h2>Design System</h2>
  <p>Building consistent UI components.</p>
</div>`;
</script>

<div class="space-y-12">
  <div>
    <h1 class="mb-2 text-3xl font-bold text-neutral-12">Code</h1>
    <p class="text-neutral-11">
      A syntax-highlighting code block component powered by Shiki, supporting Galfus Script
      natively.
    </p>
  </div>

  <section class="space-y-6">
    <div>
      <h2 class="mb-4 text-xl font-semibold text-neutral-12">Galfus Script (Native Grammar)</h2>
      <Code code={galfusCode} lang="galfus" label="main.gfs" />
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold text-neutral-12">JavaScript</h2>
      <Code code={jsCode} lang="javascript" label="utils.js" />
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold text-neutral-12">HTML</h2>
      <Code code={htmlCode} lang="html" label="template.html" />
    </div>
  </section>
</div>
