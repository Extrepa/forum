function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(aBytes, bBytes) {
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export function normalizeEmail(input) {
  return String(input || '').trim().toLowerCase();
}

export function isProbablyEmail(input) {
  const v = String(input || '').trim();
  return v.includes('@') && v.includes('.');
}

// Stored format:
// pbkdf2_sha256$<iterations>$<salt_b64url>$<hash_b64url>
const ALGO = 'pbkdf2_sha256';
const HASH = 'SHA-256';
const KEY_LENGTH_BITS = 256;
const DEFAULT_ITERATIONS = 310000;

export async function hashPassword(password, opts = {}) {
  const iterations = Number.isFinite(opts.iterations) ? Math.floor(opts.iterations) : DEFAULT_ITERATIONS;
  if (!password || String(password).length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (!Number.isFinite(iterations) || iterations < 100000) {
    throw new Error('Invalid password hashing parameters.');
  }

  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: HASH },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  const hashBytes = new Uint8Array(bits);

  return `${ALGO}$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hashBytes)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 4) return false;
  const [algo, iterRaw, saltRaw, hashRaw] = parts;
  if (algo !== ALGO) return false;
  const iterations = Number.parseInt(iterRaw, 10);
  if (!Number.isFinite(iterations) || iterations < 100000) return false;

  const salt = base64UrlToBytes(saltRaw);
  const expectedHash = base64UrlToBytes(hashRaw);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: HASH },
    keyMaterial,
    expectedHash.length * 8
  );
  const actualHash = new Uint8Array(bits);

  return constantTimeEqual(actualHash, expectedHash);
}

