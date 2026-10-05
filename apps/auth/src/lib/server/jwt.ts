import { JwtService } from '@galfus/auth-utils';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const secret = env.AUTH_SECRET ?? (dev ? 'galfus_local_development_only_secret' : undefined);

if (!secret) {
  throw new Error('AUTH_SECRET is required outside local development.');
}

export const jwt = new JwtService(secret, {
  issuer: 'galfus:auth',
  audience: 'galfus:auth-flow',
  keyId: env.AUTH_JWT_KEY_ID ?? 'local-v1',
});
