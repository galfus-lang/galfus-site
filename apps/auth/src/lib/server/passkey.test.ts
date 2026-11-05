import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$env/dynamic/private', () => ({ env: state.env }));
import { getPasskeyRelyingParty } from './passkey';

beforeEach(() => {
  delete state.env.AUTH_PASSKEY_ORIGIN;
  delete state.env.AUTH_PASSKEY_RP_ID;
});

it('uses configured trusted origins and does not trust arbitrary request headers', () => {
  expect(getPasskeyRelyingParty('https://attacker.example')).toMatchObject({
    id: 'localhost',
    origin: 'http://localhost:5001',
  });
  expect(getPasskeyRelyingParty('http://127.0.0.1:5001')).toMatchObject({
    id: '127.0.0.1',
    origin: 'http://127.0.0.1:5001',
  });
  state.env.AUTH_PASSKEY_ORIGIN = 'https://auth.example.com';
  state.env.AUTH_PASSKEY_RP_ID = 'example.com';
  expect(getPasskeyRelyingParty('https://attacker.example')).toMatchObject({
    id: 'example.com',
    origin: 'https://auth.example.com',
  });
});

it('rejects a relying-party ID unrelated to its configured origin', () => {
  state.env.AUTH_PASSKEY_ORIGIN = 'https://auth.example.com';
  state.env.AUTH_PASSKEY_RP_ID = 'attacker.example';
  expect(() => getPasskeyRelyingParty()).toThrow();
});
