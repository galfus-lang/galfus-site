import VerificationCode from '@galfus/design-system/email/VerificationCode.svelte';
import PasswordRecovery from '@galfus/design-system/email/PasswordRecovery.svelte';
import { safeLocale, translate, type Locale } from '@galfus/i18n';
import { render } from 'svelte/server';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface VerificationEmailInput {
  code: string;
  expiresInMinutes: number;
  locale?: Locale;
}

export async function renderPasswordRecoveryEmail(input: {
  url: string;
  expiresInMinutes: number;
  locale?: Locale;
}): Promise<RenderedEmail> {
  const url = new URL(input.url);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !Number.isSafeInteger(input.expiresInMinutes) ||
    input.expiresInMinutes < 1
  )
    throw new Error('Invalid password recovery email input.');
  const locale = safeLocale(input.locale);
  const subject = translate('email.recovery.subject', locale);
  const props = {
    preview: translate('email.recovery.preview', locale),
    title: translate('email.recovery.title', locale),
    introduction: translate('email.recovery.introduction', locale),
    action: translate('email.recovery.action', locale),
    url: url.toString(),
    expiration: translate('email.recovery.expiration', locale, { minutes: input.expiresInMinutes }),
    disclaimer: translate('email.recovery.disclaimer', locale),
  };
  const { head, body } = await render(PasswordRecovery, { props });
  return {
    subject,
    html: `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body style="margin: 0; padding: 0;">${body}</body></html>`,
    text: [
      props.title,
      props.introduction,
      `${props.action}: ${props.url}`,
      props.expiration,
      props.disclaimer,
    ].join('\n\n'),
  };
}

/** Render an email on the server. The caller owns code generation and expiry. */
export async function renderVerificationEmail(
  input: VerificationEmailInput,
): Promise<RenderedEmail> {
  if (!/^\d{6}$/.test(input.code)) {
    throw new Error('Verification code must contain exactly six digits.');
  }
  if (!Number.isSafeInteger(input.expiresInMinutes) || input.expiresInMinutes < 1) {
    throw new Error('Verification code expiry must be a positive number of minutes.');
  }

  const locale = safeLocale(input.locale);
  const subject = translate('email.verification.subject', locale);
  const props = {
    preview: translate('email.verification.preview', locale),
    title: translate('email.verification.title', locale),
    introduction: translate('email.verification.introduction', locale),
    code: input.code,
    expiration: translate('email.verification.expiration', locale, {
      minutes: input.expiresInMinutes,
    }),
    disclaimer: translate('email.verification.disclaimer', locale),
  };
  const { head, body } = await render(VerificationCode, { props });

  return {
    subject,
    html: `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body style="margin: 0; padding: 0;">${body}</body></html>`,
    text: [props.title, props.introduction, props.code, props.expiration, props.disclaimer].join(
      '\n\n',
    ),
  };
}
