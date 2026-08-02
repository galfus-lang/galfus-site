<div class="flex flex-col gap-8">
  <h1 class="text-3xl font-bold">Table</h1>
  <p class="text-neutral-11">A tabular data display built exclusively with standard <code>&lt;table&gt;</code> semantic tags.</p>

  <div class="border border-neutral-4 rounded-md overflow-hidden bg-neutral-1">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">List of active users</caption>
      <thead class="bg-neutral-2 border-b border-neutral-4">
        <tr>
          <th scope="col" class="px-4 py-3 font-medium text-neutral-11">Name</th>
          <th scope="col" class="px-4 py-3 font-medium text-neutral-11">Role</th>
          <th scope="col" class="px-4 py-3 font-medium text-neutral-11">Status</th>
          <th scope="col" class="px-4 py-3 font-medium text-neutral-11 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-neutral-4">
        <tr class="hover:bg-neutral-2/50 transition-colors">
          <td class="px-4 py-3 font-medium">Alice Smith</td>
          <td class="px-4 py-3 text-neutral-11">Admin</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600">Active</span></td>
          <td class="px-4 py-3 text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
        <tr class="hover:bg-neutral-2/50 transition-colors">
          <td class="px-4 py-3 font-medium">Bob Jones</td>
          <td class="px-4 py-3 text-neutral-11">Editor</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-4 text-neutral-11">Offline</span></td>
          <td class="px-4 py-3 text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
        <tr class="hover:bg-neutral-2/50 transition-colors">
          <td class="px-4 py-3 font-medium">Charlie Brown</td>
          <td class="px-4 py-3 text-neutral-11">Viewer</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600">Active</span></td>
          <td class="px-4 py-3 text-right">
            <button class="text-primary-9 hover:underline">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
