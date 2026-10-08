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
  Copy, Check, UserCheck, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Member {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator' | 'viewer';
  appPassword?: string;
  telegramUpload?: boolean;
  joinedAt?: Timestamp | string;
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
      let wid = user!.uid;
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (userSnap.exists() && userSnap.data()?.defaultWorkspaceId) {
        wid = userSnap.data().defaultWorkspaceId;
      }
      setWorkspaceId(wid);
      loadSubscription(wid);

      // Load members via API or direct Firestore
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/team/members?workspaceId=${wid}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        } else {
          // Fallback to Firestore direct query
          const snap = await getDocs(collection(db, 'workspaces', wid, 'members'));
          setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
        }
      } catch (err) {
        console.warn('Team members query fallback:', err);
        const snap = await getDocs(collection(db, 'workspaces', wid, 'members'));
        setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/team/set-owner-app-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
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
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/team/create-app-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/team/members?workspaceId=${activeWid}&memberId=${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
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

  const currentUserMember = members.find(m => m.uid === user?.uid);
  const currentUserRole = (!workspaceId || workspaceId === user?.uid) ? 'owner' : (currentUserMember?.role || 'owner');
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
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
                Set your mobile app password to log in directly into the Digicast mobile app with your email.
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

      {/* Member list with Credentials & Eye Toggle */}
      <div className="space-y-3">
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

              return (
                <div key={member.uid} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.03] transition">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {member.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photoURL}
                        alt=""
                        className="w-10 h-10 rounded-full shrink-0 ring-1 ring-white/15"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-white/10 text-white border border-white/15"
                      >
                        {member.displayName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate text-white">
                          {member.displayName ?? 'Unknown'}
                        </p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                          style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  {/* Credentials Box (Visible to Owner & Admin) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {canManageTeam && (
                      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-400 font-medium">Password:</span>

                        {hasPassword ? (
                          <>
                            <span className="text-xs font-mono text-cyan-300 font-semibold tracking-wider">
                              {isPasswordVisible ? member.appPassword : '••••••••'}
                            </span>

                            {/* Eye Hide / Unhide Button */}
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

                            {/* Copy button */}
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
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not set</span>
                        )}
                      </div>
                    )}

                    {/* Quick Reset Button */}
                    {canManageTeam && (
                      <button
                        onClick={() => {
                          setInviteEmail(member.email || '');
                          setInviteRole(member.role === 'admin' ? 'admin' : member.role === 'moderator' ? 'moderator' : 'editor');
                          setInviteName(member.displayName || '');
                          window.scrollTo({ top: 320, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        title="Update credentials"
                      >
                        Reset Password
                      </button>
                    )}

                    {/* Remove Member Button */}
                    {member.role !== 'owner' && canManageTeam && (
                      <button
                        onClick={() => handleDeleteMember(member.uid)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
        <span className="font-semibold text-white">App Security & Permissions:</span> Credentials stored in this dashboard can be viewed anytime by Owners and Admins using the eye toggle button. In the Android mobile app, Owners and Admins can also create new Editors and Moderators and view credentials directly inside the app settings.
      </div>
    </div>
  );
}
