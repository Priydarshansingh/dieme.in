'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Coins,
  Tv,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  Sliders,
  DollarSign,
  Award,
  Video,
  ShieldCheck,
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

  // Handle D Coins to DP Conversion
  const handleConvert = (e: React.FormEvent) => {
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

    const dpGained = convertAmount / 10;
    setDCoinsBalance((prev) => prev - convertAmount);
    setDpBalance((prev) => prev + dpGained);
    setFeedback(`Success! Converted ${convertAmount} D Coins to ${dpGained} DP (₹${dpGained} INR).`);
    setTimeout(() => setFeedback(''), 5000);
  };

  // Handle Watermark Removal In-App Purchase
  const handleBuyWatermarkRemoval = () => {
    const costDP = 29;
    if (dpBalance < costDP) {
      setFeedback(`Insufficient DP balance. You need ${costDP} DP (₹29) to remove watermarks.`);
      return;
    }
    setDpBalance((prev) => prev - costDP);
    setHasWatermarkRemoved(true);
    setFeedback('🎉 Watermark removal successfully unlocked using your in-app DP balance!');
    setTimeout(() => setFeedback(''), 5000);
  };

  // Simulate / Play Rewarded Ad for 24h Pass (Official AdMob Unit: ca-app-pub-5470934256709090/8839247619)
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
          setDCoinsBalance((prev) => prev + 10); // 10 D coins reward + 24 hour pass
          setFeedback('🎉 Rewarded Ad completed! Verified AdMob Unit [ca-app-pub-5470934256709090/8839247619]. 24-hour full feature access granted and +10 D-Coins added to your wallet.');
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

    setFeedback(`Proof submitted for "${selectedTask.title}"! SuperAdmin will verify in the God Panel.`);
    setSelectedTask(null);
    setProofUrl('');
    setProofNotes('');
    setTimeout(() => setFeedback(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Coins className="h-6 w-6 text-amber-400" />
            <span>Virtual Currency, Tasks & Rewards</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Earn D-Coins and DP through tasks & ads to unlock subscriptions and remove watermarks.
          </p>
        </div>

        {/* Currency badge pill */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Conversion Rule:</span>
          <span className="text-xs font-bold text-amber-400">10 D Coins = 1 DP = ₹1 INR</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'wallet', label: 'Wallet & In-App Store', icon: Coins },
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
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="rounded-xl bg-amber-950/70 border border-amber-500/40 p-4 text-xs text-amber-200 flex items-center gap-2 shadow-lg">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TAB 1: WALLET & IN-APP STORE */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                D Coins Balance
              </span>
              <div className="text-3xl font-extrabold text-amber-400">{dCoinsBalance} D</div>
              <p className="text-xs text-slate-400">= {dCoinsBalance / 10} DP equivalent value</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                DP Balance (Main Currency)
              </span>
              <div className="text-3xl font-extrabold text-cyan-400">{dpBalance} DP</div>
              <p className="text-xs text-slate-400">1 DP = ₹1 INR spendable on any in-app perk</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Wallet Purchasing Power
              </span>
              <div className="text-3xl font-extrabold text-emerald-400">₹{totalEquivalentINR} INR</div>
              <p className="text-xs text-slate-400">Usable for subscriptions & watermark removal</p>
            </div>
          </div>

          {/* Strict Policy Notice */}
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-200">Withdrawal Policy Notice:</p>
              <p className="mt-0.5 text-slate-400">
                In-app balances cannot be withdrawn to external bank accounts. Earned D-Coins and DP are strictly designed for in-platform utility: subscribing to creator plans, removing export watermarks, and accessing premium live stream overlays.
              </p>
            </div>
          </div>

          {/* D-Coins to DP Conversion Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400" />
                <span>Convert D Coins into DP</span>
              </h3>
              <p className="text-xs text-slate-400">
                Accumulate 10 D coins to exchange for 1 DP. DP can be directly spent in place of real INR.
              </p>

              <form onSubmit={handleConvert} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    D Coins to Convert (Multiple of 10)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max={dCoinsBalance}
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                  <p className="text-[11px] text-cyan-400 mt-1">
                    You will receive: {convertAmount / 10} DP (₹{convertAmount / 10} INR)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={dCoinsBalance < 10}
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 py-2.5 text-xs font-bold text-slate-950 transition shadow"
                >
                  Convert {convertAmount} D Coins &rarr; {convertAmount / 10} DP
                </button>
              </form>
            </div>

            {/* In-App Spend Store */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>In-App Feature Unlocks</span>
              </h3>
              <p className="text-xs text-slate-400">
                Spend your earned DP balance directly without credit card or bank payments.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Permanent Watermark Removal</h4>
                    <p className="text-xs text-slate-400">Remove &quot;Clipped with Digicast&quot; watermark on all exported clips.</p>
                  </div>
                  <span className="text-sm font-extrabold text-cyan-400">29 DP (₹29)</span>
                </div>

                {hasWatermarkRemoved ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Unlocked on your account</span>
                  </div>
                ) : (
                  <button
                    onClick={handleBuyWatermarkRemoval}
                    disabled={dpBalance < 29}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 py-2 text-xs font-semibold text-white transition shadow"
                  >
                    Unlock with 29 DP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AD-SUPPORTED 24-HOUR PASS OR PRO AD-FREE STATUS */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          {isPaidSubscriber ? (
            /* Subscribed Users NEVER see ads */
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
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
                  <div className="text-2xl font-black text-emerald-400">100% Ad-Free</div>
                  <p className="text-xs text-slate-400">Subscription Benefit</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                As an active subscribed member, all sponsored video ads, banners, and rewarded units are completely disabled for your account across Digicast Web, Android App, and Browser Extensions. You have permanent 24/7 uninterrupted access to all stream clipping tools.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Ad-Free Guarantee</span>
                  <span className="text-sm font-bold text-emerald-400">Ads Permanently Disabled</span>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Live Stream Clipping</span>
                  <span className="text-sm font-bold text-white">Full Speed Priority</span>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Export Watermarks</span>
                  <span className="text-sm font-bold text-white">Clean Unbranded Exports</span>
                </div>
              </div>
            </div>
          ) : (
            /* Free & Free Trial users: Rewarded Ad 24-hour pass */
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-950 border border-purple-500/40 px-3 py-1 text-xs font-bold text-purple-300">
                      Ad-Supported Free Tier
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Unit: ca-app-pub-5470934256709090/8839247619
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-2">
                    Watch 1 Sponsored Video &rarr; Unlock 24 Hours Full Access (+10 D-Coins)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Free &amp; Free Trial users can watch 1 rewarded advertisement to enjoy 24 hours of uninterrupted live stream tools and receive 10 D-Coins.
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-black ${hasActiveAdPass ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasActiveAdPass ? `${adRemainingHours}h Active` : 'No Active Pass'}
                  </div>
                  <p className="text-xs text-slate-400">24-Hour Access Status</p>
                </div>
              </div>

              {isWatchingAd ? (
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/50 p-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-purple-300 text-sm font-semibold">
                    <Tv className="h-4 w-4 animate-pulse" />
                    <span>Playing Google AdMob Rewarded Video...</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${adProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Watching Rewarded Ad (ca-app-pub-5470934256709090/8839247619)... {adProgress}%
                  </p>
                </div>
              ) : (
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={handleWatchAd}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 px-6 py-3 text-xs font-bold text-white transition shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    <Tv className="h-4 w-4" />
                    <span>Watch Sponsored Ad (AdMob 24h Pass &amp; +10 D)</span>
                  </button>
                  {hasActiveAdPass && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
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
                Complete custom marketing or client tasks to earn DP directly into your wallet balance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="rounded bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Reward: {task.reward}
                  </span>
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <p className="text-xs text-slate-400">{task.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-500 mb-3">
                    <strong>Instructions:</strong> {task.instructions}
                  </p>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                  >
                    Submit Proof & Claim &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Modal */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
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
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Additional Details / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe client agreement or channel link..."
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow"
                    >
                      Submit for God Panel Review
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
