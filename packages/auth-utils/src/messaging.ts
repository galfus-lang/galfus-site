export type MessageChannel = 'email' | 'sms';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface SmsMessage {
  to: string;
  text: string;
}

/** Port implemented later by the real messaging service. */
export interface MessageDelivery {
  sendEmail(message: EmailMessage): Promise<void>;
  sendSms(message: SmsMessage): Promise<void>;
}

export interface MockDeliveryReceipt {
  channel: MessageChannel;
  recipient: string;
  createdAt: Date;
}

function maskRecipient(value: string): string {
  const [local, domain] = value.split('@');
  if (domain && local) return `${local.slice(0, 2)}***@${domain}`;
  return `${value.slice(0, 3)}***`;
}

/**
 * Development/test adapter. It deliberately discards message content so OTPs
 * cannot leak through logs or captured application state.
 */
export class MockMessageDelivery implements MessageDelivery {
  readonly receipts: MockDeliveryReceipt[] = [];

  async sendEmail(message: EmailMessage): Promise<void> {
    this.receipts.push({
      channel: 'email',
      recipient: maskRecipient(message.to),
      createdAt: new Date(),
    });
  }

  async sendSms(message: SmsMessage): Promise<void> {
    this.receipts.push({
      channel: 'sms',
      recipient: maskRecipient(message.to),
      createdAt: new Date(),
    });
  }
}
