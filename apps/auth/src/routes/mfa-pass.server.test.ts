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
  createOtpChallenge: vi.fn(),
  confirmOtpAuthTransaction: vi.fn(),
  completeAuthTransaction: vi.fn(),
  sendEmail: vi.fn(),
  sendSms: vi.fn(),
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

vi.mock('$lib/server/messaging', () => ({
  messageDelivery: {
    sendEmail: mocks.sendEmail,
    sendSms: mocks.sendSms,
  },
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  getActiveMfaAuthenticator: mocks.getActiveMfaAuthenticator,
  createOtpChallenge: mocks.createOtpChallenge,
  confirmOtpAuthTransaction: mocks.confirmOtpAuthTransaction,
  completeAuthTransaction: mocks.completeAuthTransaction,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./mfa-pass/+page.server');

const validTransactionToken = `01JQ3VVRJ6WZFQYGG5HS5T6H0X.${'a'.repeat(43)}`;

describe('mfa-pass server route', () => {
  let mockDbQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQuery = vi.fn().mockReturnValue({ json: () => Promise.resolve([[]]) });
    mocks.connectDb.mockResolvedValue({ query: mockDbQuery });
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

    it('redirects to /mfa-otp when pending MFA method is totp', async () => {
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

      try {
        await load({ cookies: {} as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/mfa-otp' });
      }
    });

    it('creates OTP challenge and sends email when no active challenge exists', async () => {
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
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: {
          id: 'authenticator:email_1',
          kind: 'email_otp',
        },
      });

      const result = await load({ cookies: {} as never } as never);

      expect(mocks.createOtpChallenge).toHaveBeenCalled();
      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@galfus.com' }),
      );
      expect(result).toMatchObject({
        channel: 'email',
      });
    });
  });

  describe('actions.verify', () => {
    it('fails with 400 when OTP code is not 6 digits', async () => {
      const form = new FormData();
      form.set('otp', '12');

      const result = await actions.verify({
        request: new Request('http://localhost:5001/mfa-pass', { method: 'POST', body: form }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.otp.invalid' },
      });
    });

    it('fails with 401 when confirmOtpAuthTransaction returns failure', async () => {
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
      mockDbQuery.mockReturnValue({
        json: () => Promise.resolve([[{ id: 'auth_otp_challenge:ch_1' }]]),
      });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: { id: 'authenticator:email_1', kind: 'email_otp' },
      });
      mocks.confirmOtpAuthTransaction.mockResolvedValue({
        success: false,
        error: { id: 'error.auth.otp.incorrect' },
      });

      const form = new FormData();
      form.set('otp', '654321');

      const result = await actions.verify({
        request: new Request('http://localhost:5001/mfa-pass', { method: 'POST', body: form }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 401,
        data: { error: 'error.auth.otp.incorrect' },
      });
    });

    it('confirms OTP and redirects to /success on valid code', async () => {
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
      mockDbQuery.mockReturnValue({
        json: () => Promise.resolve([[{ id: 'auth_otp_challenge:ch_1' }]]),
      });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: { id: 'authenticator:email_1', kind: 'email_otp' },
      });
      mocks.confirmOtpAuthTransaction.mockResolvedValue({
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
          request: new Request('http://localhost:5001/mfa-pass', { method: 'POST', body: form }),
          cookies: {} as never,
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/success' });
        expect(mocks.confirmOtpAuthTransaction).toHaveBeenCalled();
        expect(mocks.completeAuthTransaction).toHaveBeenCalled();
        expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalledWith(
          expect.anything(),
          'signed-access-token',
        );
      }
    });
  });

  describe('actions.resend', () => {
    it('creates fresh OTP challenge and dispatches message', async () => {
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
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: { id: 'authenticator:email_1', kind: 'email_otp' },
      });

      const result = await actions.resend({
        cookies: {} as never,
      } as never);

      expect(result).toEqual({ success: true });
      expect(mocks.createOtpChallenge).toHaveBeenCalled();
      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@galfus.com' }),
      );
    });
  });
});
