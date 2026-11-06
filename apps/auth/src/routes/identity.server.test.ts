import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  clearAuthTransactionCookie: vi.fn(),
  connectDb: vi.fn(),
  createAuthTransactionToken: vi.fn(),
  getAuthAccessTokenCookie: vi.fn(),
  jwtVerify: vi.fn(),
  getAuthTransaction: vi.fn(),
  getAuthTransactionCookie: vi.fn(),
  setAuthTransactionCookie: vi.fn(),
  startIdentityAuthTransaction: vi.fn(),
  sendRegistrationCode: vi.fn(),
  reserveIdentityAttempt: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthAccessTokenCookie: mocks.getAuthAccessTokenCookie,
  getAuthTransactionCookie: mocks.getAuthTransactionCookie,
  setAuthTransactionCookie: mocks.setAuthTransactionCookie,
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
vi.mock('$lib/server/password-attempt', () => ({
  reserveIdentityAttempt: mocks.reserveIdentityAttempt,
}));
vi.mock('$lib/server/registration-email', () => ({
  sendRegistrationCode: mocks.sendRegistrationCode,
}));
vi.mock('$lib/server/i18n', () => ({ getRequestLocale: () => 'en-US' }));
vi.mock('$lib/server/access-session', () => ({
  validateAndRenewAccessSession: async () => {
    if (!mocks.getAuthAccessTokenCookie()) return null;
    try {
      return await mocks.jwtVerify();
    } catch {
      mocks.clearAuthAccessTokenCookie();
      return null;
    }
  },
}));
vi.mock('$lib/server/jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: { verify: vi.fn() },
}));

vi.mock('@galfus/auth-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/auth-utils')>()),
  createAuthTransactionToken: mocks.createAuthTransactionToken,
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  startIdentityAuthTransaction: mocks.startIdentityAuthTransaction,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { actions } = await import('./+page.server');

const transactionToken = {
  id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
  verifier: 'browser-verifier',
  verifierHash: 'a'.repeat(43),
  value: 'opaque-browser-transaction',
};

function submitIdentifier(identifier: string, returnTo?: string) {
  const form = new FormData();
  form.set('identifier', identifier);

  const query = returnTo ? `?rto=${encodeURIComponent(returnTo)}` : '';
  return actions.default({
    request: new Request(`http://localhost:5001/${query}`, {
      method: 'POST',
      body: form,
    }),
    url: new URL(`http://localhost:5001/${query}`),
    cookies: {} as never,
    getClientAddress: () => '127.0.0.1',
  } as never);
}

async function expectRedirect(
  identifier: string,
  route: '/register' | '/challenge',
  returnTo?: string,
) {
  try {
    await submitIdentifier(identifier, returnTo);
    throw new Error('Expected the identity action to redirect.');
  } catch (error) {
    expect(isRedirect(error)).toBe(true);
    expect(error).toMatchObject({ status: 303, location: route });
  }
}

describe('identity action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.reserveIdentityAttempt.mockResolvedValue(true);
    mocks.createAuthTransactionToken.mockResolvedValue(transactionToken);
    mocks.sendRegistrationCode.mockResolvedValue({ success: true });
  });

  it('rejects malformed e-mail addresses before creating a transaction', async () => {
    const result = await submitIdentifier('person@');

    expect(result).toMatchObject({
      status: 400,
      data: { error: 'error.fields.email.malformed', identifier: 'person@' },
    });
    expect(mocks.connectDb).not.toHaveBeenCalled();
    expect(mocks.createAuthTransactionToken).not.toHaveBeenCalled();
  });

  it('limits identity attempts before creating transactions or sending messages', async () => {
    mocks.reserveIdentityAttempt.mockResolvedValue(false);
    const result = await submitIdentifier('person@example.com');
    expect(result).toMatchObject({ status: 429, data: { error: 'error.auth.login.rate_limited' } });
    expect(mocks.createAuthTransactionToken).not.toHaveBeenCalled();
    expect(mocks.sendRegistrationCode).not.toHaveBeenCalled();
  });

  it('normalizes an unknown e-mail and routes it to registration', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: true,
      data: { nextRoute: '/register' },
    });

    await expectRedirect('  Person@Example.com  ', '/register');

    expect(mocks.startIdentityAuthTransaction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        id: transactionToken.id,
        browserVerifierHash: transactionToken.verifierHash,
        identifier: 'person@example.com',
      }),
    );
    expect(mocks.setAuthTransactionCookie).toHaveBeenCalledWith(
      expect.anything(),
      transactionToken.value,
    );
    expect(mocks.sendRegistrationCode).toHaveBeenCalled();
  });

  it('accepts a username and routes an existing account to challenge', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: true,
      data: { nextRoute: '/challenge' },
    });

    await expectRedirect('  galfus_user  ', '/challenge');

    expect(mocks.startIdentityAuthTransaction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ identifier: 'galfus_user' }),
    );
  });

  it('requires an email for a new account', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: true,
      data: { nextRoute: '/register' },
    });
    expect(await submitIdentifier('new_user')).toMatchObject({
      status: 400,
      data: { error: 'error.auth.registration.email_required' },
    });
    expect(mocks.sendRegistrationCode).not.toHaveBeenCalled();
  });

  it('redirects to registration with an error if email delivery fails', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: true,
      data: { nextRoute: '/register' },
    });
    mocks.sendRegistrationCode.mockRejectedValue(new Error('offline'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await submitIdentifier('new@example.com');
      throw new Error('Expected redirect');
    } catch (error) {
      expect(error).toMatchObject({ status: 303, location: '/register?delivery=failed' });
    }
    errorSpy.mockRestore();
  });

  it('does not persist an unsafe return destination', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: true,
      data: { nextRoute: '/register' },
    });

    await expectRedirect('user@example.com', '/register', 'https://attacker.example/steal');

    expect(mocks.startIdentityAuthTransaction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ returnTo: undefined }),
    );
  });

  it('returns a forbidden response when the account is blocked', async () => {
    mocks.startIdentityAuthTransaction.mockResolvedValue({
      success: false,
      error: { id: 'error.auth.account.blocked' },
    });

    const result = await submitIdentifier('galfus_user');

    expect(result).toMatchObject({
      status: 403,
      data: { error: 'error.auth.account.blocked', identifier: 'galfus_user' },
    });
    expect(mocks.setAuthTransactionCookie).not.toHaveBeenCalled();
  });

  it('returns a generic error when identity lookup fails unexpectedly', async () => {
    mocks.startIdentityAuthTransaction.mockRejectedValue(new Error('Database unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await submitIdentifier('galfus_user');

    expect(result).toMatchObject({
      status: 500,
      data: { error: 'error.auth.identity.lookup_failed', identifier: 'galfus_user' },
    });
    errorSpy.mockRestore();
  });
});
