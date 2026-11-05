import { Resend } from 'resend';
import type { RenderedEmail } from './render';

export interface EmailSenderConfig {
  apiKey: string;
  from: string;
}

export interface SendEmailInput extends RenderedEmail {
  to: string | string[];
  replyTo?: string | string[];
  idempotencyKey?: string;
}

/** Construct on the server with credentials supplied by the application. */
export function createEmailSender(config: EmailSenderConfig) {
  if (!config.apiKey.trim() || !config.from.trim()) {
    throw new Error('A Resend API key and sender address are required.');
  }

  const resend = new Resend(config.apiKey);

  return {
    async send(input: SendEmailInput): Promise<{ id: string }> {
      const { data, error } = await resend.emails.send(
        {
          from: config.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        },
        input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
      );

      if (error) {
        throw new EmailDeliveryError(error.name, error.message, error.statusCode);
      }
      if (!data?.id) {
        throw new EmailDeliveryError('missing_response', 'Resend did not return an email ID.');
      }
      return { id: data.id };
    },
  };
}

export class EmailDeliveryError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode?: number | null,
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}
