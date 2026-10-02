'use client';

import { useEffect, useState } from 'react';
import {
  collection, getDocs, doc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, Mail, Shield, Trash2, Users, Eye, EyeOff, AlertTriangle, Smartphone, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Member {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  telegramUpload?: boolean;
  joinedAt?: Timestamp;
}

const ROLE_CONFIG: Record<Member['role'], { label: string; color: string; bg: string }> = {
  owner:  { label: 'Owner',  color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  admin:  { label: 'Admin',  color: '#1B2237', bg: 'rgba(27,34,55,0.08)' },
  editor: { label: 'Editor', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  viewer: { label: 'Viewer', color: '#6B7280', bg: '#F4F6F9' },
};

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // App User Creation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Owner App Password State
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [isSavingOwnerPassword, setIsSavingOwnerPassword] = useState(false);
  const [ownerPasswordSuccess, setOwnerPasswordSuccess] = useState<string | null>(null);
  const [ownerPasswordError, setOwnerPasswordError] = useState<string | null>(null);

  // Subscription State
  const [subscription, setSubscription] = useState<{
    status: 'trial' | 'active' | 'expired';
    plan: 'free_trial' | 'pro';
    trialEndsAt: string | null;
    subscriptionExpiresAt: string | null;
    daysRemaining: number;
    isExpired: boolean;
  } | null>(null);

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMembers();
  }, [user]);

  async function loadSubscription(wid: string) {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/workspaces/subscription?workspaceId=${wid}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Subscription load error:', err);
    }
  }

  async function loadMembers() {
    try {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (!userSnap.exists()) return;
      const wid: string = userSnap.data().defaultWorkspaceId;
      setWorkspaceId(wid);
      loadSubscription(wid);
      const snap = await getDocs(collection(db, 'workspaces', wid, 'members'));
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
    } catch (err) {
      console.error('Team load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSetOwnerPassword = async () => {
    if (!ownerPassword || !workspaceId) {
      setOwnerPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSavingOwnerPassword(true);
    setOwnerPasswordError(null);
    setOwnerPasswordSuccess(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/team/set-owner-app-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          workspaceId,
          password: ownerPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set app password');
      }

      setOwnerPasswordSuccess('Your mobile app login password has been saved! You can now log into the mobile app with your email and this password.');
      setOwnerPassword('');
      setTimeout(() => setOwnerPasswordSuccess(null), 5000);
    } catch (err: any) {
      setOwnerPasswordError(err.message);
    } finally {
      setIsSavingOwnerPassword(false);
    }
  };

  const handleCreateAppUser = async () => {
    if (!inviteEmail || !invitePassword || !workspaceId) {
      setCreateError('Email and Password are required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/team/create-app-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail,
          password: invitePassword,
          displayName: inviteEmail.split('@')[0],
          role: 'editor'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create app user');
      }

      setCreateSuccess(data.isExisting ? 'Editor app password updated successfully!' : 'Editor app user created successfully!');
      setInviteEmail('');
      setInvitePassword('');
      loadMembers(); // Refresh list

      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const currentUserIsOwner = members.find(m => m.uid === user?.uid)?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#1B2237' }}>Team & App Access</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            Generate ID & passwords for the mobile app for yourself and your team.
          </p>
        </div>

        {subscription && (
          <div>
            {subscription.isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Subscription Expired
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: subscription.status === 'trial' ? '#EFF6FF' : '#ECFDF5',
                  borderColor: subscription.status === 'trial' ? '#BFDBFE' : '#A7F3D0',
                  color: subscription.status === 'trial' ? '#1D4ED8' : '#047857',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: subscription.status === 'trial' ? '#3B82F6' : '#10B981' }}
                />
                {subscription.plan === 'pro'
                  ? `Pro Monthly (${subscription.daysRemaining}d left)`
                  : `Free Trial (${subscription.daysRemaining}d left)`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Subscription Expired Warning Banner */}
      {subscription?.isExpired && (
        <div className="rounded-2xl p-5 border border-red-200 bg-red-50 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-red-900">Workspace Subscription Expired</h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Your workspace trial or subscription has expired. All mobile app logins (creator and editors) are suspended until renewed. Renew your subscription in Settings to restore mobile app access and generate new passwords.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="px-4 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shrink-0 transition shadow-sm"
          >
            Renew in Settings &rarr;
          </button>
        </div>
      )}

      {/* Creator / Owner Mobile App Login Card */}
      {currentUserIsOwner && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4" style={{ color: '#7C3AED' }} />
                <h2 style={{ color: '#1B2237' }}>My Mobile App Login (Creator)</h2>
              </div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                Set your mobile app password to log in directly into the Digicast mobile app with your email.
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
              style={{ color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)' }}
            >
              Workspace Owner
            </span>
          </div>

          {ownerPasswordError && (
            <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 border border-red-100">
              {ownerPasswordError}
            </div>
          )}

          {ownerPasswordSuccess && (
            <div className="p-3 text-sm rounded-lg bg-green-50 text-green-700 border border-green-100 font-medium">
              {ownerPasswordSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-gray-50 opacity-80"
              style={{ borderColor: '#E5E7EB' }}
            >
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
              <input
                type="text"
                readOnly
                value={user?.email || ''}
                className="flex-1 text-sm bg-transparent outline-none w-full cursor-not-allowed font-mono text-gray-700"
                title="Your App User ID (Email)"
              />
            </div>

            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors focus-within:border-indigo-500"
              style={{ backgroundColor: '#F4F6F9', borderColor: '#E5E7EB' }}
            >
              <button
                type="button"
                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                className="shrink-0 focus:outline-none"
              >
                {showOwnerPassword ? (
                  <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                )}
              </button>
              <input
                type={showOwnerPassword ? "text" : "password"}
                placeholder="Set / Reset App Password"
                value={ownerPassword}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50"
                style={{ color: '#1B2237' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Your login ID is your email: <code className="font-semibold text-gray-700">{user?.email}</code>
            </p>
            <button
              onClick={handleSetOwnerPassword}
              disabled={isSavingOwnerPassword || !ownerPassword || Boolean(subscription?.isExpired)}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
            >
              {isSavingOwnerPassword ? 'Saving...' : 'Save App Password'}
            </button>
          </div>
        </div>
      )}

      {/* Editor App Login Card — only owners can create */}
      {currentUserIsOwner && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4" style={{ color: '#1B2237' }} />
              <h2 style={{ color: '#1B2237' }}>Add Editor App Login</h2>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Generate an ID and Password for an Editor to log into the Digicast mobile app. If the editor already exists, submitting will update their password.
            </p>
          </div>

          {createError && (
            <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 border border-red-100">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="p-3 text-sm rounded-lg bg-green-50 text-green-700 border border-green-100 font-medium">
              {createSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors focus-within:border-indigo-500"
              style={{ backgroundColor: '#F4F6F9', borderColor: '#E5E7EB' }}
            >
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
              <input
                type="email"
                placeholder="editor@example.com"
                value={inviteEmail}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50"
                style={{ color: '#1B2237' }}
              />
            </div>

            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors focus-within:border-indigo-500"
              style={{ backgroundColor: '#F4F6F9', borderColor: '#E5E7EB' }}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                )}
              </button>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Secure Password (min 6 chars)"
                value={invitePassword}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50"
                style={{ color: '#1B2237' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Editors will automatically sync live streams and can trigger clips from their mobile device.
            </p>
            <button
              onClick={handleCreateAppUser}
              disabled={isCreating || !inviteEmail || !invitePassword || Boolean(subscription?.isExpired)}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#1B2237', color: '#FFFFFF' }}
            >
              {isCreating ? 'Saving...' : 'Save Editor Login'}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="space-y-3">
        <h2 style={{ color: '#1B2237' }}>
          Workspace Members
          <span className="ml-2 text-sm font-normal" style={{ color: '#9CA3AF' }}>
            {members.length}
          </span>
        </h2>

        {members.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center border border-dashed"
            style={{ borderColor: '#E5E7EB' }}
          >
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No members yet</p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            {members.map((member) => {
              const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.viewer;
              return (
                <div key={member.uid} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  {member.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoURL}
                      alt=""
                      className="w-9 h-9 rounded-full shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: '#F4F6F9', color: '#1B2237' }}
                    >
                      {member.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1B2237' }}>
                        {member.displayName ?? 'Unknown'}
                      </p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        App User
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{member.email}</p>
                  </div>

                  {/* Telegram toggle indicator (editor only) */}
                  {member.role === 'editor' && (
                    <div
                      className="hidden sm:flex items-center gap-1 text-xs font-medium shrink-0"
                      style={{ color: member.telegramUpload ? '#059669' : '#9CA3AF' }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Telegram {member.telegramUpload ? 'on' : 'off'}
                    </div>
                  )}

                  {/* Role badge */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>

                  {/* Quick Reset Password button for Editors */}
                  {member.role === 'editor' && currentUserIsOwner && (
                    <button
                      onClick={() => {
                        setInviteEmail(member.email || '');
                        window.scrollTo({ top: 250, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
                      title="Update app password for this editor"
                    >
                      Set Password
                    </button>
                  )}

                  {/* Remove (not for owner, only owner can remove) */}
                  {member.role !== 'owner' && currentUserIsOwner && (
                    <button
                      className="shrink-0 transition hover:opacity-60"
                      style={{ color: '#D1D5DB' }}
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security notice */}
      <div
        className="rounded-xl p-4 text-xs leading-relaxed"
        style={{ backgroundColor: '#F4F6F9', color: '#9CA3AF' }}
      >
        <span className="font-semibold text-gray-700">App Security & Subscription:</span> All creator and editor mobile credentials remain active during your active subscription or free trial. If the subscription expires, credentials automatically expire. When renewed, you can update credentials and app access is immediately restored.
      </div>
    </div>
  );
}
