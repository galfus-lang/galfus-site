import { env } from '$env/dynamic/private';
import { generateId, generateOtp, hashOtp } from '@galfus/auth-utils';
import { createRegistrationChallenge } from '@galfus/data-manager/server';
import { createEmailSender, renderVerificationEmail } from '@galfus/email-utils';
import type { Locale } from '@galfus/i18n';
import type { Surreal } from 'surrealdb';

export async function sendRegistrationCode(
  db: Surreal,
  token: { id: string; verifierHash: string },
  locale: Locale,
) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const pepper = env.AUTH_OTP_SECRET;
  if (!apiKey || !from || !pepper || pepper.length < 32) {
    throw new Error('Registration email delivery is not configured.');
  }

  const code = generateOtp();
  const challengeId = generateId();
  const result = await createRegistrationChallenge(db, {
    id: token.id,
    browserVerifierHash: token.verifierHash,
    challengeId,
    codeHash: await hashOtp(code, pepper),
  });
  if (!result.success) return result;

  const email = await renderVerificationEmail({ code, expiresInMinutes: 10, locale });
  const sender = createEmailSender({ apiKey, from });
  await sender.send({
    to: result.data.email,
    ...email,
    idempotencyKey: `registration/${challengeId}`,
  });
  return { success: true as const };
}
