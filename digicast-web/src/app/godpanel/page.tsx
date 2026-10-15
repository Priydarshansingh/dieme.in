'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Coins,
  Tv,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  LogOut,
  Users,
  TrendingUp,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Radio,
  DollarSign,
  Palette,
  Video,
  FileText,
  Key,
  Check,
  X,
  UserCheck,
  UserX,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Copy,
  Filter,
  Download,
  Send,
  Zap,
  Server,
  Database,
  Smartphone,
  Bot,
  ChevronRight,
  BadgePercent,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PlatformUser {
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

interface LedgerEntry {
  id: string;
  uid: string;
  type: 'CREDIT' | 'DEBIT';
  currency: 'DP' | 'D_COIN';
  amount: number;
  source: string;
  description: string;
  timestamp: number;
  referenceId?: string;
}

interface PaymentRecord {
  id?: string;
  paymentId?: string;
  workspaceId: string;
  userEmail?: string;
  planId?: string;
  amountINR: number;
  utrNumber?: string;
  proofUrl?: string;
  screenshotUrl?: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  createdAt: string;
  submittedAt?: string;
}

export default function GodPanelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'users' | 'mint' | 'ledger' | 'subscriptions' | 'editors' | 'assets' | 'ads' | 'tasks' | 'security'
  >('telemetry');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Overview Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalEditors: 0,
    totalStreamers: 0,
    activeOnlineCount: 0,
    liveStreamsCount: 0,
    totalConcurrentViewers: 0,
    activeSubscribers: 0,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR: 0,
    targetMonthlyRevenueINR: 7500,
    totalDPInCirculation: 0,
    totalDCoinsInCirculation: 0,
    pendingTasksForReview: 0,
    active24hAdPasses: 0,
  });

  // Users Directory State
  const [usersList, setUsersList] = useState<PlatformUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'streamer' | 'editor' | 'admin'>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<PlatformUser | null>(null);

  // Ledger & Money History State
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [ledgerSummary, setLedgerSummary] = useState({
    totalTransactions: 0,
    totalMoneyInflowINR: 0,
    totalMoneyOutflowINR: 0,
    netPlatformCirculationINR: 0,
  });

  // E-Cash Mint / Adjust Form State
  const [mintUid, setMintUid] = useState('');
  const [mintCurrency, setMintCurrency] = useState<'DP' | 'D_COIN'>('DP');
  const [mintAmount, setMintAmount] = useState<number>(100);
  const [mintType, setMintType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [mintSource, setMintSource] = useState('CREATOR_GRANT');
  const [mintReason, setMintReason] = useState('Creator onboarding grant & stream acceleration');
  const [isMinting, setIsMinting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  // Payments / UPI Verification State
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [selectedPaymentScreenshot, setSelectedPaymentScreenshot] = useState<string | null>(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);

  // Subscription Plans
  const [plans] = useState([
    { id: 'trial_14', name: '14-Day Free Trial', priceINR: 0, duration: '14 Days', isTrial: true, perks: 'Full OBS & Studio Overlay Access' },
    { id: 'intro_29', name: 'Introductory Offer (Month 1)', priceINR: 29, duration: '30 Days', isTrial: false, perks: 'Watermark-free RTMP Streaming' },
    { id: 'monthly_149', name: 'Standard Monthly Plan', priceINR: 149, duration: '30 Days', isTrial: false, perks: 'Priority Relay & Unlimited Graphics' },
    { id: 'quarterly_449', name: 'Quarterly Plan (Save ~10%)', priceINR: 449, duration: '90 Days', isTrial: false, perks: 'Editor Matchmaking + Cloud Assets' },
    { id: 'annual_999', name: 'Annual Pro (Save ~45%)', priceINR: 999, duration: '365 Days', isTrial: false, perks: 'VIP YouTube Growth Consultations' },
  ]);

  // Tasks Queue
  const [tasks, setTasks] = useState([
    {
      id: 'sub_01',
      title: 'Acquire 1 Web Development Client',
      userEmail: 'creator_vikram@gmail.com',
      reward: '50 DP (₹50)',
      proofUrl: 'https://drive.google.com/file/d/sample-client-agreement/view',
      notes: 'Signed contract for YouTube branding website development.',
      status: 'PENDING',
    },
    {
      id: 'sub_02',
      title: 'Post Twitter / X Thread about Digicast',
      userEmail: 'streamer_aryan@outlook.com',
      reward: '150 D Coins (15 DP)',
      proofUrl: 'https://twitter.com/aryan_streams/status/178923098',
      notes: 'Included tutorial on clipping live stream moments with Digicast.',
      status: 'PENDING',
    },
    {
      id: 'sub_03',
      title: 'Refer 3 Livestream Editors',
      userEmail: 'montage_rahul@gmail.com',
      reward: '100 DP (₹100)',
      proofUrl: 'https://youtube.com/@rahul_montages/community',
      notes: 'Shared my referral link in editor community Discord.',
      status: 'PENDING',
    },
  ]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Check existing session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/godpanel/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setAdminUser(data.admin);
            fetchInitialData();
          }
        }
      } catch (err) {
        console.error('Session check error', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Users
      const uRes = await fetch('/api/godpanel/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        const users = uData.users || [];
        setUsersList(users);
        if (users.length > 0 && !mintUid) {
          setMintUid(users[0].uid);
        }
      }

      // 2. Fetch Ledger
      const lRes = await fetch('/api/godpanel/ledger');
      if (lRes.ok) {
        const lData = await lRes.json();
        setLedgerEntries(lData.entries || []);
        if (lData.summary) setLedgerSummary(lData.summary);
      }

      // 3. Fetch Overview Metrics
      const oRes = await fetch('/api/godpanel/overview');
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.metrics) {
          setMetrics((prev) => ({ ...prev, ...oData.metrics }));
        }
      }

      // 4. Fetch Payments / UPI submissions
      const pRes = await fetch('/api/godpanel/payments');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPaymentsList(pData.payments || []);
      }
    } catch (e) {
      console.error('Failed to load GodPanel telemetry data', e);
      showToast('Telemetry refresh failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/godpanel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication rejected by security gateway');
      } else {
        setIsAuthenticated(true);
        setAdminUser(data.admin);
        fetchInitialData();
        showToast('SuperAdmin session initialized successfully', 'success');
      }
    } catch {
      setLoginError('Security gateway connection refused');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/godpanel/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('Admin session terminated', 'info');
  };

  // E-Cash Mint / Debit Action
  const handleMintMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintUid || mintAmount <= 0) {
      showToast('Please specify a valid UID and positive amount', 'error');
      return;
    }

    setIsMinting(true);
    setLastReceipt(null);

    try {
      const res = await fetch('/api/godpanel/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: mintUid,
          currency: mintCurrency,
          amount: Number(mintAmount),
          type: mintType,
          source: mintSource,
          description: mintReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLastReceipt({
          ...data.transaction,
          newBalance: data.newBalance,
        });
        showToast(
          `Successfully ${mintType === 'CREDIT' ? 'minted' : 'debited'} ${mintAmount} ${mintCurrency} for creator ${mintUid.slice(0, 8)}...`,
          'success'
        );
        fetchInitialData();
      } else {
        showToast(`Transaction failed: ${data.error || 'Check parameters'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Network failure: ${err.message}`, 'error');
    } finally {
      setIsMinting(false);
    }
  };

  // User Status Toggle (Active / Suspended)
  const handleUpdateUserStatus = async (uid: string, newStatus: 'active' | 'suspended') => {
    try {
      const res = await fetch('/api/godpanel/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          uid,
          updates: { status: newStatus },
        }),
      });
      if (res.ok) {
        showToast(`User status set to ${newStatus.toUpperCase()}`, 'success');
        fetchInitialData();
      }
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  // User Plan Update
  const handleUpdateUserPlan = async (uid: string, newPlan: string) => {
    try {
      const res = await fetch('/api/godpanel/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          uid,
          updates: { plan: newPlan },
        }),
      });
      if (res.ok) {
        showToast(`Creator plan upgraded to ${newPlan.toUpperCase()}`, 'success');
        fetchInitialData();
        setSelectedUserForEdit(null);
      }
    } catch (err: any) {
      showToast(`Failed to change plan: ${err.message}`, 'error');
    }
  };

  // Approve / Reject UPI Payment Proof
  const handleVerifyPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setVerifyingPaymentId(paymentId);
    try {
      const res = await fetch('/api/godpanel/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          days: 30,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'approve' ? 'Payment approved & subscription activated!' : 'Payment rejected', 'success');
        fetchInitialData();
      } else {
        showToast(data.error || 'Failed to process payment verification', 'error');
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'info');
  };

  // Selected User for live wallet inspector in Mint tab
  const targetedMintUser = useMemo(() => {
    return usersList.find((u) => u.uid === mintUid);
  }, [usersList, mintUid]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.uid.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [usersList, userSearch, userRoleFilter, userPlanFilter]);

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((e) => {
      if (ledgerFilter === 'ALL') return true;
      return e.type === ledgerFilter;
    });
  }, [ledgerEntries, ledgerFilter]);

  // Active Streams (real data)
  const activeStreams = useMemo(() => {
    return usersList.filter((u) => u.activeStreamTitle);
  }, [usersList]);

  // Pending payments count
  const pendingPaymentsCount = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'pending_verification').length;
  }, [paymentsList]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#07090E] text-slate-300">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-8 w-8 text-cyan-400" />
          </div>
          <RefreshCw className="absolute -bottom-2 -right-2 h-5 w-5 text-cyan-400 animate-spin" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest uppercase text-slate-400">
          Initializing GodPanel Command Gateway...
        </p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN (High-End Enterprise Terminal Style)
  // ════════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06080D] p-4 text-slate-200">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B0F19]/90 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">DIGICAST GODPANEL</h2>
                <p className="text-[10px] font-mono text-cyan-400 tracking-wider">ROOT ACCESS COMMAND</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SECURE TLS
            </span>
          </div>

          <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Environment:</span>
              <span className="font-mono text-slate-200">Production (Vercel Edge)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Firebase Project:</span>
              <span className="font-mono text-cyan-400">digicast-eaca1</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Auth Policy:</span>
              <span className="font-mono text-emerald-400">RBAC Level 0 (Owner)</span>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 rounded-xl bg-red-950/60 border border-red-500/30 p-3 text-xs text-red-300 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Username / UID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="off"
                className="w-full rounded-xl bg-[#070A11] border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Passphrase / Master Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-[#070A11] border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-indigo-500 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter GodPanel'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] text-slate-600">
            Digicast Core Architecture &bull; Cryptographic Signatures Enforced
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN DASHBOARD (OBSIDIAN ENTERPRISE UI)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-[#06080D] text-slate-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : toast.type === 'error' ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-cyan-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {selectedPaymentScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full rounded-2xl bg-[#0B0F19] border border-slate-800 p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-cyan-400" />
                <span>UPI Payment Slip Proof</span>
              </h3>
              <button
                onClick={() => setSelectedPaymentScreenshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden max-h-[70vh]">
              <img
                src={selectedPaymentScreenshot}
                alt="Payment proof"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={selectedPaymentScreenshot}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
              >
                <span>Open full-resolution in new tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. SIDE NAVIGATION ──────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#090C15] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Header */}
          <div className="h-16 border-b border-slate-800/80 px-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-tight">GOD PANEL</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Backend Central Command</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Group 1: Live Operations */}
            <div>
              <p className="px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Live Operations
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'telemetry'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 shrink-0" />
                    <span>Real-Time Telemetry</span>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'users'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>All Platform Users</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                    {metrics.totalUsers}
                  </span>
                </button>
              </div>
            </div>

            {/* Group 2: Money & E-Cash Engine */}
            <div>
              <p className="px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Fintech &amp; E-Cash
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'mint'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Create / Mint Money</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    +MINT
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'ledger'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="h-4 w-4 shrink-0 text-yellow-400" />
                    <span>Come &amp; Go History</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                    {ledgerEntries.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'subscriptions'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 shrink-0 text-blue-400" />
                    <span>UPI Approvals &amp; Plans</span>
                  </div>
                  {pendingPaymentsCount > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold animate-pulse border border-amber-500/30">
                      {pendingPaymentsCount} PENDING
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">₹149/mo</span>
                  )}
                </button>
              </div>
            </div>

            {/* Group 3: Creator Ecosystem */}
            <div>
              <p className="px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Creator Ecosystem
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('editors')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'editors'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span>Editors &amp; Portfolios</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                    {metrics.totalEditors}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('assets')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'assets'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="h-4 w-4 shrink-0 text-purple-400" />
                    <span>Stream Assets Hub</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                    4 CATS
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('ads')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'ads'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tv className="h-4 w-4 shrink-0 text-pink-400" />
                    <span>Ad Telemetry (24h)</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{metrics.active24hAdPasses}</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'tasks'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                    <span>Task Reviews</span>
                  </div>
                  {metrics.pendingTasksForReview > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                      {metrics.pendingTasksForReview}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Group 4: Infrastructure */}
            <div>
              <p className="px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Core Infrastructure
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'security'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>API &amp; Security Gateway</span>
                  </div>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070910] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'Root God Admin'}</p>
              <p className="text-[10px] text-slate-500 font-mono">RBAC: SuperUser</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out of God Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── 2. MAIN WORKSPACE / CONTENT AREA ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070A11]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0A0D18]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-slate-500">ROOT</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white font-bold capitalize">
                {activeTab === 'telemetry' && 'Real-Time Telemetry & Broadcast Monitor'}
                {activeTab === 'users' && 'Creator Profiles & RBAC Management'}
                {activeTab === 'mint' && 'E-Cash Double-Entry Minting Engine'}
                {activeTab === 'ledger' && 'Financial Ledger & Audit Trail'}
                {activeTab === 'subscriptions' && 'UPI Approvals & Subscription Matrix'}
                {activeTab === 'editors' && 'Editors Directory & Video Portfolios'}
                {activeTab === 'assets' && 'Live Stream Asset Catalog'}
                {activeTab === 'ads' && '24-Hour Ad Pass Telemetry & Rewards'}
                {activeTab === 'tasks' && 'Community Tasks & Bounty Reviews'}
                {activeTab === 'security' && 'Cryptographic Gateway & System Health'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Button */}
            <button
              onClick={() => setActiveTab('mint')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Quick Mint E-Cash</span>
            </button>

            {/* Refresh State Button */}
            <button
              onClick={fetchInitialData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh State'}</span>
            </button>

            {/* Status Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production Enclave Active</span>
            </div>
          </div>
        </header>

        {/* Tab Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ════════════════════════════════════════════════════════════════════
              TAB 1: REAL-TIME TELEMETRY & STUDIO MONITOR
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Professional Financial Summary Grid (Replaces bulky toy banner) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Monthly Recurring Revenue */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Monthly Run-Rate (MRR)
                    </span>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    ₹{metrics.monthlyProjectedRevenueINR.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target: ₹{metrics.targetMonthlyRevenueINR.toLocaleString()}</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round((metrics.monthlyProjectedRevenueINR / (metrics.targetMonthlyRevenueINR || 1)) * 100)}% to goal
                    </span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((metrics.monthlyProjectedRevenueINR / (metrics.targetMonthlyRevenueINR || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Metric 2: Active Subscribers */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Paying Subscribers
                    </span>
                    <Layers className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {metrics.activeSubscribers}
                    <span className="text-xs font-normal text-slate-400 ml-1">Creators</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">50 Sub Milestone</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round((metrics.activeSubscribers / (metrics.targetSubscribers || 1)) * 100)}% reached
                    </span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((metrics.activeSubscribers / (metrics.targetSubscribers || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Metric 3: Total Platform Users */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total Registered Creators
                    </span>
                    <Users className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {metrics.totalUsers}
                    <span className="text-xs font-normal text-slate-400 ml-1">Accounts</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{metrics.totalStreamers} Streamers</span>
                    <span>&bull;</span>
                    <span>{metrics.totalEditors} Editors</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-time Firebase Auth verified</span>
                  </div>
                </div>

                {/* Metric 4: E-Cash In Circulation */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Net E-Cash In Circulation
                    </span>
                    <Coins className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-yellow-400">
                    {metrics.totalDPInCirculation.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">DP (₹{metrics.totalDPInCirculation})</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>D-Coins: {metrics.totalDCoinsInCirculation.toLocaleString()} D</span>
                    <button
                      onClick={() => setActiveTab('mint')}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      Mint More &rarr;
                    </button>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                    Double-entry ledger backed
                  </div>
                </div>
              </div>

              {/* Secondary Status Row: UPI Submissions Alert & Quick Ops */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* UPI Pending Alert Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">UPI Verifications</span>
                    </div>
                    <p className="text-xl font-extrabold text-white">
                      {pendingPaymentsCount} <span className="text-xs font-normal text-slate-400">Pending Proofs</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Creators waiting for manual subscription activation</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Review Proofs</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Ad Pass Status Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">24H Ad Stream Passes</span>
                    </div>
                    <p className="text-xl font-extrabold text-purple-400">
                      {metrics.active24hAdPasses} <span className="text-xs font-normal text-slate-400">Active Today</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Ad-supported tier streams running</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ads')}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Ad Telemetry</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* System Node Telemetry */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Gateway Latency</span>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-400">
                      18 ms <span className="text-xs font-normal text-slate-400">Edge Ping</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Firebase Firestore &amp; Auth synchronized</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('security')}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Diagnostics</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Active YouTube Broadcasts Radar */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">Live Broadcast Radar (Monitored by Studio)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                      {activeStreams.length} ON AIR
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">RTMP Relay &bull; v1.8.0</span>
                </div>

                {activeStreams.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40">
                    <Radio className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">No active YouTube live broadcasts detected</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Creators streaming via Digicast Android or Web Studio will appear here with live viewer metrics.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {activeStreams.map((s) => (
                      <div key={s.uid} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                          <div>
                            <p className="text-xs font-bold text-white">{s.activeStreamTitle}</p>
                            <p className="text-[11px] text-slate-400">
                              Streamer: <span className="text-cyan-400">{s.displayName}</span> &bull; {s.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                            {s.concurrentViewers || 500} Viewers
                          </span>
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                            {s.plan.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 2: ALL PLATFORM USERS (ENTERPRISE DIRECTORY)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0B0F1A] p-4 rounded-2xl border border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-500 px-2 text-[11px] font-bold uppercase">Role:</span>
                    {(['all', 'streamer', 'editor', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold uppercase transition ${
                          userRoleFilter === r
                            ? 'bg-cyan-500 text-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-500 px-2 text-[11px] font-bold uppercase">Plan:</span>
                    <select
                      value={userPlanFilter}
                      onChange={(e) => setUserPlanFilter(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none pr-2"
                    >
                      <option value="all" className="bg-slate-900">All Tiers</option>
                      <option value="free_trial" className="bg-slate-900">Free Trial</option>
                      <option value="intro_29" className="bg-slate-900">Intro (₹29)</option>
                      <option value="monthly_149" className="bg-slate-900">Monthly (₹149)</option>
                      <option value="quarterly_449" className="bg-slate-900">Quarterly (₹449)</option>
                      <option value="annual_999" className="bg-slate-900">Annual Pro (₹999)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-5">Creator / Account</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Plan &amp; Tier</th>
                        <th className="py-3.5 px-4">E-Cash Wallet</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Last Activity</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                            No creators match the active filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-800/20 transition font-sans">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                                  {u.displayName ? u.displayName[0].toUpperCase() : 'C'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span className="truncate">{u.displayName}</span>
                                    {u.isOnline && (
                                      <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online now" />
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] text-slate-600 font-mono truncate">
                                      UID: {u.uid.slice(0, 10)}...
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(u.uid, 'UID')}
                                      className="text-slate-600 hover:text-slate-400"
                                      title="Copy UID"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                  u.role === 'owner'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                    : u.role === 'admin'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : u.role === 'editor'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white uppercase">
                                  {u.plan.replace('_', ' ')}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  {u.plan.includes('annual')
                                    ? '₹999 / year'
                                    : u.plan.includes('quarterly')
                                    ? '₹449 / 3mo'
                                    : u.plan.includes('intro')
                                    ? '₹29 (Month 1)'
                                    : u.plan.includes('monthly')
                                    ? '₹149 / month'
                                    : 'Trial Tier'}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-mono text-xs font-bold text-yellow-400 flex items-center gap-1">
                                  <Coins className="h-3 w-3" />
                                  <span>{u.dpBalance} DP (₹{u.dpBalance})</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {u.dCoinsBalance} D-Coins
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : u.status === 'trial'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-[11px] text-slate-400">
                              {u.lastActiveAt}
                            </td>

                            <td className="py-3.5 px-5 text-right space-x-1.5">
                              {/* Quick Mint Action */}
                              <button
                                onClick={() => {
                                  setMintUid(u.uid);
                                  setActiveTab('mint');
                                  showToast(`Selected creator ${u.displayName} for E-Cash minting`, 'info');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition"
                                title="Mint or Adjust E-Cash"
                              >
                                + Mint
                              </button>

                              {/* Change Plan Button */}
                              <button
                                onClick={() => setSelectedUserForEdit(u)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
                              >
                                Plan
                              </button>

                              {/* Toggle Status */}
                              {u.status === 'suspended' ? (
                                <button
                                  onClick={() => handleUpdateUserStatus(u.uid, 'active')}
                                  className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                                  title="Unsuspend User"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateUserStatus(u.uid, 'suspended')}
                                  className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                                  title="Suspend User"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Plan Modal */}
              {selectedUserForEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl bg-[#0B0F19] border border-slate-800 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-cyan-400" />
                        <span>Change Creator Subscription Tier</span>
                      </h3>
                      <button
                        onClick={() => setSelectedUserForEdit(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-white">{selectedUserForEdit.displayName}</p>
                      <p className="text-slate-400 font-mono">{selectedUserForEdit.email}</p>
                      <p className="text-[11px] text-cyan-400 font-mono">Current: {selectedUserForEdit.plan.toUpperCase()}</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Select Target Tier:</p>
                      {[
                        { id: 'free_trial', label: 'Free Trial (14 Days)' },
                        { id: 'intro_29', label: 'Introductory Offer (₹29 / mo)' },
                        { id: 'monthly_149', label: 'Standard Monthly (₹149 / mo)' },
                        { id: 'quarterly_449', label: 'Quarterly Pro (₹449 / 3mo)' },
                        { id: 'annual_999', label: 'Annual Studio (₹999 / yr)' },
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => handleUpdateUserPlan(selectedUserForEdit.uid, plan.id)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-xs font-semibold text-white flex items-center justify-between transition"
                        >
                          <span>{plan.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 3: CREATE / MINT MONEY (FINTECH MINT & BURN CONSOLE)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'mint' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: The Minting Machine Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 shadow-2xl space-y-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Coins className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-white tracking-tight">
                          E-Cash Minting &amp; Balance Adjuster
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Authorized double-entry transaction write directly into Firestore and Creator Wallet.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleMintMoney} className="space-y-5">
                    {/* Operation Type: Credit (Mint) vs Debit (Clawback) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Operation Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setMintType('CREDIT')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition ${
                            mintType === 'CREDIT'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>MINT / CREDIT (+)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMintType('DEBIT')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition ${
                            mintType === 'DEBIT'
                              ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <ArrowDownLeft className="h-4 w-4" />
                          <span>DEBIT / CLAWBACK (-)</span>
                        </button>
                      </div>
                    </div>

                    {/* Target Creator Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Recipient Creator
                      </label>
                      <div className="space-y-2">
                        <select
                          value={mintUid}
                          onChange={(e) => setMintUid(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          {usersList.map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.displayName} ({u.email || u.uid}) &mdash; Bal: {u.dpBalance} DP
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Or enter custom UID manually..."
                            value={mintUid}
                            onChange={(e) => setMintUid(e.target.value)}
                            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Currency & Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Currency Standard
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMintCurrency('DP')}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              mintCurrency === 'DP'
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            DP (₹1 INR)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMintCurrency('D_COIN')}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              mintCurrency === 'D_COIN'
                                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            D-Coin (0.1 DP)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Amount ({mintCurrency})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100000"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Presets:</span>
                      {[50, 100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setMintAmount(amt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-slate-300 transition"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>

                    {/* Source / Category */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Transaction Category / Audit Source
                      </label>
                      <select
                        value={mintSource}
                        onChange={(e) => setMintSource(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="CREATOR_GRANT">CREATOR_GRANT (Growth Onboarding Incentive)</option>
                        <option value="CAMPAIGN_BONUS">CAMPAIGN_BONUS (Viral Stream / Milestone Reward)</option>
                        <option value="SUBSCRIPTION_PURCHASE">SUBSCRIPTION_PURCHASE (Manual UPI Top-up)</option>
                        <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT (Admin Ledger Correction)</option>
                        <option value="BUG_BOUNTY">BUG_BOUNTY (Vulnerability / Quality Report)</option>
                      </select>
                    </div>

                    {/* Description Reason */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Audit Memo / Description (Mandatory)
                      </label>
                      <input
                        type="text"
                        value={mintReason}
                        onChange={(e) => setMintReason(e.target.value)}
                        placeholder="Reason for audit log..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isMinting}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg ${
                        mintType === 'CREDIT'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20'
                      }`}
                    >
                      {isMinting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Writing to Ledger &amp; Syncing Firestore...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          <span>
                            Execute {mintType === 'CREDIT' ? 'Mint' : 'Debit'} of {mintAmount} {mintCurrency}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Live Creator Wallet Inspector & Receipt */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Wallet Inspector */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Creator Wallet Snapshot
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {targetedMintUser ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-bold text-white">{targetedMintUser.displayName}</p>
                        <p className="text-xs text-slate-400 font-mono">{targetedMintUser.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          UID: {targetedMintUser.uid}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">DP Balance</p>
                          <p className="text-xl font-black text-yellow-400 font-mono mt-1">
                            {targetedMintUser.dpBalance} DP
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">≈ ₹{targetedMintUser.dpBalance} INR</p>
                        </div>

                        <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">D-Coins Balance</p>
                          <p className="text-xl font-black text-cyan-400 font-mono mt-1">
                            {targetedMintUser.dCoinsBalance} D
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ≈ {Math.floor(targetedMintUser.dCoinsBalance / 10)} DP
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subscription Tier:</span>
                          <span className="font-bold text-white uppercase">{targetedMintUser.plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Status:</span>
                          <span className="font-bold text-emerald-400 uppercase">{targetedMintUser.status}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      Select or enter a UID to inspect their live wallet balances.
                    </p>
                  )}
                </div>

                {/* Last Transaction Receipt */}
                {lastReceipt && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 shadow-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ledger Write Confirmed</span>
                    </div>

                    <div className="text-xs font-mono space-y-1.5 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="text-white truncate max-w-[180px]">{lastReceipt.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount / Currency:</span>
                        <span className="text-yellow-400 font-bold">
                          {lastReceipt.type === 'CREDIT' ? '+' : '-'} {lastReceipt.amount} {lastReceipt.currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">New DP Balance:</span>
                        <span className="text-emerald-400 font-bold">{lastReceipt.newBalance?.dpBalance} DP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span>{new Date(lastReceipt.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 4: COME & GO TRANSACTION HISTORY (FINANCIAL LEDGER)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Ledger Summary Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
                  <p className="text-xl font-bold text-white mt-1 font-mono">{ledgerSummary.totalTransactions}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Minted / Inflow</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                    +₹{ledgerSummary.totalMoneyInflowINR.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Debited / Outflow</p>
                  <p className="text-xl font-bold text-red-400 mt-1 font-mono">
                    -₹{ledgerSummary.totalMoneyOutflowINR.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Circulating Capital</p>
                  <p className="text-xl font-bold text-yellow-400 mt-1 font-mono">
                    ₹{ledgerSummary.netPlatformCirculationINR.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex items-center justify-between bg-[#0B0F1A] p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold px-2">Type Filter:</span>
                  {(['ALL', 'CREDIT', 'DEBIT'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setLedgerFilter(f)}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
                        ledgerFilter === f
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      ['ID,UID,Type,Amount,Currency,Source,Description,Time']
                        .concat(
                          ledgerEntries.map(
                            (e) =>
                              `${e.id},${e.uid},${e.type},${e.amount},${e.currency},${e.source},"${e.description}",${new Date(
                                e.timestamp
                              ).toISOString()}`
                          )
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `digicast_ledger_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('Ledger exported to CSV', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Ledger Entries Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Creator UID</th>
                        <th className="py-3 px-4">Direction</th>
                        <th className="py-3 px-4">Amount &amp; Currency</th>
                        <th className="py-3 px-4">Category Source</th>
                        <th className="py-3 px-4">Audit Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                            No ledger entries found.
                          </td>
                        </tr>
                      ) : (
                        filteredLedger.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-800/20 transition">
                            <td className="py-3 px-4 font-bold text-slate-300 truncate max-w-[140px]" title={e.id}>
                              {e.id}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-3 px-4 text-cyan-400 truncate max-w-[140px]" title={e.uid}>
                              {e.uid}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                                  e.type === 'CREDIT'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {e.type === 'CREDIT' ? '+ CREDIT' : '- DEBIT'}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-4 font-bold ${
                                e.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {e.amount} {e.currency}
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-sans text-[11px]">{e.source}</td>
                            <td className="py-3 px-4 text-slate-400 font-sans text-[11px] truncate max-w-xs" title={e.description}>
                              {e.description}
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

          {/* ════════════════════════════════════════════════════════════════════
              TAB 5: UPI PAYMENT APPROVALS & SUBSCRIPTION MATRIX
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Top Banner: Verification Action Queue */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Submitted UPI Payments Queue</h3>
                      <p className="text-xs text-slate-400">
                        Review proof slips uploaded by creators. Approving extends workspace subscription by 30 days.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                    {pendingPaymentsCount} PENDING ACTION
                  </span>
                </div>

                {paymentsList.length === 0 ? (
                  <div className="py-10 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-500">
                    No pending UPI payment proof submissions at this time.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[11px]">
                          <th className="py-3 px-4">Workspace / User</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">UTR Number</th>
                          <th className="py-3 px-4">Proof Slip</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {paymentsList.map((p, idx) => {
                          const pId = p.paymentId || p.id || `pay_${idx}`;
                          const slipUrl = p.proofUrl || p.screenshotUrl;
                          return (
                            <tr key={pId} className="hover:bg-slate-800/20 transition">
                              <td className="py-3 px-4 font-mono">
                                <p className="font-bold text-white truncate max-w-[150px]">{p.workspaceId}</p>
                                {p.userEmail && <p className="text-[11px] text-slate-400">{p.userEmail}</p>}
                              </td>

                              <td className="py-3 px-4 uppercase font-bold text-cyan-400">
                                {p.planId || 'MONTHLY_149'}
                              </td>

                              <td className="py-3 px-4 font-bold text-emerald-400 font-mono">
                                ₹{p.amountINR || 149}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-slate-300">
                                {p.utrNumber ? (
                                  <div className="flex items-center gap-1">
                                    <span>{p.utrNumber}</span>
                                    <button
                                      onClick={() => copyToClipboard(p.utrNumber!, 'UTR')}
                                      className="text-slate-500 hover:text-slate-300"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">N/A</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {slipUrl ? (
                                  <button
                                    onClick={() => setSelectedPaymentScreenshot(slipUrl)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-cyan-400 hover:bg-slate-800"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Inspect Slip</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">No image</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    p.status === 'approved'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : p.status === 'rejected'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right space-x-2">
                                {p.status === 'pending_verification' && (
                                  <>
                                    <button
                                      onClick={() => handleVerifyPayment(pId, 'approve')}
                                      disabled={verifyingPaymentId === pId}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition"
                                    >
                                      {verifyingPaymentId === pId ? 'Activating...' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleVerifyPayment(pId, 'reject')}
                                      disabled={verifyingPaymentId === pId}
                                      className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-xs font-bold transition"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subscription Plans Matrix */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Configured Subscription Tier Matrix</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((pl) => (
                    <div key={pl.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{pl.name}</span>
                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          {pl.priceINR === 0 ? 'FREE' : `₹${pl.priceINR}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pl.perks}</p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1">Duration: {pl.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 6: EDITORS & CREATOR MATCHMAKING
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'editors' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Video className="h-4 w-4 text-indigo-400" />
                      <span>Verified Editors Directory</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Match YouTube streamers with professional video editors &amp; thumbnail designers.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    {metrics.totalEditors} Verified Editors
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {usersList
                    .filter((u) => u.role === 'editor')
                    .map((ed) => (
                      <div key={ed.uid} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                            {ed.displayName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{ed.displayName}</p>
                            <p className="text-[11px] text-slate-400">{ed.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                          <span>Wallet: {ed.dpBalance} DP</span>
                          <span className="text-emerald-400 font-bold uppercase">{ed.status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 7: STREAM ASSETS HUB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-400" />
                    <span>Live Stream Asset Catalog (4 Categories)</span>
                  </h3>
                  <span className="text-xs text-purple-400 font-mono">Cloud Synced &bull; RTMP Ready</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Overlays & HUDs', count: 18, desc: 'Cyberpunk, Minimalist & Gaming HUDs' },
                    { name: 'Animated Lower Thirds', count: 12, desc: 'Social handles & subscriber alerts' },
                    { name: 'Sound FX & Stingers', count: 24, desc: 'High-energy stream transitions' },
                    { name: 'BGM Audio Loops', count: 16, desc: 'Copyright-free livestream tracks' },
                  ].map((cat) => (
                    <div key={cat.name} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                      <span className="text-xs font-bold text-white">{cat.name}</span>
                      <p className="text-xl font-black text-purple-400 font-mono">{cat.count} Assets</p>
                      <p className="text-[11px] text-slate-500">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 8: 24-HOUR AD PASS TELEMETRY
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv className="h-4 w-4 text-pink-400" />
                      <span>24-Hour Rewarded Ad Telemetry</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      AdMob rewarded video ad verifications granting free streaming passes.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                    {metrics.active24hAdPasses} Active Passes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Supported Networks</p>
                    <p className="text-sm font-bold text-white mt-1">Google AdMob &bull; Unity Ads</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Rewarded Pass Duration</p>
                    <p className="text-sm font-bold text-cyan-400 mt-1">24 Hours from Watch</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Reward Token Bonus</p>
                    <p className="text-sm font-bold text-yellow-400 mt-1">+15 D-Coins per Ad View</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 9: TASK REVIEWS & COMMUNITY BOUNTIES
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    <span>Creator Tasks &amp; Community Bounty Review</span>
                  </h3>
                  <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                    {tasks.filter((t) => t.status === 'PENDING').length} Pending Review
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{task.title}</p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                              task.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : task.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{task.userEmail} &bull; Reward: {task.reward}</p>
                        <p className="text-[11px] text-slate-500">{task.notes}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, status: 'APPROVED' } : t))
                                );
                                showToast(`Approved bounty for ${task.userEmail}`, 'success');
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, status: 'REJECTED' } : t))
                                );
                                showToast(`Rejected task ${task.id}`, 'info');
                              }}
                              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold hover:bg-red-500/30 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 10: API & SECURITY GATEWAY DIAGNOSTICS
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Production Gateway Diagnostics &amp; Health Matrix</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Firebase Admin SDK</span>
                      <Check className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-white">Project: digicast-eaca1</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Service Account Active &bull; ASN.1 Key OK</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Telegram Bot Engine</span>
                      <Bot className="h-4 w-4 text-cyan-400" />
                    </div>
                    <p className="text-sm font-bold text-white">@DigicastIndiaBot</p>
                    <p className="text-[10px] text-cyan-400 font-mono">Webhook Registered &bull; Alerts Enabled</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Cryptographic Auth</span>
                      <Lock className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-sm font-bold text-white">HMAC SHA-256 Tokens</p>
                    <p className="text-[10px] text-amber-400 font-mono">Zero-Trust RBAC &bull; Cookie + Header</p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                  <p className="text-slate-500 font-bold uppercase">Active Endpoints &amp; Routes:</p>
                  <p className="text-slate-300">&bull; POST /api/godpanel/ledger &mdash; Double-entry E-Cash writes</p>
                  <p className="text-slate-300">&bull; POST /api/godpanel/payments &mdash; Manual UPI verification &amp; workspace extension</p>
                  <p className="text-slate-300">&bull; POST /api/godpanel/users &mdash; Profile, status, and role sync to Firestore</p>
                  <p className="text-slate-300">&bull; POST /api/telegram/webhook &mdash; Instant admin bot notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
