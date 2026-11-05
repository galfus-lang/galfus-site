<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="border-collapse: collapse; background-color: #f3f4f6;"
>
  <tbody>
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="border-collapse: collapse; max-width: 560px; background-color: #ffffff;"
        >
          <tbody>
            <tr
              ><td
                style="padding: 32px; color: #202124; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5;"
                >{@render children()}</td
              ></tr
            >
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
