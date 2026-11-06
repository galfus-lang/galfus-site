import { load as loadProfile, actions as profileActions } from '../+page.server';

export const load = loadProfile;

export const actions = {
  passkeyRegistrationOptions: profileActions.passkeyRegistrationOptions,
  verifyPasskeyRegistration: profileActions.verifyPasskeyRegistration,
  removePasskey: profileActions.removePasskey,
};
