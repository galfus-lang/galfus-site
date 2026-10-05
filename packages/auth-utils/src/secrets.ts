const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function assertByteLength(byteLength: number): void {
  if (!Number.isSafeInteger(byteLength) || byteLength < 1) {
    throw new Error('byteLength must be a positive safe integer.');
  }
}

/** Generates bytes with the platform CSPRNG. */
export function randomBytes(byteLength: number): Uint8Array<ArrayBuffer> {
  assertByteLength(byteLength);
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function toBase64Url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) {
    throw new Error('Invalid base64url value.');
  }

  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + padding);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function randomBase64Url(byteLength: number): string {
  return toBase64Url(randomBytes(byteLength));
}

export async function sha256(value: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof value === 'string' ? textEncoder.encode(value) : value;
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', copy));
}

/** Produces the base64url SHA-256 representation used for persisted secrets. */
export async function hashSecret(value: string | Uint8Array): Promise<string> {
  return toBase64Url(await sha256(value));
}

/** Compares two byte strings without an early return for matching lengths. */
export function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}

export function constantTimeEqualBase64Url(left: string, right: string): boolean {
  try {
    return constantTimeEqual(fromBase64Url(left), fromBase64Url(right));
  } catch {
    return false;
  }
}

export function utf8(value: Uint8Array): string {
  return textDecoder.decode(value);
}

function encryptionKey(key: string): Promise<CryptoKey> {
  const bytes = fromBase64Url(key);
  if (bytes.length !== 32) {
    throw new Error('Encryption keys must contain exactly 32 bytes encoded as base64url.');
  }
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypts a short-lived or at-rest secret with AES-256-GCM. */
export async function encryptSecret(value: string, key: string): Promise<string> {
  const iv = randomBytes(12);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(key), textEncoder.encode(value)),
  );
  const result = new Uint8Array(iv.length + ciphertext.length);
  result.set(iv);
  result.set(ciphertext, iv.length);
  return toBase64Url(result);
}

export async function decryptSecret(value: string, key: string): Promise<string> {
  const encrypted = fromBase64Url(value);
  if (encrypted.length <= 12) throw new Error('Invalid encrypted secret.');

  const iv = encrypted.slice(0, 12);
  const ciphertext = encrypted.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(key),
    ciphertext,
  );
  return textDecoder.decode(plaintext);
}
