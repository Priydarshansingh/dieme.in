'use client';

import React, { useState, useEffect } from 'react';
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
  Sliders,
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
} from 'lucide-react';

export default function GodPanelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Left-Side Navigation Section
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'users' | 'mint' | 'ledger' | 'subscriptions' | 'editors' | 'assets' | 'ads' | 'tasks' | 'security'
  >('telemetry');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Real-time Overview & Telemetry Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 142,
    totalEditors: 38,
    totalStreamers: 104,
    activeOnlineCount: 28,
    liveStreamsCount: 4,
    totalConcurrentViewers: 2190,
    activeSubscribers: 24,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR: 3600,
    targetMonthlyRevenueINR: 7500,
    totalDPInCirculation: 3240,
    totalDCoinsInCirculation: 32400,
    pendingTasksForReview: 3,
    active24hAdPasses: 17,
  });

  // Users Directory State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'streamer' | 'editor' | 'admin'>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);

  // Ledger & Money History State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [ledgerSummary, setLedgerSummary] = useState({
    totalTransactions: 0,
    totalMoneyInflowINR: 0,
    totalMoneyOutflowINR: 0,
    netPlatformCirculationINR: 0,
  });

  // Money Minting / Creation Form State
  const [mintUid, setMintUid] = useState('');
  const [mintCurrency, setMintCurrency] = useState<'DP' | 'D_COIN'>('DP');
  const [mintAmount, setMintAmount] = useState(100);
  const [mintType, setMintType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [mintReason, setMintReason] = useState('Creator campaign bonus & stream grant');
  const [mintFeedback, setMintFeedback] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Subscription Plans
  const [plans, setPlans] = useState([
    { id: 'TRIAL_14', name: '14-Day Free Trial', priceINR: 0, duration: '14 Days', isTrial: true, activeUsers: 64 },
    { id: 'INTRO_29', name: 'Introductory Offer (Month 1)', priceINR: 29, duration: '30 Days', isTrial: false, activeUsers: 18 },
    { id: 'MONTHLY_149', name: 'Standard Monthly Plan', priceINR: 149, duration: '30 Days', isTrial: false, activeUsers: 24 },
    { id: 'QUARTERLY_449', name: 'Quarterly Plan (Save ~10%)', priceINR: 449, duration: '90 Days', isTrial: false, activeUsers: 12 },
    { id: 'ANNUAL_999', name: 'Annual Pro (Save ~45%)', priceINR: 999, duration: '365 Days', isTrial: false, activeUsers: 8 },
  ]);

  // Tasks queue
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
    try {
      // 1. Fetch Users
      const uRes = await fetch('/api/godpanel/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsersList(uData.users || []);
        if (uData.users?.length && !mintUid) {
          setMintUid(uData.users[0].uid);
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
    } catch (e) {
      console.error('Failed to load initial godpanel data', e);
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
        setLoginError(data.error || 'Authentication failed');
      } else {
        setIsAuthenticated(true);
        setAdminUser(data.admin);
        fetchInitialData();
      }
    } catch {
      setLoginError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/godpanel/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const handleMintMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setMintFeedback(null);
    setIsMinting(true);

    try {
      const res = await fetch('/api/godpanel/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: mintUid,
          currency: mintCurrency,
          amount: mintAmount,
          type: mintType,
          description: mintReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMintFeedback(`✅ Successfully ${mintType === 'CREDIT' ? 'MINTED' : 'DEBITED'} ${mintAmount} ${mintCurrency} for UID: ${mintUid}`);
        fetchInitialData();
      } else {
        setMintFeedback(`⚠️ Error: ${data.error || 'Adjustment failed'}`);
      }
    } catch (err: any) {
      setMintFeedback(`⚠️ Network Error: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

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
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        fetchInitialData();
        setSelectedUserForEdit(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveTask = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'APPROVED' } : t)));
    setMetrics((prev) => ({ ...prev, pendingTasksForReview: Math.max(0, prev.pendingTasksForReview - 1) }));
  };

  const handleRejectTask = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'REJECTED' } : t)));
    setMetrics((prev) => ({ ...prev, pendingTasksForReview: Math.max(0, prev.pendingTasksForReview - 1) }));
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Ledger Entries
  const filteredLedger = ledgerEntries.filter((e) => {
    if (ledgerFilter === 'ALL') return true;
    return e.type === ledgerFilter;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-400">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // LOGIN SCREEN (Clean Blank Inputs)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight text-white">
            God Panel SuperAdmin
          </h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Decoupled Backend Engine &bull; Zero-Trust RBAC
          </p>

          {loginError && (
            <div className="mt-4 rounded-lg bg-red-950/80 border border-red-500/40 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                placeholder="Enter admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition mt-2"
            >
              Authenticate &rarr;
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <span className="text-xs text-slate-500">
              Protected Administrative Surface &bull; Authorized Personnel Only
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED GOD PANEL WITH LEFT-SIDE FULL NAVIGATION ───────────────────
  return (
    <div className="flex h-screen bg-[#07090E] text-slate-100 overflow-hidden font-sans">
      {/* ── 1. LEFT SIDEBAR (Comprehensive Navigation) ───────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col h-full bg-[#0B0E17] border-r border-slate-800/80 z-30 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">GOD PANEL</span>
                <span className="rounded bg-red-950 border border-red-500/40 px-1 py-0.2 text-[9px] font-black text-red-400">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Backend Central Command</p>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Section: Live Operations */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Live Operations
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'telemetry'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
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
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>All Platform Users</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {metrics.totalUsers}
                </span>
              </button>
            </div>
          </div>

          {/* Section: Money & Financial Ledger */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Money &amp; Ledger
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('mint')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'mint'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Create / Mint Money</span>
                </div>
                <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">+MINT</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'ledger'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="h-4 w-4 shrink-0 text-yellow-400" />
                  <span>Come &amp; Go History</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {ledgerEntries.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'subscriptions'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Subscription Plans</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">₹149/mo</span>
              </button>
            </div>
          </div>

          {/* Section: Creator Ecosystem */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                  <Video className="h-4 w-4 shrink-0" />
                  <span>Editors &amp; Portfolios</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
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
                  <Palette className="h-4 w-4 shrink-0" />
                  <span>Stream Assets Hub</span>
                </div>
                <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 font-bold">4 CATS</span>
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
                  <Tv className="h-4 w-4 shrink-0" />
                  <span>Ad Telemetry (24h)</span>
                </div>
                <span className="text-[10px] text-purple-400 font-bold">{metrics.active24hAdPasses}</span>
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
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Task Reviews</span>
                </div>
                {metrics.pendingTasksForReview > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold animate-pulse">
                    {metrics.pendingTasksForReview}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section: Infrastructure */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Infrastructure
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
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>API &amp; Security Gateway</span>
                </div>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'SuperAdmin'}</p>
              <p className="text-[10px] text-slate-400">Root Access</p>
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
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090E]">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#0B0E17]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white capitalize tracking-tight">
              {activeTab === 'telemetry' && 'Real-Time Active Users & Broadcast Telemetry'}
              {activeTab === 'users' && 'Every Platform User & Creator Profiles'}
              {activeTab === 'mint' && 'Create / Mint Currency (Double-Entry Engine)'}
              {activeTab === 'ledger' && 'Come & Go Transaction History (Full Ledger)'}
              {activeTab === 'subscriptions' && 'Subscription Plans & Revenue Milestones'}
              {activeTab === 'editors' && 'Editors Directory & Video Portfolio Approvals'}
              {activeTab === 'assets' && 'Live Stream Asset Catalog (4 Categories)'}
              {activeTab === 'ads' && '24-Hour Ad Pass Telemetry & Reward Verifications'}
              {activeTab === 'tasks' && 'Community Tasks Review & Bounty Distribution'}
              {activeTab === 'security' && 'HMAC Security Gateway & Cryptographic Integrity'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInitialData}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh State</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </header>

        {/* Tab Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ══════════ TAB 1: REAL-TIME TELEMETRY ══════════ */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Primary Revenue Milestone Banner */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
                      Primary Revenue Target
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">
                      50 Paying Subscribers @ ₹150/mo = ₹7,500/mo Run-Rate
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Current: {metrics.activeSubscribers} paying creators (~₹{metrics.monthlyProjectedRevenueINR}/mo run-rate)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-cyan-400">
                      {Math.round((metrics.activeSubscribers / metrics.targetSubscribers) * 100)}%
                    </span>
                    <p className="text-xs text-slate-400">Milestone Progress</p>
                  </div>
                </div>

                <div className="mt-4 w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(metrics.activeSubscribers / metrics.targetSubscribers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Real-time KPI Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase">Active Users Online</span>
                    <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.activeOnlineCount} Creators</div>
                  <div className="text-xs text-emerald-400">Connected in real-time across apps</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase">Live Broadcasts Running</span>
                    <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-red-400">{metrics.liveStreamsCount} Streaming</div>
                  <div className="text-xs text-slate-400">{metrics.totalConcurrentViewers.toLocaleString()} concurrent viewers</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase">Net DP in Circulation</span>
                    <Coins className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{metrics.totalDPInCirculation.toLocaleString()} DP</div>
                  <div className="text-xs text-slate-400">≈ ₹{metrics.totalDPInCirculation.toLocaleString()} INR Internal Value</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase">24h Ad Stream Passes</span>
                    <Tv className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{metrics.active24hAdPasses} Active</div>
                  <div className="text-xs text-slate-400">Ad-supported tier creators</div>
                </div>
              </div>

              {/* Real-time Streaming Radar Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-red-500" />
                    <h3 className="text-sm font-bold text-white">Active YouTube Broadcasts (Monitored by Studio)</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Capture Engine v1.0.0</span>
                </div>

                <div className="divide-y divide-slate-800">
                  {usersList
                    .filter((u) => u.activeStreamTitle)
                    .map((s) => (
                      <div key={s.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            {s.concurrentViewers || 500} Viewers
                          </span>
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            {s.plan.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: EVERY USER DIRECTORY ══════════ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Role:</span>
                  {(['all', 'streamer', 'editor', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold uppercase transition ${
                        userRoleFilter === r
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">User / Creator</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">D-Coins</th>
                        <th className="py-3 px-4">DP (INR Value)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                                {u.displayName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-white flex items-center gap-1.5">
                                  <span>{u.displayName}</span>
                                  {u.isOnline && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Online" />
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-semibold text-cyan-400 uppercase">
                              {u.plan.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                            {u.dCoinsBalance} D
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {u.dpBalance} DP (₹{u.dpBalance})
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : u.status === 'trial'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setMintUid(u.uid);
                                setActiveTab('mint');
                              }}
                              className="px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-[11px] font-bold border border-yellow-500/30 transition"
                            >
                              +Mint
                            </button>

                            <button
                              onClick={() => setSelectedUserForEdit(u)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                            >
                              Edit Plan
                            </button>

                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u.uid, 'suspended')}
                                className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold transition"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u.uid, 'active')}
                                className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Plan Modal */}
              {selectedUserForEdit && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
                    <h3 className="text-base font-bold text-white">
                      Edit Plan for {selectedUserForEdit.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">UID: {selectedUserForEdit.uid}</p>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Choose Subscription Tier:</label>
                      {[
                        { id: 'free_trial', label: '14-Day Free Trial (₹0)' },
                        { id: 'intro_29', label: 'Introductory Offer Month 1 (₹29)' },
                        { id: 'monthly_149', label: 'Standard Monthly (₹149)' },
                        { id: 'quarterly_449', label: 'Quarterly Pro (₹449)' },
                        { id: 'annual_999', label: 'Annual Pro Creator (₹999)' },
                        { id: 'pro', label: 'Lifetime VIP / Custom Pro' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => handleUpdateUserPlan(selectedUserForEdit.uid, tier.id)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-slate-950 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-xs text-white font-medium transition"
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setSelectedUserForEdit(null)}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB 3: CREATE / MINT MONEY ══════════ */}
          {activeTab === 'mint' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <PlusCircle className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Create &amp; Mint Virtual Currency</h2>
                    <p className="text-xs text-slate-400">
                      Direct balance issuance into double-entry ledger. 10 D-Coins = 1 DP = ₹1 INR.
                    </p>
                  </div>
                </div>

                {mintFeedback && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-cyan-300">
                    {mintFeedback}
                  </div>
                )}

                <form onSubmit={handleMintMoney} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target User (UID or Select from Platform)
                    </label>
                    <select
                      value={mintUid}
                      onChange={(e) => setMintUid(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    >
                      {usersList.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email}) — Current: {u.dpBalance} DP / {u.dCoinsBalance} D
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Unit</label>
                      <select
                        value={mintCurrency}
                        onChange={(e) => setMintCurrency(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
                      >
                        <option value="DP">DP — Digicast Points (1 DP = ₹1 INR)</option>
                        <option value="D_COIN">D Coins — Micro Earnings (10 D = 1 DP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Operation</label>
                      <select
                        value={mintType}
                        onChange={(e) => setMintType(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
                      >
                        <option value="CREDIT">+ CREDIT (Mint &amp; Add)</option>
                        <option value="DEBIT">- DEBIT (Deduct)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Amount to {mintType === 'CREDIT' ? 'Mint' : 'Deduct'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(Number(e.target.value))}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Equivalent value: ≈ ₹{mintCurrency === 'DP' ? mintAmount : mintAmount / 10} INR
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Audit Reason &amp; Reference Note (Mandatory)
                    </label>
                    <input
                      type="text"
                      value={mintReason}
                      onChange={(e) => setMintReason(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isMinting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50"
                  >
                    {isMinting ? 'Writing to Ledger...' : `Execute ${mintType} Operation`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══════════ TAB 4: COME & GO TRANSACTION HISTORY (FULL LEDGER) ══════════ */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <p className="text-xs text-slate-400">Total Inflow ("Money Come")</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    +₹{ledgerSummary.totalMoneyInflowINR.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">UPI, Card &amp; Task Credits</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <p className="text-xs text-slate-400">Total Outflow ("Money Go")</p>
                  <p className="text-xl font-bold text-red-400 mt-1">
                    -₹{ledgerSummary.totalMoneyOutflowINR.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">Watermark Removal, Asset Perks</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <p className="text-xs text-slate-400">Net Internal Circulation</p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">
                    ₹{ledgerSummary.netPlatformCirculationINR.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">Active Balance Pool</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <p className="text-xs text-slate-400">Total Ledger Entries</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {ledgerSummary.totalTransactions} Txns
                  </p>
                  <p className="text-[11px] text-slate-500">Immutable Double-Entry Log</p>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Filter Flow:</span>
                {(['ALL', 'CREDIT', 'DEBIT'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLedgerFilter(f)}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
                      ledgerFilter === f
                        ? f === 'CREDIT'
                          ? 'bg-emerald-500 text-black'
                          : f === 'DEBIT'
                          ? 'bg-red-500 text-white'
                          : 'bg-cyan-500 text-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f === 'CREDIT' ? '+ Come (Credits)' : f === 'DEBIT' ? '- Go (Debits)' : 'All Records'}
                  </button>
                ))}
              </div>

              {/* Full Ledger Records Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Target User</th>
                        <th className="py-3 px-4">Flow Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Source Category</th>
                        <th className="py-3 px-4">Description / Audit Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {filteredLedger.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 text-cyan-400 font-bold text-[11px]">{e.id}</td>
                          <td className="py-3 px-4 text-white text-[11px] font-sans font-semibold">{e.uid}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                e.type === 'CREDIT'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {e.type === 'CREDIT' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {e.type === 'CREDIT' ? 'COME (+)' : 'GO (-)'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 font-bold text-sm ${
                              e.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {e.type === 'CREDIT' ? '+' : '-'}
                            {e.amount} {e.currency}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[10px] uppercase font-bold">
                            {e.source}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-sans text-xs">{e.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 5: SUBSCRIPTIONS & PLANS ══════════ */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Commercial Pricing Tiers</h3>
                  <p className="text-xs text-slate-400">All pricing points configured for high creator conversion</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  Target: 50 @ ₹150/mo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-white">{p.name}</h4>
                      <span className="rounded bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                        {p.duration}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      {p.priceINR === 0 ? 'FREE' : `₹${p.priceINR}`}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                      <span>Active Subscribers:</span>
                      <span className="font-bold text-white">{p.activeUsers} creators</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 6: EDITORS & PORTFOLIOS ══════════ */}
          {activeTab === 'editors' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Verified Video Editors Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usersList
                  .filter((u) => u.role === 'editor')
                  .map((ed) => (
                    <div key={ed.uid} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{ed.displayName}</h4>
                          <p className="text-xs text-slate-400">{ed.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                          VERIFIED
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Short Rate</span>
                          <span className="font-bold text-yellow-400">₹350 / short</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Turnaround</span>
                          <span className="font-bold text-cyan-400">12 - 24 Hours</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 7: STREAM ASSETS ══════════ */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Live Stream Assets Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { cat: 'Facecam Overlays', count: 8, format: 'WebM / PNG', tier: 'Free & Ad Pass' },
                  { cat: 'Green Screen FX', count: 12, format: 'Alpha MP4', tier: '15 DP / Ad Pass' },
                  { cat: 'Custom Video Frames', count: 6, format: 'OBS Scene JSON', tier: 'Pro Subscription' },
                  { cat: 'Live Frame Photos', count: 14, format: '4K Hi-Res JPG', tier: 'Free' },
                ].map((a) => (
                  <div key={a.cat} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <h4 className="text-sm font-bold text-white">{a.cat}</h4>
                    <p className="text-xs text-cyan-400 font-bold">{a.count} Assets Live</p>
                    <p className="text-[11px] text-slate-400">Format: {a.format}</p>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                      {a.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 8: AD TELEMETRY (24H) & MONETIZATION HUB ══════════ */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Tv className="h-5 w-5 text-purple-400" />
                    <span>Ad Networks &amp; Monetization Revenue Telemetry</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-network programmatic earnings across Google AdMob, Unity Ads, and Start.io.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Ad Mediation Active
                  </span>
                </div>
              </div>

              {/* Top Financial Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Est. Today&apos;s Ad Revenue</span>
                  <div className="text-2xl font-black text-emerald-400">$28.45</div>
                  <p className="text-xs text-slate-400">&asymp; ₹2,389 INR earned today</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Month Projected Ad Inflow</span>
                  <div className="text-2xl font-black text-cyan-400">$853.50</div>
                  <p className="text-xs text-slate-400">&asymp; ₹71,690 INR run-rate</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Rewarded Views</span>
                  <div className="text-2xl font-black text-purple-400">890 Views</div>
                  <p className="text-xs text-slate-400">Average eCPM: $32.00</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active 24h Passes Running</span>
                  <div className="text-2xl font-black text-amber-400">17 Creators</div>
                  <p className="text-xs text-slate-400">Free/Trial ad-rewarded tier</p>
                </div>
              </div>

              {/* Connected Ad Networks Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Google AdMob */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                        G
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Google AdMob</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">&bull; Active Primary Network</span>
                      </div>
                    </div>
                    <span className="rounded bg-blue-950 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      Tier 1
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">App ID:</span>
                      <span className="font-mono text-[11px] text-white">ca-app-pub-5470934256709090~1068479518</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Rewarded Unit:</span>
                      <span className="font-mono text-[11px] text-purple-300">.../8839247619</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Today&apos;s Revenue:</span>
                      <span className="font-bold text-emerald-400">$14.80 (₹1,243)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Impressions / Fill:</span>
                      <span className="text-slate-200">420 views (99.4%)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Average eCPM:</span>
                      <span className="text-amber-400 font-bold">$35.20</span>
                    </div>
                  </div>
                </div>

                {/* 2. Unity Ads */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs">
                        U
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Unity Ads</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">&bull; Stats API Authenticated</span>
                      </div>
                    </div>
                    <span className="rounded bg-purple-950 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      Mediation Fill
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Org ID:</span>
                      <span className="font-mono text-[11px] text-white">13469985384413</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Stats API Key:</span>
                      <span className="font-mono text-[10px] text-cyan-300 truncate max-w-[140px]" title="88cc4f0e0faa45b9287640a305808a4d49f8c71521b49a9fe99ac6e0d9a4b4da">
                        88cc4f0e0faa...4b4da
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Today&apos;s Revenue:</span>
                      <span className="font-bold text-emerald-400">$9.45 (₹793)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Impressions / Fill:</span>
                      <span className="text-slate-200">290 views (98.1%)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Average eCPM:</span>
                      <span className="text-amber-400 font-bold">$32.50</span>
                    </div>
                  </div>
                </div>

                {/* 3. Start.io */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs">
                        S
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Start.io</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">&bull; app-ads.txt Verified</span>
                      </div>
                    </div>
                    <span className="rounded bg-amber-950 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Resellers
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Publisher ID:</span>
                      <span className="font-mono text-[11px] text-white">149124855</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Authorized Resellers:</span>
                      <span className="text-[11px] text-emerald-300 font-bold">130+ Partners Live</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Today&apos;s Revenue:</span>
                      <span className="font-bold text-emerald-400">$4.20 (₹353)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Impressions / Fill:</span>
                      <span className="text-slate-200">180 views (95.8%)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Average eCPM:</span>
                      <span className="text-amber-400 font-bold">$23.30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-Hour Pass Active Holders Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Recent Rewarded 24-Hour Passes Issued</h4>
                  <span className="text-xs text-slate-400">Auto-audited via HMAC view tokens</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2.5 font-semibold">Creator Account</th>
                        <th className="pb-2.5 font-semibold">Network Served</th>
                        <th className="pb-2.5 font-semibold">Rewarded Unit</th>
                        <th className="pb-2.5 font-semibold">Coins Granted</th>
                        <th className="pb-2.5 font-semibold">Pass Remaining</th>
                        <th className="pb-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {[
                        { user: 'streamer_rohit@gmail.com', network: 'Google AdMob', unit: '...8839247619', coins: '+10 D', remaining: '23.4h', status: 'ACTIVE' },
                        { user: 'clip_master_ananya@yahoo.com', network: 'Unity Ads', unit: 'Rewarded_Android', coins: '+10 D', remaining: '21.1h', status: 'ACTIVE' },
                        { user: 'gameplay_kabir@outlook.com', network: 'Google AdMob', unit: '...8839247619', coins: '+10 D', remaining: '18.8h', status: 'ACTIVE' },
                        { user: 'vlog_editor_priya@gmail.com', network: 'Start.io', unit: '149124855_video', coins: '+10 D', remaining: '14.2h', status: 'ACTIVE' },
                        { user: 'live_trimmer_dev@gmail.com', network: 'Google AdMob', unit: '...8839247619', coins: '+10 D', remaining: '9.6h', status: 'ACTIVE' },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 font-semibold text-white">{item.user}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.network === 'Google AdMob' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' :
                              item.network === 'Unity Ads' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                              'bg-amber-950 text-amber-300 border border-amber-500/30'
                            }`}>
                              {item.network}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-400">{item.unit}</td>
                          <td className="py-2.5 font-bold text-amber-400">{item.coins}</td>
                          <td className="py-2.5 text-cyan-400 font-semibold">{item.remaining}</td>
                          <td className="py-2.5">
                            <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 9: TASKS QUEUE ══════════ */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Community Task Verification Queue</h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{task.title}</h4>
                        <p className="text-xs text-slate-400">Submitted by: <span className="text-cyan-400">{task.userEmail}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          Reward: {task.reward}
                        </span>
                        <span className={`rounded px-2.5 py-1 text-xs font-semibold ${
                          task.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          task.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300">
                      <p className="font-semibold text-slate-400 mb-0.5">Proof Notes:</p>
                      <p className="italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">{task.notes}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <a
                        href={task.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Inspect Submitted Proof URL</span>
                        <ArrowRight className="h-3 w-3" />
                      </a>

                      {task.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectTask(task.id)}
                            className="rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition"
                          >
                            Reject Proof
                          </button>
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition shadow"
                          >
                            Approve &amp; Credit Balance
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 10: API & SECURITY GATEWAY ══════════ */}
          {activeTab === 'security' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-400" />
                <span>Zero-Trust Gateway &amp; Master API Keys</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Admin API Key</span>
                  <code className="text-cyan-400 font-mono text-xs">godpanel_master_secret_key_superadmin_auth_9988</code>
                </div>
                <p>&bull; <strong className="text-white">HMAC Algorithm:</strong> SHA-256 with constant-time equality check (timingSafeEqual).</p>
                <p>&bull; <strong className="text-white">External Withdrawals:</strong> STRICTLY DISABLED in code &amp; ledger rules.</p>
                <p>&bull; <strong className="text-white">Decoupled Hosting:</strong> Backend API &amp; God Panel deployed on independent Vercel account.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
