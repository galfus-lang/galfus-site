import VerificationCode from '@galfus/design-system/email/VerificationCode.svelte';
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
