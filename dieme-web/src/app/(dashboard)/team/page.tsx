'use client';

import { useEffect, useState } from 'react';
import {
  collection, getDocs, doc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  KeyRound, Mail, Shield, Trash2, Users, Eye, EyeOff,
  AlertTriangle, Smartphone, RefreshCw, CheckCircle2, Lock,
  Copy, Check, UserCheck, ShieldCheck, Code2, Terminal, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeveloperAccess } from '@/hooks/useDeveloperAccess';

interface Member {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator' | 'viewer';
  appPassword?: string;
  telegramUpload?: boolean;
  joinedAt?: Timestamp | string;
  developerAccess?: boolean;
}

const ROLE_CONFIG: Record<Member['role'], { label: string; color: string; bg: string; border: string }> = {
  owner:     { label: 'Owner',     color: '#C084FC', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  admin:     { label: 'Admin',     color: '#60A5FA', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)' },
  editor:    { label: 'Editor',    color: '#34D399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)' },
  moderator: { label: 'Moderator', color: '#22D3EE', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.3)' },
  viewer:    { label: 'Viewer',    color: '#94A3B8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // App User Creation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'admin' | 'moderator'>('editor');
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

  // Passwords visibility state per member
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

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
  const [serverCallerRole, setServerCallerRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMembers();
  }, [user]);

  async function loadSubscription(wid: string) {
    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/workspaces/subscription?workspaceId=${wid}`, {
        headers
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
    if (!user) return;
    try {
      let wid = user.uid;
      // Resolve default workspace without letting client firestore exceptions break page
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists() && userSnap.data()?.defaultWorkspaceId) {
          wid = userSnap.data().defaultWorkspaceId;
        }
      } catch (docErr) {
        console.warn('User doc client lookup note:', docErr);
      }

      setWorkspaceId(wid);
      loadSubscription(wid);

      // Robust authenticated fetch with fallback headers
      let idToken = '';
      try {
        idToken = (await auth.currentUser?.getIdToken()) || '';
      } catch (tokenErr) {
        console.warn('idToken refresh note:', tokenErr);
      }

      const headers: Record<string, string> = {
        'x-user-uid': user.uid,
        'x-user-email': user.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/team/members?workspaceId=${wid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        if (data.workspaceId) {
          setWorkspaceId(data.workspaceId);
        }
        if (data.callerRole) {
          setServerCallerRole(data.callerRole);
        }
      } else {
        console.warn('Team members API returned non-ok status:', res.status);
        try {
          const snap = await getDocs(collection(db, 'workspaces', wid, 'members'));
          setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
        } catch (clientErr) {
          console.warn('Client Firestore query error:', clientErr);
        }
      }
    } catch (err) {
      console.error('Team load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSetOwnerPassword = async () => {
    const activeWid = workspaceId || user?.uid;
    if (!ownerPassword) {
      setOwnerPasswordError('Password is required');
      return;
    }
    if (ownerPassword.length < 6) {
      setOwnerPasswordError('Password must be at least 6 characters');
      return;
    }
    if (!activeWid) {
      setOwnerPasswordError('Workspace could not be identified. Please refresh.');
      return;
    }

    setIsSavingOwnerPassword(true);
    setOwnerPasswordError(null);
    setOwnerPasswordSuccess(null);

    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/team/set-owner-app-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workspaceId: activeWid,
          password: ownerPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set app password');
      }

      setOwnerPasswordSuccess('Your mobile app login password has been saved! You can now log into the mobile app with your email and this password.');
      setOwnerPassword('');
      loadMembers();
      setTimeout(() => setOwnerPasswordSuccess(null), 5000);
    } catch (err: any) {
      setOwnerPasswordError(err.message);
    } finally {
      setIsSavingOwnerPassword(false);
    }
  };

  const handleCreateAppUser = async () => {
    const activeWid = workspaceId || user?.uid;
    if (!inviteEmail || !invitePassword) {
      setCreateError('Email and Password are required');
      return;
    }
    if (invitePassword.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }
    if (!activeWid) {
      setCreateError('Workspace could not be identified. Please refresh.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/team/create-app-user', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workspaceId: activeWid,
          email: inviteEmail.trim().toLowerCase(),
          password: invitePassword,
          displayName: inviteName.trim() || inviteEmail.split('@')[0],
          role: inviteRole,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create app user');
      }

      setCreateSuccess(data.isExisting
        ? `${inviteRole.toUpperCase()} credentials updated successfully!`
        : `${inviteRole.toUpperCase()} team member created successfully!`);
      setInviteEmail('');
      setInvitePassword('');
      setInviteName('');
      loadMembers();

      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    const activeWid = workspaceId || user?.uid;
    if (!activeWid) return;

    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/team/members?workspaceId=${activeWid}&memberId=${memberId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        loadMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing member');
    }
  };

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const copyToClipboard = (text: string, uid: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const { hasDeveloperAccess, toggleTargetDeveloperAccess } = useDeveloperAccess();
  const [updatingDevUid, setUpdatingDevUid] = useState<string | null>(null);
  const [devActionFeedback, setDevActionFeedback] = useState<string | null>(null);

  const handleToggleDevAccess = async (targetMember: Member) => {
    if (targetMember.email === 'pskishnawat133@gmail.com') {
      setDevActionFeedback('pskishnawat133@gmail.com is the permanent Master Developer and cannot be revoked.');
      setTimeout(() => setDevActionFeedback(null), 4000);
      return;
    }

    setUpdatingDevUid(targetMember.uid);
    setDevActionFeedback(null);
    const nextVal = !Boolean(targetMember.developerAccess);

    try {
      const ok = await toggleTargetDeveloperAccess(targetMember.uid, nextVal, workspaceId || undefined);
      if (ok) {
        setMembers(prev =>
          prev.map(m => m.uid === targetMember.uid ? { ...m, developerAccess: nextVal } : m)
        );
        setDevActionFeedback(
          nextVal
            ? `Granted Developer Preview Access to ${targetMember.displayName || targetMember.email}! They can now view Marketplace, Matchmaker & Leaderboard.`
            : `Revoked Developer Preview Access from ${targetMember.displayName || targetMember.email}. They will now see the Coming Soon gate.`
        );
      } else {
        setDevActionFeedback('Failed to update developer permission. Please try again.');
      }
    } catch (err: any) {
      setDevActionFeedback(err?.message || 'Error updating developer permissions.');
    } finally {
      setUpdatingDevUid(null);
      setTimeout(() => setDevActionFeedback(null), 5000);
    }
  };

  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);
  const [roleActionFeedback, setRoleActionFeedback] = useState<string | null>(null);

  const handleUpdateMemberRole = async (targetMemberUid: string, newRole: string) => {
    setUpdatingRoleUid(targetMemberUid);
    setRoleActionFeedback(null);
    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/team/members', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          workspaceId,
          memberId: targetMemberUid,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member access role');
      }

      setMembers(prev =>
        prev.map(m => m.uid === targetMemberUid ? { ...m, role: newRole as any } : m)
      );

      setRoleActionFeedback(`Access updated: Member is now an ${newRole.toUpperCase()}!`);
    } catch (err: any) {
      setRoleActionFeedback(err.message || 'Error updating member role');
    } finally {
      setUpdatingRoleUid(null);
      setTimeout(() => setRoleActionFeedback(null), 5000);
    }
  };

  const currentUserMember = members.find(m => m.uid === user?.uid);
  const currentUserRole = serverCallerRole ||
    (currentUserMember?.role) ||
    ((!workspaceId || workspaceId === user?.uid) ? 'owner' : 'owner');
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Team & App Access</h1>
          <p className="text-sm mt-1 text-slate-400">
            Generate ID & passwords for the mobile app, manage roles (Admin, Editor, Moderator), and view credentials.
          </p>
        </div>

        {subscription && (
          <div>
            {subscription.isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Subscription Expired
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: subscription.status === 'trial' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                  borderColor: subscription.status === 'trial' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)',
                  color: subscription.status === 'trial' ? '#93C5FD' : '#6EE7B7',
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
        <div className="rounded-2xl p-5 border border-red-500/30 bg-red-500/10 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-red-300">Workspace Subscription Expired</h3>
              <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                Your workspace trial or subscription has expired. All mobile app logins (creator and editors) are suspended until renewed. Renew your subscription in Settings to restore mobile app access and generate new passwords.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="px-4 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shrink-0 transition shadow-sm"
          >
            Renew in Settings &rarr;
          </button>
        </div>
      )}

      {/* Moderator Role Notice Banner */}
      {currentUserRole === 'moderator' && (
        <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-cyan-300">Moderator Access</p>
            <p className="text-slate-300 mt-0.5">You can inspect and copy Editor mobile app login credentials below. Provisioning and workspace administration are reserved for Admins and Owners.</p>
          </div>
        </div>
      )}

      {/* Creator / Owner Mobile App Login Card */}
      {currentUserRole === 'owner' && (
        <div
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <h2 className="font-bold text-white">My Mobile App Login (Creator)</h2>
              </div>
              <p className="text-sm text-slate-400">
                Set your mobile app password to log in directly into the Dieme mobile app with your email.
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 border border-purple-500/30 text-purple-300 bg-purple-500/15"
            >
              Workspace Owner
            </span>
          </div>

          {ownerPasswordError && (
            <div className="p-3 text-sm rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
              {ownerPasswordError}
            </div>
          )}

          {ownerPasswordSuccess && (
            <div className="p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              {ownerPasswordSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03]"
            >
              <Mail className="w-4 h-4 shrink-0 text-slate-400" />
              <input
                type="text"
                readOnly
                value={user?.email || ''}
                className="flex-1 text-sm bg-transparent outline-none w-full cursor-not-allowed font-mono text-slate-300"
                title="Your App User ID (Email)"
              />
            </div>

            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-cyan-400"
            >
              <button
                type="button"
                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                className="shrink-0 focus:outline-none"
              >
                {showOwnerPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <input
                type={showOwnerPassword ? "text" : "password"}
                placeholder="Set / Reset App Password"
                value={ownerPassword}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-400">
              Your login ID is your email: <code className="font-semibold text-cyan-300 font-mono">{user?.email}</code>
            </p>
            <button
              onClick={handleSetOwnerPassword}
              disabled={isSavingOwnerPassword || !ownerPassword || Boolean(subscription?.isExpired)}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 hover:opacity-90 shadow-sm bg-purple-600 hover:bg-purple-500 text-white shrink-0"
            >
              {isSavingOwnerPassword ? 'Saving...' : 'Save App Password'}
            </button>
          </div>
        </div>
      )}

      {/* Team Member Creation Card (Owner & Admin) */}
      {canManageTeam && (
        <div
          className="glass-card rounded-2xl p-6 space-y-5"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-base text-white">Create Team Member & App Login</h2>
            </div>
            <p className="text-sm text-slate-400">
              Add multiple Editors, Admins, or Moderators. Credentials are automatically stored so you can view and copy them at any time.
            </p>
          </div>

          {createError && (
            <div className="p-3 text-sm rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              {createSuccess}
            </div>
          )}

          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
              Select Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setInviteRole('editor')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                  inviteRole === 'editor'
                    ? 'border-emerald-500/50 bg-emerald-500/15 shadow-sm text-white'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Editor</p>
                  <p className="text-[11px] text-slate-400">Clips & stream markers</p>
                </div>
              </button>

              {currentUserRole === 'owner' && (
                <button
                  type="button"
                  onClick={() => setInviteRole('admin')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                    inviteRole === 'admin'
                      ? 'border-indigo-500/50 bg-indigo-500/15 shadow-sm text-white'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Admin</p>
                    <p className="text-[11px] text-slate-400">Studio & member access</p>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setInviteRole('moderator')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                  inviteRole === 'moderator'
                    ? 'border-cyan-500/50 bg-cyan-500/15 shadow-sm text-white'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400'
                }`}
              >
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Moderator</p>
                  <p className="text-[11px] text-slate-400">Chat & event monitoring</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Display Name Input */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-cyan-400"
            >
              <Users className="w-4 h-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name (optional)"
                value={inviteName}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setInviteName(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50 text-white placeholder-slate-500"
              />
            </div>

            {/* Email Input */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-cyan-400"
            >
              <Mail className="w-4 h-4 shrink-0 text-slate-400" />
              <input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50 text-white placeholder-slate-500"
              />
            </div>

            {/* Password Input with Eye */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-cyan-400"
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 chars)"
                value={invitePassword}
                disabled={Boolean(subscription?.isExpired)}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none w-full disabled:opacity-50 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-400">
              Credentials will be saved in the workspace. You can reveal or copy the password at any time below.
            </p>
            <button
              onClick={handleCreateAppUser}
              disabled={isCreating || !inviteEmail || !invitePassword || Boolean(subscription?.isExpired)}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 hover:opacity-90 shadow-sm shrink-0 bg-white/10 border border-white/15 text-white hover:bg-white/20"
            >
              {isCreating ? 'Saving...' : `Save ${ROLE_CONFIG[inviteRole].label} Login`}
            </button>
          </div>
        </div>
      )}

      {/* Developer & Admin Preview Permissions Card */}
      {canManageTeam && (
        <div className="rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-cyan-950/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Developer & Admin Preview Access</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Feature Gate
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  The <span className="text-cyan-300 font-medium">Marketplace</span>, <span className="text-cyan-300 font-medium">AI Matchmaker</span>, and <span className="text-cyan-300 font-medium">Leaderboard</span> pages display a <em>Coming Soon</em> gate to normal accounts. You can grant developer access to any team member below to let them view and test the live pages.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Master Dev: pskishnawat133@gmail.com
              </span>
            </div>
          </div>

          {devActionFeedback && (
            <div className="p-3 text-xs rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{devActionFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Member list with Credentials & Eye Toggle */}
      <div className="space-y-3">
        {roleActionFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{roleActionFeedback}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">
            Workspace Members & Credentials
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({members.length})
            </span>
          </h2>
          <button
            onClick={() => loadMembers()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {members.length === 0 ? (
          <div
            className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/15"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm text-slate-400">No members yet</p>
          </div>
        ) : (
          <div
            className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl"
          >
            {members.map((member) => {
              const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.viewer;
              const isPasswordVisible = Boolean(visiblePasswords[member.uid]);
              const hasPassword = Boolean(member.appPassword);
              const isSelf = member.uid === user?.uid;

              // Exact Role-Based Credential Permissions:
              // - Admin & Owner can check Mods and Editors
              // - Moderator can ONLY check Editors
              // - Member can see their own password
              const canViewThisPassword = isSelf ||
                (currentUserRole === 'owner' && ['editor', 'moderator', 'admin'].includes(member.role)) ||
                (currentUserRole === 'admin' && ['editor', 'moderator'].includes(member.role)) ||
                (currentUserRole === 'moderator' && member.role === 'editor');

              // Delete permissions:
              const canDeleteThisMember = !isSelf && (
                currentUserRole === 'owner' ||
                (currentUserRole === 'admin' && ['editor', 'moderator'].includes(member.role))
              );

              return (
                <div key={member.uid} className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-white/[0.025] transition border-b border-white/[0.04] last:border-0">
                  {/* Left Column: Member Profile (Avatar + Name with '..' truncation if long + Email) */}
                  <div className="flex items-center justify-between xl:justify-start gap-3.5 min-w-0 xl:w-[240px] xl:shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {member.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photoURL}
                          alt=""
                          className="w-10 h-10 rounded-full shrink-0 ring-1 ring-white/15 object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-white/10 text-white border border-white/15"
                        >
                          {member.displayName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}

                      <div className="min-w-0">
                        {/* Name with strict truncation if long so it never breaks the layout */}
                        <p
                          className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-[180px]"
                          title={member.displayName ?? 'Unknown'}
                        >
                          {member.displayName ?? 'Unknown'}
                        </p>
                        <p
                          className="text-xs font-mono text-slate-400 truncate max-w-[160px] sm:max-w-[180px] mt-0.5"
                          title={member.email}
                        >
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Mobile-only delete button pinned to top-right of card */}
                    {canDeleteThisMember && (
                      <button
                        onClick={() => handleDeleteMember(member.uid)}
                        className="xl:hidden p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition shrink-0"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Right Column: Symmetrical, perfectly aligned controls (Role, DEV, Password, Reset, Delete) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full xl:w-auto xl:justify-end">
                    {/* 1. Role Switcher / Badge (Fixed width 110px) */}
                    <div className="w-[110px] shrink-0 flex items-center justify-center">
                      {canManageTeam && !isSelf && member.role !== 'owner' ? (
                        <div className="relative inline-flex items-center w-full">
                          <select
                            value={member.role}
                            disabled={updatingRoleUid === member.uid}
                            onChange={(e) => handleUpdateMemberRole(member.uid, e.target.value)}
                            className="w-full appearance-none text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-lg border cursor-pointer outline-none transition focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 text-center"
                            style={{
                              color: cfg.color,
                              backgroundColor: cfg.bg,
                              borderColor: cfg.border,
                            }}
                            title="Change Member Role (Admin, Moderator, Editor)"
                          >
                            {currentUserRole === 'owner' && (
                              <option value="admin" className="bg-slate-900 text-blue-400">
                                Admin
                              </option>
                            )}
                            <option value="moderator" className="bg-slate-900 text-cyan-400">
                              Moderator
                            </option>
                            <option value="editor" className="bg-slate-900 text-emerald-400">
                              Editor
                            </option>
                          </select>
                          <ChevronDown
                            className="w-3 h-3 absolute right-2 pointer-events-none opacity-70"
                            style={{ color: cfg.color }}
                          />
                        </div>
                      ) : (
                        <span
                          className="w-full text-center text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                          style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    {/* 2. DEV Access Indicator & 1-Click Toggle (Fixed width 80px) */}
                    <div className="w-[80px] shrink-0 flex items-center justify-center">
                      {member.email === 'pskishnawat133@gmail.com' ? (
                        <span
                          className="w-full text-center text-[11px] font-mono font-bold tracking-wider px-2 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-1 shadow-sm"
                          title="Permanent Master Developer"
                        >
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          DEV
                        </span>
                      ) : member.developerAccess ? (
                        <button
                          type="button"
                          disabled={updatingDevUid === member.uid || !canManageTeam}
                          onClick={() => handleToggleDevAccess(member)}
                          className="w-full text-[11px] font-mono font-bold tracking-wider px-2 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 transition flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-default"
                          title="Developer Preview is ON. Click to toggle OFF."
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          <span>{updatingDevUid === member.uid ? '...' : 'DEV'}</span>
                        </button>
                      ) : canManageTeam ? (
                        <button
                          type="button"
                          disabled={updatingDevUid === member.uid}
                          onClick={() => handleToggleDevAccess(member)}
                          className="w-full text-[11px] font-mono font-semibold tracking-wider px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/25 hover:bg-white/[0.08] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          title="Developer Preview is OFF. Click to grant DEV access."
                        >
                          <Code2 className="w-3 h-3 opacity-60" />
                          <span>{updatingDevUid === member.uid ? '...' : '+ DEV'}</span>
                        </button>
                      ) : (
                        <div className="w-full" />
                      )}
                    </div>

                    {/* 3. Password / Protected Box (Fixed width 220px, no '...' truncation) */}
                    <div className="w-full sm:w-[220px] shrink-0">
                      {canViewThisPassword ? (
                        <div className="flex items-center justify-between gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 w-full h-9">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-400 font-medium shrink-0">Password:</span>
                            <span className="text-xs font-mono text-cyan-300 font-semibold truncate">
                              {hasPassword ? (isPasswordVisible ? member.appPassword : '••••••••') : <span className="text-slate-500 italic font-normal">Not set</span>}
                            </span>
                          </div>

                          {hasPassword && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(member.uid)}
                                className="p-1 text-slate-400 hover:text-white transition rounded focus:outline-none"
                                title={isPasswordVisible ? "Hide password" : "Show password"}
                              >
                                {isPasswordVisible ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(member.appPassword || '', member.uid)}
                                className="p-1 text-slate-400 hover:text-white transition rounded focus:outline-none"
                                title="Copy password"
                              >
                                {copiedUid === member.uid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 text-slate-500 text-xs w-full h-9">
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Protected</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Reset Password Button (Fixed width 115px) */}
                    <div className="w-full sm:w-[115px] shrink-0 flex items-center justify-center">
                      {canManageTeam && canViewThisPassword && !isSelf ? (
                        <button
                          onClick={() => {
                            setInviteEmail(member.email || '');
                            setInviteRole(member.role === 'admin' ? 'admin' : member.role === 'moderator' ? 'moderator' : 'editor');
                            setInviteName(member.displayName || '');
                            window.scrollTo({ top: 320, behavior: 'smooth' });
                          }}
                          className="w-full py-2 text-xs font-medium rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition h-9 text-center"
                          title="Update credentials"
                        >
                          Reset Password
                        </button>
                      ) : (
                        <div className="w-full h-9 hidden sm:block" />
                      )}
                    </div>

                    {/* 5. Desktop Delete Button (Fixed width 36px) */}
                    <div className="w-9 h-9 shrink-0 hidden xl:flex items-center justify-center">
                      {canDeleteThisMember ? (
                        <button
                          onClick={() => handleDeleteMember(member.uid)}
                          className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-9 h-9" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security notice */}
      <div
        className="glass-subcard rounded-xl p-4 text-xs leading-relaxed text-slate-400 border border-white/10"
      >
        <span className="font-semibold text-white">Team Access &amp; Security:</span> Workspace owners and admins can reveal passwords, change member roles, or revoke access at any time. Credentials synchronize live with the Android mobile app.
      </div>
    </div>
  );
}
