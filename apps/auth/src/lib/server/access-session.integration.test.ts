import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  clearCookie: vi.fn(),
  account: vi.fn(),
}));
vi.mock('./auth-cookies', () => ({
  getAuthAccessTokenCookie: mocks.getCookie,
  setAuthAccessTokenCookie: mocks.setCookie,
  clearAuthAccessTokenCookie: mocks.clearCookie,
}));
vi.mock('./db', () => ({ connectDb: async () => ({}) }));
vi.mock('@galfus/data-manager/server', () => ({ getAccountAccessState: mocks.account }));
vi.mock('./jwt', async () => {
  const { JwtService } = await import('@galfus/auth-utils');
  return {
    AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
    jwt: new JwtService('test-signing-secret-for-session-tests', {
      issuer: 'galfus:auth',
      audience: 'galfus:auth-flow',
      keyId: 'test',
    }),
  };
});

import { issueAccessToken, validateAndRenewAccessSession } from './access-session';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.account.mockResolvedValue({
    success: true,
    data: { status: 'active', credential_version: 1 },
  });
});

it('renews a signed token and rejects it after credential version changes', async () => {
  const cookies = {} as never;
  const token = await issueAccessToken({} as never, { accountId: 'account:user' }, 1);
  mocks.getCookie.mockReturnValue(token);
  expect(await validateAndRenewAccessSession(cookies)).toMatchObject({
    accountId: 'account:user',
    credentialVersion: 1,
  });
  expect(mocks.setCookie).toHaveBeenCalledWith(cookies, expect.any(String));
  mocks.account.mockResolvedValue({
    success: true,
    data: { status: 'active', credential_version: 2 },
  });
  expect(await validateAndRenewAccessSession(cookies)).toBeNull();
  expect(mocks.clearCookie).toHaveBeenCalledWith(cookies);
});

it('rejects a modified signed token', async () => {
  const token = await issueAccessToken({} as never, { accountId: 'account:user' }, 1);
  const parts = token.split('.');
  parts[1] = `${parts[1]}A`;
  mocks.getCookie.mockReturnValue(parts.join('.'));
  expect(await validateAndRenewAccessSession({} as never)).toBeNull();
  expect(mocks.clearCookie).toHaveBeenCalled();
});
