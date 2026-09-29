<script lang="ts">
  import Code from '@galfus/design-system/components/ui/Code.svelte';

  const usageCode = `<nav aria-label="Pagination">
  <ul class="pagination">
    <li>
      <a href="#" class="pagination-item" aria-label="Previous page">
        <span class="icon-[lucide--chevron-left] text-[18px]" ></span>
      </a>
    </li>
    <li>
      <a href="#" class="pagination-item">1</a>
    </li>
    <li>
      <a href="#" class="pagination-item" aria-current="page">2</a>
    </li>
    <li>
      <a href="#" class="pagination-item">3</a>
    </li>
    <li>
      <span class="pagination-ellipsis">...</span>
    </li>
    <li>
      <a href="#" class="pagination-item">10</a>
    </li>
    <li>
      <a href="#" class="pagination-item" aria-label="Next page">
        <span class="icon-[lucide--chevron-right] text-[18px]" ></span>
      </a>
    </li>
  </ul>
</nav>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Pagination</h1>
  <p class="text-neutral-11">
    Page navigation using <code>&lt;nav aria-label="Pagination"&gt;</code> and
    <code>@utility pagination-*</code> classes.
  </p>

  <div class="card flex justify-center">
    <nav aria-label="Pagination">
      <ul class="color-group-primary pagination">
        <li>
          <a href="#" class="pagination-item" aria-label="Previous page">
            <span class="icon-[lucide--chevron-left] text-[18px]"></span>
          </a>
        </li>
        <li>
          <a href="#" class="pagination-item">1</a>
        </li>
        <li>
          <a href="#" class="pagination-item" aria-current="page">2</a>
        </li>
        <li>
          <a href="#" class="pagination-item">3</a>
        </li>
        <li>
          <span class="pagination-ellipsis">...</span>
        </li>
        <li>
          <a href="#" class="pagination-item">10</a>
        </li>
        <li>
          <a href="#" class="pagination-item" aria-label="Next page">
            <span class="icon-[lucide--chevron-right] text-[18px]"></span>
          </a>
        </li>
      </ul>
    </nav>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="pagination.html" code={usageCode} lang="html" />
  </div>
</div>
