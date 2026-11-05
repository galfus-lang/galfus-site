import { redirect } from '@sveltejs/kit';

/**
 * Creates a non-cacheable post-action redirect. A 307 redirect would replay a
 * credential-bearing POST at the destination, whereas 303 safely continues as
 * a GET.
 */
export function temporaryRedirect(location: string) {
  return redirect(303, location);
}
