import { MockMessageDelivery, type MessageDelivery } from '@galfus/auth-utils';
import { dev } from '$app/environment';

class UnconfiguredMessageDelivery implements MessageDelivery {
  async sendEmail(): Promise<void> {
    throw new Error('No e-mail delivery provider is configured.');
  }

  async sendSms(): Promise<void> {
    throw new Error('No SMS delivery provider is configured.');
  }
}

/** Replace this adapter when the shared messaging service is implemented. */
export const messageDelivery: MessageDelivery = dev
  ? new MockMessageDelivery()
  : new UnconfiguredMessageDelivery();
