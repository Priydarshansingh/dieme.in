'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Key, Lock, Users, CreditCard, RefreshCw, CheckCircle2,
  AlertTriangle, LogOut, UserPlus, Trash2, Calendar, Clock,
  Search, ChevronRight, Zap, Eye, EyeOff, ShieldAlert, Sparkles, Building2,
  QrCode, Check, Sliders, Video, Scissors, Youtube, Send, Ban, ExternalLink,
  ShieldCheck, UserCheck, UserX, Activity, Radio
} from 'lucide-react';

interface AdminSession {
  username: string;
  name: string;
  role: 'super_admin' | 'sub_admin';
}

interface WorkspaceItem {
  id: string;
  name: string;
  ownerUid: string;
  ownerEmail: string;
  ownerDisplayName: string;
  streamCount: number;
  clipCount: number;
  memberCount: number;
  createdAt: string;
  isSuspended?: boolean;
  subscription: {
    status: 'trial' | 'active' | 'expired';
    plan: string;
    trialEndsAt: string;
    subscriptionExpiresAt?: string;
    isExpired: boolean;
    daysRemaining: number;
    isSuspended?: boolean;
    trialBypassDetected?: boolean;
  };
}

interface WorkspaceMember {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator';
  appPassword?: string;
  joinedAt?: string;
}

interface WorkspaceDetailData {
  workspace: any;
  members: WorkspaceMember[];
  youtubeChannel: any;
  streams: any[];
  clips: any[];
}

interface AdminItem {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'sub_admin';
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string | null;
}

interface PaymentItem {
  id: string;
  workspaceId: string;
  workspaceName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  utrNumber: string;
  note?: string;
  screenshotUrl?: string | null;
  submittedVia?: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  createdAt: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
}

