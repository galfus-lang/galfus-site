import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  clearAuthTransactionCookie: vi.fn(),
  connectDb: vi.fn(),
  getAuthTransactionCookie: vi.fn(),
  setAuthAccessTokenCookie: vi.fn(),
  getAuthTransaction: vi.fn(),
  getActiveMfaAuthenticator: vi.fn(),
  confirmTotpAuthTransaction: vi.fn(),
  confirmRecoveryCodeAuthTransaction: vi.fn(),
  completeAuthTransaction: vi.fn(),
  verifyTotp: vi.fn(),
  jwtSign: vi.fn(),
  jwtVerify: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthAccessTokenCookie: vi.fn(),
  getAuthTransactionCookie: mocks.getAuthTransactionCookie,
  setAuthAccessTokenCookie: mocks.setAuthAccessTokenCookie,
  setAuthTransactionCookie: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
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

vi.mock('@galfus/auth-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/auth-utils')>()),
  verifyTotp: mocks.verifyTotp,
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  getActiveMfaAuthenticator: mocks.getActiveMfaAuthenticator,
  confirmTotpAuthTransaction: mocks.confirmTotpAuthTransaction,
  confirmRecoveryCodeAuthTransaction: mocks.confirmRecoveryCodeAuthTransaction,
  completeAuthTransaction: mocks.completeAuthTransaction,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./mfa-otp/+page.server');

const validTransactionToken = `01JQ3VVRJ6WZFQYGG5HS5T6H0X.${'a'.repeat(43)}`;

describe('mfa-otp server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.jwtSign.mockResolvedValue('signed-access-token');
  });

  describe('load', () => {
    it('redirects to / when transaction cookie is missing', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(undefined);

      try {
        await load({ cookies: {} as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/' });
      }
    });

    it('redirects to /mfa-pass when pending MFA method is email_otp', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          account: 'account:test',
          version: 1,
          metadata: {
            authorization: {
              pending_mfa_method: 'email_otp',
              identifier: 'user@galfus.com',
            },
          },
        },
      });

      try {
        await load({ cookies: {} as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/mfa-pass' });
      }
    });

    it('returns identifier on valid awaiting_mfa transaction for TOTP', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          account: 'account:test',
          version: 1,
          metadata: {
            authorization: {
              pending_mfa_method: 'totp',
              identifier: 'user@galfus.com',
            },
          },
        },
      });

      const result = await load({ cookies: {} as never } as never);

      expect(result).toEqual({
        identifier: 'user@galfus.com',
      });
    });
  });

  describe('actions.verify', () => {
    it('fails with 400 when OTP code is not 6 digits', async () => {
      const form = new FormData();
      form.set('otp', '123');

      const result = await actions.verify({
        request: new Request('http://localhost:5001/mfa-otp', { method: 'POST', body: form }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.otp.invalid' },
      });
    });

    it('fails with 401 when verifyTotp returns false', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          account: 'account:test',
          version: 1,
          metadata: {
            authorization: { identifier: 'user@galfus.com', pending_mfa_method: 'totp' },
          },
        },
      });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: {
          id: 'authenticator:totp_1',
          kind: 'totp',
          secretCiphertext: 'JBSWY3DPEHPK3PXP',
        },
      });
      mocks.verifyTotp.mockReturnValue(false);

      const form = new FormData();
      form.set('otp', '123456');

      const result = await actions.verify({
        request: new Request('http://localhost:5001/mfa-otp', { method: 'POST', body: form }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 401,
        data: { error: 'error.auth.otp.incorrect' },
      });
    });

    it('confirms transaction and redirects to /success on valid TOTP code', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          account: 'account:test',
          version: 1,
          metadata: {
            authorization: { identifier: 'user@galfus.com', pending_mfa_method: 'totp' },
          },
        },
      });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: {
          id: 'authenticator:totp_1',
          kind: 'totp',
          secretCiphertext: 'JBSWY3DPEHPK3PXP',
        },
      });
      mocks.verifyTotp.mockReturnValue(true);
      mocks.confirmTotpAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          status: 'authorized',
          version: 2,
        },
      });
      mocks.completeAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          account: 'account:test',
          status: 'completed',
          version: 3,
        },
      });

      const form = new FormData();
      form.set('otp', '123456');

      try {
        await actions.verify({
          request: new Request('http://localhost:5001/mfa-otp', { method: 'POST', body: form }),
          cookies: {} as never,
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/success' });
        expect(mocks.confirmTotpAuthTransaction).toHaveBeenCalled();
        expect(mocks.completeAuthTransaction).toHaveBeenCalled();
        expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalledWith(
          expect.anything(),
          'signed-access-token',
        );
        expect(mocks.clearAuthTransactionCookie).toHaveBeenCalled();
      }
    });
  });

  describe('actions.recovery', () => {
    it('confirms recovery code and redirects to /success', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'authorization',
          status: 'awaiting_mfa',
          account: 'account:test',
          version: 1,
          metadata: {
            authorization: { identifier: 'user@galfus.com', pending_mfa_method: 'totp' },
          },
        },
      });
      mocks.confirmRecoveryCodeAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          status: 'authorized',
          version: 2,
        },
      });
      mocks.completeAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          account: 'account:test',
          status: 'completed',
          version: 3,
        },
      });

      const form = new FormData();
      form.set('recoveryCode', 'ABCD-EFGH-IJKL');

      try {
        await actions.recovery({
          request: new Request('http://localhost:5001/mfa-otp?/recovery', {
            method: 'POST',
            body: form,
          }),
          cookies: {} as never,
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/success' });
        expect(mocks.confirmRecoveryCodeAuthTransaction).toHaveBeenCalled();
        expect(mocks.completeAuthTransaction).toHaveBeenCalled();
      }
    });
  });
});
