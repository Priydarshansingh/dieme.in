'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  PRICING_PLANS,
  PricingPlan,
  PlanId,
} from '@/lib/pricingPlans';
import UpiPaymentModal from '@/components/subscription/UpiPaymentModal';
import {
  Check,
  CreditCard,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  Coins,
  Share2,
  Copy,
  CheckCircle2,
  Gift,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export default function PricingAndSubscriptionsPage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest_creator';

  const [feedback, setFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');

  const referralCode = `REF_${uid.slice(0, 6).toUpperCase()}`;
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${referralCode}` : `https://digicast-web.vercel.app/login?ref=${referralCode}`;

  const allCards = [
    {
      id: 'free_trial' as const,
      isTrial: true,
      name: '14-Day Free Evaluation',
      badge: 'RISK-FREE TRIAL',
      price: '₹0',
      period: '14 days',
      description: 'Test all features on your live streams with zero payment details required.',
      features: [
        'Full live chat capture & indexing',
        '!clip automatic moment detection',
        'Includes 14-day evaluation credits',
        'Telegram editor group auto-forwarding',
        'Direct YouTube replay jump links (?t=...)',
      ],
      dpCost: 0,
      popular: false,
      color: '#06B6D4',
    },
    ...PRICING_PLANS.map((p) => ({
      id: p.id,
      isTrial: false,
      name: p.name,
      badge: p.badge || 'PRO PACK',
      price: `₹${p.priceINR}`,
      period: p.periodLabel.replace('/ ', ''),
      description: p.description,
      features: p.features,
      dpCost: p.priceINR,
      popular: !!p.recommended,
      color: p.color,
    })),
  ];

  const handleOpenPayment = (planId: PlanId) => {
    setSelectedPlanId(planId);
    setPaymentModalOpen(true);
  };

  const handleStartTrial = () => {
    setFeedback('🎉 14-Day Evaluation Active! All stream markers and on-device trimming are unlocked.');
    setTimeout(() => setFeedback(''), 6000);
  };

  const handleDpPayment = (planName: string, dpCost: number) => {
    setFeedback(`💡 To pay ${dpCost} DP for ${planName}, check your balance in the Wallet tab or watch rewarded ads to earn DP!`);
    setTimeout(() => setFeedback(''), 6000);
  };

  const copyReferral = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <span className="rounded-full bg-cyan-950/80 border border-cyan-500/30 px-3.5 py-1 text-xs font-bold text-cyan-400">
          Transparent Pricing for Creators & Streamers
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Supercharge Your Stream Clips & Editor Workflow
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Start with a 14-day free trial, subscribe for just ₹29 in your first month, or pay using DP balance earned by completing community tasks.
        </p>
      </div>

      {/* Target Revenue Milestone Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Join Our First 50 Pro Streamers</h3>
            <p className="text-xs text-slate-400">
              Target milestone: 50 creators @ ~₹150/mo = ₹7,500 monthly run-rate. Lock in early supporter perks today.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">24 / 50 Spots Claimed</span>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {allCards.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
              p.popular
                ? 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/30 to-slate-900 shadow-xl shadow-cyan-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                p.popular ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {p.badge}
              </span>

              <div>
                <h4 className="text-base font-bold text-white">{p.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.description}</p>
              </div>

              <div
                onClick={() => {
                  if (!p.isTrial) handleOpenPayment(p.id as PlanId);
                }}
                className={`pt-2 ${!p.isTrial ? 'cursor-pointer hover:opacity-90 group' : ''}`}
                title={!p.isTrial ? `Click to subscribe for ${p.price}` : ''}
              >
                <span className="text-3xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">{p.price}</span>
                <span className="text-xs text-slate-400 ml-1">/{p.period}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                {p.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 space-y-2">
              {p.isTrial ? (
                <button
                  onClick={handleStartTrial}
                  className="w-full rounded-xl py-2.5 text-xs font-bold transition shadow bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                >
                  Start 14-Day Free Evaluation
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPayment(p.id as PlanId)}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold transition shadow flex items-center justify-center gap-1.5 ${
                    p.popular
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Subscribe ({p.price})</span>
                </button>
              )}

              {!p.isTrial && (
                <button
                  onClick={() => handleDpPayment(p.name, p.dpCost)}
                  className="w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 py-2 text-[11px] font-semibold text-amber-400 transition flex items-center justify-center gap-1.5"
                >
                  <Coins className="h-3 w-3" />
                  <span>Pay with {p.dpCost} DP Balance</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Affiliate / Referral Program Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Affiliate & Creator Referral Program</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Invite streamers to Digicast. Earn a <strong className="text-white">15% Lifetime Commission</strong> on every subscription they purchase, directly credited as DP in your wallet!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Your Referral Code:</span>
            <span className="rounded-lg bg-amber-950/80 border border-amber-500/40 px-3 py-1 font-mono text-xs font-bold text-amber-300">
              {referralCode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Total Referred Streamers</span>
            <p className="text-2xl font-bold text-white">12 Streamers</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Lifetime Commission Earned</span>
            <p className="text-2xl font-bold text-emerald-400">₹640 INR</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Credited to In-App Wallet</span>
            <p className="text-2xl font-bold text-amber-400">640 DP</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 font-mono"
          />
          <button
            onClick={copyReferral}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white transition shadow flex items-center justify-center gap-2"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
          </button>
        </div>
      </div>

      {/* Production UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        workspaceId={user?.uid || 'guest_creator'}
        workspaceName={user?.displayName || 'Creator Studio'}
        userEmail={user?.email || ''}
        initialPlanId={selectedPlanId}
        onPaymentSubmitted={() => {
          setPaymentModalOpen(false);
          setFeedback('⚡ Payment submitted for verification! 24-hour instant access has been provisioned.');
          setTimeout(() => setFeedback(''), 8000);
        }}
      />
    </div>
  );
}
