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
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle,
  XCircle,
  MoreVertical,
  ArrowUp,
  CreditCard as CardIcon,
  Play,
  Share2,
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

  // Timeframe selector (like "This Month" in the Admin video)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'This Month' | 'Last 30 Days' | 'All Time'>('This Month');

  // Interactive graph active point (day 21 default)
  const [activeDateIndex, setActiveDateIndex] = useState<number>(3); // day 21

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
    totalUsers: 5,
    totalEditors: 1,
    totalStreamers: 4,
    activeOnlineCount: 2,
    liveStreamsCount: 1,
    totalConcurrentViewers: 320,
    activeSubscribers: 1,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR: 149,
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

  // Pending payments count
  const pendingPaymentsCount = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'pending_verification').length;
  }, [paymentsList]);

  // Graph curve data points for Balance Overview
  const graphDates = [
    { day: 18, val: '₹4,120' },
    { day: 19, val: '₹4,890' },
    { day: 20, val: '₹5,600' },
    { day: 21, val: '₹7,500' },
    { day: 22, val: '₹7,100' },
    { day: 23, val: '₹7,850' },
    { day: 24, val: '₹8,200' },
  ];

  // Radial goal progress (current vs target 50 subscribers)
  const goalPercent = Math.min(100, Math.max(8, Math.round((metrics.activeSubscribers / (metrics.targetSubscribers || 1)) * 100)));
  const circumference = 180; // half circle arc for radial gauge
  const strokeDashoffset = circumference - (circumference * goalPercent) / 100;

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#07080B] text-slate-300">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-[#12151D] border border-white/5 flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-7 w-7 text-blue-500" />
          </div>
          <RefreshCw className="absolute -bottom-2 -right-2 h-4 w-4 text-blue-500 animate-spin" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest uppercase text-slate-500">
          Connecting to Root Command Node...
        </p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN (Pitch Black Monochromatic Style)
  // ════════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050608] p-4 text-slate-200">
        <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0C0E14] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight">DIGICAST GODPANEL</h2>
                <p className="text-[10px] font-mono text-slate-400">Root Access Control</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-white/5 text-slate-300 border border-white/10">
              PROD
            </span>
          </div>

          {loginError && (
            <div className="mb-6 rounded-2xl bg-red-950/40 border border-red-500/20 p-3 text-xs text-red-300 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Admin Username / UID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="off"
                className="w-full rounded-2xl bg-[#07080B] border border-white/5 px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl bg-[#07080B] border border-white/5 px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition duration-150 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Authenticate & Enter Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] text-slate-600">
            Digicast Architecture &bull; Cryptographic Signatures Enforced
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN DASHBOARD (EXACT GRAPH UI FROM VIDEO INSPIRTATION)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-[#07080B] text-slate-200 overflow-hidden font-sans select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-[#0E121B] border-blue-500/40 text-blue-200'
              : toast.type === 'error'
              ? 'bg-[#180E10] border-red-500/40 text-red-200'
              : 'bg-[#0E121B] border-white/10 text-slate-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-blue-400" />
          ) : toast.type === 'error' ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {selectedPaymentScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full rounded-3xl bg-[#0E1118] border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <CardIcon className="h-4 w-4 text-blue-400" />
                <span>UPI Payment Proof Slip</span>
              </h3>
              <button
                onClick={() => setSelectedPaymentScreenshot(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-[#07080B] rounded-2xl overflow-hidden max-h-[70vh]">
              <img
                src={selectedPaymentScreenshot}
                alt="Payment proof"
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={selectedPaymentScreenshot}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1.5"
              >
                <span>Open in full resolution</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. SIDEBAR (MATCHING VIDEO: BRAND + WELCOME CARD + MONOCHROMATIC PILLS) ───────────────── */}
      <aside className="w-64 border-r border-white/5 bg-[#07080B] flex flex-col justify-between shrink-0 p-3.5">
        <div className="space-y-4">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">Digicast</span>
              <span className="text-[10px] text-slate-500 font-mono ml-1.5 font-bold">ROOT</span>
            </div>
          </div>

          {/* Welcome Back Card (Exact from video 00:02 to 00:05) */}
          <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white">
                AD
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-500">LIVE</span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pt-2">
              THURSDAY, OCT 15
            </p>
            <h4 className="text-xs font-bold text-white">
              Welcome back, Root Admin!
            </h4>
          </div>

          {/* Navigation Pill List (Single unified color scheme, no rainbow chaos) */}
          <nav className="space-y-1 pt-1 overflow-y-auto max-h-[calc(100vh-290px)]">
            {[
              { id: 'telemetry', label: 'Dashboard', icon: Activity, count: null },
              { id: 'users', label: 'All Platform Users', icon: Users, count: metrics.totalUsers },
              { id: 'mint', label: 'Create / Mint Money', icon: PlusCircle, count: '+MINT' },
              { id: 'ledger', label: 'Come & Go History', icon: Coins, count: ledgerEntries.length },
              { id: 'subscriptions', label: 'UPI Approvals & Plans', icon: CardIcon, count: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} PENDING` : null },
              { id: 'editors', label: 'Editors Directory', icon: Video, count: metrics.totalEditors },
              { id: 'assets', label: 'Stream Assets Hub', icon: Palette, count: '4 CATS' },
              { id: 'ads', label: '24h Ad Telemetry', icon: Tv, count: metrics.active24hAdPasses },
              { id: 'tasks', label: 'Task Reviews', icon: CheckCircle2, count: metrics.pendingTasksForReview > 0 ? metrics.pendingTasksForReview : null },
              { id: 'security', label: 'API & Security Gateway', icon: Lock, count: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#12151D] text-white border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : typeof item.count === 'string' && item.count.includes('PENDING')
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner Card (Matching video activate card) */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-3 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-[11px]">GodPanel Pro</p>
              <p className="text-[10px] text-slate-500 font-mono">Zero-Trust Secured</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN VIEW ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#07080B]">
        {/* Top Header Controls Bar (From Video 00:02: "This Month" dropdown + "Manage Widgets" + "+ Add new Widget") */}
        <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#07080B]">
          {/* Timeframe pill selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1118] border border-white/5 text-xs text-white">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="This Month" className="bg-[#0E1118]">This Month</option>
                <option value="Last 30 Days" className="bg-[#0E1118]">Last 30 Days</option>
                <option value="All Time" className="bg-[#0E1118]">All Time</option>
              </select>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchInitialData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1118] border border-white/5 hover:border-white/10 text-xs text-slate-300 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            {/* Manage Widgets / Quick Filter */}
            <button
              onClick={() => setActiveTab('security')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1118] border border-white/5 hover:border-white/10 text-xs text-slate-300 transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span>Manage Widgets</span>
            </button>

            {/* Primary Action Button (blue button from video) */}
            <button
              onClick={() => setActiveTab('mint')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ Mint E-Cash</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ════════════════════════════════════════════════════════════════════
              TAB 1: EXACT GRAPH DASHBOARD FROM VIDEO INSPIRATION
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 max-w-[1400px] mx-auto">
              {/* TOP ROW: AI Insights (3 cols) + Balance Overview Line Graph (6 cols) + Earnings Radial (3 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 1. AI Insights Card (Frame 00:02 to 00:04) */}
                <div className="lg:col-span-3 rounded-3xl border border-white/5 bg-[#0E1118] p-5 flex flex-col justify-between relative overflow-hidden group">
                  {/* Subtle glowing mesh gradient in top-right */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white bg-white/5 border border-white/10">
                      AI Insights
                    </span>

                    <h3 className="text-lg font-extrabold text-white leading-snug">
                      Your Transaction Volume has increased by 18% Since last Month
                    </h3>

                    <p className="text-xs text-slate-500">
                      {metrics.totalUsers} registered creators with active stream telemetry telemetry active.
                    </p>
                  </div>

                  <div className="pt-6 flex justify-end relative z-10">
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className="h-10 w-10 rounded-2xl bg-[#141823] border border-white/10 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition shadow-md"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Balance Overview with Smooth SVG Spline Line Graph (Frame 00:02 to 00:05) */}
                <div className="lg:col-span-6 rounded-3xl border border-white/5 bg-[#0E1118] p-5 flex flex-col justify-between space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Balance Overview</span>
                        <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <ArrowUp className="h-3 w-3 mr-0.5" />
                          <span>12% From last month</span>
                        </span>
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        ₹{metrics.targetMonthlyRevenueINR.toLocaleString()}.00
                      </div>
                    </div>

                    {/* Chips: transactions & categories */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-300 bg-[#141823] border border-white/5 px-2.5 py-1 rounded-xl">
                        ⇄ {ledgerEntries.length} transactions
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300 bg-[#141823] border border-white/5 px-2.5 py-1 rounded-xl">
                        📁 {metrics.totalUsers} creators
                      </span>
                    </div>
                  </div>

                  {/* Smooth Curved SVG Line Chart */}
                  <div className="relative w-full h-36 pt-2">
                    <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 10,95 Q 80,95 130,70 T 250,50 T 360,25 T 490,45 L 490,120 L 10,120 Z"
                        fill="url(#curveGradient)"
                      />

                      {/* Main Smooth Spline Line */}
                      <path
                        d="M 10,95 Q 80,95 130,70 T 250,50 T 360,25 T 490,45"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Active Highlight Dot on Day 21 */}
                      <circle cx="360" cy="25" r="5" fill="#3B82F6" />
                      <circle cx="360" cy="25" r="9" fill="none" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.4" />
                    </svg>

                    {/* Floating Tooltip at active dot */}
                    <div className="absolute top-0 left-[70%] -translate-x-1/2 -translate-y-2 bg-blue-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-lg">
                      {graphDates[activeDateIndex]?.val || '₹7,500'}
                    </div>
                  </div>

                  {/* Bottom Timeline Date Pills (18 19 20 [21] 22 23 24) */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    {graphDates.map((item, idx) => (
                      <button
                        key={item.day}
                        onClick={() => setActiveDateIndex(idx)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-mono transition ${
                          activeDateIndex === idx
                            ? 'bg-blue-600 text-white font-bold shadow-md'
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {item.day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Earnings & Milestone Radial Gauge (Frame 00:02 & 00:08) */}
                <div className="lg:col-span-3 rounded-3xl border border-white/5 bg-[#0E1118] p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Earnings</span>
                      <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ArrowUp className="h-3 w-3 mr-0.5" />
                        <span>7% From last month</span>
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                      ₹{metrics.monthlyProjectedRevenueINR.toLocaleString()}
                    </div>
                  </div>

                  {/* Semi-circular Radial Arc Chart */}
                  <div className="flex flex-col items-center justify-center py-1 relative">
                    <svg viewBox="0 0 160 90" className="w-36 h-24 overflow-visible">
                      {/* Background Track */}
                      <path
                        d="M 20,80 A 60,60 0 0,1 140,80"
                        fill="none"
                        stroke="#161B26"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Foreground Progress */}
                      <path
                        d="M 20,80 A 60,60 0 0,1 140,80"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="text-center -mt-6">
                      <span className="text-xl font-black text-white font-mono">{goalPercent}%</span>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Milestone Progress</p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                      <span>Month Goal (₹7,500)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: Transactions Table (8 cols) + Spending / Circulation Bar Chart (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 4. Transactions List (Frame 00:02 to 00:05) */}
                <div className="lg:col-span-8 rounded-3xl border border-white/5 bg-[#0E1118] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className="text-xs text-blue-400 hover:underline font-semibold"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {ledgerEntries.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-white/5 bg-[#07080B] text-xs text-slate-500">
                      No transactions recorded yet. Use "+ Mint E-Cash" to generate test records.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {ledgerEntries.slice(0, 5).map((entry, idx) => (
                        <div key={entry.id || idx} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-2xl bg-[#141823] border border-white/5 flex items-center justify-center text-slate-300">
                              {entry.type === 'CREDIT' ? (
                                <ArrowUpRight className="h-4 w-4 text-blue-400" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{entry.description || entry.source}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                UID: •••• {entry.uid.slice(-4)} &bull; {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-xs font-mono font-bold ${
                                entry.type === 'CREDIT' ? 'text-white' : 'text-slate-400'
                              }`}
                            >
                              {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.currency === 'DP' ? entry.amount : entry.amount / 10}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {entry.amount} {entry.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Spending & Activity Vertical Bar Chart (Frame 00:02 & 00:08) */}
                <div className="lg:col-span-4 rounded-3xl border border-white/5 bg-[#0E1118] p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">E-Cash Circulation</span>
                      <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ArrowUp className="h-3 w-3 mr-0.5" />
                        <span>3% From last month</span>
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                      {metrics.totalDPInCirculation} <span className="text-xs font-normal text-slate-400">DP (₹{metrics.totalDPInCirculation})</span>
                    </div>
                  </div>

                  {/* Vertical Bar Chart (with varying heights and electric blue active bars) */}
                  <div className="flex items-end justify-between h-28 pt-2 px-2">
                    {[
                      { label: '1-8', height: '40%', active: false },
                      { label: '9-15', height: '70%', active: false },
                      { label: '16-22', height: '100%', active: true },
                      { label: '23-31', height: '55%', active: false },
                    ].map((bar) => (
                      <div key={bar.label} className="flex flex-col items-center gap-2">
                        <div className="w-8 bg-[#141823] rounded-t-xl h-20 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-xl transition-all duration-500 ${
                              bar.active ? 'bg-blue-600' : 'bg-slate-700/60'
                            }`}
                            style={{ height: bar.height }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{bar.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Category Chips (from video: Clothing, Groceries, Pets, Bills) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                    {['Subscription', 'Ad Pass', 'Bonus', 'Bounty'].map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-semibold text-slate-300 bg-[#141823] border border-white/5 px-2 py-0.5 rounded-lg"
                      >
                        {cat}
                      </span>
                    ))}
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                      +4
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 2: ALL PLATFORM USERS (MATCHING BLACK MONOCHROME THEME)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E1118] p-4 rounded-3xl border border-white/5">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#07080B] border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#07080B] p-1 rounded-2xl border border-white/5 text-xs">
                    {(['all', 'streamer', 'editor', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`text-xs px-3 py-1 rounded-xl font-semibold uppercase transition ${
                          userRoleFilter === r
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-[#0E1118] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#07080B] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-4 px-5">Creator / Account</th>
                        <th className="py-4 px-4">Role</th>
                        <th className="py-4 px-4">Plan</th>
                        <th className="py-4 px-4">E-Cash Wallet</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-white/5 transition font-sans">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-[#141823] border border-white/5 flex items-center justify-center font-bold text-white text-xs">
                                {u.displayName ? u.displayName[0].toUpperCase() : 'C'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs">{u.displayName}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase text-slate-300">
                              {u.role}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-xs font-bold text-white uppercase">
                            {u.plan.replace('_', ' ')}
                          </td>

                          <td className="py-4 px-4 font-mono font-bold text-white">
                            {u.dpBalance} DP (₹{u.dpBalance})
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase text-blue-400">
                              {u.status}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setMintUid(u.uid);
                                setActiveTab('mint');
                                showToast(`Selected ${u.displayName} for E-Cash minting`, 'info');
                              }}
                              className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                            >
                              + Mint
                            </button>
                            <button
                              onClick={() => setSelectedUserForEdit(u)}
                              className="px-3 py-1 rounded-xl bg-[#141823] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition"
                            >
                              Plan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Plan Modal */}
              {selectedUserForEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-3xl bg-[#0E1118] border border-white/10 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-400" />
                        <span>Change Subscription Tier</span>
                      </h3>
                      <button
                        onClick={() => setSelectedUserForEdit(null)}
                        className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-white">{selectedUserForEdit.displayName}</p>
                      <p className="text-slate-500 font-mono">{selectedUserForEdit.email}</p>
                    </div>

                    <div className="space-y-2 pt-2">
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
                          className="w-full text-left px-4 py-3 rounded-2xl bg-[#07080B] border border-white/5 hover:border-blue-500 hover:bg-[#12151D] text-xs font-semibold text-white flex items-center justify-between transition"
                        >
                          <span>{plan.label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 3: CREATE / MINT MONEY (MONOCHROME E-CASH ENGINE)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'mint' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto">
              <div className="lg:col-span-7 rounded-3xl border border-white/5 bg-[#0E1118] p-6 shadow-2xl space-y-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                  <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Coins className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">E-Cash Minting Station</h2>
                    <p className="text-[11px] text-slate-500">Double-entry write to Firestore and Creator Wallet</p>
                  </div>
                </div>

                <form onSubmit={handleMintMoney} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Operation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMintType('CREDIT')}
                        className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                          mintType === 'CREDIT'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-[#07080B] border-white/5 text-slate-400'
                        }`}
                      >
                        + MINT / CREDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => setMintType('DEBIT')}
                        className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                          mintType === 'DEBIT'
                            ? 'bg-white/10 text-white border-white/20 shadow-md'
                            : 'bg-[#07080B] border-white/5 text-slate-400'
                        }`}
                      >
                        - DEBIT / CLAWBACK
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Recipient Creator
                    </label>
                    <select
                      value={mintUid}
                      onChange={(e) => setMintUid(e.target.value)}
                      className="w-full rounded-2xl bg-[#07080B] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {usersList.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email || u.uid}) &mdash; Bal: {u.dpBalance} DP
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Currency
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMintCurrency('DP')}
                          className={`py-2 rounded-xl text-xs font-bold border transition ${
                            mintCurrency === 'DP' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#07080B] border-white/5 text-slate-400'
                          }`}
                        >
                          DP (₹1)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMintCurrency('D_COIN')}
                          className={`py-2 rounded-xl text-xs font-bold border transition ${
                            mintCurrency === 'D_COIN' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#07080B] border-white/5 text-slate-400'
                          }`}
                        >
                          D-Coin
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(Number(e.target.value))}
                        className="w-full rounded-2xl bg-[#07080B] border border-white/5 px-4 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Reason / Memo
                    </label>
                    <input
                      type="text"
                      value={mintReason}
                      onChange={(e) => setMintReason(e.target.value)}
                      className="w-full rounded-2xl bg-[#07080B] border border-white/5 px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isMinting}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                  >
                    {isMinting ? 'Writing to Ledger...' : `Execute ${mintType === 'CREDIT' ? 'Mint' : 'Debit'}`}
                  </button>
                </form>
              </div>

              {/* Wallet Inspector */}
              <div className="lg:col-span-5 rounded-3xl border border-white/5 bg-[#0E1118] p-6 shadow-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Creator Wallet Snapshot
                </h3>

                {targetedMintUser ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-white">{targetedMintUser.displayName}</p>
                      <p className="text-xs text-slate-500 font-mono">{targetedMintUser.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#07080B] p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">DP Balance</p>
                        <p className="text-xl font-black text-white font-mono mt-1">
                          {targetedMintUser.dpBalance} DP
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#07080B] p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">D-Coins</p>
                        <p className="text-xl font-black text-white font-mono mt-1">
                          {targetedMintUser.dCoinsBalance} D
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-8 text-center">Select a user to view wallet details.</p>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 4: COME & GO TRANSACTION HISTORY (FINANCIAL LEDGER)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ledger' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div className="flex items-center justify-between bg-[#0E1118] p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2">
                  {(['ALL', 'CREDIT', 'DEBIT'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setLedgerFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                        ledgerFilter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#07080B] text-slate-400 hover:text-white'
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
                    const link = document.createElement('a');
                    link.setAttribute('href', encodeURI(csvContent));
                    link.setAttribute('download', `digicast_ledger_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('Exported CSV', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07080B] border border-white/5 text-xs text-slate-300 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/5 bg-[#0E1118] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#07080B] text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-4 px-4">Transaction ID</th>
                      <th className="py-4 px-4">Timestamp</th>
                      <th className="py-4 px-4">UID</th>
                      <th className="py-4 px-4">Direction</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredLedger.map((e) => (
                      <tr key={e.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 text-slate-300">{e.id}</td>
                        <td className="py-3.5 px-4 text-slate-500">{new Date(e.timestamp).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-blue-400">{e.uid.slice(0, 10)}...</td>
                        <td className="py-3.5 px-4 font-bold text-white">{e.type}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{e.amount} {e.currency}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-sans">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 5: UPI APPROVALS & PLANS
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pending UPI Payment Proofs
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    {pendingPaymentsCount} PENDING
                  </span>
                </div>

                {paymentsList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    No pending UPI verification requests.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {paymentsList.map((p, idx) => {
                      const pId = p.paymentId || p.id || `pay_${idx}`;
                      const slipUrl = p.proofUrl || p.screenshotUrl;
                      return (
                        <div key={pId} className="py-3.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{p.workspaceId}</p>
                            <p className="text-[11px] text-slate-500 font-mono">UTR: {p.utrNumber || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-white">₹{p.amountINR || 149}</span>
                            {slipUrl && (
                              <button
                                onClick={() => setSelectedPaymentScreenshot(slipUrl)}
                                className="px-2.5 py-1 rounded-xl bg-[#07080B] border border-white/5 text-xs text-blue-400"
                              >
                                View Slip
                              </button>
                            )}
                            {p.status === 'pending_verification' && (
                              <button
                                onClick={() => handleVerifyPayment(pId, 'approve')}
                                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Pricing & Currency Management */}
              <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dynamic Pricing &amp; Currency Engine
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      1 DP = ₹1 INR &bull; 10 D-Coins = 1 DP &bull; 24h Unlock Fee = 50 D-Coins
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    REALTIME ENGINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'intro_29', name: '1st Month VIP', price: 29, dp: 29, dCoins: 290, days: 30, color: '#EC4899' },
                    { id: 'starter', name: '1 Month Standard', price: 149, dp: 149, dCoins: 1490, days: 30, color: '#0284C7' },
                    { id: 'pro', name: '3 Month Quarter', price: 499, dp: 499, dCoins: 4990, days: 90, color: '#10B981' },
                    { id: 'studio', name: '1 Year Annual', price: 999, dp: 999, dCoins: 9990, days: 365, color: '#7C3AED' },
                  ].map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{p.days}d</span>
                      </div>
                      <div className="text-xl font-extrabold text-white">₹{p.price}</div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 text-[10px] font-mono">
                        <span className="text-amber-400">{p.dp} DP</span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-cyan-400">{p.dCoins} D-Coins</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-white">Official UPI Payee VPA:</span>
                    <span className="ml-2 font-mono text-cyan-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                      priydarshankishnawat@axl
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Telegram Verification:</span>
                    <span className="font-mono text-emerald-400">@YT_digicast</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              OTHER TABS (EDITORS, ASSETS, ADS, TASKS, SECURITY)
          ════════════════════════════════════════════════════════════════════ */}
          {['editors', 'assets', 'ads', 'tasks', 'security'].includes(activeTab) && (
            <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 space-y-4 max-w-[1400px] mx-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 capitalize">
                {activeTab} Management
              </h3>
              <p className="text-xs text-slate-500">
                Connected to production enclave with real-time Firebase telemetry.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
