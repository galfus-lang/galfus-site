<script lang="ts">
  import Code from '$lib/components/ui/Code.svelte';

  const usageCode = `<div class="table-container">
  <table class="table-base">
    <caption class="sr-only">List of active users</caption>
    <thead class="table-header">
      <tr>
        <th scope="col" class="table-th">Name</th>
        <th scope="col" class="table-th">Role</th>
        <th scope="col" class="table-th">Status</th>
        <th scope="col" class="table-th text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row">
        <td class="table-td font-medium">Alice Smith</td>
        <td class="table-td text-neutral-11">Admin</td>
        <td class="table-td">
          <span class="badge color-group-success">Active</span>
        </td>
        <td class="table-td text-right">
          <button class="text-primary-9 hover:underline">Edit</button>
        </td>
      </tr>
      <!-- ... -->
    </tbody>
  </table>
</div>`;
</script>

<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Table</h1>
  <p class="text-neutral-11">A tabular data display built exclusively with standard semantic tags and <code>@utility table-*</code> classes.</p>

  <div class="table-container">
    <table class="table-base">
      <caption class="sr-only">List of active users</caption>
      <thead class="table-header">
        <tr>
          <th scope="col" class="table-th">Name</th>
          <th scope="col" class="table-th">Role</th>
          <th scope="col" class="table-th">Status</th>
          <th scope="col" class="table-th text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr class="table-row">
          <td class="table-td font-medium">Alice Smith</td>
          <td class="table-td text-neutral-11">Admin</td>
          <td class="table-td"><span class="badge color-group-success">Active</span></td>
          <td class="table-td text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
        <tr class="table-row">
          <td class="table-td font-medium">Bob Jones</td>
          <td class="table-td text-neutral-11">Editor</td>
          <td class="table-td"><span class="badge color-group-neutral">Offline</span></td>
          <td class="table-td text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
        <tr class="table-row">
          <td class="table-td font-medium">Charlie Brown</td>
          <td class="table-td text-neutral-11">Viewer</td>
          <td class="table-td"><span class="badge color-group-success">Active</span></td>
          <td class="table-td text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-8">
    <h2 class="mb-4 text-xl font-bold">Usage</h2>
    <Code label="table.html" code={usageCode} lang="html" />
  </div>
</div>
