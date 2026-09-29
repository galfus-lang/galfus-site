<script lang="ts">
  import Brand from '../components/svg/Brand.svelte';
  import GitHubStarButton from './GitHubStarButton.svelte';
  import { Menu, X } from '@lucide/svelte';

  let dialog: HTMLDialogElement;

  const isDev = import.meta.env.DEV;

  function getAppUrl(app: 'main' | 'auth' | 'blog', path = '/') {
    if (isDev) {
      const ports = { auth: 5001, main: 5002, blog: 5003 };
      return `http://localhost:${ports[app]}${path}`;
    } else {
      const domains = {
        auth: 'https://auth.galfus.com',
        main: 'https://galfus.com',
        blog: 'https://blog.galfus.com',
      };
      return `${domains[app]}${path}`;
    }
  }
</script>

<header class="color-group-primary @container sticky top-0 z-50 appbar w-full">
  <a href={getAppUrl('main')} class="group appbar-title">
    <div class="relative flex items-center justify-center">
      <Brand size={40} class="text-group-9 relative z-10" />
    </div>
    <span class="text-group-12 group-hover:text-group-10 transition-colors">Galfus</span>
  </a>

  <button
    class="btn btn-icon btn-ghost @md:hidden"
    aria-label="Open Menu"
    onclick={() => dialog.showModal()}
  >
    <Menu size={24} />
  </button>

  <nav class="hidden @md:block">
    <ul class="appbar-nav">
      <li>
        <a href={getAppUrl('main')} class="appbar-link">Home</a>
      </li>
      <li>
        <a href={getAppUrl('blog')} class="appbar-link">Blog</a>
      </li>
      <li>
        <a href={getAppUrl('auth')} class="appbar-link">Auth</a>
      </li>
      <li>
        <a href={getAppUrl('main', '/design-system')} class="appbar-link">Design System</a>
      </li>
      <li>
        <GitHubStarButton owner="galfus-lang" repo="galfus-script" />
      </li>
    </ul>
  </nav>

  <dialog bind:this={dialog} class="modal-aside modal @md:hidden" data-placement="end">
    <div class="modal-content h-full w-64 max-w-[80vw]">
      <div class="modal-header border-b-transparent!">
        <h2 class="modal-title">Menu</h2>
        <button
          class="btn btn-icon btn-ghost"
          aria-label="Close Menu"
          onclick={() => dialog.close()}
        >
          <X size={20} />
        </button>
      </div>
      <div class="modal-body">
        <ul class="flex flex-col gap-4">
          <li>
            <a
              href={getAppUrl('main')}
              class="block w-full appbar-link"
              onclick={() => dialog.close()}>Home</a
            >
          </li>
          <li>
            <a
              href={getAppUrl('blog')}
              class="block w-full appbar-link"
              onclick={() => dialog.close()}>Blog</a
            >
          </li>
          <li>
            <a
              href={getAppUrl('auth')}
              class="block w-full appbar-link"
              onclick={() => dialog.close()}>Auth</a
            >
          </li>
          <li>
            <a
              href={getAppUrl('main', '/design-system')}
              class="block w-full appbar-link"
              onclick={() => dialog.close()}>Design System</a
            >
          </li>
          <li>
            <GitHubStarButton owner="galfus-lang" repo="galfus-script" />
          </li>
        </ul>
      </div>
    </div>
  </dialog>
</header>
