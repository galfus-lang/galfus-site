<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Tabs</h1>
  <p class="text-neutral-11">A tabbed interface using ARIA roles (<code>tablist</code>, <code>tab</code>, <code>tabpanel</code>).</p>

  <div class="card">
    <div role="tablist" class="flex border-b border-neutral-4 mb-4">
      <button role="tab" aria-selected="true" aria-controls="panel-1" class="px-4 py-2 font-medium text-primary-9 border-b-2 border-primary-9">Account</button>
      <button role="tab" aria-selected="false" aria-controls="panel-2" class="px-4 py-2 font-medium text-neutral-11 hover:text-neutral-12">Password</button>
      <button role="tab" aria-selected="false" aria-controls="panel-3" class="px-4 py-2 font-medium text-neutral-11 hover:text-neutral-12">Settings</button>
    </div>
    
    <div id="panel-1" role="tabpanel" tabindex="0" class="text-neutral-11 focus:outline-none">
      <p>Make changes to your account here. Click save when you're done.</p>
    </div>
    <div id="panel-2" role="tabpanel" tabindex="0" class="hidden text-neutral-11 focus:outline-none">
      <p>Change your password here.</p>
    </div>
    <div id="panel-3" role="tabpanel" tabindex="0" class="hidden text-neutral-11 focus:outline-none">
      <p>Manage your notification settings.</p>
    </div>
  </div>
</div>
