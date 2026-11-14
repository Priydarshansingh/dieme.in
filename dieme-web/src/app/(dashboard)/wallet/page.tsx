'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Coins,
  Tv,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Award,
  Video,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function WalletAndTasksPage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest_creator';

  const [activeTab, setActiveTab] = useState<'wallet' | 'ads' | 'tasks'>('wallet');
  const [dCoinsBalance, setDCoinsBalance] = useState(120);
  const [dpBalance, setDpBalance] = useState(45);
  const [convertAmount, setConvertAmount] = useState(20);
  const [hasWatermarkRemoved, setHasWatermarkRemoved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/workspaces/subscription?workspaceId=${user.uid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.subscription) setSubscription(d.subscription);
      })
      .catch(() => {});

    // Fetch real-time wallet ledger balances from dieme-backend
    fetch(`/api/wallet/balance?uid=${encodeURIComponent(user.uid)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.wallet) {
          setDCoinsBalance(d.wallet.dCoins ?? 0);
          setDpBalance(d.wallet.dp ?? 0);
        }
      })
      .catch(() => {});
  }, [user]);

  // Restore 24h Ad Pass if active
  useEffect(() => {
    try {
      const savedPass = localStorage.getItem('digicast_ad_pass_expires');
      if (savedPass) {
        const expiresAt = parseInt(savedPass, 10);
        const now = Date.now();
        if (expiresAt > now) {
          setHasActiveAdPass(true);
          setAdRemainingHours(Math.max(1, Math.round((expiresAt - now) / (3600 * 1000))));
        } else {
          localStorage.removeItem('digicast_ad_pass_expires');
        }
      }
    } catch (_) {}
  }, []);

  const isPaidSubscriber =
    subscription?.plan &&
    subscription.plan !== 'free' &&
    subscription.plan !== 'free_trial' &&
    !subscription.isExpired;

  // Ad Pass State
  const [hasActiveAdPass, setHasActiveAdPass] = useState(false);
  const [adRemainingHours, setAdRemainingHours] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // Tasks State
  const [tasks, setTasks] = useState([
    {
      id: 'task_stream_clipping',
      title: 'Index 5 Highlights during a Live Stream',
      description: 'Capture at least 5 stream moments using the !clip chat command or mobile trimmer.',
      reward: '50 DP (₹50)',
      instructions: 'Submit stream URL or exported clip links.',
      completed: false,
    },
    {
      id: 'task_share_social',
      title: 'Post Live Stream Clipping Showcase on Twitter / YouTube',
      description: 'Post a clip showing Digicast on-device live trimming in action with hashtag #Digicast.',
      reward: '150 D Coins (15 DP / ₹15)',
      instructions: 'Submit public tweet link or YouTube short URL.',
      completed: false,
    },
    {
      id: 'task_refer_streamer',
      title: 'Refer 3 Livestream Editors',
      description: 'Invite 3 video editors to create an editor showcase profile on Digicast.',
      reward: '100 DP (₹100)',
      instructions: 'Submit editor usernames or portfolio links.',
      completed: false,
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  // 10 D Coins = 1 DP = ₹1 INR
  const totalEquivalentINR = dpBalance + dCoinsBalance / 10;

  // Handle D Coins to DP Conversion via dieme-backend Ledger Engine
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (convertAmount < 10) {
      setFeedback('Minimum conversion is 10 D Coins.');
      return;
    }
    if (convertAmount % 10 !== 0) {
      setFeedback('Conversion amount must be a multiple of 10 D Coins.');
      return;
    }
    if (convertAmount > dCoinsBalance) {
      setFeedback('Insufficient D Coins balance.');
      return;
    }

    try {
      const res = await fetch('/api/wallet/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid || 'guest_creator', dCoinsToConvert: convertAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.message || 'Conversion failed. Please try again.');
        return;
      }
      if (data.wallet) {
        setDCoinsBalance(data.wallet.dCoins);
        setDpBalance(data.wallet.dp);
      } else {
        const dpGained = convertAmount / 10;
        setDCoinsBalance((prev) => Math.max(0, prev - convertAmount));
        setDpBalance((prev) => prev + dpGained);
      }
      setFeedback(`Success! Converted ${convertAmount} D Coins to ${data.convertedDP || convertAmount / 10} DP.`);
    } catch {
      setFeedback('Network error during conversion.');
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Handle Watermark Removal In-App Purchase via dieme-backend Ledger Engine
  const handleBuyWatermarkRemoval = async () => {
    const costDP = 29;
    if (dpBalance < costDP) {
      setFeedback(`Insufficient DP balance. You need ${costDP} DP (₹29) to remove watermarks.`);
      return;
    }
    try {
      const res = await fetch('/api/wallet/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'guest_creator',
          itemType: 'WATERMARK_REMOVAL',
          dpAmount: costDP,
          amount: costDP,
          currency: 'DP',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.message || 'Debit failed.');
        return;
      }
      if (data.wallet) {
        setDpBalance(data.wallet.dp);
        setDCoinsBalance(data.wallet.dCoins);
      } else {
        setDpBalance((prev) => Math.max(0, prev - costDP));
      }
      setHasWatermarkRemoved(true);
      setFeedback('🎉 Watermark removal successfully unlocked using your in-app DP balance!');
    } catch {
      setFeedback('Network error during purchase.');
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Simulate / Play Rewarded Ad for 24h Pass
  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdProgress(0);

    const interval = setInterval(() => {
      setAdProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          setIsWatchingAd(false);
          const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
          try {
            localStorage.setItem('digicast_ad_pass_expires', expiresAt.toString());
          } catch (_) {}
          setHasActiveAdPass(true);
          setAdRemainingHours(24);
          setDCoinsBalance((prev) => prev + 10);
          setFeedback('🎉 Rewarded session completed! 24-hour full feature access granted and +10 D Coins added to your wallet.');
          setTimeout(() => setFeedback(''), 6000);
          return 100;
        }
        return old + 20;
      });
    }, 600);
  };

  // Submit Task Proof
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) {
      setFeedback('Please provide a valid proof URL.');
      return;
    }

    setFeedback(`Proof submitted for "${selectedTask.title}". Our team will verify and credit your balance.`);
    setSelectedTask(null);
    setProofUrl('');
    setProofNotes('');
    setTimeout(() => setFeedback(''), 6000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Coins className="h-6 w-6 text-cyan-400" />
            <span>Virtual Currency &amp; Utility Store</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Earn D Coins through companion stream clipping, convert to DP, and unlock platform features.
          </p>
        </div>

        {/* Global Conversion Rule Pill */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-white/10 px-4 py-2 rounded-xl text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Conversion Rule:</span>
          <span className="font-bold text-cyan-400">10 D Coins = 1 DP = ₹1 INR</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'wallet', label: 'Wallet & Utility Store', icon: Coins },
          {
            id: 'ads',
            label: isPaidSubscriber ? 'Pro Ad-Free Status' : 'Ad-Supported Free Tier (24h Pass)',
            icon: isPaidSubscriber ? ShieldCheck : Tv,
          },
          { id: 'tasks', label: 'Task-Based Earning Hub', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-4 text-xs text-cyan-200 flex items-center gap-2.5 shadow-sm">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TAB 1: WALLET & IN-APP STORE */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Top Symmetrical Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: D Coins */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  D Coins Balance
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                  Mobile Reward
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums flex items-baseline gap-1.5">
                  <span>{dCoinsBalance}</span>
                  <span className="text-sm font-bold text-cyan-400">D</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">= {dCoinsBalance / 10} DP equivalent value</p>
              </div>
            </div>

            {/* Card 2: DP Balance */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  DP Balance
                </span>
                <span className="text-[11px] font-medium text-cyan-400/90 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  Main Currency
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums flex items-baseline gap-1.5">
                  <span>{dpBalance}</span>
                  <span className="text-sm font-bold text-cyan-400">DP</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">1 DP = ₹1 INR spendable on in-app perks</p>
              </div>
            </div>

            {/* Card 3: Total Purchasing Power */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Purchasing Power
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                  Combined Value
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums flex items-baseline gap-1.5">
                  <span>₹{totalEquivalentINR}</span>
                  <span className="text-sm font-bold text-cyan-400">INR</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Usable for subscriptions &amp; watermark removal</p>
              </div>
            </div>
          </div>

          {/* Platform Utility Policy Notice (Neutral, Professional Design) */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-xs flex items-start gap-3">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Platform Utility &amp; Currency Policy</p>
              <p className="text-slate-400 leading-relaxed text-[12px]">
                In-app balances (D Coins and DP) are digital utility credits designed exclusively for unlocking platform perks: watermark-free exports, priority cloud rendering, and subscription passes. In accordance with policy, in-app points are non-refundable and cannot be withdrawn as cash to external bank accounts.
              </p>
            </div>
          </div>

          {/* Symmetrical Dual Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card 1: Convert D Coins into DP */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Convert D Coins into DP</h3>
                    <p className="text-xs text-slate-400">Exchange mobile companion coins for spendable platform points.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    D Coins to Convert (Multiples of 10)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="10"
                      max={dCoinsBalance}
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                    <div className="absolute right-3 top-2.5 text-xs font-bold text-cyan-400">
                      = {convertAmount / 10} DP
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-0.5">
                    <span>Available: <strong className="text-white">{dCoinsBalance} D</strong></span>
                    <span>Credit: <strong className="text-cyan-400">₹{convertAmount / 10} INR</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={dCoinsBalance < 10}
                  className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 py-3 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  Convert {convertAmount} D Coins &rarr; {convertAmount / 10} DP
                </button>
              </div>
            </div>

            {/* Card 2: In-App Feature Store */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">In-App Feature Unlocks</h3>
                    <p className="text-xs text-slate-400">Spend DP directly without card payments or bank details.</p>
                  </div>
                </div>

                {/* Feature Item Details Box */}
                <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Permanent Watermark Removal</h4>
                    <span className="text-sm font-extrabold text-cyan-400">29 DP (₹29)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Remove &quot;Clipped with Digicast&quot; branding across all exported clips and videos permanently.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                {hasWatermarkRemoved ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 font-semibold bg-cyan-500/10 py-3 rounded-xl border border-cyan-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Unlocked on your account</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuyWatermarkRemoval}
                    disabled={dpBalance < 29}
                    className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 py-3 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    Unlock with 29 DP (₹29 Balance)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Symmetrical 3-Step Guide: How to Earn and Spend */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              How the Ecosystem Works
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase">Step 1 &bull; Earn D Coins</span>
                <h5 className="text-sm font-semibold text-white">Clip on Mobile Companion</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Capture live moments during streams or complete daily check-ins to build your D Coins balance.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase">Step 2 &bull; Convert to DP</span>
                <h5 className="text-sm font-semibold text-white">10 D Coins = 1 DP</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Convert coins in your wallet anytime. Every 10 D Coins gives 1 DP, equivalent to ₹1 INR utility credit.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase">Step 3 &bull; Redeem Perks</span>
                <h5 className="text-sm font-semibold text-white">Zero Payment Checkout</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Redeem DP directly for watermark-free exports, 24-hour passes, and creator subscription tiers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AD-SUPPORTED 24-HOUR PASS OR PRO AD-FREE STATUS */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          {isPaidSubscriber ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                        PRO AD-FREE ACTIVE
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Plan: {String(subscription?.plan || 'PRO').toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">
                      Zero Advertisements &bull; Premium Member Privilege
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-400">100% Ad-Free</div>
                  <p className="text-xs text-slate-400">Subscription Benefit</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                As an active subscribed member, all sponsored video ads, banners, and rewarded units are completely disabled for your account across Digicast Web, Android App, and Browser Extensions. You have permanent 24/7 uninterrupted access to all stream clipping tools.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-semibold">Ad-Free Guarantee</span>
                  <span className="text-sm font-bold text-cyan-400">Ads Permanently Disabled</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-semibold">Live Stream Clipping</span>
                  <span className="text-sm font-bold text-white">Full Speed Priority</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-semibold">Export Watermarks</span>
                  <span className="text-sm font-bold text-white">Clean Unbranded Exports</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                      Ad-Supported Free Tier
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-2">
                    Watch 1 Sponsored Video &rarr; Unlock 24 Hours Full Access (+10 D Coins)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Free users can watch 1 rewarded session to enjoy 24 hours of uninterrupted live stream tools and receive 10 D Coins.
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-black ${hasActiveAdPass ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {hasActiveAdPass ? `${adRemainingHours}h Active` : 'No Active Pass'}
                  </div>
                  <p className="text-xs text-slate-400">24-Hour Access Status</p>
                </div>
              </div>

              {isWatchingAd ? (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm font-semibold">
                    <Tv className="h-4 w-4 animate-pulse" />
                    <span>Playing Rewarded Video Session...</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${adProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Watching Rewarded Session... {adProgress}%
                  </p>
                </div>
              ) : (
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={handleWatchAd}
                    className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 text-xs font-semibold text-white transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <Tv className="h-4 w-4" />
                    <span>Watch Sponsored Ad (24h Pass &amp; +10 D)</span>
                  </button>
                  {hasActiveAdPass && (
                    <span className="text-xs text-cyan-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      24h Pass is active for another {adRemainingHours} hours
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASK-BASED EARNING */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Earn DP Without Money</h3>
              <p className="text-xs text-slate-400">
                Complete custom marketing or community tasks to earn DP directly into your wallet balance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                    Reward: {task.reward}
                  </span>
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[11px] text-slate-500 mb-3">
                    <strong>Instructions:</strong> {task.instructions}
                  </p>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-full rounded-xl bg-white/[0.04] hover:bg-white/[0.08] py-2 text-xs font-semibold text-slate-200 border border-white/10 transition"
                  >
                    Submit Proof &amp; Claim &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Modal */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">Submit Proof</h3>
                    <p className="text-xs text-cyan-400">{selectedTask.title}</p>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Proof URL (Drive link, Tweet, Screenshot link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Additional Details / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe submission details or links..."
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow transition"
                    >
                      Submit for Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
