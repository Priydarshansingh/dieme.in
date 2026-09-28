'use client';

import { useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

// ─── Firestore provisioning ────────────────────────────────────────────────────
// Called once when a new user signs in. Creates:
//   /users/{uid}
//   /workspaces/{uid}          (workspace ID = owner UID for simplicity)
//   /workspaces/{uid}/members/{uid}
async function provisionNewUser(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  // Already exists — nothing to do
  if (snap.exists()) return;

  const workspaceId = user.uid; // personal workspace ID = owner UID

  // 1. User document
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    defaultWorkspaceId: workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Workspace document
  const wsRef = doc(db, 'workspaces', workspaceId);
  await setDoc(wsRef, {
    id: workspaceId,
    name: `${user.displayName ?? user.email}'s Workspace`,
    ownerUid: user.uid,
    plan: 'free_trial',
    telegramEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3. Member record
  const memberRef = doc(collection(db, 'workspaces', workspaceId, 'members'), user.uid);
  await setDoc(memberRef, {
    uid: user.uid,
    role: 'owner',
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    telegramUpload: true, // owner can always upload
    joinedAt: serverTimestamp(),
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Provision on first sign-in (idempotent — checks before writing)
        await provisionNewUser(u);
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Product account only — YouTube OAuth is a separate step in Settings
    provider.addScope('email');
    provider.addScope('profile');
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, signInWithGoogle, logout };
}
