// Server-side only — Firebase Admin SDK
import { initializeApp, getApps, cert, App, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

export function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

adminApp = getAdminApp();

export const adminDb = adminApp ? getFirestore(adminApp) : (null as unknown as ReturnType<typeof getFirestore>);
export const adminAuth = adminApp ? getAuth(adminApp) : (null as unknown as ReturnType<typeof getAuth>);
