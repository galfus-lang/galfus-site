import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  clearAuthTransactionCookie: vi.fn(),
  getAuthTransactionCookie: vi.fn(),
  setAuthAccessTokenCookie: vi.fn(),
  setAuthTransactionCookie: vi.fn(),
  connectDb: vi.fn(),
  getAuthTransaction: vi.fn(),
  completeUpsertPasswordTransaction: vi.fn(),
  getAccountAccessState: vi.fn(),
  jwtSign: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthTransactionCookie: mocks.getAuthTransactionCookie,
  setAuthAccessTokenCookie: mocks.setAuthAccessTokenCookie,
  setAuthTransactionCookie: mocks.setAuthTransactionCookie,
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
vi.mock('$lib/server/i18n', () => ({ getRequestLocale: () => 'en-US' }));
vi.mock('$lib/server/access-session', () => ({
  issueAccessToken: (...args: unknown[]) => mocks.jwtSign(...args),
}));
vi.mock('$lib/server/jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: {
    sign: mocks.jwtSign,
  },
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  completeUpsertPasswordTransaction: mocks.completeUpsertPasswordTransaction,
  getAccountAccessState: mocks.getAccountAccessState,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./upsert-password/+page.server');

const validTransactionToken = `01JQ3VVRJ6WZFQYGG5HS5T6H0X.${'a'.repeat(43)}`;

describe('upsert-password server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.getAccountAccessState.mockResolvedValue({
      success: true,
      data: { status: 'active', credential_version: 3 },
    });
    mocks.jwtSign.mockResolvedValue('signed-access-token');
  });

  describe('load', () => {
    it('sets cookie and redirects if URL has code parameter', async () => {
      try {
        await load({
          cookies: {} as never,
          url: new URL(`http://localhost:5001/upsert-password?code=${validTransactionToken}`),
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/upsert-password' });
        expect(mocks.setAuthTransactionCookie).toHaveBeenCalledWith(
          expect.anything(),
          validTransactionToken,
        );
      }
    });

    it('redirects to / when cookie is missing', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(undefined);

      try {
        await load({
          cookies: {} as never,
          url: new URL('http://localhost:5001/upsert-password'),
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/' });
      }
    });

    it('renders page when valid transaction exists', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'upsert_password',
          status: 'pending',
          account: 'account:test_account',
          version: 0,
        },
      });

      const result = await load({
        cookies: {} as never,
        url: new URL('http://localhost:5001/upsert-password'),
      } as never);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('fails when password is missing', async () => {
      const form = new FormData();
      const result = await actions.default({
        request: new Request('http://localhost:5001/upsert-password', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.pass.required' },
      });
    });

    it('fails when password is too short', async () => {
      const form = new FormData();
      form.set('password', 'short');
      form.set('confirmPassword', 'short');

      const result = await actions.default({
        request: new Request('http://localhost:5001/upsert-password', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.pass.too_short' },
      });
    });

    it('fails when passwords do not match', async () => {
      const form = new FormData();
      form.set('password', 'password1234');
      form.set('confirmPassword', 'password5678');

      const result = await actions.default({
        request: new Request('http://localhost:5001/upsert-password', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.pass.password_dont_match' },
      });
    });

    it('successfully completes upsert password transaction, signs token and redirects to /success', async () => {
      mocks.getAuthTransactionCookie.mockReturnValue(validTransactionToken);
      mocks.getAuthTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          kind: 'upsert_password',
          status: 'pending',
          account: 'account:test_account',
          version: 0,
        },
      });
      mocks.completeUpsertPasswordTransaction.mockResolvedValue({
        success: true,
        data: {
          id: '01JQ3VVRJ6WZFQYGG5HS5T6H0X',
          account: 'account:test_account',
          status: 'completed',
          version: 1,
        },
      });

      const form = new FormData();
      form.set('password', 'brand_new_secret_123');
      form.set('confirmPassword', 'brand_new_secret_123');

      try {
        await actions.default({
          request: new Request('http://localhost:5001/upsert-password', {
            method: 'POST',
            body: form,
          }),
          cookies: {} as never,
        } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/success' });
        expect(mocks.completeUpsertPasswordTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            accountId: 'account:test_account',
            password: 'brand_new_secret_123',
          }),
        );
        expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalledWith(
          expect.anything(),
          'signed-access-token',
        );
        expect(mocks.clearAuthTransactionCookie).toHaveBeenCalled();
      }
    });
  });
});
