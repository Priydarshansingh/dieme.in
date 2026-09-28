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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Provision on first sign-in (idempotent — checks before writing)
        try {
          await provisionNewUser(u);
        } catch (e) {
          console.warn('[useAuth] User provision error:', e);
        }
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Product account only — YouTube OAuth is a separate step in Settings
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('[useAuth] Google Sign-In failed:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        setAuthError(
          'This domain is not authorized in Firebase. Add your Vercel domain in Firebase Console → Authentication → Settings → Authorized domains.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setAuthError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, isSigningIn, authError, signInWithGoogle, logout };
}
