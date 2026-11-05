import { expect, it, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({
  env: {
    AUTH_TOTP_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    AUTH_RECOVERY_PEPPER: 'x'.repeat(32),
  },
}));
import { decryptTotpSecret, encryptTotpSecret, recoveryPepper } from './totp-secrets';

it('encrypts TOTP material and rejects modifications', async () => {
  const ciphertext = await encryptTotpSecret('JBSWY3DPEHPK3PXP');
  expect(ciphertext).not.toContain('JBSWY3DPEHPK3PXP');
  expect(await decryptTotpSecret(ciphertext)).toBe('JBSWY3DPEHPK3PXP');
  const altered = `${ciphertext[0] === 'A' ? 'B' : 'A'}${ciphertext.slice(1)}`;
  await expect(decryptTotpSecret(altered)).rejects.toThrow();
  expect(recoveryPepper()).toHaveLength(32);
});
