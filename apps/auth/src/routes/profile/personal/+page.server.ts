import { load as loadProfile, actions as profileActions } from '../+page.server';

export const load = loadProfile;

export const actions = {
  updateProfile: profileActions.updateProfile,
};
