import { JwtService } from '@galfus/auth-utils';
import { env } from '$env/dynamic/private';

const secret = env.AUTH_SECRET || 'galfus_super_secret_development_key_12345';

export const jwt = new JwtService(secret);
