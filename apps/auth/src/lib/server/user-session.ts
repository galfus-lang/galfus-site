import { validateAndRenewAccessSession } from './access-session';
import { temporaryRedirect } from './temporary-redirect';

export async function requireUserSession(
  cookies: Parameters<typeof validateAndRenewAccessSession>[0],
): Promise<{
  accountId: string;
  identifier: string;
  credentialVersion: number;
}> {
  const session = await validateAndRenewAccessSession(cookies);
  if (!session) {
    throw temporaryRedirect('/');
  }
  return {
    accountId: session.accountId,
    identifier: session.identifier ?? '',
    credentialVersion: session.credentialVersion,
  };
}
