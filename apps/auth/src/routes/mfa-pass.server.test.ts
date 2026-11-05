import { isRedirect } from '@sveltejs/kit';
import { expect, it, vi } from 'vitest';

const clear = vi.hoisted(() => vi.fn());
vi.mock('$lib/server/auth-cookies', () => ({ clearAuthTransactionCookie: clear }));
const { load, actions } = await import('./mfa-pass/+page.server');

it.each([load, actions.verify, actions.resend])('rejects unsupported sent-code MFA', (handler) => {
  try {
    handler({ cookies: {} as never } as never);
    throw new Error('Expected redirect');
  } catch (error) {
    expect(isRedirect(error)).toBe(true);
    expect(error).toMatchObject({ status: 303, location: '/' });
    expect(clear).toHaveBeenCalled();
  }
});
