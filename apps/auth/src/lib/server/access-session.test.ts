import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  clearCookie: vi.fn(),
  setCookie: vi.fn(),
  verify: vi.fn(),
  sign: vi.fn(),
  connectDb: vi.fn(),
  getAccount: vi.fn(),
}));
vi.mock('./auth-cookies', () => ({
  getAuthAccessTokenCookie: mocks.getCookie,
  clearAuthAccessTokenCookie: mocks.clearCookie,
  setAuthAccessTokenCookie: mocks.setCookie,
}));
vi.mock('./db', () => ({ connectDb: mocks.connectDb }));
vi.mock('./jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: { verify: mocks.verify, sign: mocks.sign },
}));
vi.mock('@galfus/data-manager/server', () => ({ getAccountAccessState: mocks.getAccount }));
import {
  getPrimaryCredentialVersion,
  issueAccessToken,
  validateAndRenewAccessSession,
} from './access-session';

describe('access sessions', () => {
  const cookies = {} as never;
  const payload = {
    flow: 'access',
    sub: 'account:user',
    accountId: 'account:user',
    credentialVersion: 3,
    exp: 9999999999,
    identifier: 'user@example.com',
  };
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getCookie.mockReturnValue('signed-token');
    mocks.verify.mockResolvedValue(payload);
    mocks.connectDb.mockResolvedValue({});
    mocks.getAccount.mockResolvedValue({
      success: true,
      data: { status: 'active', credential_version: 3 },
    });
    mocks.sign.mockResolvedValue('renewed-token');
  });
  it('validates the account and version before renewing', async () => {
    expect(await validateAndRenewAccessSession(cookies)).toMatchObject({
      accountId: 'account:user',
      credentialVersion: 3,
    });
    expect(mocks.getAccount).toHaveBeenCalledWith({}, { accountId: 'account:user' });
    expect(mocks.sign).toHaveBeenCalledWith(
      expect.objectContaining({ credentialVersion: 3 }),
      expect.anything(),
    );
    expect(mocks.setCookie).toHaveBeenCalledWith(cookies, 'renewed-token');
  });
  it.each([
    null,
    { status: 'disabled', credential_version: 3 },
    { status: 'active', credential_version: 4 },
  ])('rejects missing, disabled and revoked accounts: %s', async (account) => {
    mocks.getAccount.mockResolvedValue({ success: true, data: account });
    expect(await validateAndRenewAccessSession(cookies)).toBeNull();
    expect(mocks.clearCookie).toHaveBeenCalled();
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('rejects legacy tokens without a credential version', async () => {
    mocks.verify.mockResolvedValue({ ...payload, credentialVersion: undefined });
    expect(await validateAndRenewAccessSession(cookies)).toBeNull();
    expect(mocks.getAccount).not.toHaveBeenCalled();
  });
  it('rejects an expired or invalid signed token without looking up the account', async () => {
    mocks.verify.mockRejectedValue(new Error('expired'));
    expect(await validateAndRenewAccessSession(cookies)).toBeNull();
    expect(mocks.clearCookie).toHaveBeenCalled();
    expect(mocks.getAccount).not.toHaveBeenCalled();
  });
  it('does not clear a token when the database is unavailable', async () => {
    mocks.connectDb.mockRejectedValue(new Error('offline'));
    await expect(validateAndRenewAccessSession(cookies)).rejects.toThrow('offline');
    expect(mocks.clearCookie).not.toHaveBeenCalled();
  });
  it('includes the current version when issuing a new token', async () => {
    await issueAccessToken({} as never, { accountId: 'account:user' }, 3);
    expect(mocks.sign).toHaveBeenCalledWith(
      expect.objectContaining({ credentialVersion: 3 }),
      expect.anything(),
    );
  });
  it('does not issue a new token if the account was revoked after the primary factor', async () => {
    await expect(issueAccessToken({} as never, { accountId: 'account:user' }, 2)).rejects.toThrow();
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('requires the credential version captured with the primary factor', () => {
    expect(
      getPrimaryCredentialVersion({
        metadata: { authorization: { primary_credential_version: 3 } },
      }),
    ).toBe(3);
    expect(() => getPrimaryCredentialVersion({})).toThrow();
  });
});
