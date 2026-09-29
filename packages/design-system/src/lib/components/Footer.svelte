<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-primary-4 bg-primary-2 px-6 py-12 text-primary-11 sm:px-8 lg:px-12">
  <div class="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
    <div class="flex flex-col gap-4">
      <h3 class="text-xl font-bold text-primary-12">Galfus Script</h3>
      <p class="max-w-sm text-sm">
        A highly modular interpreted scripting language built around typed source code, an in-memory
        executable graph, and a deterministic VM runtime.
      </p>
      <p class="text-sm">
        Contact: <a
          href="mailto:contact@vulppi.dev"
          class="font-medium text-primary-12 hover:underline">contact@vulppi.dev</a
        >
      </p>
    </div>

    <div class="flex min-w-50 flex-col gap-2">
      <h4 class="mb-2 font-bold text-primary-12">Resources</h4>
      <a
        href="/design-system"
        class="inline-flex items-center gap-1 transition-colors hover:text-primary-12"
        >Design System</a
      >
      <a
        href="https://x.com/galfuslang"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 transition-colors hover:text-primary-12"
        >X (Twitter)</a
      >
      <a
        href="https://github.com/galfus-lang"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 transition-colors hover:text-primary-12"
        >GitHub Organization</a
      >
      <a
        href="https://github.com/galfus-lang/galfus-script/discussions"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 transition-colors hover:text-primary-12"
        >GitHub Discussions</a
      >
    </div>
  </div>

  <div
    class="mx-auto mt-12 max-w-7xl border-t border-primary-4 pt-8 text-center text-sm text-primary-10"
  >
    &copy; {currentYear} Galfus Script. Released under the MIT License.
  </div>
</footer>
