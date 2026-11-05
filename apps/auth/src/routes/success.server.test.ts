import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  getAuthAccessTokenCookie: vi.fn(),
  jwtVerify: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  getAuthAccessTokenCookie: mocks.getAuthAccessTokenCookie,
}));

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

const { load } = await import('./success/+page.server');

describe('success server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to / when access token is missing', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue(undefined);

    try {
      await load({ cookies: {} as never } as never);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect(error).toMatchObject({ status: 303, location: '/' });
    }
  });

  it('clears token and redirects to / when access token is invalid', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('invalid-jwt');
    mocks.jwtVerify.mockRejectedValue(new Error('Signature verification failed'));

    try {
      await load({ cookies: {} as never } as never);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect(error).toMatchObject({ status: 303, location: '/' });
      expect(mocks.clearAuthAccessTokenCookie).toHaveBeenCalled();
    }
  });

  it('returns validated destination when access token is valid', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-jwt');
    mocks.jwtVerify.mockResolvedValue({
      flow: 'access',
      sub: 'account:test',
      rto: '/dashboard',
    });

    const result = await load({ cookies: {} as never } as never);

    expect(result).toHaveProperty('destination');
    expect(result.destination).toContain('/dashboard');
  });
});
