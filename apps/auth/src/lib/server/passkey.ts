import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { PasskeyRelyingParty } from '@galfus/auth-utils';

export function getPasskeyRelyingParty(originHeader?: string | null): PasskeyRelyingParty {
  const origin =
    env.AUTH_PASSKEY_ORIGIN ||
    (dev && originHeader === 'http://127.0.0.1:5001' ? originHeader : undefined) ||
    (dev ? 'http://localhost:5001' : 'https://auth.galfus.com');
  const url = new URL(origin);
  const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (
    url.origin !== origin ||
    (url.protocol !== 'https:' && !(dev && isLoopback && url.protocol === 'http:'))
  ) {
    throw new Error(
      'AUTH_PASSKEY_ORIGIN must be a trusted HTTPS origin or a local development origin.',
    );
  }
  const id = env.AUTH_PASSKEY_RP_ID || (dev ? url.hostname : 'galfus.com');
  if (url.hostname !== id && !url.hostname.endsWith(`.${id}`)) {
    throw new Error('AUTH_PASSKEY_RP_ID must match the configured origin.');
  }
  return {
    id,
    name: dev ? 'Galfus (Development)' : 'Galfus',
    origin,
  };
}
