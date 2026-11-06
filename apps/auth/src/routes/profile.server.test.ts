import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthAccessTokenCookie: vi.fn(),
  clearAuthTransactionCookie: vi.fn(),
  getAuthAccessTokenCookie: vi.fn(),
  setAuthAccessTokenCookie: vi.fn(),
  connectDb: vi.fn(),
  getAccountProfile: vi.fn(),
  getAccountPasskeys: vi.fn(),
  updateAccountProfile: vi.fn(),
  verifyAccountPassword: vi.fn(),
  upsertAccountPassword: vi.fn(),
  removeAccountAuthenticator: vi.fn(),
  disableAccountMfa: vi.fn(),
  activateDirectTotpAuthenticator: vi.fn(),
  getActiveMfaAuthenticator: vi.fn(),
  decryptTotpSecret: vi.fn(),
  verifyTotpStep: vi.fn(),
  incrementAccountCredentialVersion: vi.fn(),
  verifyPasskeyRegistration: vi.fn(),
  persistVerifiedPasskeyAuthenticator: vi.fn(),
  encryptTotpSecret: vi.fn(),
  jwtSign: vi.fn(),
  jwtVerify: vi.fn(),
  challengeSign: vi.fn(),
  challengeVerify: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth-cookies', () => ({
  clearAuthAccessTokenCookie: mocks.clearAuthAccessTokenCookie,
  clearAuthTransactionCookie: mocks.clearAuthTransactionCookie,
  getAuthAccessTokenCookie: mocks.getAuthAccessTokenCookie,
  setAuthAccessTokenCookie: mocks.setAuthAccessTokenCookie,
}));

vi.mock('$lib/server/db', () => ({ connectDb: mocks.connectDb }));
vi.mock('$lib/server/password-attempt', () => ({ reserveLoginAttempt: async () => true }));
vi.mock('$lib/server/totp-secrets', () => ({
  encryptTotpSecret: mocks.encryptTotpSecret,
  decryptTotpSecret: mocks.decryptTotpSecret,
  recoveryPepper: () => 'x'.repeat(32),
}));
vi.mock('@galfus/auth-utils', async (original) => ({
  ...(await original<typeof import('@galfus/auth-utils')>()),
  verifyPasskeyRegistration: mocks.verifyPasskeyRegistration,
  verifyTotpStep: mocks.verifyTotpStep,
}));
vi.mock('$lib/server/i18n', () => ({ getRequestLocale: () => 'en-US' }));
vi.mock('$lib/server/access-session', () => ({
  issueAccessToken: (...args: unknown[]) => mocks.jwtSign(...args),
  validateAndRenewAccessSession: async () => {
    if (!mocks.getAuthAccessTokenCookie()) return null;
    const payload = await mocks.jwtVerify();
    return {
      accountId: payload.accountId || payload.sub,
      identifier: payload.identifier,
      credentialVersion: 3,
    };
  },
}));
vi.mock('$lib/server/jwt', () => ({
  AUTH_ACCESS_JWT_AUDIENCE: 'galfus:access',
  jwt: {
    sign: mocks.challengeSign,
    verify: mocks.challengeVerify,
  },
}));

vi.mock('@galfus/data-manager/server', () => ({
  getAccountProfile: mocks.getAccountProfile,
  updateAccountProfile: mocks.updateAccountProfile,
  verifyAccountPassword: mocks.verifyAccountPassword,
  upsertAccountPassword: mocks.upsertAccountPassword,
  removeAccountAuthenticator: mocks.removeAccountAuthenticator,
  disableAccountMfa: mocks.disableAccountMfa,
  getActiveMfaAuthenticator: mocks.getActiveMfaAuthenticator,
  incrementAccountCredentialVersion: mocks.incrementAccountCredentialVersion,
  activateDirectTotpAuthenticator: mocks.activateDirectTotpAuthenticator,
  getAccountPasskeys: mocks.getAccountPasskeys,
  persistVerifiedPasskeyAuthenticator: mocks.persistVerifiedPasskeyAuthenticator,
}));

vi.mock('@galfus/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@galfus/i18n')>()),
  translate: (id: string) => id,
}));

const { load, actions } = await import('./profile/+page.server');
const { actions: mfaActions } = await import('./profile/mfa/+page.server');
const personalPage = await import('./profile/personal/+page.server');
const passwordPage = await import('./profile/password/+page.server');
const passkeysPage = await import('./profile/passkeys/+page.server');
const sessionsPage = await import('./profile/sessions/+page.server');
const identitiesPage = await import('./profile/identities/+page.server');
const securityPage = await import('./profile/security/+page.server');

