import { createRemoteJWKSet, jwtVerify } from 'jose';

import { hashSecret, randomBase64Url } from './secrets';

export const EXTERNAL_AUTH_PROVIDERS = ['google', 'github', 'steam'] as const;
export type ExternalAuthProvider = (typeof EXTERNAL_AUTH_PROVIDERS)[number];

export type ExternalAuthProtocol = 'oauth2' | 'oidc' | 'openid2';

export interface VerifiedExternalIdentity {
  provider: ExternalAuthProvider;
  protocol: ExternalAuthProtocol;
  issuer: string;
  subject: string;
  profile: Record<string, unknown>;
}

export interface ExternalAuthorizationArtifacts {
  state: string;
  stateHash: string;
  nonce: string;
  nonceHash: string;
  pkceVerifier: string;
  pkceChallenge: string;
}

export interface ExternalAuthorizationRequestInput {
  redirectUri: string;
  state: string;
  nonce: string;
  pkceChallenge: string;
}

export interface ExternalCallbackInput {
  callbackUrl: string;
  redirectUri: string;
  expectedState: string;
  expectedNonce?: string;
  pkceVerifier?: string;
}

export interface ExternalAuthAdapter {
  readonly provider: ExternalAuthProvider;
  readonly protocol: ExternalAuthProtocol;
  readonly issuer: string;
  createAuthorizationUrl(input: ExternalAuthorizationRequestInput): string;
  verifyCallback(input: ExternalCallbackInput): Promise<VerifiedExternalIdentity>;
}

export interface GoogleExternalAuthConfig {
  provider: 'google';
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}

export interface GitHubExternalAuthConfig {
  provider: 'github';
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}

export interface SteamExternalAuthConfig {
  provider: 'steam';
  realm: string;
}

export type ExternalAuthConfig =
  GoogleExternalAuthConfig | GitHubExternalAuthConfig | SteamExternalAuthConfig;

export class ExternalAuthError extends Error {
  constructor(
    readonly code:
      | 'callback_invalid'
      | 'provider_rejected'
      | 'provider_response_invalid'
      | 'provider_request_failed',
  ) {
    super(code);
    this.name = 'ExternalAuthError';
  }
}

const googleIssuer = 'https://accounts.google.com';
const googleAuthorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenEndpoint = 'https://oauth2.googleapis.com/token';
const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const githubIssuer = 'https://github.com';
const githubAuthorizationEndpoint = 'https://github.com/login/oauth/authorize';
const githubTokenEndpoint = 'https://github.com/login/oauth/access_token';
const githubUserEndpoint = 'https://api.github.com/user';
const steamIssuer = 'https://steamcommunity.com/openid';
const steamEndpoint = 'https://steamcommunity.com/openid/';

function assertNonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(`${name} is required.`);
}

function assertRedirectUri(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('redirectUri must be an absolute URL.');
  }

  const isLocalHttp =
    url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('redirectUri must use HTTPS outside localhost.');
  }
  return url;
}

function callbackParameters(input: ExternalCallbackInput): URLSearchParams {
  const callback = assertRedirectUri(input.callbackUrl);
  const error = callback.searchParams.get('error');
  if (error) throw new ExternalAuthError('provider_rejected');
  if (callback.searchParams.get('state') !== input.expectedState) {
    throw new ExternalAuthError('callback_invalid');
  }
  return callback.searchParams;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok) throw new ExternalAuthError('provider_request_failed');
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new ExternalAuthError('provider_response_invalid');
    }
    return payload as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ExternalAuthError) throw error;
    throw new ExternalAuthError('provider_response_invalid');
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Creates per-transaction CSRF, OIDC replay, and PKCE artifacts. Persist only hashes or ciphertext. */
export async function createExternalAuthorizationArtifacts(): Promise<ExternalAuthorizationArtifacts> {
  const state = randomBase64Url(32);
  const nonce = randomBase64Url(32);
  const pkceVerifier = randomBase64Url(32);
  const [stateHash, nonceHash, pkceChallenge] = await Promise.all([
    hashSecret(state),
    hashSecret(nonce),
    hashSecret(pkceVerifier),
  ]);

  return { state, stateHash, nonce, nonceHash, pkceVerifier, pkceChallenge };
}

