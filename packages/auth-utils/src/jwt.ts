import { decodeProtectedHeader, SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JwtOptions {
  issuer: string;
  audience: string;
  expirationTime?: string | number;
  keyId?: string;
}

export interface JwtSigningKey {
  keyId: string;
  secret: string;
}

/** JWT helper for signed authorization-flow artifacts and stateless access tokens. */
export class JwtService {
  private keys: Map<string, Uint8Array>;
  private defaultOptions: Required<JwtOptions>;

  constructor(secret: string | readonly JwtSigningKey[], options: JwtOptions) {
    if (!options.issuer || !options.audience || !options.keyId) {
      throw new Error('JwtService requires issuer, audience, and keyId.');
    }

    const signingKeys: readonly JwtSigningKey[] =
      typeof secret === 'string' ? [{ keyId: options.keyId, secret }] : secret;
    if (signingKeys.length === 0) throw new Error('JwtService requires at least one signing key.');

    this.keys = new Map();
    for (const signingKey of signingKeys) {
      if (!signingKey.keyId || !signingKey.secret || this.keys.has(signingKey.keyId)) {
        throw new Error('JWT signing keys require unique non-empty key IDs and secrets.');
      }
      this.keys.set(signingKey.keyId, new TextEncoder().encode(signingKey.secret));
    }
    if (!this.keys.has(options.keyId)) {
      throw new Error('JwtService keyId must identify an active signing key.');
    }

    this.defaultOptions = {
      issuer: options.issuer,
      audience: options.audience,
      expirationTime: options.expirationTime ?? '15m',
      keyId: options.keyId,
    };
  }

  async sign(payload: JWTPayload, options?: Partial<JwtOptions>): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const key = this.keys.get(opts.keyId);
    if (!key) throw new Error('JWT signing key is not configured.');
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', kid: opts.keyId })
      .setIssuedAt()
      .setIssuer(opts.issuer)
      .setAudience(opts.audience)
      .setExpirationTime(opts.expirationTime)
      .sign(key);
  }

  async verify<T extends JWTPayload = JWTPayload>(
    token: string,
    options?: Partial<JwtOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let keyId: string | undefined;
    try {
      const header = decodeProtectedHeader(token);
      if (header.alg !== 'HS256' || typeof header.kid !== 'string') {
        throw new Error('JWT uses an unsupported protected header.');
      }
      keyId = header.kid;
    } catch {
      throw new Error('JWT uses an invalid protected header.');
    }
    const key = this.keys.get(keyId);
    if (!key) throw new Error('JWT key ID is not configured.');

    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer: opts.issuer,
      audience: opts.audience,
    });
    return payload as T;
  }
}
