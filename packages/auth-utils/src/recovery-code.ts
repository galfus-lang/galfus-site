import { constantTimeEqualBase64Url, hashSecret, randomBytes } from './secrets';

const recoveryAlphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const recoveryCodePattern = /^[A-HJKMNP-TV-Z2-9]{4}-[A-HJKMNP-TV-Z2-9]{4}$/;

function normalizeRecoveryCode(value: string): string {
  return value.trim().toUpperCase();
}

/** Generates a human-readable recovery code using rejection sampling. */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(10);
  const characters: string[] = [];
  const limit = Math.floor(256 / recoveryAlphabet.length) * recoveryAlphabet.length;

  for (const byte of bytes) {
    if (byte >= limit) continue;
    characters.push(recoveryAlphabet[byte % recoveryAlphabet.length]!);
    if (characters.length === 8) break;
  }
  return characters.length === 8
    ? `${characters.slice(0, 4).join('')}-${characters.slice(4).join('')}`
    : generateRecoveryCode();
}

export function generateRecoveryCodes(count = 10): string[] {
  if (!Number.isSafeInteger(count) || count < 1 || count > 32) {
    throw new Error('Recovery code count must be an integer between 1 and 32.');
  }

  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateRecoveryCode());
  return [...codes];
}

/** Hashes a recovery code with a caller-owned pepper before persistence. */
export async function hashRecoveryCode(code: string, pepper: string): Promise<string> {
  const normalized = normalizeRecoveryCode(code);
  if (!recoveryCodePattern.test(normalized) || !pepper) {
    throw new Error('A valid recovery code and non-empty pepper are required.');
  }
  return hashSecret(`${pepper}\u0000${normalized}`);
}

export async function verifyRecoveryCode(
  code: string,
  pepper: string,
  expectedHash: string,
): Promise<boolean> {
  try {
    return constantTimeEqualBase64Url(await hashRecoveryCode(code, pepper), expectedHash);
  } catch {
    return false;
  }
}