class GoogleExternalAuthAdapter implements ExternalAuthAdapter {
  readonly provider = 'google' as const;
  readonly protocol = 'oidc' as const;
  readonly issuer = googleIssuer;

  constructor(private readonly config: GoogleExternalAuthConfig) {
    assertNonEmpty(config.clientId, 'Google clientId');
    assertNonEmpty(config.clientSecret, 'Google clientSecret');
  }

  createAuthorizationUrl(input: ExternalAuthorizationRequestInput): string {
    assertRedirectUri(input.redirectUri);
    const url = new URL(googleAuthorizationEndpoint);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', (this.config.scopes ?? ['openid', 'email', 'profile']).join(' '));
    url.searchParams.set('state', input.state);
    url.searchParams.set('nonce', input.nonce);
    url.searchParams.set('code_challenge', input.pkceChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  }

  async verifyCallback(input: ExternalCallbackInput): Promise<VerifiedExternalIdentity> {
    const parameters = callbackParameters(input);
    const code = parameters.get('code');
    if (!code || !input.pkceVerifier || !input.expectedNonce) {
      throw new ExternalAuthError('callback_invalid');
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      code_verifier: input.pkceVerifier,
      grant_type: 'authorization_code',
      redirect_uri: input.redirectUri,
    });
    const token = await readJson(
      await fetch(googleTokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }),
    );
    const idToken = optionalString(token.id_token);
    if (!idToken) throw new ExternalAuthError('provider_response_invalid');

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, googleJwks, {
        algorithms: ['RS256'],
        audience: this.config.clientId,
        issuer: [googleIssuer, 'accounts.google.com'],
      }));
    } catch {
      throw new ExternalAuthError('provider_response_invalid');
    }
    if (payload.nonce !== input.expectedNonce || typeof payload.sub !== 'string' || !payload.sub) {
      throw new ExternalAuthError('provider_response_invalid');
    }

    return {
      provider: this.provider,
      protocol: this.protocol,
      issuer: googleIssuer,
      subject: payload.sub,
      profile: {
        ...(optionalString(payload.email) ? { email: payload.email } : {}),
        ...(typeof payload.email_verified === 'boolean'
          ? { email_verified: payload.email_verified }
          : {}),
        ...(optionalString(payload.name) ? { name: payload.name } : {}),
        ...(optionalString(payload.picture) ? { picture: payload.picture } : {}),
      },
    };
  }
}

class GitHubExternalAuthAdapter implements ExternalAuthAdapter {
  readonly provider = 'github' as const;
  readonly protocol = 'oauth2' as const;
  readonly issuer = githubIssuer;

  constructor(private readonly config: GitHubExternalAuthConfig) {
    assertNonEmpty(config.clientId, 'GitHub clientId');
    assertNonEmpty(config.clientSecret, 'GitHub clientSecret');
  }

  createAuthorizationUrl(input: ExternalAuthorizationRequestInput): string {
    assertRedirectUri(input.redirectUri);
    const url = new URL(githubAuthorizationEndpoint);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('scope', (this.config.scopes ?? ['read:user']).join(' '));
    url.searchParams.set('state', input.state);
    return url.toString();
  }

