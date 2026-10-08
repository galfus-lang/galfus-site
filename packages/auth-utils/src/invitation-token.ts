import { generateId } from './id';
import { hashSecret, randomBase64Url } from './secrets';

const invitationIdPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

export interface OrganizationInvitationToken {
  id: string;
  token: string;
  tokenHash: string;
}

/** Hashes an opaque external secret with an application-owned pepper before persistence. */
export async function hashOpaqueToken(token: string, pepper: string): Promise<string> {
  if (!tokenPattern.test(token) || !pepper) {
    throw new Error('An opaque token and a non-empty pepper are required.');
  }
  return hashSecret(`${pepper}\u0000${token}`);
}

/** Creates a public invitation handle and a secret that is safe to place in a URL path. */
export async function createOrganizationInvitationToken(
  pepper: string,
): Promise<OrganizationInvitationToken> {
  const token = randomBase64Url(32);
  return { id: generateId(), token, tokenHash: await hashOpaqueToken(token, pepper) };
}

/** Creates the canonical path for an opaque invitation without logging its secret. */
export function createOrganizationInvitationPath(
  token: Pick<OrganizationInvitationToken, 'id' | 'token'>,
): string {
  if (!invitationIdPattern.test(token.id) || !tokenPattern.test(token.token)) {
    throw new Error('Invalid organization invitation token.');
  }
  return `/invite/${token.id}/${token.token}`;
}

/** Parses an invitation path token structurally; validity is checked only against the database. */
export function parseOrganizationInvitationToken(
  id: string | null | undefined,
  token: string | null | undefined,
): Pick<OrganizationInvitationToken, 'id' | 'token'> | null {
  if (!id || !token || !invitationIdPattern.test(id) || !tokenPattern.test(token)) return null;
  return { id, token };
}
