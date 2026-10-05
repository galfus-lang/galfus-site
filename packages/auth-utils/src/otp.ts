import * as OTPAuth from 'otpauth';

import { constantTimeEqualBase64Url, hashSecret } from './secrets';

export interface TotpEnrollment {
  secret: string;
  uri: string;
  issuer: string;
  label: string;
}

export interface TotpOptions {
  issuer: string;
  label: string;
  secret?: string;
  period?: number;
  digits?: number;
}

function createTotp(options: TotpOptions): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: options.issuer,
    label: options.label,
    algorithm: 'SHA1',
    digits: options.digits ?? 6,
    period: options.period ?? 30,
    secret: options.secret
      ? OTPAuth.Secret.fromBase32(options.secret)
      : new OTPAuth.Secret({ size: 20 }),
  });
}

/** Creates a TOTP secret and provisioning URI; persist only after first verification. */
export function createTotpEnrollment(options: TotpOptions): TotpEnrollment {
  const totp = createTotp(options);
  const secret = totp.secret.base32;

  return { secret, uri: totp.toString(), issuer: options.issuer, label: options.label };
}

/** Validates a TOTP value with one adjacent period for small clock drift. */
export function verifyTotp(
  token: string,
  options: Required<Pick<TotpOptions, 'issuer' | 'label' | 'secret'>> &
    Pick<TotpOptions, 'period' | 'digits'>,
): boolean {
  if (!/^\d{6,8}$/.test(token)) return false;
  return createTotp(options).validate({ token, window: 1 }) !== null;
}

/** Generates a decimal OTP without modulo bias. */
export function generateOtp(length = 6): string {
  if (!Number.isSafeInteger(length) || length < 6 || length > 10) {
    throw new Error('OTP length must be an integer between 6 and 10.');
  }

  const range = 10 ** length;
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  const random = new Uint32Array(1);
  let value: number;

  do {
    crypto.getRandomValues(random);
    value = random[0]!;
  } while (value >= limit);

  return String(value % range).padStart(length, '0');
}

/** Hashes a one-time code with a caller-owned pepper before persistence. */
export async function hashOtp(code: string, pepper: string): Promise<string> {
  if (!/^\d{6,10}$/.test(code) || !pepper) {
    throw new Error('A numeric OTP and non-empty pepper are required.');
  }
  return hashSecret(`${pepper}:${code}`);
}

export async function verifyOtp(
  code: string,
  pepper: string,
  expectedHash: string,
): Promise<boolean> {
  if (!/^\d{6,10}$/.test(code) || !pepper || !expectedHash) return false;
  return constantTimeEqualBase64Url(await hashOtp(code, pepper), expectedHash);
}
