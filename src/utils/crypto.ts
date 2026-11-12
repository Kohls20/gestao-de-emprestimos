const ENVELOPE_FORMAT = 'p2p-ledger-encrypted';
const ENVELOPE_VERSION = 1;
const DEFAULT_ITERATIONS = 310_000;

export type EncryptionPurpose = 'local' | 'backup';

export interface EncryptedEnvelope {
  format: typeof ENVELOPE_FORMAT;
  version: typeof ENVELOPE_VERSION;
  purpose: EncryptionPurpose;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function ensureWebCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error(
      'Este navegador não oferece suporte à criptografia necessária. Atualize o navegador e tente novamente.',
    );
  }

  return globalThis.crypto.subtle;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error('O arquivo de dados criptografados está malformado.');
  }
}

export function isEncryptedEnvelope(
  value: unknown,
): value is EncryptedEnvelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const envelope = value as Record<string, unknown>;
  return (
    envelope.format === ENVELOPE_FORMAT &&
    envelope.version === ENVELOPE_VERSION &&
    (envelope.purpose === 'local' || envelope.purpose === 'backup') &&
    envelope.algorithm === 'AES-GCM' &&
    envelope.kdf === 'PBKDF2-SHA-256' &&
    typeof envelope.iterations === 'number' &&
    Number.isInteger(envelope.iterations) &&
    envelope.iterations >= 100_000 &&
    envelope.iterations <= 1_000_000 &&
    typeof envelope.salt === 'string' &&
    typeof envelope.iv === 'string' &&
    typeof envelope.ciphertext === 'string'
  );
}

export function createEncryptionSalt(): string {
  ensureWebCrypto();
  return encodeBase64(globalThis.crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveEncryptionKey(
  password: string,
  salt: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<CryptoKey> {
  const subtle = ensureWebCrypto();
  if (password.length === 0) {
    throw new Error('A senha não pode ficar vazia.');
  }
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) {
    throw new Error('Os parâmetros de criptografia são inválidos.');
  }

  const saltBytes = decodeBase64(salt);
  if (saltBytes.length !== 16) {
    throw new Error('O arquivo de dados criptografados está malformado.');
  }

  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJsonWithKey(
  value: unknown,
  key: CryptoKey,
  salt: string,
  purpose: EncryptionPurpose,
  iterations = DEFAULT_ITERATIONS,
): Promise<EncryptedEnvelope> {
  const subtle = ensureWebCrypto();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  );

  return {
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
    purpose,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations,
    salt,
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJsonWithKey<T>(
  envelope: EncryptedEnvelope,
  key: CryptoKey,
): Promise<T> {
  const subtle = ensureWebCrypto();
  const iv = decodeBase64(envelope.iv);
  if (iv.length !== 12) {
    throw new Error('O arquivo de dados criptografados está malformado.');
  }

  try {
    const plaintext = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      decodeBase64(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new Error('Senha incorreta ou dados criptografados inválidos.');
  }
}

export async function encryptJsonWithPassword(
  value: unknown,
  password: string,
  purpose: EncryptionPurpose,
): Promise<EncryptedEnvelope> {
  const salt = createEncryptionSalt();
  const key = await deriveEncryptionKey(password, salt);
  return encryptJsonWithKey(value, key, salt, purpose);
}

export async function decryptJsonWithPassword<T>(
  envelope: EncryptedEnvelope,
  password: string,
  expectedPurpose: EncryptionPurpose,
): Promise<T> {
  if (!isEncryptedEnvelope(envelope) || envelope.purpose !== expectedPurpose) {
    throw new Error('O arquivo não é um backup compatível do P2P Ledger.');
  }

  const key = await deriveEncryptionKey(
    password,
    envelope.salt,
    envelope.iterations,
  );
  return decryptJsonWithKey<T>(envelope, key);
}
