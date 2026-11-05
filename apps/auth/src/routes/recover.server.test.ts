import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  getAuthAccessTokenCookie: vi.fn(),
  connectDb: vi.fn(),
  startPasswordRecoveryTransaction: vi.fn(),
  jwtVerify: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  getAuthAccessTokenCookie: mocks.getAuthAccessTokenCookie,
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
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
  jwt: {
    verify: mocks.jwtVerify,
  },
}));

vi.mock('@galfus/data-manager/server', () => ({
  startPasswordRecoveryTransaction: mocks.startPasswordRecoveryTransaction,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./recover/+page.server');

describe('recover server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
  });

  describe('load', () => {
    it('redirects to main app if valid access token exists', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-token');
      mocks.jwtVerify.mockResolvedValue({ sub: 'account:1' });

      try {
        await load({
          cookies: {} as never,
          url: new URL('http://localhost:5001/recover?rto=/dashboard'),
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: 'http://localhost:5002/dashboard' });
      }
    });

    it('returns empty object when unauthenticated', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue(undefined);
      const result = await load({
        cookies: {} as never,
        url: new URL('http://localhost:5001/recover'),
      } as never);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('fails on invalid identifier format', async () => {
      const form = new FormData();
      form.set('identifier', '');

      const result = await actions.default({
        request: new Request('http://localhost:5001/recover', { method: 'POST', body: form }),
        url: new URL('http://localhost:5001/recover'),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.input.invalid' },
      });
    });

    it('returns success even if account does not exist (neutral response)', async () => {
      mocks.startPasswordRecoveryTransaction.mockResolvedValue({
        success: true,
        data: null,
      });

      const form = new FormData();
      form.set('identifier', 'nonexistent@example.com');

      const result = await actions.default({
        request: new Request('http://localhost:5001/recover', { method: 'POST', body: form }),
        url: new URL('http://localhost:5001/recover'),
        cookies: {} as never,
      } as never);

      expect(result).toEqual({
        success: true,
        identifier: 'nonexistent@example.com',
      });
    });

    it('creates recovery transaction and dispatches email when account exists', async () => {
      mocks.startPasswordRecoveryTransaction.mockResolvedValue({
        success: true,
        data: {
          transaction: { id: 'tx-123', kind: 'upsert_password' },
          targetEmail: 'user@galfus.com',
        },
      });

      const form = new FormData();
      form.set('identifier', 'user@galfus.com');

      const result = await actions.default({
        request: new Request('http://localhost:5001/recover', { method: 'POST', body: form }),
        url: new URL('http://localhost:5001/recover'),
        cookies: {} as never,
      } as never);

      expect(result).toEqual({
        success: true,
        identifier: 'user@galfus.com',
      });
      expect(mocks.startPasswordRecoveryTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          identifier: 'user@galfus.com',
        }),
      );
    });
  });
});
