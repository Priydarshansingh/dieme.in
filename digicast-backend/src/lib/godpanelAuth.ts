import crypto from 'crypto';

export interface GodAdmin {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'sub_admin';
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  permissions: string[];
}

const SECRET_KEY = process.env.GODPANEL_JWT_SECRET || process.env.DIGICAST_HMAC_SECRET || 'digicast-godpanel-master-secret-salt-key-2026';

// In-memory admin store with secure PBKDF2 hash for root admin fallback
const inMemoryAdmins = new Map<string, any>();

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyAdminPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const origBuf = Buffer.from(originalHash, 'hex');
  if (hashBuf.length !== origBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, origBuf);
}

export function createGodSessionToken(payload: { username: string; role: 'super_admin' | 'sub_admin'; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days session
  const data = Buffer.from(JSON.stringify({ ...payload, exp: expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyGodSessionToken(token: string): { username: string; role: 'super_admin' | 'sub_admin'; name: string } | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${data}`).digest('base64url');
  
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return {
      username: parsed.username,
      role: parsed.role,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

// Initialize default root admin if empty
export function getRootAdminRecord() {
  if (!inMemoryAdmins.has('admin')) {
    const defaultPassword = process.env.ROOT_ADMIN_PASSWORD || 'DigicastGod2026!#';
    inMemoryAdmins.set('admin', {
      id: 'admin_root',
      username: 'admin',
      name: 'Super God Admin',
      role: 'super_admin',
      passwordHash: hashAdminPassword(defaultPassword),
      isActive: true,
      permissions: ['all'],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
  }
  return inMemoryAdmins.get('admin');
}
