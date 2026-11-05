import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthTransactionCookie: vi.fn(),
  connectDb: vi.fn(),
  getAuthTransactionCookie: vi.fn(),
  setAuthAccessTokenCookie: vi.fn(),
  getAuthTransaction: vi.fn(),
  completeVerifiedRegistration: vi.fn(),
  sendRegistrationCode: vi.fn(),
  jwtSign: vi.fn(),
}));
vi.mock('$env/dynamic/private', () => ({ env: { AUTH_OTP_SECRET: 'x'.repeat(32) } }));
vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthTransactionCookie: mocks.getAuthTransactionCookie,
  setAuthAccessTokenCookie: mocks.setAuthAccessTokenCookie,
}));
vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
vi.mock('$lib/server/registration-email', () => ({
  sendRegistrationCode: mocks.sendRegistrationCode,
}));
vi.mock('$lib/server/i18n', () => ({ getRequestLocale: () => 'en-US' }));
vi.mock('$lib/server/access-session', () => ({
  issueAccessToken: (...args: unknown[]) => mocks.jwtSign(...args),
}));
vi.mock('$lib/server/jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: { sign: mocks.jwtSign },
}));
vi.mock('@galfus/data-manager/server', () => ({
  getAuthTransaction: mocks.getAuthTransaction,
  completeVerifiedRegistration: mocks.completeVerifiedRegistration,
}));
vi.mock('@galfus/i18n', async (original) => ({
  ...(await original<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));
const { load, actions } = await import('./register/+page.server');
const token = `01JQ3VVRJ6WZFQYGG5HS5T6H0X.${'a'.repeat(43)}`;
function form(code = '012345') {
  const data = new FormData();
  data.set('code', code);
  data.set('fullName', 'John Doe');
  data.set('password', 'SuperSecret123!');
  data.set('confirmPassword', 'SuperSecret123!');
  return new Request('http://localhost:5001/register', { method: 'POST', body: data });
}
describe('verified registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.jwtSign.mockResolvedValue('signed-token');
    mocks.getAuthTransactionCookie.mockReturnValue(token);
    mocks.getAuthTransaction.mockResolvedValue({
      success: true,
      data: {
        kind: 'registration',
        status: 'awaiting_primary',
        metadata: { registration: { identifier: 'new@example.com', provider: 'email' } },
      },
    });
  });
  it('renders the email from the transaction', async () => {
    expect(
      await load({ cookies: {} as never, url: new URL('http://localhost/register') } as never),
    ).toMatchObject({ identifier: 'new@example.com' });
  });
  it('rejects an invalid code before completing registration', async () => {
    const result = await actions.register({ request: form('bad'), cookies: {} as never } as never);
    expect(result).toMatchObject({ status: 400, data: { error: 'error.auth.otp.invalid' } });
    expect(mocks.completeVerifiedRegistration).not.toHaveBeenCalled();
  });
  it('does not issue a session when the code is rejected', async () => {
    mocks.completeVerifiedRegistration.mockResolvedValue({
      success: false,
      error: { id: 'error.auth.otp.invalid' },
    });
    const result = await actions.register({ request: form(), cookies: {} as never } as never);
    expect(result).toMatchObject({ status: 400 });
    expect(mocks.setAuthAccessTokenCookie).not.toHaveBeenCalled();
  });
  it('issues a session only after the verified account was created', async () => {
    mocks.completeVerifiedRegistration.mockResolvedValue({
      success: true,
      data: { accountId: 'account:user' },
    });
    try {
      await actions.register({ request: form(), cookies: {} as never } as never);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect(error).toMatchObject({ location: '/success' });
    }
    expect(mocks.completeVerifiedRegistration).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ fullName: 'John Doe', codeHash: expect.any(String) }),
    );
    expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalledWith(expect.anything(), 'signed-token');
  });
  it('reports a delivery failure on resend', async () => {
    mocks.sendRegistrationCode.mockRejectedValue(new Error('offline'));
    const result = await actions.resend({ request: form(), cookies: {} as never } as never);
    expect(result).toMatchObject({
      status: 503,
      data: { error: 'error.auth.registration.delivery_failed' },
    });
  });
  it('reports the resend limit instead of treating it as a successful delivery', async () => {
    mocks.sendRegistrationCode.mockResolvedValue({
      success: false,
      error: { id: 'error.auth.registration.resend_limited' },
    });
    const result = await actions.resend({ request: form(), cookies: {} as never } as never);
    expect(result).toMatchObject({
      status: 429,
      data: { error: 'error.auth.registration.resend_limited' },
    });
  });
});
