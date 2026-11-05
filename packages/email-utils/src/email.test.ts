import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

import { createEmailSender, EmailDeliveryError, renderVerificationEmail } from './index';

describe('verification email', () => {
  it('renders a localized document and matching plain text', async () => {
    const email = await renderVerificationEmail({
      code: '012345',
      expiresInMinutes: 5,
      locale: 'pt-BR',
    });

    expect(email.subject).toBe('Confirme seu endereço de e-mail');
    expect(email.html).toContain('<html lang="pt-BR">');
    expect(email.html).toContain('012345');
    expect(email.html).toContain('5 minutos');
    expect(email.text).toContain('012345');
    expect(email.text).toContain('5 minutos');
    expect(email.html).not.toContain('<script');
  });

  it('rejects invalid codes and expiry', async () => {
    await expect(
      renderVerificationEmail({ code: '<script>', expiresInMinutes: 5 }),
    ).rejects.toThrow();
    await expect(
      renderVerificationEmail({ code: '012345', expiresInMinutes: 0 }),
    ).rejects.toThrow();
  });
});

describe('Resend delivery', () => {
  beforeEach(() => send.mockReset());

  it('passes the rendered content and idempotency key to Resend', async () => {
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const sender = createEmailSender({ apiKey: 'test-key', from: 'Galfus <mail@example.com>' });
    const result = await sender.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Message</p>',
      text: 'Message',
      idempotencyKey: 'registration/request-1',
    });

    expect(result).toEqual({ id: 'email-id' });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Galfus <mail@example.com>',
        to: 'user@example.com',
        text: 'Message',
      }),
      { idempotencyKey: 'registration/request-1' },
    );
  });

  it('surfaces a provider rejection instead of reporting success', async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid sender', statusCode: 403 },
    });
    const sender = createEmailSender({ apiKey: 'test-key', from: 'mail@example.com' });
    await expect(
      sender.send({
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Message</p>',
        text: 'Message',
      }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);
  });
});
