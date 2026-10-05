import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type Base64URLString,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';

import { fromBase64Url, toBase64Url } from './secrets';

export interface PasskeyRelyingParty {
  id: string;
  name: string;
  origin: string | string[];
}

export interface StoredPasskey {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

export interface PasskeyRegistrationOptionsInput {
  relyingParty: PasskeyRelyingParty;
  accountId: string;
  userName: string;
  userDisplayName: string;
  existingPasskeys: Pick<StoredPasskey, 'credentialId' | 'transports'>[];
}

export interface VerifiedPasskeyRegistration {
  credentialId: string;
  webauthnUserId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
}

function asBase64Url(value: string): Base64URLString {
  return value as Base64URLString;
}

/** Creates public WebAuthn registration options; save its challenge in the transaction. */
export function createPasskeyRegistrationOptions(input: PasskeyRegistrationOptionsInput) {
  return generateRegistrationOptions({
    rpName: input.relyingParty.name,
    rpID: input.relyingParty.id,
    userID: new TextEncoder().encode(input.accountId),
    userName: input.userName,
    userDisplayName: input.userDisplayName,
    attestationType: 'none',
    excludeCredentials: input.existingPasskeys.map((passkey) => ({
      id: asBase64Url(passkey.credentialId),
      transports: passkey.transports,
    })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  });
}

export async function verifyPasskeyRegistration(input: {
  relyingParty: PasskeyRelyingParty;
  expectedChallenge: string;
  response: RegistrationResponseJSON;
  webauthnUserId: string;
}): Promise<{ verified: false } | { verified: true; passkey: VerifiedPasskeyRegistration }> {
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: input.expectedChallenge,
    expectedOrigin: input.relyingParty.origin,
    expectedRPID: input.relyingParty.id,
    requireUserVerification: true,
  });

  if (!verification.verified) return { verified: false };

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  return {
    verified: true,
    passkey: {
      credentialId: credential.id,
      webauthnUserId: input.webauthnUserId,
      publicKey: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    },
  };
}

/** Creates public WebAuthn authentication options; save its challenge in the transaction. */
export function createPasskeyAuthenticationOptions(input: {
  relyingParty: PasskeyRelyingParty;
  passkeys: Pick<StoredPasskey, 'credentialId' | 'transports'>[];
}) {
  return generateAuthenticationOptions({
    rpID: input.relyingParty.id,
    userVerification: 'required',
    allowCredentials: input.passkeys.map((passkey) => ({
      id: asBase64Url(passkey.credentialId),
      transports: passkey.transports,
    })),
  });
}

export async function verifyPasskeyAuthentication(input: {
  relyingParty: PasskeyRelyingParty;
  expectedChallenge: string;
  response: AuthenticationResponseJSON;
  passkey: StoredPasskey;
}): Promise<{ verified: false } | { verified: true; newCounter: number }> {
  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge: input.expectedChallenge,
    expectedOrigin: input.relyingParty.origin,
    expectedRPID: input.relyingParty.id,
    credential: {
      id: asBase64Url(input.passkey.credentialId),
      publicKey: fromBase64Url(input.passkey.publicKey),
      counter: input.passkey.counter,
      transports: input.passkey.transports,
    },
    requireUserVerification: true,
  });

  return verification.verified
    ? { verified: true, newCounter: verification.authenticationInfo.newCounter }
    : { verified: false };
}
