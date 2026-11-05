import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  clearAuthTransactionCookie: vi.fn(),
  connectDb: vi.fn(),
  getAuthTransactionCookie: vi.fn(),
  setAuthAccessTokenCookie: vi.fn(),
  getAuthTransaction: vi.fn(),
  confirmPasswordAuthTransaction: vi.fn(),
  completeAuthTransaction: vi.fn(),
  getAccountAuthenticationState: vi.fn(),
  getAccountPasskeys: vi.fn(),
  setPasskeyAuthTransactionChallenge: vi.fn(),
  authorizePasskeyAuthTransaction: vi.fn(),
  createPasskeyAuthenticationOptions: vi.fn(),
  verifyPasskeyAuthentication: vi.fn(),
  jwtSign: vi.fn(),
  jwtVerify: vi.fn(),
  reservePasswordAttempt: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$env/dynamic/private', () => ({ env: { AUTH_RATE_LIMIT_SECRET: 'x'.repeat(32) } }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthAccessTokenCookie: vi.fn(),
  getAuthTransactionCookie: mocks.getAuthTransactionCookie,
  setAuthAccessTokenCookie: mocks.setAuthAccessTokenCookie,
  setAuthTransactionCookie: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
vi.mock('$lib/server/password-attempt', () => ({
  reserveLoginAttempt: async () => (await mocks.reservePasswordAttempt()).data,
}));
vi.mock('$lib/server/i18n', () => ({ getRequestLocale: () => 'en-US' }));
vi.mock('$lib/server/access-session', () => ({
  issueAccessToken: (...args: unknown[]) => mocks.jwtSign(...args),
  getPrimaryCredentialVersion: () => 3,
}));
vi.mock('$lib/server/jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: {
    sign: mocks.jwtSign,
    verify: mocks.jwtVerify,
  },
}));
vi.mock('$lib/server/passkey', () => ({
  getPasskeyRelyingParty: () => ({
    id: 'localhost',
    name: 'Galfus Local',
    origin: 'http://localhost:5001',
  }),
}));

vi.mock('@galfus/auth-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/auth-utils')>()),
  createPasskeyAuthenticationOptions: mocks.createPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication: mocks.verifyPasskeyAuthentication,
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  confirmPasswordAuthTransaction: mocks.confirmPasswordAuthTransaction,
  completeAuthTransaction: mocks.completeAuthTransaction,
  getAccountAuthenticationState: mocks.getAccountAuthenticationState,
  getAccountPasskeys: mocks.getAccountPasskeys,
  setPasskeyAuthTransactionChallenge: mocks.setPasskeyAuthTransactionChallenge,
  authorizePasskeyAuthTransaction: mocks.authorizePasskeyAuthTransaction,
  reservePasswordAttempt: mocks.reservePasswordAttempt,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./challenge/+page.server');

const validTransactionToken = `01JQ3VVRJ6WZFQYGG5HS5T6H0X.${'a'.repeat(43)}`;

