'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const MASTER_DEVELOPER_EMAILS = [
  'pskishnawat133@gmail.com',
  'shivambanna786@gmail.com',
];

const MASTER_DEV_PASSCODES = [
  'DIGICAST_DEV_2026',
  '7727094133',
];

export function useDeveloperAccess() {
  const { user, loading: authLoading } = useAuth();
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check access status
  const checkAccess = useCallback(async () => {
    if (!user) {
      // Check local developer key override even if not signed in
      if (typeof window !== 'undefined') {
        const localDev = localStorage.getItem('digicast_developer_mode') === 'true';
        setHasDeveloperAccess(localDev);
      }
      setIsChecking(false);
      return;
    }

    // 1. Primary Owner / Master Developer check
    const cleanEmail = (user.email || '').toLowerCase().trim();
    if (MASTER_DEVELOPER_EMAILS.includes(cleanEmail)) {
      setHasDeveloperAccess(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('digicast_developer_mode', 'true');
      }
      setIsChecking(false);
      return;
    }

    // 2. Local storage bypass check
    if (typeof window !== 'undefined' && localStorage.getItem('digicast_developer_mode') === 'true') {
      setHasDeveloperAccess(true);
      setIsChecking(false);
      return;
    }

    // 3. Firestore user document check
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.developerAccess === true || data?.isDeveloper === true || data?.role === 'owner') {
          setHasDeveloperAccess(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('digicast_developer_mode', 'true');
          }
          setIsChecking(false);
          return;
        }
      }
    } catch (e) {
      console.warn('[useDeveloperAccess] Firestore lookup note:', e);
    }

    setHasDeveloperAccess(false);
    setIsChecking(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkAccess();
    }
  }, [user, authLoading, checkAccess]);

  // Unlock using master developer passcode
  const unlockWithDevKey = (passcode: string): boolean => {
    const clean = passcode.trim();
    if (MASTER_DEV_PASSCODES.includes(clean)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('digicast_developer_mode', 'true');
      }
      setHasDeveloperAccess(true);
      return true;
    }
    return false;
  };

  // Toggle developer access for a member via API
  const toggleTargetDeveloperAccess = async (targetUid: string, enabled: boolean, workspaceId?: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const res = await fetch('/api/team/developer-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : '',
          'x-user-uid': user.uid,
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({ targetUid, enabled, workspaceId })
      });
      return res.ok;
    } catch (err) {
      console.error('[toggleTargetDeveloperAccess] Error:', err);
      return false;
    }
  };

  return {
    hasDeveloperAccess,
    isChecking,
    unlockWithDevKey,
    toggleTargetDeveloperAccess,
    recheckAccess: checkAccess,
  };
}
