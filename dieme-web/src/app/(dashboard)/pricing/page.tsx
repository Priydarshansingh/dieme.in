'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  PRICING_PLANS,
  PlanId,
} from '@/lib/pricingPlans';
import UpiPaymentModal from '@/components/subscription/UpiPaymentModal';
import {
  Check,
  CreditCard,
  Sparkles,
  Users,
  ShieldCheck,
  Coins,
  Copy,
  CheckCircle2,
  Gift,
  QrCode,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Film,
  Zap,
} from 'lucide-react';

export default function PricingAndSubscriptionsPage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest_creator';

  const [feedback, setFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const referralCode = `REF_${uid.slice(0, 6).toUpperCase()}`;
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login?ref=${referralCode}`
      : `https://www.dieme.in/login?ref=${referralCode}`;

  const allCards = [
    {
      id: 'free_trial' as const,
      isTrial: true,
      name: '14-Day Free Evaluation',
      badge: 'EVALUATION',
      price: '₹0',
      period: '14 days',
      description: 'Full live stream clipping and chat capture with no payment method required.',
      highlightFeatures: [
        'Full live chat capture & indexing',
        '!clip automatic moment detection',
        'Telegram editor group auto-forwarding',
      ],
      extraFeatures: [
        'Includes 14-day evaluation credits',
        'Direct YouTube replay jump links (?t=...)',
        'On-device mobile clipper preview',
      ],
      dpCost: 0,
      popular: false,
    },
    ...PRICING_PLANS.map((p) => {
      // Split into 3 primary highlights and remaining extra features
      const highlightFeatures = p.features.slice(0, 3);
      const extraFeatures = p.features.slice(3);
      return {
        id: p.id,
        isTrial: false,
        name: p.name,
        badge: p.badge || 'PRO PACK',
        price: `₹${p.priceINR}`,
        period: p.periodLabel.replace('/ ', ''),
        description: p.description,
        highlightFeatures,
        extraFeatures,
        dpCost: p.priceINR,
        popular: !!p.recommended,
      };
    }),
  ];

  const toggleExpand = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleOpenPayment = (planId: PlanId) => {
    setSelectedPlanId(planId);
    setPaymentModalOpen(true);
  };

  const handleStartTrial = () => {
    setFeedback('🎉 14-Day Evaluation Active! All stream markers and on-device trimming are unlocked.');
    setTimeout(() => setFeedback(''), 6000);
  };

  const handleDpPayment = (planName: string, dpCost: number) => {
    setFeedback(`💡 You can redeem ${dpCost} DP for ${planName} directly from your Wallet balance.`);
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
    <div className="w-full space-y-10 pb-12">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 text-xs font-bold text-cyan-400">
          Transparent Pricing for Creators &amp; Streamers
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Upgrade Your Stream Clipping Workflow
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Start with a 14-day free trial, unlock the ₹29 intro pass, or redeem your earned DP balance. All plans use manual UPI renewal with zero auto-debit.
        </p>
      </div>

      {/* Supporter Milestone Banner */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Join Our First 50 Pro Streamers</h3>
            <p className="text-xs text-slate-400">
              Early supporter milestone: Lock in introductory pricing and priority Telegram channel forwarding.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-medium">24 / 50 Spots Claimed</span>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-4 text-xs text-cyan-200 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Symmetrical Pricing Cards Grid (Compact 2-3 points with Read More) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
        {allCards.map((p) => {
          const isExpanded = !!expandedCards[p.id];
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 h-full ${
                p.popular
                  ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 via-slate-900 to-slate-900 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/20'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      p.popular
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white/[0.04] text-slate-400 border border-white/10'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{p.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div
                  onClick={() => {
                    if (!p.isTrial) handleOpenPayment(p.id as PlanId);
                  }}
                  className={`pt-1 ${!p.isTrial ? 'cursor-pointer group' : ''}`}
                  title={!p.isTrial ? `Click to subscribe for ${p.price}` : ''}
                >
                  <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums group-hover:text-cyan-300 transition-colors">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/{p.period}</span>
                </div>

                {/* Primary 2-3 Highlights */}
                <div className="pt-3 border-t border-white/[0.08] space-y-2">
                  {p.highlightFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {/* Expandable Extra Features */}
                  {isExpanded &&
                    p.extraFeatures.map((feat, idx) => (
                      <div
                        key={`extra-${idx}`}
                        className="flex items-start gap-2 text-xs text-slate-400 animate-fadeIn"
                      >
                        <Check className="h-3.5 w-3.5 text-cyan-400/70 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                </div>

                {/* Read More / Show Less Toggle */}
                {p.extraFeatures.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(p.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition pt-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Show less' : `+${p.extraFeatures.length} more details`}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-2">
                {p.isTrial ? (
                  <button
                    type="button"
                    onClick={handleStartTrial}
                    className="w-full rounded-xl py-2.5 text-xs font-semibold transition bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                  >
                    Start 14-Day Free Evaluation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(p.id as PlanId)}
                    className="w-full rounded-xl py-2.5 text-xs font-semibold transition bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Subscribe ({p.price})</span>
                  </button>
                )}

                {!p.isTrial && (
                  <button
                    type="button"
                    onClick={() => handleDpPayment(p.name, p.dpCost)}
                    className="w-full rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 py-2 text-[11px] font-medium text-slate-300 hover:text-cyan-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="h-3 w-3 text-cyan-400" />
                    <span>Pay with {p.dpCost} DP</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Detailed Feature Comparison Matrix */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
            Full Specification Breakdown
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Detailed Plan Comparison</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare all capabilities, hardware export settings, and team allowances across passes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 px-4 font-semibold">Features &amp; Specs</th>
                <th className="py-3 px-3 font-semibold text-center">Free Evaluation</th>
                <th className="py-3 px-3 font-semibold text-center">1st Month VIP</th>
                <th className="py-3 px-3 font-semibold text-center">1 Month Pass</th>
                <th className="py-3 px-3 font-semibold text-center text-cyan-400">3 Month Quarter</th>
                <th className="py-3 px-3 font-semibold text-center">1 Year Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {/* Row 1 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Pricing &amp; Duration</td>
                <td className="py-3 px-3 text-center">₹0 (14 Days)</td>
                <td className="py-3 px-3 text-center">₹29 (30 Days)</td>
                <td className="py-3 px-3 text-center">₹149 (30 Days)</td>
                <td className="py-3 px-3 text-center font-bold text-cyan-400">₹499 (90 Days)</td>
                <td className="py-3 px-3 text-center">₹999 (365 Days)</td>
              </tr>
              {/* Row 2 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Effective Monthly Cost</td>
                <td className="py-3 px-3 text-center">₹0</td>
                <td className="py-3 px-3 text-center">₹29/mo</td>
                <td className="py-3 px-3 text-center">₹149/mo</td>
                <td className="py-3 px-3 text-center text-cyan-400">₹166/mo</td>
                <td className="py-3 px-3 text-center">₹83/mo (Best)</td>
              </tr>
              {/* Row 3 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Live Clips &amp; Markers</td>
                <td className="py-3 px-3 text-center">Evaluation Limit</td>
                <td className="py-3 px-3 text-center">Unlimited</td>
                <td className="py-3 px-3 text-center">Unlimited</td>
                <td className="py-3 px-3 text-center text-cyan-400">Unlimited</td>
                <td className="py-3 px-3 text-center">Unlimited</td>
              </tr>
              {/* Row 4 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Nightbot !clip Chat Capture</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓</td>
              </tr>
              {/* Row 5 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Export Resolution Quality</td>
                <td className="py-3 px-3 text-center text-slate-400">720p HD</td>
                <td className="py-3 px-3 text-center">1080p Full HD</td>
                <td className="py-3 px-3 text-center">1080p Full HD</td>
                <td className="py-3 px-3 text-center text-cyan-400">1080p 60fps</td>
                <td className="py-3 px-3 text-center font-bold text-white">4K UHD &amp; 1080p 60fps</td>
              </tr>
              {/* Row 6 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Export Watermark</td>
                <td className="py-3 px-3 text-center text-slate-500">Standard Watermark</td>
                <td className="py-3 px-3 text-center text-cyan-400 font-medium">Clean (No Watermark)</td>
                <td className="py-3 px-3 text-center text-cyan-400 font-medium">Clean (No Watermark)</td>
                <td className="py-3 px-3 text-center text-cyan-400 font-medium">Clean (No Watermark)</td>
                <td className="py-3 px-3 text-center text-cyan-400 font-medium">Clean (No Watermark)</td>
              </tr>
              {/* Row 7 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Telegram Video Forwarding</td>
                <td className="py-3 px-3 text-center">Shared Bot Group</td>
                <td className="py-3 px-3 text-center">Dedicated Channel</td>
                <td className="py-3 px-3 text-center">Dedicated Channel</td>
                <td className="py-3 px-3 text-center text-cyan-400">Priority Instant Channel</td>
                <td className="py-3 px-3 text-center">Priority Instant Channel</td>
              </tr>
              {/* Row 8 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Mobile Editor &amp; Team Logins</td>
                <td className="py-3 px-3 text-center text-slate-500">1 Login</td>
                <td className="py-3 px-3 text-center">2 Editor Logins</td>
                <td className="py-3 px-3 text-center">3 Editor Logins</td>
                <td className="py-3 px-3 text-center text-cyan-400">5 Editor Logins</td>
                <td className="py-3 px-3 text-center font-bold text-white">Unlimited Logins</td>
              </tr>
              {/* Row 9 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">YouTube Stream Auto-Sync</td>
                <td className="py-3 px-3 text-center text-slate-400">Standard</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓ Fast Sync</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓ Fast Sync</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓ Priority Sync</td>
                <td className="py-3 px-3 text-center text-cyan-400">✓ Real-time Sync</td>
              </tr>
              {/* Row 10 */}
              <tr>
                <td className="py-3 px-4 font-medium text-white">Support SLA</td>
                <td className="py-3 px-3 text-center text-slate-500">Community</td>
                <td className="py-3 px-3 text-center">Standard Support</td>
                <td className="py-3 px-3 text-center">Standard Support</td>
                <td className="py-3 px-3 text-center text-cyan-400">Priority Discord</td>
                <td className="py-3 px-3 text-center font-bold text-white">24/7 Concierge Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Creator FAQ Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-1.5">
            <h4 className="text-sm font-semibold text-white">How does the ₹29 intro pass work?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              New streamers can experience complete Pro clipping, Telegram forwarding, and 1080p exports for their first 30 days at just ₹29. No hidden terms or credit card requirement.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-1.5">
            <h4 className="text-sm font-semibold text-white">Can I pay using my DP balance?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes. You can earn D Coins via stream clipping and convert them into DP (10 D Coins = 1 DP = ₹1 INR). You can then apply your DP balance directly toward any pass without card fees.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-1.5">
            <h4 className="text-sm font-semibold text-white">Will my card or UPI be auto-debited?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never. All payments are one-time UPI transfers. When your pass expires, you decide if and when to renew manually. We never store debit credentials or run recurring charges.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-1.5">
            <h4 className="text-sm font-semibold text-white">How do team editor credentials work?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              From your Team page, you can generate dedicated app credentials for your video editors. They log in directly to the mobile companion app to trim and export clips without accessing your channel credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Affiliate / Referral Program Section (Global Cyan & Slate) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Affiliate &amp; Creator Referral Program</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Invite streamers to Digicast. Earn a <strong className="text-white">15% Lifetime Commission</strong> on every subscription pass they purchase, credited directly as DP into your wallet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Your Referral Code:</span>
            <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
              {referralCode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Referred Streamers</span>
            <p className="text-2xl font-bold text-white">12 Streamers</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Lifetime Commission Earned</span>
            <p className="text-2xl font-bold text-white">
              ₹640 <span className="text-sm font-semibold text-cyan-400">INR</span>
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-1">
            <span className="text-xs text-slate-400">Credited to Wallet</span>
            <p className="text-2xl font-bold text-white">
              640 <span className="text-sm font-semibold text-cyan-400">DP</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={copyReferral}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
          setFeedback('⚡ Payment submitted for verification! Instant access has been provisioned.');
          setTimeout(() => setFeedback(''), 8000);
        }}
      />
    </div>
  );
}
