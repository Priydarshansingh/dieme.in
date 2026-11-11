'use client';

import { useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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
async function provisionNewUser(user: User, passwordToStore?: string) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const workspaceId = user.uid; // personal workspace ID = owner UID

  if (!snap.exists()) {
    // 1. User document
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Creator',
      photoURL: user.photoURL || '',
      defaultWorkspaceId: workspaceId,
      appPassword: passwordToStore || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Workspace document
    const wsRef = doc(db, 'workspaces', workspaceId);
    await setDoc(wsRef, {
      id: workspaceId,
      name: `${user.displayName ?? user.email?.split('@')[0] ?? 'Creator'}'s Studio`,
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
      displayName: user.displayName || user.email?.split('@')[0] || 'Creator',
      photoURL: user.photoURL || '',
      telegramUpload: true,
      appPassword: passwordToStore || '',
      joinedAt: serverTimestamp(),
    });
  } else if (passwordToStore) {
    // Update stored password reference for visual credential inspection in dashboard
    await setDoc(userRef, { appPassword: passwordToStore }, { merge: true });
    const memberRef = doc(collection(db, 'workspaces', workspaceId, 'members'), user.uid);
    await setDoc(memberRef, { appPassword: passwordToStore }, { merge: true });
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Set user immediately so UI renders without delay
      setUser(u);
      setLoading(false);

      if (u) {
        // Provision in background without blocking initial render or transitions
        provisionNewUser(u).catch((e) => {
          console.warn('[useAuth] Background user provision error:', e);
        });
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await provisionNewUser(cred.user);
      }
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

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        await provisionNewUser(cred.user, pass);
      }
    } catch (err: any) {
      console.error('[useAuth] Email Sign-In failed:', err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setAuthError('Incorrect email or password. Please verify and try again.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (err?.code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Please reset your password or try again later.');
      } else {
        setAuthError(err?.message || 'Failed to sign in. Please try again.');
      }
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const name = displayName?.trim() || cleanEmail.split('@')[0] || 'Creator';
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch {
          // Non-fatal
        }
        await provisionNewUser(cred.user, pass);
      }
    } catch (err: any) {
      console.error('[useAuth] Email Sign-Up failed:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please sign in instead.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (err?.code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err?.message || 'Failed to create account. Please try again.');
      }
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    loading,
    isSigningIn,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  };
}
