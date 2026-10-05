import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JwtOptions {
  issuer: string;
  audience: string;
  expirationTime?: string | number;
  keyId?: string;
}

/** JWT helper for explicitly signed artifacts; browser sessions stay opaque. */
export class JwtService {
  private secretKey: Uint8Array;
  private defaultOptions: Required<JwtOptions>;

  constructor(secret: string, options: JwtOptions) {
    if (!secret) throw new Error('JwtService requires a secret key.');
    if (!options.issuer || !options.audience || !options.keyId) {
      throw new Error('JwtService requires issuer, audience, and keyId.');
    }

    this.secretKey = new TextEncoder().encode(secret);
    this.defaultOptions = {
      issuer: options.issuer,
      audience: options.audience,
      expirationTime: options.expirationTime ?? '15m',
      keyId: options.keyId,
    };
  }

  async sign(payload: JWTPayload, options?: Partial<JwtOptions>): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', kid: opts.keyId })
      .setIssuedAt()
      .setIssuer(opts.issuer)
      .setAudience(opts.audience)
      .setExpirationTime(opts.expirationTime)
      .sign(this.secretKey);
  }

  async verify<T extends JWTPayload = JWTPayload>(
    token: string,
    options?: Partial<JwtOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const { payload, protectedHeader } = await jwtVerify(token, this.secretKey, {
      issuer: opts.issuer,
      audience: opts.audience,
    });

    if (protectedHeader.kid !== opts.keyId) {
      throw new Error('JWT key ID does not match the active signing key.');
    }

    return payload as T;
  }
}