describe('challenge server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.jwtSign.mockResolvedValue('signed-access-token');
    mocks.reservePasswordAttempt.mockResolvedValue({ success: true, data: true });
  });

  describe('load', () => {
    it('redirects to / when cookie is missing', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(undefined);

      try {
        await load({ cookies: {} as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/' });
      }
    });

    it('returns identifier and passkey availability on valid authorization transaction', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 0,
          metadata: {
            authorization: {
              identifier: 'user@galfus.com',
              provider: 'email',
            },
          },
        },
      });
      mocks.getAccountAuthenticationState.mockResolvedValue({
        success: true,
        data: { hasPasskey: true, mfaEnabled: false },
      });

      const result = await load({ cookies: {} as never } as never);

      expect(result).toEqual({
        identifier: 'user@galfus.com',
        hasPasskey: true,
      });
    });
  });

  describe('actions.password', () => {
    it('rejects attempts exceeding the account or address limit', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test',
          version: 0,
          metadata: { authorization: {} },
        },
      });
      mocks.reservePasswordAttempt.mockResolvedValue({ success: true, data: false });
      const body = new FormData();
      body.set('password', 'some-password');
      const result = await actions.password({
        request: new Request('http://localhost/challenge', { method: 'POST', body }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);
      expect(result).toMatchObject({
        status: 429,
        data: { error: 'error.auth.login.rate_limited' },
      });
      expect(mocks.confirmPasswordAuthTransaction).not.toHaveBeenCalled();
    });
    it('fails with 400 when password is missing', async () => {
      const form = new FormData();
      const result = await actions.password({
        request: new Request('http://localhost:5001/challenge?/password', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.pass.required' },
      });
    });

    it('fails with 401 on incorrect password', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 0,
          metadata: { authorization: { identifier: 'user@galfus.com' } },
        },
      });
      mocks.confirmPasswordAuthTransaction.mockResolvedValue({
        success: false,
        error: { id: 'error.auth.pass.incorrect' },
      });

      const form = new FormData();
      form.set('password', 'wrong_pass');

      const result = await actions.password({
        request: new Request('http://localhost:5001/challenge?/password', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toMatchObject({
        status: 401,
        data: { error: 'error.auth.pass.incorrect' },
      });
    });

    it('redirects to /mfa-otp when transaction transitions to awaiting_mfa with totp', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 0,
          metadata: { authorization: { identifier: 'user@galfus.com' } },
        },
      });
      mocks.confirmPasswordAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          version: 1,
          metadata: {
            authorization: {
              pending_mfa_method: 'totp',
            },
          },
        },
      });

      const form = new FormData();
      form.set('password', 'correct_pass');

      try {
        await actions.password({
          request: new Request('http://localhost:5001/challenge?/password', {
            method: 'POST',
            body: form,
          }),
          cookies: {} as never,
          getClientAddress: () => '127.0.0.1',
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/mfa-otp' });
      }
    });

    it('completes transaction and redirects to /success on valid password with no MFA', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 0,
          metadata: { authorization: { identifier: 'user@galfus.com' } },
        },
      });
      mocks.confirmPasswordAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'authorized',
          version: 1,
        },
      });
      mocks.completeAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          account: 'account:test_account',
          status: 'completed',
          version: 2,
        },
      });

      const form = new FormData();
      form.set('password', 'correct_pass');

      try {
        await actions.password({
          request: new Request('http://localhost:5001/challenge?/password', {
            method: 'POST',
            body: form,
          }),
          cookies: {} as never,
          getClientAddress: () => '127.0.0.1',
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/success' });
        expect(mocks.completeAuthTransaction).toHaveBeenCalled();
        expect(mocks.jwtSign).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ accountId: 'account:test_account' }),
          3,
        );
        expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalledWith(
          expect.anything(),
          'signed-access-token',
        );
        expect(mocks.clearAuthTransactionCookie).toHaveBeenCalled();
      }
    });
  });

  describe('actions.passkeyOptions', () => {
    it('generates passkey assertion options and saves challenge', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 0,
        },
      });
      mocks.getAccountPasskeys.mockResolvedValue([
        { id: 'auth:1', credentialId: 'cred-123', transports: ['internal'] },
      ]);
      mocks.createPasskeyAuthenticationOptions.mockResolvedValue({
        challenge: 'generated-challenge-123',
        allowCredentials: [{ id: 'cred-123' }],
      });
      mocks.setPasskeyAuthTransactionChallenge.mockResolvedValue({ success: true });

      const result = await actions.passkeyOptions({
        request: new Request('http://localhost:5001/challenge?/passkeyOptions', {
          headers: { origin: 'http://localhost:5001' },
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({
        options: {
          challenge: 'generated-challenge-123',
          allowCredentials: [{ id: 'cred-123' }],
        },
      });
      expect(mocks.setPasskeyAuthTransactionChallenge).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          challengeCiphertext: 'generated-challenge-123',
        }),
      );
    });
  });

  describe('actions.passkeyVerify', () => {
    it('verifies passkey assertion, completes transaction and redirects to /success', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_primary',
          account: 'account:test_account',
          version: 1,
          metadata: {
            authorization: {
              identifier: 'user@galfus.com',
              passkey: {
                challenge_ciphertext: 'saved-challenge-123',
              },
            },
          },
        },
      });
      mocks.getAccountPasskeys.mockResolvedValue([
        {
          id: 'auth:1',
          credentialId: 'cred-123',
          publicKey: 'pk-bytes',
          counter: 5,
        },
      ]);
      mocks.verifyPasskeyAuthentication.mockResolvedValue({
        verified: true,
        newCounter: 6,
      });
      mocks.authorizePasskeyAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'authorized',
          version: 2,
        },
      });
      mocks.completeAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          account: 'account:test_account',
          status: 'completed',
          version: 3,
        },
      });

      const body = new FormData();
      body.set(
        'response',
        JSON.stringify({
          id: 'cred-123',
          rawId: 'cred-123',
          response: {
            clientDataJSON: 'xyz',
            authenticatorData: 'abc',
            signature: 'sig',
          },
        }),
      );

      const result = await actions.passkeyVerify({
        request: new Request('http://localhost:5001/challenge?/passkeyVerify', {
          method: 'POST',
          headers: { origin: 'http://localhost:5001' },
          body,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ redirectUrl: '/success' });
      expect(mocks.verifyPasskeyAuthentication).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'saved-challenge-123',
        }),
      );
      expect(mocks.authorizePasskeyAuthTransaction).toHaveBeenCalled();
      expect(mocks.completeAuthTransaction).toHaveBeenCalled();
      expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalled();
      expect(mocks.clearAuthTransactionCookie).toHaveBeenCalled();
    });
  });
});
