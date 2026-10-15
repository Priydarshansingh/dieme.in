import crypto from 'crypto';

const HMAC_SECRET = process.env.DIGICAST_HMAC_SECRET || 'digicast_super_secure_hmac_secret_key_prod_2026';
const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_API_KEY || 'godpanel_master_secret_key_superadmin_auth_9988';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generates an HMAC-SHA256 signature for a payload string or object
 */
export function generateHmacSignature(payload: string | object, secret: string = HMAC_SECRET): string {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

/**
 * Verifies an incoming HMAC-SHA256 signature securely against timing attacks
 */
export function verifyHmacSignature(payload: string | object, signature: string, secret: string = HMAC_SECRET): boolean {
  if (!signature) return false;
  try {
    const expected = generateHmacSignature(payload, secret);
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates Master Admin Key for God Panel administrative endpoints
 */
export function verifyAdminKey(key: string | null | undefined): boolean {
  if (!key) return false;
  try {
    const keyBuf = Buffer.from(key);
    const masterBuf = Buffer.from(ADMIN_MASTER_KEY);
    if (keyBuf.length !== masterBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, masterBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically strong unique nonce with timestamp
 */
export function generateSecureNonce(prefix: string = 'nonce'): string {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${prefix}_${timestamp}_${randomBytes}`;
}

/**
 * Validates whether a timestamp is within the acceptable drift window
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) <= TIMESTAMP_TOLERANCE_MS;
}

/**
 * Creates a signed ad reward session token
 */
export function createSignedAdSession(uid: string): { sessionId: string; nonce: string; expiresAt: number; signature: string } {
  const sessionId = `ad_${crypto.randomBytes(12).toString('hex')}`;
  const nonce = generateSecureNonce('ad');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15-minute validity to complete ad

  const payload = `${sessionId}:${uid}:${nonce}:${expiresAt}`;
  const signature = generateHmacSignature(payload);

  return { sessionId, nonce, expiresAt, signature };
}

/**
 * Verifies signed ad reward session token
 */
export function verifySignedAdSession(sessionId: string, uid: string, nonce: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) {
    return false;
  }
  const payload = `${sessionId}:${uid}:${nonce}:${expiresAt}`;
  return verifyHmacSignature(payload, signature);
}