const mockProfile = {
  account: {
    id: 'account:test_account',
    displayName: 'Test User',
    status: 'active',
    credentialVersion: 1,
    createdAt: new Date(),
  },
  identities: [
    {
      id: 'id:1',
      kind: 'local',
      provider: 'email',
      identifier: 'user@galfus.com',
      status: 'active',
      createdAt: new Date(),
    },
  ],
  security: {
    hasPassword: true,
    passkeys: [],
    mfa: { enabled: false },
  },
};

describe('profile server route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connectDb.mockResolvedValue({});
    mocks.jwtSign.mockResolvedValue('signed-access-token');
    mocks.challengeVerify.mockResolvedValue({
      flow: 'passkey_registration',
      sub: 'account:test_account',
      credentialVersion: 3,
      challenge: 'expected-challenge',
    });
    mocks.encryptTotpSecret.mockResolvedValue('encrypted-pending');
  });

  it.each([
    ['personal', personalPage.load],
    ['password', passwordPage.load],
    ['passkeys', passkeysPage.load],
    ['sessions', sessionsPage.load],
    ['identities', identitiesPage.load],
    ['security', securityPage.load],
  ])('requires authentication for the %s page', async (_, loadPage) => {
    mocks.getAuthAccessTokenCookie.mockReturnValue(undefined);
    await expect(loadPage({ cookies: {} } as never)).rejects.toMatchObject({
      status: 303,
      location: '/',
    });
  });

  it.each([
    ['personal', personalPage.actions.updateProfile],
    ['password', passwordPage.actions.changePassword],
    ['passkey options', passkeysPage.actions.passkeyRegistrationOptions],
    ['passkey verification', passkeysPage.actions.verifyPasskeyRegistration],
    ['passkey removal', passkeysPage.actions.removePasskey],
    ['sessions', sessionsPage.actions.revokeOtherSessions],
  ])('requires authentication for the %s action', async (_, action) => {
    mocks.getAuthAccessTokenCookie.mockReturnValue(undefined);
    await expect(
      action({
        request: new Request('http://localhost:5001/profile', { method: 'POST' }),
        cookies: {},
        getClientAddress: () => '127.0.0.1',
      } as never),
    ).rejects.toMatchObject({ status: 303, location: '/' });
  });

  describe('load', () => {
    it('redirects to / when access token cookie is missing', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue(undefined);

      try {
        await load({ cookies: {} as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/' });
      }
    });

    it('returns profile data on valid authenticated session', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
        identifier: 'user@galfus.com',
      });
      mocks.getAccountProfile.mockResolvedValue({
        success: true,
        data: mockProfile,
      });

      const result = await load({ cookies: {} as never } as never);

      expect(result).toEqual({
        profile: mockProfile,
        identifier: 'user@galfus.com',
      });
    });
  });

  describe('actions.updateProfile', () => {
    it('fails if display name is too short', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });

      const form = new FormData();
      form.set('displayName', 'A');

      const result = await actions.updateProfile({
        request: new Request('http://localhost:5001/profile?/updateProfile', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.fields.full_name.too_short' },
      });
    });

    it('updates display name successfully', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });
      mocks.updateAccountProfile.mockResolvedValue({
        success: true,
        data: { id: 'account:test_account', displayName: 'Jane Doe' },
      });

      const form = new FormData();
      form.set('displayName', 'Jane Doe');

      const result = await actions.updateProfile({
        request: new Request('http://localhost:5001/profile?/updateProfile', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ success: true, updatedField: 'profile' });
      expect(mocks.updateAccountProfile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: 'Jane Doe' }),
      );
    });
  });

  describe('actions.changePassword', () => {
    it('fails when new password and confirm password do not match', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });

      const form = new FormData();
      form.set('currentPassword', 'old_pass_123');
      form.set('newPassword', 'password_one');
      form.set('confirmNewPassword', 'password_two');

      const result = await actions.changePassword({
        request: new Request('http://localhost:5001/profile?/changePassword', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.pass.password_dont_match' },
      });
    });

    it('verifies old password and upserts new password', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });
      mocks.getAccountProfile.mockResolvedValue({
        success: true,
        data: mockProfile,
      });
      mocks.verifyAccountPassword.mockResolvedValue({
        success: true,
        data: true,
      });
      mocks.upsertAccountPassword.mockResolvedValue({
        success: true,
        data: { id: 'auth:pwd' },
      });

      const form = new FormData();
      form.set('currentPassword', 'correct_old_pass');
      form.set('newPassword', 'brand_new_pass_123');
      form.set('confirmNewPassword', 'brand_new_pass_123');

      const result = await actions.changePassword({
        request: new Request('http://localhost:5001/profile?/changePassword', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ success: true, updatedField: 'password' });
      expect(mocks.verifyAccountPassword).toHaveBeenCalled();
      expect(mocks.upsertAccountPassword).toHaveBeenCalled();
      expect(mocks.jwtSign).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ accountId: 'account:test_account' }),
        4,
      );
      expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalled();
    });
  });

  describe('actions.removePasskey', () => {
    it('removes passkey authenticator', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });
      mocks.removeAccountAuthenticator.mockResolvedValue({
        success: true,
        data: true,
      });

      const form = new FormData();
      form.set('authenticatorId', 'account_authenticator:pk_1');

      const result = await actions.removePasskey({
        request: new Request('http://localhost:5001/profile?/removePasskey', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ success: true, updatedField: 'passkey_removed' });
      expect(mocks.removeAccountAuthenticator).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          authenticatorId: 'account_authenticator:pk_1',
        }),
      );
    });

    it('reports failure when no passkey was removed', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });
      mocks.removeAccountAuthenticator.mockResolvedValue({ success: true, data: false });
      const form = new FormData();
      form.set('authenticatorId', 'account_authenticator:missing');
      const result = await actions.removePasskey({
        request: new Request('http://localhost:5001/profile?/removePasskey', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
      } as never);
      expect(result).toMatchObject({
        status: 400,
        data: { error: 'error.auth.passkey.remove_failed' },
      });
    });
  });

  it('does not prepare passkey registration if the account profile is unavailable', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({
      sub: 'account:test_account',
      accountId: 'account:test_account',
    });
    mocks.getAccountProfile.mockResolvedValue({ success: true, data: null });
    const result = await actions.passkeyRegistrationOptions({
      request: new Request('http://localhost:5001/profile?/passkeyRegistrationOptions', {
        method: 'POST',
      }),
      cookies: {} as never,
    } as never);
    expect(result).toMatchObject({ status: 400, data: { error: 'error.auth.account.invalid' } });
  });

  it('requires the current password before issuing a passkey registration challenge', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({ accountId: 'account:test_account' });
    mocks.getAccountProfile.mockResolvedValue({ success: true, data: mockProfile });
    mocks.verifyAccountPassword.mockResolvedValue({ success: true, data: false });
    const form = new FormData();
    form.set('currentPassword', 'wrong-password');
    const result = await actions.passkeyRegistrationOptions({
      request: new Request('http://localhost:5001/profile/passkeys?/passkeyRegistrationOptions', {
        method: 'POST',
        body: form,
      }),
      cookies: {} as never,
      getClientAddress: () => '127.0.0.1',
    });
    expect(result).toMatchObject({ status: 401 });
    expect(mocks.challengeSign).not.toHaveBeenCalled();
  });

  it('binds the passkey registration challenge to the account and credential version', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({ accountId: 'account:test_account' });
    mocks.getAccountProfile.mockResolvedValue({ success: true, data: mockProfile });
    mocks.verifyAccountPassword.mockResolvedValue({ success: true, data: true });
    mocks.getAccountPasskeys.mockResolvedValue([]);
    mocks.challengeSign.mockResolvedValue('signed-challenge');
    const form = new FormData();
    form.set('currentPassword', 'correct-password');
    const cookies = { set: vi.fn() };
    const result = await actions.passkeyRegistrationOptions({
      request: new Request('http://localhost:5001/profile/passkeys?/passkeyRegistrationOptions', {
        method: 'POST',
        body: form,
      }),
      cookies: cookies as never,
      getClientAddress: () => '127.0.0.1',
    });
    expect(result).toHaveProperty('options.challenge');
    expect(mocks.challengeSign).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'passkey_registration',
        sub: 'account:test_account',
        credentialVersion: 3,
      }),
      expect.objectContaining({ audience: 'galfus:passkey-registration', expirationTime: '5m' }),
    );
    expect(cookies.set).toHaveBeenCalledWith(
      'passkey_reg_challenge',
      'signed-challenge',
      expect.objectContaining({ httpOnly: true, path: '/profile', maxAge: 300 }),
    );
  });

  it('stores the WebAuthn user ID in base64url format when registering a passkey', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({
      sub: 'account:test_account',
      accountId: 'account:test_account',
    });
    mocks.verifyPasskeyRegistration.mockResolvedValue({
      verified: true,
      passkey: {
        credentialId: 'Y3JlZGVudGlhbA',
        webauthnUserId: 'YWNjb3VudDp0ZXN0X2FjY291bnQ',
        publicKey: 'cHVibGlj',
        counter: 0,
        transports: ['internal'],
        deviceType: 'singleDevice',
        backedUp: false,
      },
    });
    mocks.persistVerifiedPasskeyAuthenticator.mockResolvedValue({ success: true, data: {} });
    const form = new FormData();
    form.set('response', JSON.stringify({ id: 'Y3JlZGVudGlhbA' }));
    const cookies = { get: vi.fn().mockReturnValue('expected-challenge'), delete: vi.fn() };
    const result = await actions.verifyPasskeyRegistration({
      request: new Request('http://localhost:5001/profile?/verifyPasskeyRegistration', {
        method: 'POST',
        body: form,
      }),
      cookies: cookies as never,
    } as never);
    expect(result).toEqual({ success: true });
    expect(mocks.verifyPasskeyRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        webauthnUserId: 'YWNjb3VudDp0ZXN0X2FjY291bnQ',
      }),
    );
    expect(mocks.persistVerifiedPasskeyAuthenticator).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        credentialVersion: 3,
        webauthnUserId: 'YWNjb3VudDp0ZXN0X2FjY291bnQ',
      }),
    );
  });

  it.each([{ sub: 'account:another_account' }, { credentialVersion: 2 }, { flow: 'access' }])(
    'rejects a passkey registration challenge bound to another security context: %o',
    async (change) => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({ accountId: 'account:test_account' });
      mocks.challengeVerify.mockResolvedValue({
        flow: 'passkey_registration',
        sub: 'account:test_account',
        credentialVersion: 3,
        challenge: 'expected-challenge',
        ...change,
      });
      const form = new FormData();
      form.set('response', JSON.stringify({ id: 'credential' }));
      const cookies = { get: vi.fn().mockReturnValue('signed-challenge'), delete: vi.fn() };
      const result = await actions.verifyPasskeyRegistration({
        request: new Request('http://localhost:5001/profile?/verifyPasskeyRegistration', {
          method: 'POST',
          body: form,
        }),
        cookies: cookies as never,
      } as never);
      expect(result).toMatchObject({ status: 400 });
      expect(mocks.verifyPasskeyRegistration).not.toHaveBeenCalled();
      expect(mocks.persistVerifiedPasskeyAuthenticator).not.toHaveBeenCalled();
    },
  );

  describe('actions.disableTotp', () => {
    it('disables 2FA authenticators for the account', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
      });
      mocks.disableAccountMfa.mockResolvedValue({
        success: true,
        data: true,
      });
      mocks.verifyAccountPassword.mockResolvedValue({ success: true, data: true });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: { id: 'account_authenticator:totp', secretCiphertext: 'encrypted' },
      });
      mocks.decryptTotpSecret.mockResolvedValue('secret');
      mocks.verifyTotpStep.mockReturnValue(12345);
      const form = new FormData();
      form.set('currentPassword', 'password');
      form.set('code', '123456');

      const result = await mfaActions.disableTotp({
        request: new Request('http://localhost:5001/profile?/disableTotp', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ success: true, updatedField: 'mfa_disabled' });
      expect(mocks.disableAccountMfa).toHaveBeenCalledWith(expect.anything(), {
        accountId: 'account:test_account',
        authenticatorId: 'account_authenticator:totp',
        credentialVersion: 3,
        verifiedStep: 12345,
      });
      expect(mocks.jwtSign).toHaveBeenCalledWith(expect.anything(), expect.anything(), 4);
    });

    it('does not disable MFA when the authenticator code is incorrect', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({ accountId: 'account:test_account' });
      mocks.verifyAccountPassword.mockResolvedValue({ success: true, data: true });
      mocks.getActiveMfaAuthenticator.mockResolvedValue({
        success: true,
        data: { id: 'account_authenticator:totp', secretCiphertext: 'encrypted' },
      });
      mocks.decryptTotpSecret.mockResolvedValue('secret');
      mocks.verifyTotpStep.mockReturnValue(null);
      const form = new FormData();
      form.set('currentPassword', 'password');
      form.set('code', '123456');
      const result = await mfaActions.disableTotp({
        request: new Request('http://localhost:5001/profile/mfa?/disableTotp', {
          method: 'POST',
          body: form,
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);
      expect(result).toMatchObject({ status: 401 });
      expect(mocks.disableAccountMfa).not.toHaveBeenCalled();
    });
  });

  it('starts MFA setup on the dedicated route only after password reauthentication', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({
      sub: 'account:test_account',
      accountId: 'account:test_account',
    });
    mocks.getAccountProfile.mockResolvedValue({ success: true, data: mockProfile });
    mocks.verifyAccountPassword.mockResolvedValue({ success: true, data: true });
    const form = new FormData();
    form.set('currentPassword', 'correct-password');
    const cookies = { set: vi.fn() };
    const result = await mfaActions.setupTotp({
      request: new Request('http://localhost:5001/profile/mfa?/setupTotp', {
        method: 'POST',
        body: form,
      }),
      cookies: cookies as never,
      getClientAddress: () => '127.0.0.1',
    } as never);
    expect(result).toHaveProperty('totpSetup.qrCodeSvg');
    expect(mocks.verifyAccountPassword).toHaveBeenCalled();
    expect(cookies.set).toHaveBeenCalledWith(
      'totp_enrollment_secret',
      'encrypted-pending',
      expect.objectContaining({ httpOnly: true, path: '/profile/mfa' }),
    );
  });

  it('renews the current credential after MFA activation revokes older credentials', async () => {
    mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
    mocks.jwtVerify.mockResolvedValue({ accountId: 'account:test_account' });
    mocks.decryptTotpSecret.mockResolvedValue(
      JSON.stringify({
        accountId: 'account:test_account',
        credentialVersion: 3,
        secret: 'secret',
        recoveryCodes: [],
        createdAt: Date.now(),
      }),
    );
    mocks.verifyTotpStep.mockReturnValue(12345);
    mocks.activateDirectTotpAuthenticator.mockResolvedValue({ success: true, data: true });
    const form = new FormData();
    form.set('code', '123456');
    const cookies = { get: vi.fn().mockReturnValue('pending'), delete: vi.fn() };
    const result = await mfaActions.activateTotp({
      request: new Request('http://localhost:5001/profile/mfa?/activateTotp', {
        method: 'POST',
        body: form,
      }),
      cookies: cookies as never,
      getClientAddress: () => '127.0.0.1',
    } as never);
    expect(result).toEqual({ success: true, updatedField: 'mfa_enabled', recoveryCodes: [] });
    expect(mocks.activateDirectTotpAuthenticator).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ credentialVersion: 3, verifiedStep: 12345 }),
    );
    expect(mocks.jwtSign).toHaveBeenCalledWith(expect.anything(), expect.anything(), 4);
    expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalled();
  });

  describe('actions.revokeOtherSessions', () => {
    it('increments credential version and refreshes session token', async () => {
      mocks.getAuthAccessTokenCookie.mockReturnValue('valid-access-token');
      mocks.jwtVerify.mockResolvedValue({
        sub: 'account:test_account',
        accountId: 'account:test_account',
        identifier: 'user@galfus.com',
      });
      mocks.incrementAccountCredentialVersion.mockResolvedValue({
        success: true,
        data: { id: 'account:test_account', credential_version: 2 },
      });

      const result = await actions.revokeOtherSessions({
        request: new Request('http://localhost:5001/profile?/revokeOtherSessions', {
          method: 'POST',
        }),
        cookies: {} as never,
        getClientAddress: () => '127.0.0.1',
      } as never);

      expect(result).toEqual({ success: true, updatedField: 'sessions_revoked' });
      expect(mocks.incrementAccountCredentialVersion).toHaveBeenCalled();
      expect(mocks.jwtSign).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ accountId: 'account:test_account' }),
        4,
      );
      expect(mocks.setAuthAccessTokenCookie).toHaveBeenCalled();
    });
  });

  describe('actions.logout', () => {
    it('clears cookies and redirects to /', async () => {
      const cookies = { delete: vi.fn() };
      try {
        await actions.logout({ cookies: cookies as never } as never);
        throw new Error('Expected redirect');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(error).toMatchObject({ status: 303, location: '/' });
        expect(mocks.clearAuthAccessTokenCookie).toHaveBeenCalled();
        expect(mocks.clearAuthTransactionCookie).toHaveBeenCalled();
        expect(cookies.delete).toHaveBeenCalledWith('passkey_reg_challenge', { path: '/profile' });
        expect(cookies.delete).toHaveBeenCalledWith('totp_enrollment_secret', {
          path: '/profile/mfa',
        });
      }
    });
  });
});
