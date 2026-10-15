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
} from 'lucide-react';

export default function GodPanelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'tasks' | 'ads' | 'subscriptions' | 'security'>('overview');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('DigicastGod2026!#');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Live overview metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 142,
    totalEditors: 38,
    totalStreamers: 104,
    activeSubscribers: 24,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR: 3600,
    targetMonthlyRevenueINR: 7500,
    totalDPInCirculation: 3240,
    totalDCoinsInCirculation: 32400,
    pendingTasksForReview: 3,
    active24hAdPasses: 17,
  });

  // Currency manual adjustment form state
  const [adjustUid, setAdjustUid] = useState('');
  const [adjustCurrency, setAdjustCurrency] = useState<'D_COIN' | 'DP'>('DP');
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('Manual bonus credited by SuperAdmin');
  const [adjustFeedback, setAdjustFeedback] = useState('');

  // Sample tasks queue
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

  // Subscription plans
  const [plans, setPlans] = useState([
    { id: 'TRIAL_14', name: '14-Day Free Trial', priceINR: 0, duration: '14 Days', isTrial: true, active: true },
    { id: 'INTRO_29', name: 'Introductory Offer (Month 1)', priceINR: 29, duration: '30 Days', isTrial: false, active: true },
    { id: 'MONTHLY_149', name: 'Standard Monthly Plan', priceINR: 149, duration: '30 Days', isTrial: false, active: true },
    { id: 'QUARTERLY_449', name: 'Quarterly Plan (Save ~10%)', priceINR: 449, duration: '90 Days', isTrial: false, active: true },
    { id: 'ANNUAL_999', name: 'Annual Pro (Save ~45%)', priceINR: 999, duration: '365 Days', isTrial: false, active: true },
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

  const handleApproveTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: 'APPROVED' } : t)));
    setMetrics((prev) => ({
      ...prev,
      pendingTasksForReview: Math.max(0, prev.pendingTasksForReview - 1),
      totalDPInCirculation: prev.totalDPInCirculation + 50,
    }));
  };

  const handleRejectTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: 'REJECTED' } : t)));
    setMetrics((prev) => ({
      ...prev,
      pendingTasksForReview: Math.max(0, prev.pendingTasksForReview - 1),
    }));
  };

  const handleAdjustCoins = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUid) {
      setAdjustFeedback('User ID is required');
      return;
    }
    const delta = adjustType === 'CREDIT' ? adjustAmount : -adjustAmount;
    if (adjustCurrency === 'DP') {
      setMetrics((prev) => ({ ...prev, totalDPInCirculation: Math.max(0, prev.totalDPInCirculation + delta) }));
    } else {
      setMetrics((prev) => ({ ...prev, totalDCoinsInCirculation: Math.max(0, prev.totalDCoinsInCirculation + delta) }));
    }
    setAdjustFeedback(`Successfully recorded ${adjustType} of ${adjustAmount} ${adjustCurrency} for ${adjustUid}.`);
    setTimeout(() => setAdjustFeedback(''), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="font-medium text-slate-300">Loading Secure God Panel...</span>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight text-white">
            God Panel Admin Portal
          </h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Relocated Backend Service &bull; High Security RBAC
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
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
              Sign In to God Panel &rarr;
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <span className="text-xs text-slate-500">
              Zero-Trust Architecture &bull; Monitored IP Session
            </span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED GOD PANEL DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">GOD PANEL</span>
                <span className="rounded bg-red-950/80 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                  ROOT
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Backend Isolated Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Logged in: {adminUser?.name || 'SuperAdmin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'overview', label: 'Overview & Monetization', icon: TrendingUp },
            { id: 'ledger', label: 'Currency & Ledger', icon: Coins },
            { id: 'tasks', label: `Task Reviews (${metrics.pendingTasksForReview})`, icon: CheckCircle2 },
            { id: 'ads', label: 'Ad Telemetry (24h)', icon: Tv },
            { id: 'subscriptions', label: 'Pricing & Plans', icon: Layers },
            { id: 'security', label: 'Security & HMAC', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue & Milestone Banner */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                    Primary Revenue Milestone
                  </span>
                  <h2 className="text-2xl font-black text-white mt-0.5">
                    Target: 50 Paying Subscribers @ ₹150/mo = ₹7,500/mo
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Current run rate: {metrics.activeSubscribers} paying users (~₹{metrics.monthlyProjectedRevenueINR}/mo)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-cyan-400">
                    {Math.round((metrics.activeSubscribers / metrics.targetSubscribers) * 100)}%
                  </span>
                  <p className="text-xs text-slate-400">Milestone Progress</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${(metrics.activeSubscribers / metrics.targetSubscribers) * 100}%` }}
                />
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Total Users</span>
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
                <div className="text-xs text-slate-400">
                  {metrics.totalEditors} Editors &bull; {metrics.totalStreamers} Streamers
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">DP in Circulation</span>
                  <Coins className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">{metrics.totalDPInCirculation.toLocaleString()} DP</div>
                <div className="text-xs text-slate-400">
                  = ₹{metrics.totalDPInCirculation.toLocaleString()} INR (10 D = 1 DP)
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Active 24h Passes</span>
                  <Tv className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400">{metrics.active24hAdPasses}</div>
                <div className="text-xs text-slate-400">Streamers using ad-supported tier</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase">Pending Tasks</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">{metrics.pendingTasksForReview}</div>
                <div className="text-xs text-slate-400">Awaiting SuperAdmin verification</div>
              </div>
            </div>
          </div>
        )}

        {/* LEDGER & CURRENCY TAB */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                <span>Manual Currency Adjustment (Audit Logged)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Grant or debit D-Coins or DP balance to any user. Double-entry ledger will append an immutable transaction.
              </p>

              {adjustFeedback && (
                <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-300">
                  {adjustFeedback}
                </div>
              )}

              <form onSubmit={handleAdjustCoins} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target User ID (UID)</label>
                  <input
                    type="text"
                    placeholder="e.g. usr_creator_44"
                    value={adjustUid}
                    onChange={(e) => setAdjustUid(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Currency</label>
                  <select
                    value={adjustCurrency}
                    onChange={(e) => setAdjustCurrency(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="DP">DP (1 DP = ₹1 INR)</option>
                    <option value="D_COIN">D Coins (10 D = 1 DP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Action & Amount</label>
                  <div className="flex gap-2">
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as any)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white w-24"
                    >
                      <option value="CREDIT">+ Credit</option>
                      <option value="DEBIT">- Debit</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2 px-4 text-xs font-semibold text-white transition shadow"
                  >
                    Apply Ledger Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TASKS QUEUE TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Community Task Verification Queue</span>
            </h3>
            <p className="text-xs text-slate-400">
              Users complete tasks to earn app balance for subscriptions or watermark removal without paying cash.
            </p>

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
                    <p className="font-semibold text-slate-400 mb-0.5">Applicant Notes:</p>
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
                          Approve & Credit Balance
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <span>Subscription Plans & Monetization Configuration</span>
            </h3>
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
                  <p className="text-xs text-slate-400">
                    Purchasable via Razorpay INR or equivalent in-app DP balance.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-400" />
              <span>Security Gateway & Cryptographic Integrity</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p>&bull; <strong className="text-white">HMAC Algorithm:</strong> SHA-256 with constant-time equality check.</p>
              <p>&bull; <strong className="text-white">External Withdrawals:</strong> STRICTLY DISABLED in code & ledger rules.</p>
              <p>&bull; <strong className="text-white">Ad Verification:</strong> Nonced cryptographically signed sessions (15-min TTL).</p>
              <p>&bull; <strong className="text-white">Decoupled Hosting:</strong> Backend API & God Panel deployable on dedicated Vercel Account B.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
