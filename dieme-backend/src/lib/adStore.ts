import { adminDb } from '@/lib/firebase/admin';

// Ad Pass Store Interface
export interface UserAdPass {
  uid?: string;
  hasActivePass?: boolean;
  passExpiresAt: number;
  totalAdsWatched: number;
  lastAdWatchedAt: number;
  unlockMethod?: string;
}

// In-memory cache for ultra-fast local lookups
export const userAdPassStore = new Map<string, UserAdPass>();

/**
 * Retrieves a user's ad pass, checking memory cache first and falling back to Firestore
 */
export async function getAdPass(uid: string): Promise<UserAdPass | null> {
  const now = Date.now();
  const cached = userAdPassStore.get(uid);

  // If active in memory cache, return immediately
  if (cached && cached.passExpiresAt > now) {
    return cached;
  }

  // Fallback to Firestore ad_passes collection
  if (adminDb) {
    try {
      const doc = await adminDb.collection('ad_passes').doc(uid).get();
      if (doc.exists) {
        const data = doc.data() as UserAdPass;
        // Keep local memory cache updated
        userAdPassStore.set(uid, data);
        return data;
      }
    } catch (err: any) {
      console.warn('[adStore] Firestore ad pass fetch fallback:', err.message);
    }
  }

  return cached || null;
}

/**
 * Persists an ad pass to Firestore with TTL support and keeps memory cache in sync
 */
export async function saveAdPass(uid: string, pass: Partial<UserAdPass>): Promise<UserAdPass> {
  const current = await getAdPass(uid);
  const now = Date.now();

  const merged: UserAdPass = {
    uid,
    hasActivePass: (pass.passExpiresAt || current?.passExpiresAt || 0) > now,
    passExpiresAt: pass.passExpiresAt ?? current?.passExpiresAt ?? now,
    totalAdsWatched: pass.totalAdsWatched ?? (current?.totalAdsWatched || 0) + 1,
    lastAdWatchedAt: pass.lastAdWatchedAt ?? now,
    unlockMethod: pass.unlockMethod ?? current?.unlockMethod ?? 'SPONSORED_AD',
  };

  // Update memory cache
  userAdPassStore.set(uid, merged);

  // Persist to Firestore with TTL policy compatible field
  if (adminDb) {
    try {
      await adminDb.collection('ad_passes').doc(uid).set(
        {
          ...merged,
          expiresAt: new Date(merged.passExpiresAt),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[adStore] Firestore ad pass save warning:', err.message);
    }
  }

  return merged;
}

/**
 * Counts total active 24h passes across the platform
 */
export async function countActiveAdPasses(): Promise<number> {
  const now = Date.now();

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('ad_passes')
        .where('passExpiresAt', '>', now)
        .get();
      return snap.size;
    } catch (err: any) {
      console.warn('[adStore] Firestore count active passes fallback:', err.message);
    }
  }

  // Fallback to memory
  let count = 0;
  userAdPassStore.forEach((pass) => {
    if (pass.passExpiresAt > now) count++;
  });
  return count;
}
