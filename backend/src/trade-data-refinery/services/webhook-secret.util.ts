import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm' as const;
const ENC_PREFIX = 'enc:v1:';
const KEY_BYTES = 32;
const IV_BYTES = 12;

/**
 * Encrypts a webhook signing secret with AES-256-GCM.
 * Stored format: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 * keyHex must be a 64-character hex string (32 bytes).
 */
export function encryptWebhookSecret(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY must be exactly ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes).`,
    );
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts a webhook signing secret.
 * If the stored value does not start with the `enc:v1:` prefix it is treated
 * as a legacy plaintext secret and returned unchanged (backward compatibility).
 */
export function decryptWebhookSecret(envelope: string, keyHex: string): string {
  if (!envelope.startsWith(ENC_PREFIX)) {
    // Legacy plaintext record — return as-is
    return envelope;
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY must be exactly ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes).`,
    );
  }
  const rest = envelope.slice(ENC_PREFIX.length);
  const colonCount = (rest.match(/:/g) ?? []).length;
  if (colonCount !== 2) {
    throw new Error('Invalid encrypted webhook secret envelope format.');
  }
  const firstColon = rest.indexOf(':');
  const secondColon = rest.indexOf(':', firstColon + 1);
  const ivHex = rest.slice(0, firstColon);
  const authTagHex = rest.slice(firstColon + 1, secondColon);
  const ciphertextHex = rest.slice(secondColon + 1);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Returns true when the envelope is already in the `enc:v1:` format. */
export function isEncryptedEnvelope(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