  async verifyCallback(input: ExternalCallbackInput): Promise<VerifiedExternalIdentity> {
    const parameters = callbackParameters(input);
    const code = parameters.get('code');
    if (!code) throw new ExternalAuthError('callback_invalid');

    const token = await readJson(
      await fetch(githubTokenEndpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: input.redirectUri,
        }),
      }),
    );
    const accessToken = optionalString(token.access_token);
    if (!accessToken || token.token_type !== 'bearer') {
      throw new ExternalAuthError('provider_response_invalid');
    }

    const profile = await readJson(
      await fetch(githubUserEndpoint, {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${accessToken}`,
          'x-github-api-version': '2022-11-28',
        },
      }),
    );
    const id = profile.id;
    if ((typeof id !== 'number' && typeof id !== 'string') || !String(id)) {
      throw new ExternalAuthError('provider_response_invalid');
    }

    return {
      provider: this.provider,
      protocol: this.protocol,
      issuer: githubIssuer,
      subject: String(id),
      profile: {
        ...(optionalString(profile.login) ? { login: profile.login } : {}),
        ...(optionalString(profile.name) ? { name: profile.name } : {}),
        ...(optionalString(profile.avatar_url) ? { avatar_url: profile.avatar_url } : {}),
      },
    };
  }
}

class SteamExternalAuthAdapter implements ExternalAuthAdapter {
  readonly provider = 'steam' as const;
  readonly protocol = 'openid2' as const;
  readonly issuer = steamIssuer;

  constructor(private readonly config: SteamExternalAuthConfig) {
    assertRedirectUri(config.realm);
  }

  createAuthorizationUrl(input: ExternalAuthorizationRequestInput): string {
    const callback = assertRedirectUri(input.redirectUri);
    const realm = assertRedirectUri(this.config.realm);
    if (callback.origin !== realm.origin) {
      throw new Error('Steam redirectUri must share the configured realm origin.');
    }
    callback.searchParams.set('state', input.state);

    const url = new URL(steamEndpoint);
    url.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
    url.searchParams.set('openid.mode', 'checkid_setup');
    url.searchParams.set('openid.return_to', callback.toString());
    url.searchParams.set('openid.realm', realm.origin);
    url.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
    url.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
    return url.toString();
  }

  async verifyCallback(input: ExternalCallbackInput): Promise<VerifiedExternalIdentity> {
    const callback = assertRedirectUri(input.callbackUrl);
    const expectedReturnTo = assertRedirectUri(input.redirectUri);
    expectedReturnTo.searchParams.set('state', input.expectedState);
    if (callback.searchParams.get('state') !== input.expectedState) {
      throw new ExternalAuthError('callback_invalid');
    }
    if (callback.searchParams.get('openid.mode') !== 'id_res') {
      throw new ExternalAuthError('provider_rejected');
    }
    if (callback.searchParams.get('openid.op_endpoint') !== steamEndpoint) {
      throw new ExternalAuthError('callback_invalid');
    }
    if (callback.searchParams.get('openid.return_to') !== expectedReturnTo.toString()) {
      throw new ExternalAuthError('callback_invalid');
    }

    const verification = new URLSearchParams();
    for (const [key, value] of callback.searchParams) {
      if (key.startsWith('openid.') && key !== 'openid.mode') verification.append(key, value);
    }
    verification.set('openid.mode', 'check_authentication');
    const response = await fetch(steamEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: verification,
    });
    if (!response.ok || !(await response.text()).split(/\r?\n/).includes('is_valid:true')) {
      throw new ExternalAuthError('provider_response_invalid');
    }

    const claimedId = callback.searchParams.get('openid.claimed_id') ?? '';
    const match = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(claimedId);
    if (!match) throw new ExternalAuthError('provider_response_invalid');

    return {
      provider: this.provider,
      protocol: this.protocol,
      issuer: steamIssuer,
      subject: match[1]!,
      profile: {},
    };
  }
}

/** Creates a fixed-provider adapter. Do not create adapters from user-supplied configuration. */
export function createExternalAuthAdapter(config: ExternalAuthConfig): ExternalAuthAdapter {
  switch (config.provider) {
    case 'google':
      return new GoogleExternalAuthAdapter(config);
    case 'github':
      return new GitHubExternalAuthAdapter(config);
    case 'steam':
      return new SteamExternalAuthAdapter(config);
  }
}
