import { dev } from '$app/environment';
import type { PasskeyRelyingParty } from '@galfus/auth-utils';

export function getPasskeyRelyingParty(originHeader?: string | null): PasskeyRelyingParty {
  if (dev) {
    return {
      id: 'localhost',
      name: 'Galfus (Development)',
      origin: originHeader || 'http://localhost:5001',
    };
  }

  return {
    id: 'galfus.com',
    name: 'Galfus',
    origin: originHeader || 'https://auth.galfus.com',
  };
}
