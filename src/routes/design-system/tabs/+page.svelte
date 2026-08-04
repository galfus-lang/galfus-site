<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<div role="tablist" class="tab-list">
  <button role="tab" aria-selected="true" aria-controls="panel-1" class="tab-trigger">Account</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" class="tab-trigger">Password</button>
</div>

<div id="panel-1" role="tabpanel" tabindex="0" class="tab-panel">
  <p>Make changes to your account here.</p>
</div>
<div id="panel-2" role="tabpanel" tabindex="0" class="tab-panel" hidden>
  <p>Change your password here.</p>
</div>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Tabs</h1>
  <p class="text-neutral-11">A tabbed interface using ARIA roles and <code>@utility tab-*</code> classes.</p>

  <div class="card">
    <div role="tablist" class="tab-list">
      <button role="tab" aria-selected="true" aria-controls="panel-1" class="tab-trigger">Account</button>
      <button role="tab" aria-selected="false" aria-controls="panel-2" class="tab-trigger">Password</button>
      <button role="tab" aria-selected="false" aria-controls="panel-3" class="tab-trigger">Settings</button>
    </div>

    <div id="panel-1" role="tabpanel" tabindex="0" class="tab-panel">
      <p>Make changes to your account here. Click save when you're done.</p>
    </div>
    <div id="panel-2" role="tabpanel" tabindex="0" class="tab-panel" hidden>
      <p>Change your password here.</p>
    </div>
    <div id="panel-3" role="tabpanel" tabindex="0" class="tab-panel" hidden>
      <p>Manage your notification settings.</p>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-4">Usage</h2>
    <Code label="tabs.html" code={usageCode} lang="html" />
  </div>
</div>
