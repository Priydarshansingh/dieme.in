import { adminAuth, adminDb } from '@/lib/firebase/admin';

export interface PlatformUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'streamer' | 'editor' | 'admin' | 'owner';
  plan: string;
  status: 'active' | 'suspended' | 'trial';
  dCoinsBalance: number;
  dpBalance: number;
  isOnline: boolean;
  activeStreamTitle?: string;
  concurrentViewers?: number;
  joinedAt: string;
  lastActiveAt: string;
}

// In-memory runtime modifications cache
const runtimeUserUpdates = new Map<string, Partial<PlatformUser>>();
const runtimeCreatedUsers = new Map<string, PlatformUser>();

export async function getActualPlatformUsers(): Promise<PlatformUser[]> {
  try {
    if (!adminAuth || !adminDb) {
      return Array.from(runtimeCreatedUsers.values());
    }

    // 1. Fetch real Firebase Auth users
    const authResult = await adminAuth.listUsers(100);
    
    // 2. Fetch real Firestore users collection
    const userDocs = await adminDb.collection('users').get();
    const userDocMap = new Map<string, any>();
    userDocs.forEach((doc) => userDocMap.set(doc.id, doc.data()));

    // 3. Fetch real Firestore workspaces collection
    const wsDocs = await adminDb.collection('workspaces').get();
    const wsMap = new Map<string, any>();
    wsDocs.forEach((doc) => {
      const data = doc.data();
      if (data.ownerUid) wsMap.set(data.ownerUid, data);
      else if (data.ownerId) wsMap.set(data.ownerId, data);
      else wsMap.set(doc.id, data);
    });

    const mappedUsers: PlatformUser[] = authResult.users.map((u) => {
      const fUser = userDocMap.get(u.uid) || {};
      const ws = wsMap.get(u.uid) || {};
      const updates = runtimeUserUpdates.get(u.uid) || {};

      const role: PlatformUser['role'] =
        updates.role ||
        fUser.role ||
        (u.email === 'pskishnawat133@gmail.com' ? 'owner' : 'streamer');

      const plan = updates.plan || ws.plan || ws.subscription || 'free_trial';

      const isSubscribed =
        ws.subscriptionStatus === 'active' ||
        (plan !== 'free_trial' && plan !== 'free');

      const status: PlatformUser['status'] =
        updates.status || (isSubscribed ? 'active' : 'trial');

      // Check if user has active stream or is recently active
      const lastLoginTime = fUser.lastLoginAt ? new Date(fUser.lastLoginAt).getTime() : 0;
      const isRecentlyActive = Date.now() - lastLoginTime < 15 * 60 * 1000;

      return {
        uid: u.uid,
        displayName:
          updates.displayName ||
          u.displayName ||
          fUser.displayName ||
          u.email?.split('@')[0] ||
          'Digicast Creator',
        email: u.email || '',
        role,
        plan,
        status,
        dCoinsBalance: updates.dCoinsBalance ?? fUser.dCoinsBalance ?? 0,
        dpBalance: updates.dpBalance ?? fUser.dpBalance ?? 0,
        isOnline: isRecentlyActive,
        activeStreamTitle: fUser.activeStreamTitle,
        concurrentViewers: fUser.concurrentViewers || 0,
        joinedAt: u.metadata.creationTime || new Date().toISOString(),
        lastActiveAt: fUser.lastLoginAt
          ? new Date(fUser.lastLoginAt).toLocaleTimeString()
          : u.metadata.lastSignInTime
          ? new Date(u.metadata.lastSignInTime).toLocaleDateString()
          : 'Inactive',
      };
    });

    // Add any runtime created users not yet in Firebase
    Array.from(runtimeCreatedUsers.entries()).forEach(([uid, user]) => {
      if (!mappedUsers.find((m) => m.uid === uid)) {
        mappedUsers.push(user);
      }
    });

    return mappedUsers;
  } catch (err: any) {
    console.error('Error fetching actual Firebase users:', err.message);
    return Array.from(runtimeCreatedUsers.values());
  }
}

export function getAllPlatformUsers(): PlatformUser[] {
  // Sync fallback returns runtime created users
  return Array.from(runtimeCreatedUsers.values());
}

export function updatePlatformUser(uid: string, updates: Partial<PlatformUser>): PlatformUser {
  runtimeUserUpdates.set(uid, updates);
  return {
    uid,
    displayName: updates.displayName || 'Creator',
    email: updates.email || '',
    role: updates.role || 'streamer',
    plan: updates.plan || 'free_trial',
    status: updates.status || 'active',
    dCoinsBalance: updates.dCoinsBalance || 0,
    dpBalance: updates.dpBalance || 0,
    isOnline: false,
    joinedAt: new Date().toISOString(),
    lastActiveAt: 'Just now',
    ...updates,
  };
}

export function getPlatformUser(uid: string): PlatformUser | undefined {
  return runtimeCreatedUsers.get(uid) || undefined;
}

export function createPlatformUser(user: PlatformUser): PlatformUser {
  runtimeCreatedUsers.set(user.uid, user);
  return user;
}
