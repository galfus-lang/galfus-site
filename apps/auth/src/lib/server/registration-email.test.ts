import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ reserve: vi.fn(), send: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({
  env: { RESEND_API_KEY: 'test', RESEND_FROM: 'test@example.com', AUTH_OTP_SECRET: 'x'.repeat(32) },
}));
vi.mock('@galfus/data-manager/server', () => ({ createRegistrationChallenge: mocks.reserve }));
vi.mock('@galfus/email-utils', () => ({
  createEmailSender: () => ({ send: mocks.send }),
  renderVerificationEmail: vi.fn(),
}));
import { sendRegistrationCode } from './registration-email';

it('does not send an email when the resend window is still active', async () => {
  mocks.reserve.mockResolvedValue({
    success: false,
    error: { id: 'error.auth.registration.resend_limited' },
  });
  const result = await sendRegistrationCode(
    {} as never,
    { id: 'test', verifierHash: 'test' },
    'pt-BR',
  );
  expect(result).toMatchObject({
    success: false,
    error: { id: 'error.auth.registration.resend_limited' },
  });
  expect(mocks.send).not.toHaveBeenCalled();
});
