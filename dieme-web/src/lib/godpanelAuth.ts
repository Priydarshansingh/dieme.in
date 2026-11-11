import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";

export interface GodAdmin {
  id: string;
  username: string;
  name: string;
  role: "super_admin" | "sub_admin";
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  permissions: string[];
}

const SECRET_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "digicast-godpanel-secret-salt-key-2026";

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyAdminPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

export function createGodSessionToken(payload: { username: string; role: "super_admin" | "sub_admin"; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days session
  const data = Buffer.from(JSON.stringify({ ...payload, exp: expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

export function verifyGodSessionToken(token: string): { username: string; role: "super_admin" | "sub_admin"; name: string } | null {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, data, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${data}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
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

export async function ensureDefaultRootAdmin(): Promise<void> {
  if (!adminDb) {
    console.warn("[godpanelAuth] adminDb is not initialized; skipping root admin collection check.");
    return;
  }
  const adminsSnap = await adminDb.collection("admins").limit(1).get();
  if (adminsSnap.empty) {
    const defaultPassword = "DigicastGod2026!#";
    const passwordHash = hashAdminPassword(defaultPassword);
    await adminDb.collection("admins").doc("admin_root").set({
      id: "admin_root",
      username: "admin",
      name: "Root God Admin",
      role: "super_admin",
      passwordHash,
      isActive: true,
      permissions: ["all"],
      createdAt: new Date().toISOString(),
    });
    console.log("[godpanelAuth] Initialized default root super_admin 'admin'");
  }
}
