// Server-side only — Firebase Admin SDK
import { initializeApp, getApps, cert, App, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | null = null;

export function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'digicast-eaca1.firebasestorage.app';

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  } catch (err: any) {
    console.warn("[firebase-admin] Warning: could not initialize with service account cert:", err?.message);
    return null;
  }
}

adminApp = getAdminApp();

export const adminDb = adminApp ? getFirestore(adminApp) : (null as unknown as ReturnType<typeof getFirestore>);
export const adminAuth = adminApp ? getAuth(adminApp) : (null as unknown as ReturnType<typeof getAuth>);
export const adminStorage = adminApp ? getStorage(adminApp) : (null as unknown as ReturnType<typeof getStorage>);

