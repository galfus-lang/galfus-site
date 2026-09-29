<script lang="ts">
  import { page } from '$app/state';
  import ErrorPage from '@galfus/design-system/components/ErrorPage.svelte';
</script>

<!-- The auth app has its own background/layout wrapping the whole screen in +layout.svelte -->
<!-- But wait, NavigationAppbar is injected inside ErrorPage! -->
<ErrorPage status={page.status} message={page.error?.message} />
