import { dev } from '$app/environment';
import { validateAndRenewAccessSession } from '$lib/server/access-session';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import { resolveMainAppRedirect } from '@galfus/constants';

export const load = async ({ cookies }) => {
  const session = await validateAndRenewAccessSession(cookies);
  if (!session) {
    throw temporaryRedirect('/');
  }
  return { destination: resolveMainAppRedirect(dev, session.rto) };
};
