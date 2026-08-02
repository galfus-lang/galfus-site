<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Sidebar</h1>
  <p class="text-neutral-11">A side navigation area using <code>&lt;aside&gt;</code> and <code>&lt;nav&gt;</code>.</p>

  <div class="border border-neutral-4 rounded-md flex h-[400px] overflow-hidden bg-neutral-2">
    <aside class="w-64 bg-neutral-1 border-r border-neutral-4 p-4 flex flex-col">
      <div class="font-bold mb-6 px-2">Menu</div>
      <nav aria-label="Sidebar Navigation" class="flex-1">
        <ul class="flex flex-col gap-2">
          <li><a href="#" class="block px-2 py-1.5 bg-neutral-3 rounded">Overview</a></li>
          <li><a href="#" class="block px-2 py-1.5 hover:bg-neutral-3 rounded">Projects</a></li>
          <li><a href="#" class="block px-2 py-1.5 hover:bg-neutral-3 rounded">Team</a></li>
        </ul>
      </nav>
    </aside>
    <main class="flex-1 p-6 text-neutral-11">
      Main content area
    </main>
  </div>
</div>
