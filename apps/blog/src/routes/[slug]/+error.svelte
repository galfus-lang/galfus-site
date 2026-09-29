<script lang="ts">
  import { page } from '$app/state';
  import ErrorPage from '@galfus/design-system/components/ErrorPage.svelte';
</script>

<ErrorPage status={page.status} message={page.error?.message} />
