<script lang="ts">
  const repoUrl = 'https://github.com/galfus-lang/galfus-script';
</script>

<section class="relative border-t border-primary-3 bg-primary-1 py-24">
  <div class="mx-auto max-w-4xl px-6 text-center sm:px-8">
    <div class="mb-6 inline-block rounded-full bg-primary-3 p-4">
      <svg class="h-8 w-8 text-primary-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </div>
    <h2 class="mb-6 text-3xl font-bold text-primary-12 sm:text-4xl">Why "Galfus"?</h2>
    <p class="text-lg leading-relaxed text-primary-11">
      The name <strong>Galfus</strong> comes from <em>Galafus</em>, a figure from Pernambuco
      folklore associated with will-o'-the-wisp phenomena. The wandering flame represents a runtime
      that is small, lightweight, and able to float effortlessly across hosts and environments.
    </p>

    <div class="mt-12">
      <a
        href={repoUrl}
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center font-semibold text-primary-11 transition-colors hover:text-primary-12"
      >
        Explore the source code on GitHub
        <svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </a>
    </div>
  </div>
</section>
