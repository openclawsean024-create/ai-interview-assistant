/**
 * AES-GCM encryption for API keys stored in localStorage.
 * Uses PBKDF2 key derivation so the stored value is unreadable without the same salt.
 */
const SALT = new TextEncoder().encode('ai-interview-v1-salt-2024');
const ITERATIONS = 100_000;

async function deriveKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('ai-interview-client-key'),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Prepend iv (12 bytes) to ciphertext, then base64-encode
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(Array.from(combined, (c) => String.fromCharCode(c)).join(''));
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  try {
    const key = await deriveKey();
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    // Return as-is if decryption fails (handles legacy unencrypted keys)
    return encrypted;
  }
}

/** Detects whether a stored string is already AES-GCM encrypted (base64, > 20 chars, no sk- prefix). */
export function isEncrypted(value: string): boolean {
  return !value.startsWith('sk-') && value.length > 20;
}
