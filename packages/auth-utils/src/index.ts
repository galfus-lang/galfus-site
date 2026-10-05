import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { ulid } from 'ulid';

/**
 * Generates a lexicographically sortable, globally unique identifier.
 */
export function generateId(): string {
  return ulid();
}

export interface JwtOptions {
  issuer?: string;
  audience?: string;
  expirationTime?: string | number;
}

export class JwtService {
  private secretKey: Uint8Array;
  private defaultOptions: Required<JwtOptions>;

  constructor(secret: string, options?: JwtOptions) {
    if (!secret) {
      throw new Error('JwtService requires a secret key.');
    }

    this.secretKey = new TextEncoder().encode(secret);

    this.defaultOptions = {
      issuer: options?.issuer ?? 'galfus:auth',
      audience: options?.audience ?? 'galfus:suite',
      expirationTime: options?.expirationTime ?? '7d', // 7 days by default
    };
  }

  /**
   * Signs and creates a new JWT with the provided payload.
   */
  async sign(payload: JWTPayload, options?: Partial<JwtOptions>): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(opts.issuer)
      .setAudience(opts.audience)
      .setExpirationTime(opts.expirationTime)
      .sign(this.secretKey);
  }

  /**
   * Verifies a JWT and returns the parsed payload.
   * Throws an error if the token is invalid, expired, or signature mismatch.
   */
  async verify<T extends JWTPayload = JWTPayload>(
    token: string,
    options?: Partial<JwtOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };

    const { payload } = await jwtVerify(token, this.secretKey, {
      issuer: opts.issuer,
      audience: opts.audience,
    });

    return payload as T;
  }
}