export default function GodPanelPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'workspaces' | 'admins' | 'payments'>('workspaces');
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');

  // Action status state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New admin modal state
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'sub_admin' | 'super_admin'>('sub_admin');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Workspace Control Center state
  const [activeControlWorkspace, setActiveControlWorkspace] = useState<WorkspaceItem | null>(null);
  const [workspaceDetail, setWorkspaceDetail] = useState<WorkspaceDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [controlTab, setControlTab] = useState<'team' | 'subscription' | 'activity' | 'danger'>('team');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [newPasswordMap, setNewPasswordMap] = useState<Record<string, string>>({});
  const [customDays, setCustomDays] = useState<number>(30);

  // Add member to workspace form state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'editor' | 'moderator' | 'admin'>('editor');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setCheckingSession(true);
    try {
      const res = await fetch('/api/godpanel/session');
      const data = await res.json();
      if (data.authenticated && data.admin) {
        setSession(data.admin);
        loadWorkspaces();
        loadPayments();
        if (data.admin.role === 'super_admin') {
          loadAdmins();
        }
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/godpanel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSession(data.admin);
      setLoginPassword('');
      loadWorkspaces();
      if (data.admin.role === 'super_admin') {
        loadAdmins();
      }
    } catch (err: any) {
      setLoginError(err.message || 'Access denied');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/godpanel/logout', { method: 'POST' });
    setSession(null);
    setWorkspaces([]);
    setAdmins([]);
  }

  async function loadWorkspaces() {
    setLoadingData(true);
    try {
      const res = await fetch('/api/godpanel/workspaces');
      const data = await res.json();
      if (res.ok && data.workspaces) {
        setWorkspaces(data.workspaces);
      }
    } catch (err) {
      console.error('Workspaces load error:', err);
    } finally {
      setLoadingData(false);
    }
  }

  async function loadAdmins() {
    try {
      const res = await fetch('/api/godpanel/admins');
      const data = await res.json();
      if (res.ok && data.admins) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Admins load error:', err);
    }
  }

  async function loadPayments() {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/godpanel/payments');
      const data = await res.json();
      if (res.ok && data.payments) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Payments load error:', err);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function handlePaymentAction(paymentId: string, action: 'approve' | 'reject') {
    setActionLoading(`pay_${paymentId}_${action}`);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/godpanel/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action, days: 30 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process payment');

      setStatusMessage({ text: data.message || 'Payment updated', type: 'success' });
      await loadPayments();
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWorkspaceSubscriptionAction(
    workspaceId: string,
    action: 'activate_pro' | 'extend_days' | 'reset_trial' | 'expire_now',
    days: number = 30
  ) {
    setActionLoading(`${workspaceId}_${action}`);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update workspace');

      setStatusMessage({ text: data.message || 'Subscription updated', type: 'success' });
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  // ─── WORKSPACE CONTROL CENTER HANDLERS ──────────────────────────────────────
  async function openWorkspaceControl(ws: WorkspaceItem) {
    setActiveControlWorkspace(ws);
    setControlTab('team');
    setCustomDays(30);
    setShowPasswordMap({});
    setNewPasswordMap({});
    await loadWorkspaceDetail(ws.id);
  }

  async function loadWorkspaceDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${id}`);
      const data = await res.json();
      if (res.ok) {
        setWorkspaceDetail(data);
      } else {
        setStatusMessage({ text: data.error || 'Failed to load workspace details', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load workspace details', type: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleToggleSuspension(workspaceId: string, currentSuspended: boolean) {
    setActionLoading(`susp_${workspaceId}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_suspension', isSuspended: !currentSuspended }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle suspension');
      setStatusMessage({ text: data.message, type: 'success' });
      await loadWorkspaceDetail(workspaceId);
      await loadWorkspaces();
      if (activeControlWorkspace) {
        setActiveControlWorkspace({ ...activeControlWorkspace, isSuspended: !currentSuspended });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetMemberPassword(workspaceId: string, memberUid: string) {
    const pwd = newPasswordMap[memberUid];
    if (!pwd || pwd.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setActionLoading(`pwd_${memberUid}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_member_password', memberUid, memberPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set password');
      setStatusMessage({ text: data.message, type: 'success' });
      setNewPasswordMap((prev) => ({ ...prev, [memberUid]: '' }));
      await loadWorkspaceDetail(workspaceId);
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateMemberRole(workspaceId: string, memberUid: string, role: string) {
    setActionLoading(`role_${memberUid}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_member_role', memberUid, memberRole: role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');
      setStatusMessage({ text: data.message, type: 'success' });
      await loadWorkspaceDetail(workspaceId);
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddMember(e: React.FormEvent, workspaceId: string) {
    e.preventDefault();
    if (!newMemberEmail || !newMemberPassword || newMemberPassword.length < 6) {
      alert('Valid email and password (min 6 characters) required.');
      return;
    }
    setAddingMember(true);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_member',
          newMemberEmail,
          newMemberName,
          memberRole: newMemberRole,
          memberPassword: newMemberPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      setStatusMessage({ text: data.message, type: 'success' });
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPassword('');
      await loadWorkspaceDetail(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(workspaceId: string, memberUid: string) {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    setActionLoading(`del_mem_${memberUid}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_member', memberUid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      setStatusMessage({ text: data.message, type: 'success' });
      await loadWorkspaceDetail(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetPlan(workspaceId: string, plan: string, days: number = 30) {
    setActionLoading(`plan_${plan}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_plan', plan, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');
      setStatusMessage({ text: data.message, type: 'success' });
      await loadWorkspaceDetail(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExtendDays(workspaceId: string, days: number) {
    setActionLoading(`extend_${days}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend_days', days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend subscription');
      setStatusMessage({ text: data.message, type: 'success' });
      await loadWorkspaceDetail(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    const confirmation = prompt(`Type "DELETE ${workspaceId}" to permanently erase all workspace data:`);
    if (confirmation !== `DELETE ${workspaceId}`) return;
    setActionLoading(`del_ws_${workspaceId}`);
    try {
      const res = await fetch(`/api/godpanel/workspaces/${workspaceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete workspace');
      setStatusMessage({ text: data.message, type: 'success' });
      setActiveControlWorkspace(null);
      setWorkspaceDetail(null);
      await loadWorkspaces();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdminUsername || !newAdminPassword) return;

    setCreatingAdmin(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/godpanel/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAdminUsername,
          password: newAdminPassword,
          name: newAdminName || newAdminUsername,
          role: newAdminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      setStatusMessage({ text: data.message || 'Admin created successfully', type: 'success' });
      setShowCreateAdminModal(false);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminName('');
      loadAdmins();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create admin', type: 'error' });
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleDeleteAdmin(adminId: string, username: string) {
    if (!confirm(`Are you sure you want to permanently delete admin account "${username}"?`)) return;

    setActionLoading(adminId);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/godpanel/admins?id=${adminId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin');

      setStatusMessage({ text: data.message, type: 'success' });
      loadAdmins();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Deletion failed', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ws.subscription.status === 'active';
    if (filterStatus === 'trial') return ws.subscription.status === 'trial';
    if (filterStatus === 'expired') return ws.subscription.status === 'expired';
    return true;
  });

  // Calculate statistics
  const totalWorkspaces = workspaces.length;
  const activePro = workspaces.filter((w) => w.subscription.status === 'active').length;
  const activeTrial = workspaces.filter((w) => w.subscription.status === 'trial').length;
  const expiredCount = workspaces.filter((w) => w.subscription.status === 'expired').length;

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-3" />
        <span className="font-mono text-sm tracking-wider">INITIALIZING ROOT GODPANEL SYSTEM...</span>
      </div>
    );
  }

  // ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-[#06080E] text-white flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden font-sans">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#0D111A] border border-[#1E2536] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0D111A] rounded-[14px] flex items-center justify-center">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-white uppercase">
                Godpanel Root
              </h1>
              <p className="text-xs text-gray-400 tracking-wider font-mono mt-1">
                SYSTEM CONTROL &amp; SUBSCRIPTION ARBITRATION
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wider text-gray-400 uppercase">
                Admin Username
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wider text-gray-400 uppercase">
                Root Passkey
              </label>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all font-mono pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  VERIFY &amp; ENTER GODPANEL
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-gray-500 font-mono">
              Cryptographically Protected Session • Direct Server Enforcement
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-purple-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#1A2234] bg-[#0C1019]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-widest bg-gradient-to-r from-white via-gray-200 to-purple-300 bg-clip-text text-transparent uppercase">
                Godpanel
              </span>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border tracking-wider bg-purple-500/10 text-purple-300 border-purple-500/30">
              {session.role === 'super_admin' ? '⚡ SUPER ADMIN' : '🛡️ SUB ADMIN'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-200">{session.name}</p>
              <p className="text-[10px] font-mono text-gray-400">@{session.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[#141B2A] border border-[#232D42] text-gray-400 hover:text-white hover:border-red-500/40 transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Notification Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-mono underline hover:opacity-80"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0D111A] border border-[#1E2536] rounded-xl p-4">
            <p className="text-xs font-mono text-gray-400 uppercase">Total Workspaces</p>
            <p className="text-2xl font-black text-white mt-1">{totalWorkspaces}</p>
          </div>
          <div className="bg-[#0D111A] border border-emerald-900/40 rounded-xl p-4">
            <p className="text-xs font-mono text-emerald-400 uppercase">Active Pro (Monthly)</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">{activePro}</p>
          </div>
          <div className="bg-[#0D111A] border border-blue-900/40 rounded-xl p-4">
            <p className="text-xs font-mono text-blue-400 uppercase">Active Trials</p>
            <p className="text-2xl font-black text-blue-300 mt-1">{activeTrial}</p>
          </div>
          <div className="bg-[#0D111A] border border-red-900/40 rounded-xl p-4">
            <p className="text-xs font-mono text-red-400 uppercase">Expired / Suspended</p>
            <p className="text-2xl font-black text-red-400 mt-1">{expiredCount}</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'workspaces'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white bg-[#0D111A] border border-[#1E2536]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Workspaces &amp; Subscriptions ({workspaces.length})
            </button>

            {session.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'admins'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white bg-[#0D111A] border border-[#1E2536]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Accounts ({admins.length})
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('payments');
                loadPayments();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-400 hover:text-white bg-[#0D111A] border border-[#1E2536]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              UPI Payments ({payments.filter(p => p.status === 'pending_verification').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadWorkspaces();
                if (session.role === 'super_admin') loadAdmins();
              }}
              className="p-2 rounded-lg bg-[#0D111A] border border-[#1E2536] text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── TAB 1: WORKSPACES & SUBSCRIPTIONS ─────────────────────────────── */}
        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search workspace, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D111A] border border-[#1E2536] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['all', 'active', 'trial', 'expired'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors shrink-0 ${
                      filterStatus === s
                        ? 'bg-[#1E2536] text-white border border-gray-600'
                        : 'text-gray-400 hover:text-white bg-[#0D111A] border border-[#1A202E]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspaces Table */}
            <div className="bg-[#0D111A] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#101522] border-b border-[#1E2536] text-gray-400 font-mono uppercase">
                    <tr>
                      <th className="py-3.5 px-4">Workspace / Owner</th>
                      <th className="py-3.5 px-4">Status &amp; Plan</th>
                      <th className="py-3.5 px-4">Expires In</th>
                      <th className="py-3.5 px-4">Metrics</th>
                      <th className="py-3.5 px-4 text-right">Subscription Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2234]">
                    {filteredWorkspaces.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                          No matching workspaces found.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkspaces.map((ws) => {
                        const isExpired = ws.subscription.isExpired;
                        const status = ws.subscription.status;

                        return (
                          <tr key={ws.id} className="hover:bg-[#121724] transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-100 text-sm">{ws.name}</div>
                              <div className="text-gray-400 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                                <span>{ws.ownerEmail}</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-500 truncate max-w-[120px]">{ws.id}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                {ws.isSuspended ? (
                                  <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-black bg-red-950/80 border border-red-500 text-red-300 animate-pulse">
                                    🚨 SUSPENDED / BANNED
                                  </span>
                                ) : status === 'active' ? (
                                  ws.subscription.plan === 'intro_29' ? (
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-pink-500/15 border border-pink-500/30 text-pink-300">
                                      ⚡ 1ST MONTH PASS (₹29)
                                    </span>
                                  ) : ws.subscription.plan === 'starter' ? (
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                                      STARTER (₹149)
                                    </span>
                                  ) : ws.subscription.plan === 'studio' ? (
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                      👑 STUDIO VIP (₹999)
                                    </span>
                                  ) : ws.subscription.plan === 'lifetime' ? (
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                                      💎 LIFETIME VIP
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                      ⚡ ACTIVE PRO (₹499)
                                    </span>
                                  )
                                ) : status === 'trial' ? (
                                  <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                    14D TRIAL
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                                      EXPIRED / LOCKED
                                    </span>
                                    {ws.subscription.trialBypassDetected && (
                                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                                        ⚠️ TRIAL REUSED
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-mono text-gray-300">
                                {isExpired ? (
                                  <span className="text-red-400 font-bold">EXPIRED (App Locked)</span>
                                ) : (
                                  <span>{ws.subscription.daysRemaining} days left</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                {ws.subscription.subscriptionExpiresAt
                                  ? `Renews: ${new Date(ws.subscription.subscriptionExpiresAt).toLocaleDateString()}`
                                  : `Trial ends: ${new Date(ws.subscription.trialEndsAt).toLocaleDateString()}`}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                                <span>{ws.streamCount} streams</span>
                                <span>{ws.clipCount} clips</span>
                                <span>{ws.memberCount} users</span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Comprehensive Control & Deep Inspect Button */}
                                <button
                                  onClick={() => openWorkspaceControl(ws)}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                                  title="Open Full Workspace Control Center: Credentials, Members, Roles, Suspension, Tracking"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>MANAGE</span>
                                </button>

                                {/* Quick Activate / Extend Pro (+30 days) */}
                                <button
                                  onClick={() => handleWorkspaceSubscriptionAction(ws.id, 'activate_pro', 30)}
                                  disabled={actionLoading !== null}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-mono font-bold transition-all disabled:opacity-50"
                                  title="Quick Add 30 Days Pro"
                                >
                                  +30D
                                </button>

                                {/* Expire / Lock now */}
                                {!isExpired && (
                                  <button
                                    onClick={() => handleWorkspaceSubscriptionAction(ws.id, 'expire_now')}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[11px] font-mono font-bold transition-all disabled:opacity-50"
                                    title="Immediately Expire Subscription (Blocks Mobile App Login)"
                                  >
                                    EXPIRE
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: ADMIN MANAGEMENT (SUPER ADMIN ONLY) ────────────────── */}
        {activeTab === 'admins' && session.role === 'super_admin' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-200">System Administrators</h2>
                <p className="text-xs text-gray-400">
                  Manage subordinate admins with limited permissions or grant super admin privileges.
                </p>
              </div>

              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <UserPlus className="w-4 h-4" />
                CREATE NEW ADMIN
              </button>
            </div>

            {/* Admins Table */}
            <div className="bg-[#0D111A] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101522] border-b border-[#1E2536] text-gray-400 font-mono uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Admin</th>
                    <th className="py-3.5 px-4">Role &amp; Powers</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2234]">
                  {admins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-[#121724] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-200">{adm.name}</div>
                        <div className="text-gray-400 font-mono text-[11px]">@{adm.username}</div>
                      </td>

                      <td className="py-4 px-4">
                        {adm.role === 'super_admin' ? (
                          <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            ⚡ SUPER ADMIN (FULL POWER)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                            🛡️ SUB ADMIN (LIMITED POWER)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-gray-400">
                        {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-4 font-mono text-gray-400">
                        {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {adm.username !== 'admin' && adm.username !== session.username && (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB: UPI PAYMENTS VERIFICATION ──────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Submitted UPI Payments ({payments.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify user UTR numbers against your UPI bank/statement and activate plans in 1 click.
                </p>
              </div>
              <button
                onClick={loadPayments}
                className="px-3 py-1.5 rounded-lg bg-[#0D111A] border border-[#1E2536] text-xs font-mono text-gray-300 hover:text-white flex items-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${loadingPayments ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="bg-[#0D111A] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2536] text-gray-400 font-mono uppercase text-[10px] tracking-wider bg-[#080B11]">
                    <th className="py-3 px-4">Workspace / User</th>
                    <th className="py-3 px-4">Plan &amp; Amount</th>
                    <th className="py-3 px-4">UTR / Ref Number</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 font-mono">
                        No UPI payment submissions found
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isPending = p.status === 'pending_verification';
                      const isApproved = p.status === 'approved';

                      return (
                        <tr key={p.id} className="hover:bg-[#121724] transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white text-xs">{p.workspaceName}</p>
                            <p className="text-[11px] font-mono text-gray-400 mt-0.5">{p.userEmail}</p>
                            <p className="text-[10px] font-mono text-gray-500">{p.workspaceId}</p>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">₹{p.amount}</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {p.planName}
                              </span>
                            </div>
                            {p.note && <p className="text-[10px] text-gray-400 italic mt-1">&quot;{p.note}&quot;</p>}
                          </td>

                          <td className="py-4 px-4">
                            <code className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50">
                              {p.utrNumber}
                            </code>
                          </td>

                          <td className="py-4 px-4">
                            {p.screenshotUrl ? (
                              <button
                                onClick={() => setSelectedScreenshot(p.screenshotUrl || null)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-mono text-[11px] transition border border-indigo-500/30"
                              >
                                <span>📷 View Image</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-gray-500 italic">No receipt</span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-mono text-gray-400 text-xs">
                            <p>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${((p as any).submissionCount || 1) > 2 ? 'bg-amber-900/40 text-amber-300 border-amber-600/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                Upload #{((p as any).submissionCount || 1)}
                              </span>
                              {(p as any).graceGranted && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-700/40">
                                  24H Grace
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                                isPending
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : isApproved
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {p.status.replace('_', ' ')}
                            </span>
                            {p.verifiedBy && (
                              <p className="text-[10px] text-gray-500 mt-1">by @{p.verifiedBy}</p>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handlePaymentAction(p.id, 'approve')}
                                  disabled={Boolean(actionLoading)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                                >
                                  {actionLoading === `pay_${p.id}_approve` ? 'Activating...' : 'Approve (+30D)'}
                                </button>
                                <button
                                  onClick={() => handlePaymentAction(p.id, 'reject')}
                                  disabled={Boolean(actionLoading)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition border border-[#1E2536]"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-gray-500">Resolved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─── CREATE ADMIN MODAL ────────────────────────────────────────────── */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#232D42] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Create Administrator</h3>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-gray-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Assistant Admin"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  placeholder="support_admin"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Permission Level</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-[#141B2A] border border-[#232D42] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                >
                  <option value="sub_admin">Sub Admin (Less power: Manage Subscriptions &amp; Workspaces)</option>
                  <option value="super_admin">Super Admin (Full power: Can create/delete admins)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Sub-admins cannot create or delete other admins and cannot delete system workspaces.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141B2A] text-gray-400 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold disabled:opacity-50"
                >
                  {creatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SCREENSHOT LIGHTBOX MODAL ────────────────────────────────────── */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#232D42] rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
              <h4 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                <span>📷 Payment Receipt Image</span>
              </h4>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-gray-400 hover:text-white font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedScreenshot}
                alt="Payment Receipt Screenshot"
                className="max-h-[65vh] object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={selectedScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
              >
                Open Original &rarr;
              </a>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKSPACE CONTROL CENTER MODAL ────────────────────────────────── */}
      {activeControlWorkspace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0D111A] border border-[#232D42] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E2536] bg-[#090C12] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {workspaceDetail?.workspace?.name || activeControlWorkspace.name}
                    </h3>
                    {activeControlWorkspace.isSuspended ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-950/80 border border-red-500 text-red-300 animate-pulse">
                        🚨 SUSPENDED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        ✅ ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>Owner: {workspaceDetail?.workspace?.ownerEmail || activeControlWorkspace.ownerEmail}</span>
                    <span>•</span>
                    <span className="text-gray-500 truncate max-w-[150px]">{activeControlWorkspace.id}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                {activeControlWorkspace.isSuspended ? (
                  <button
                    onClick={() => handleToggleSuspension(activeControlWorkspace.id, true)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    UNSUSPEND WORKSPACE
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleSuspension(activeControlWorkspace.id, false)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    SUSPEND WORKSPACE
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveControlWorkspace(null);
                    setWorkspaceDetail(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-[#141B2A] hover:bg-[#1E2536] text-gray-400 hover:text-white flex items-center justify-center transition-colors font-mono"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="px-5 border-b border-[#1E2536] bg-[#0B0F17] flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setControlTab('team')}
                className={`py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                  controlTab === 'team'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Team Members &amp; Passwords ({workspaceDetail?.members?.length || 0})
              </button>

              <button
                onClick={() => setControlTab('subscription')}
                className={`py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                  controlTab === 'subscription'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Subscription &amp; Plans
              </button>

              <button
                onClick={() => setControlTab('activity')}
                className={`py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                  controlTab === 'activity'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                Live Tracking ({workspaceDetail?.streams?.length || 0} Streams, {workspaceDetail?.clips?.length || 0} Clips)
              </button>

              {session.role === 'super_admin' && (
                <button
                  onClick={() => setControlTab('danger')}
                  className={`py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                    controlTab === 'danger'
                      ? 'border-red-500 text-red-400 bg-red-500/5'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Danger Zone
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {loadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                  <span className="font-mono text-xs">Loading deep workspace details &amp; credentials...</span>
                </div>
              ) : (
                <>
                  {/* ─── TAB A: TEAM MEMBERS & CREDENTIALS ───────────────────────── */}
                  {controlTab === 'team' && (
                    <div className="space-y-6">
                      {/* Add Member Form */}
                      <div className="bg-[#121724] border border-[#1E2536] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <UserPlus className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                            Add User to this Workspace (Direct Admin Provision)
                          </h4>
                        </div>
                        <form
                          onSubmit={(e) => handleAddMember(e, activeControlWorkspace.id)}
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end"
                        >
                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase">User Email</label>
                            <input
                              type="email"
                              required
                              placeholder="editor@creator.com"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className="w-full mt-1 bg-[#090C12] border border-[#232D42] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase">Name (Optional)</label>
                            <input
                              type="text"
                              placeholder="John Editor"
                              value={newMemberName}
                              onChange={(e) => setNewMemberName(e.target.value)}
                              className="w-full mt-1 bg-[#090C12] border border-[#232D42] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase">Role</label>
                            <select
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value as any)}
                              className="w-full mt-1 bg-[#090C12] border border-[#232D42] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                            >
                              <option value="editor">Editor (Create &amp; edit clips)</option>
                              <option value="moderator">Moderator (Manage streams &amp; chat)</option>
                              <option value="admin">Admin (Manage settings)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase">App Password</label>
                            <input
                              type="text"
                              required
                              placeholder="Min 6 characters"
                              value={newMemberPassword}
                              onChange={(e) => setNewMemberPassword(e.target.value)}
                              className="w-full mt-1 bg-[#090C12] border border-[#232D42] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2 md:col-span-4 flex justify-end mt-2">
                            <button
                              type="submit"
                              disabled={addingMember}
                              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {addingMember ? 'Adding User...' : 'Provision Member'}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Members List Table */}
                      <div className="bg-[#101522] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#080B11] border-b border-[#1E2536] text-gray-400 font-mono uppercase text-[10px]">
                            <tr>
                              <th className="py-3 px-4">Member Info</th>
                              <th className="py-3 px-4">Role &amp; Permissions</th>
                              <th className="py-3 px-4">Mobile App Password</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E2536]">
                            {!workspaceDetail?.members || workspaceDetail.members.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500 font-mono">
                                  No members loaded for this workspace.
                                </td>
                              </tr>
                            ) : (
                              workspaceDetail.members.map((member) => {
                                const isPasswordShown = Boolean(showPasswordMap[member.uid]);
                                const hasPassword = Boolean(member.appPassword);
                                const isOwner = member.role === 'owner';

                                return (
                                  <tr key={member.uid} className="hover:bg-[#141B2A] transition-colors">
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-white text-xs">{member.displayName || 'Creator Member'}</div>
                                      <div className="text-[11px] font-mono text-gray-400">{member.email}</div>
                                      <div className="text-[10px] font-mono text-gray-500 truncate max-w-[140px]">{member.uid}</div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <select
                                        value={member.role}
                                        disabled={actionLoading === `role_${member.uid}`}
                                        onChange={(e) => handleUpdateMemberRole(activeControlWorkspace.id, member.uid, e.target.value)}
                                        className="bg-[#090C12] border border-[#232D42] text-white font-mono text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500"
                                      >
                                        <option value="owner">Owner (Full Control)</option>
                                        <option value="admin">Admin (Manage Team &amp; Tools)</option>
                                        <option value="editor">Editor (Clip Creation &amp; Streams)</option>
                                        <option value="moderator">Moderator (Monitoring)</option>
                                      </select>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <div className="space-y-1.5 max-w-xs">
                                        <div className="flex items-center gap-2 bg-[#090C12] px-2.5 py-1.5 rounded-lg border border-[#1E2536]">
                                          <Key className="w-3 h-3 text-purple-400 shrink-0" />
                                          <span className="font-mono text-xs text-purple-200 tracking-wider flex-1 truncate">
                                            {isPasswordShown
                                              ? (member.appPassword || '(Not set yet)')
                                              : (hasPassword ? '••••••••••••' : '(Not set yet)')}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setShowPasswordMap((prev) => ({
                                                ...prev,
                                                [member.uid]: !prev[member.uid],
                                              }))
                                            }
                                            className="text-gray-400 hover:text-white"
                                            title={isPasswordShown ? 'Hide Password' : 'Show Password'}
                                          >
                                            {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                        </div>

                                        {/* Inline Password Reset Field */}
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Set new password..."
                                            value={newPasswordMap[member.uid] || ''}
                                            onChange={(e) =>
                                              setNewPasswordMap((prev) => ({
                                                ...prev,
                                                [member.uid]: e.target.value,
                                              }))
                                            }
                                            className="w-32 bg-[#090C12] border border-[#232D42] rounded px-2 py-1 text-[11px] text-white font-mono outline-none focus:border-purple-500"
                                          />
                                          <button
                                            type="button"
                                            disabled={actionLoading === `pwd_${member.uid}`}
                                            onClick={() => handleSetMemberPassword(activeControlWorkspace.id, member.uid)}
                                            className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-[11px] font-mono font-bold transition disabled:opacity-50"
                                          >
                                            {actionLoading === `pwd_${member.uid}` ? 'Saving...' : 'Set'}
                                          </button>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 text-right">
                                      {!isOwner && (
                                        <button
                                          onClick={() => handleRemoveMember(activeControlWorkspace.id, member.uid)}
                                          disabled={actionLoading === `del_mem_${member.uid}`}
                                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                          title="Remove Member"
                                        >
                                          <UserX className="w-4 h-4" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB B: SUBSCRIPTIONS & PLANS ────────────────────────────── */}
                  {controlTab === 'subscription' && (
                    <div className="space-y-6">
                      {/* Current Status Overview */}
                      <div className="bg-[#121724] border border-[#1E2536] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-mono text-gray-400 uppercase">Current Workspace Tier</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-white capitalize">
                              {workspaceDetail?.workspace?.subscription?.plan || activeControlWorkspace.subscription.plan}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                activeControlWorkspace.subscription.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : activeControlWorkspace.subscription.status === 'trial'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {activeControlWorkspace.subscription.status}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-xs text-gray-300">
                          <p className="text-gray-400 text-[10px] uppercase">Expires / Renews</p>
                          <p className="font-bold text-white mt-1">
                            {workspaceDetail?.workspace?.subscription?.daysRemaining ?? activeControlWorkspace.subscription.daysRemaining} days remaining
                          </p>
                        </div>

                        {/* Lock / Expire Now button */}
                        <div>
                          <button
                            onClick={() => handleWorkspaceSubscriptionAction(activeControlWorkspace.id, 'expire_now')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-xs font-mono font-bold transition disabled:opacity-50"
                          >
                            Lock / Expire Workspace Immediately
                          </button>
                        </div>
                      </div>

                      {/* One-Click Plan Switcher */}
                      <div>
                        <h4 className="text-xs font-bold font-mono uppercase text-gray-400 tracking-wider mb-3">
                          Assign / Change Subscription Tier
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {/* Intro ₹29 Card */}
                          <div className="bg-[#101522] border border-pink-900/40 hover:border-pink-500 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-pink-300 text-xs">⚡ 1st Month Pass</span>
                                <span className="text-[10px] font-mono text-pink-400 font-bold">₹29/30D</span>
                              </div>
                              <ul className="text-[11px] text-gray-400 space-y-1 mt-2 font-mono">
                                <li>• All Pro &amp; VIP Perks</li>
                                <li>• Anti-Abuse Verified</li>
                                <li>• Full 30 Days Access</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => handleSetPlan(activeControlWorkspace.id, 'intro_29', 30)}
                              disabled={actionLoading !== null}
                              className="w-full py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                            >
                              Assign ₹29 (30D)
                            </button>
                          </div>

                          {/* Starter Card */}
                          <div className="bg-[#101522] border border-[#1E2536] hover:border-purple-500/40 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">Starter Creator</span>
                                <span className="text-[10px] font-mono text-purple-400 font-bold">₹149/mo</span>
                              </div>
                              <ul className="text-[11px] text-gray-400 space-y-1 mt-2 font-mono">
                                <li>• Zero Limits — All Features</li>
                                <li>• High-Speed On-Device Export</li>
                                <li>• Unlimited Live Clips &amp; Delivery</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => handleSetPlan(activeControlWorkspace.id, 'starter', 30)}
                              disabled={actionLoading !== null}
                              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                            >
                              Assign 1 Month (30D)
                            </button>
                          </div>

                          {/* Pro Card (3 Months) */}
                          <div className="bg-[#101522] border border-emerald-900/40 hover:border-emerald-500 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-300 text-xs">3 Month Quarter</span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">₹499 (90D)</span>
                              </div>
                              <ul className="text-[11px] text-gray-400 space-y-1 mt-2 font-mono">
                                <li>• 90 Days Uninterrupted Access</li>
                                <li>• 1080p 60fps Device Video Export</li>
                                <li>• Priority Telegram Delivery</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => handleSetPlan(activeControlWorkspace.id, 'pro', 90)}
                              disabled={actionLoading !== null}
                              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                            >
                              Assign 3 Months (90D)
                            </button>
                          </div>

                          {/* Studio VIP Card (1 Year) */}
                          <div className="bg-[#101522] border border-purple-900/40 hover:border-purple-500 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-purple-300 text-xs">1 Year Annual Pass</span>
                                <span className="text-[10px] font-mono text-purple-400 font-bold">₹999 (365D)</span>
                              </div>
                              <ul className="text-[11px] text-gray-400 space-y-1 mt-2 font-mono">
                                <li>• 365 Days Full Access (Best Value)</li>
                                <li>• Highest Bitrate &amp; 4K Device Export</li>
                                <li>• 24/7 Priority Concierge Support</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => handleSetPlan(activeControlWorkspace.id, 'studio', 365)}
                              disabled={actionLoading !== null}
                              className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                            >
                              Assign 1 Year (365D)
                            </button>
                          </div>

                          {/* Lifetime Card */}
                          <div className="bg-[#101522] border border-indigo-900/40 hover:border-indigo-500 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-300 text-xs">💎 Lifetime VIP</span>
                                <span className="text-[10px] font-mono text-indigo-400 font-bold">Never Expires</span>
                              </div>
                              <ul className="text-[11px] text-gray-400 space-y-1 mt-2 font-mono">
                                <li>• Permanent Access</li>
                                <li>• All Current &amp; Future Perks</li>
                                <li>• Max Team &amp; Channels</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => handleSetPlan(activeControlWorkspace.id, 'lifetime')}
                              disabled={actionLoading !== null}
                              className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                            >
                              Grant Lifetime Pass
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Days Extension */}
                      <div className="bg-[#121724] border border-[#1E2536] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-xs text-white">Custom Extension (Add Days)</h5>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                            Add extra days to their existing subscription or free trial without changing their tier.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="3650"
                            value={customDays}
                            onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                            className="w-20 bg-[#090C12] border border-[#232D42] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                          <button
                            onClick={() => handleExtendDays(activeControlWorkspace.id, customDays)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition disabled:opacity-50"
                          >
                            + Add {customDays} Days
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB C: LIVE TRACKING & ACTIVITY ────────────────────────── */}
                  {controlTab === 'activity' && (
                    <div className="space-y-6">
                      {/* Connection Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* YouTube Connection Card */}
                        <div className="bg-[#101522] border border-[#1E2536] rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-red-400">
                            <Youtube className="w-5 h-5" />
                            <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-white">
                              Connected YouTube Channel
                            </h4>
                          </div>
                          {workspaceDetail?.youtubeChannel ? (
                            <div className="space-y-1 font-mono text-xs text-gray-300 pt-1">
                              <p className="font-bold text-white text-sm">
                                {workspaceDetail.youtubeChannel.channelTitle || workspaceDetail.youtubeChannel.title}
                              </p>
                              <p className="text-[11px] text-gray-400">ID: {workspaceDetail.youtubeChannel.channelId}</p>
                              {workspaceDetail.youtubeChannel.subscriberCount && (
                                <p className="text-emerald-400 text-[11px]">
                                  {workspaceDetail.youtubeChannel.subscriberCount} Subscribers
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs font-mono text-gray-500 italic pt-1">
                              No YouTube channel linked to this workspace yet.
                            </p>
                          )}
                        </div>

                        {/* Telegram Alerts Card */}
                        <div className="bg-[#101522] border border-[#1E2536] rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-blue-400">
                            <Send className="w-5 h-5" />
                            <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-white">
                              Telegram Alert Bot
                            </h4>
                          </div>
                          <div className="space-y-1 font-mono text-xs text-gray-300 pt-1">
                            <p className="text-gray-400">
                              Chat ID:{' '}
                              <span className="text-white font-bold">
                                {workspaceDetail?.workspace?.telegramChatId || 'Not Configured'}
                              </span>
                            </p>
                            <p className="text-[11px]">
                              Alert Status:{' '}
                              <span
                                className={
                                  workspaceDetail?.workspace?.telegramEnabled ? 'text-emerald-400 font-bold' : 'text-gray-500'
                                }
                              >
                                {workspaceDetail?.workspace?.telegramEnabled ? 'Active & Receiving Alerts' : 'Disabled'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Streams */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-mono uppercase text-gray-300 tracking-wider flex items-center gap-2">
                            <Radio className="w-4 h-4 text-purple-400" />
                            Recent Streams ({workspaceDetail?.streams?.length || 0})
                          </h4>
                        </div>
                        <div className="bg-[#101522] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#080B11] border-b border-[#1E2536] text-gray-400 font-mono uppercase text-[10px]">
                              <tr>
                                <th className="py-2.5 px-3">Title / Broadcast</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Started Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E2536]">
                              {!workspaceDetail?.streams || workspaceDetail.streams.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-gray-500 font-mono">
                                    No streams recorded yet.
                                  </td>
                                </tr>
                              ) : (
                                workspaceDetail.streams.map((stream) => (
                                  <tr key={stream.id} className="hover:bg-[#141B2A]">
                                    <td className="py-2.5 px-3">
                                      <p className="font-bold text-white text-xs">{stream.title || 'Untitled Stream'}</p>
                                      <p className="text-[10px] font-mono text-gray-500">{stream.id}</p>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                          stream.status === 'live'
                                            ? 'bg-red-500/20 text-red-400 animate-pulse'
                                            : stream.status === 'complete'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-gray-800 text-gray-400'
                                        }`}
                                      >
                                        {stream.status?.toUpperCase() || 'READY'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-gray-400 text-[11px]">
                                      {stream.startedAt ? new Date(stream.startedAt).toLocaleString() : 'N/A'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Recent Auto-Clips */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-mono uppercase text-gray-300 tracking-wider flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-emerald-400" />
                            Recent AI Clips Generated ({workspaceDetail?.clips?.length || 0})
                          </h4>
                        </div>
                        <div className="bg-[#101522] border border-[#1E2536] rounded-xl overflow-hidden shadow-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#080B11] border-b border-[#1E2536] text-gray-400 font-mono uppercase text-[10px]">
                              <tr>
                                <th className="py-2.5 px-3">Clip Title</th>
                                <th className="py-2.5 px-3">Format / Specs</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Created</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E2536]">
                              {!workspaceDetail?.clips || workspaceDetail.clips.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-6 text-center text-gray-500 font-mono">
                                    No clips generated yet.
                                  </td>
                                </tr>
                              ) : (
                                workspaceDetail.clips.map((clip) => (
                                  <tr key={clip.id} className="hover:bg-[#141B2A]">
                                    <td className="py-2.5 px-3">
                                      <p className="font-bold text-white text-xs">{clip.title || 'Auto Highlight'}</p>
                                      <p className="text-[10px] font-mono text-gray-500">{clip.id}</p>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">
                                      9:16 Shorts / {clip.duration ? `${clip.duration}s` : '30s'}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                                        {clip.status?.toUpperCase() || 'READY'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-gray-400 text-[11px]">
                                      {clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB D: DANGER ZONE ──────────────────────────────────────── */}
                  {controlTab === 'danger' && session.role === 'super_admin' && (
                    <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="font-bold text-sm uppercase tracking-wider font-mono">
                          Permanent Workspace Erasure
                        </h4>
                      </div>
                      <p className="text-xs text-gray-300">
                        Deleting this workspace will irrevocably wipe all associated team member accounts, connected streams, clips, and configuration records. This action cannot be reversed.
                      </p>
                      <button
                        onClick={() => handleDeleteWorkspace(activeControlWorkspace.id)}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-red-600/30 disabled:opacity-50"
                      >
                        {actionLoading === `del_ws_${activeControlWorkspace.id}`
                          ? 'Wiping Data...'
                          : 'Permanently Delete Workspace'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
