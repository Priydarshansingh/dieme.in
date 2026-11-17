'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import {
  ShieldCheck,
  FileText,
  Lock,
  Gift,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'community'>('terms');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<{
    code: string;
    referrerName?: string;
  } | null>(null);
  const [referralValidationMsg, setReferralValidationMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-detect referral code from URL or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || localStorage.getItem('digicast_referral_code') || '';

    if (refParam) {
      const clean = refParam.trim().toUpperCase();
      setReferralCodeInput(clean);
      // Auto-validate
      validateCode(clean);
    }
  }, []);

  const validateCode = async (codeToTest: string) => {
    if (!codeToTest.trim()) return;
    setIsValidatingReferral(true);
    setReferralValidationMsg(null);

    try {
      const res = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToTest.trim(), currentUid: user?.uid }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedReferral({
          code: data.code,
          referrerName: data.referrerName,
        });
        setReferralValidationMsg({
          type: 'success',
          text: `Verified! Referred by ${data.referrerName || 'Creator'} (${data.code}).`,
        });
      } else {
        setAppliedReferral(null);
        setReferralValidationMsg({
          type: 'error',
          text: data.message || 'Invalid referral code.',
        });
      }
    } catch {
      setReferralValidationMsg({
        type: 'error',
        text: 'Could not verify referral code. Check network.',
      });
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleApplyReferral = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(referralCodeInput);
  };

  const handleCompleteOnboarding = async () => {
    if (!hasAgreed) {
      setSubmitError('Please check the box to agree to Dieme\'s policies before proceeding.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await user?.getIdToken().catch(() => '');
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email,
          policyAccepted: true,
          referralCode: appliedReferral?.code || referralCodeInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Clear cached referral code from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('digicast_referral_code');
        localStorage.setItem('dieme_onboarding_completed', 'true');
      }

      // Check for pending redirect
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        router.replace(decodeURIComponent(redirect));
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to accept policies. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Preparing Dieme Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300 relative flex flex-col justify-between overflow-x-hidden">
      {/* Specular Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md bg-[#030712]/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <DigicastBrandLogo size="md" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Account Setup • Step 1 of 1</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6">
          {/* Welcome Intro */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to the Creator Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome to Dieme Studio, {user?.displayName || user?.email?.split('@')[0] || 'Creator'}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Before accessing the studio canvas, livestream clipper, and chat tools, please review our compliance policies and confirm your referral attribution below.
            </p>
          </div>

          {/* Section 1: Referral Attribution */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Creator Referral Attribution</h2>
                <p className="text-xs text-slate-400">Link your account to the creator who invited you</p>
              </div>
            </div>

            {appliedReferral ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Referred by {appliedReferral.referrerName || 'Creator'}
                    </p>
                    <p className="text-[11px] text-emerald-400/80 font-mono">
                      Code: {appliedReferral.code} • 15% Creator Partnership Active
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedReferral(null);
                    setReferralCodeInput('');
                    setReferralValidationMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyReferral} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter referral code (e.g. REF_MDV4XD)"
                    className="flex-1 rounded-xl border border-white/10 bg-[#030712] px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingReferral || !referralCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isValidatingReferral ? 'Checking…' : 'Apply Code'}
                  </button>
                </div>
                {referralValidationMsg && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      referralValidationMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {referralValidationMsg.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{referralValidationMsg.text}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Optional: If a creator invited you, entering their code links your account to their affiliate rewards.
                </p>
              </form>
            )}
          </div>

          {/* Section 2: Policy Viewer */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl overflow-hidden">
            {/* Policy Tabs */}
            <div className="flex border-b border-white/10 bg-[#060A14]">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'terms'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'privacy'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy &amp; Data Rights</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('community')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'community'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Community &amp; Safety</span>
              </button>
            </div>

            {/* Policy Content Viewer */}
            <div className="p-5 sm:p-6 max-h-72 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
              {activeTab === 'terms' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Platform Usage &amp; YouTube Integration Terms</h3>
                  <p>
                    By accessing Dieme Studio, you agree to comply with all applicable copyright and broadcasting laws. Dieme provides livestream indexing, clip trimming, and AI thumbnail generation tools for content creators.
                  </p>
                  <p>
                    <strong>YouTube API Compliance:</strong> Dieme uses YouTube API Services to access public broadcast metadata and live chat messages upon your authorized consent. By connecting your YouTube account, you also agree to the{' '}
                    <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">
                      YouTube Terms of Service <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and the{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">
                      Google Privacy Policy <ExternalLink className="w-2.5 h-2.5" />
                    </a>.
                  </p>
                  <p>
                    <strong>Subscription &amp; Payments:</strong> All pass purchases are settled directly via direct UPI bank transfers with 0% gateway commission. Paid passes provide unlimited studio clipping and ad-free experience.
                  </p>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Data Protection &amp; DPDP 2023 Compliance</h3>
                  <p>
                    Your privacy and data security are strictly safeguarded. Dieme operates under the Digital Personal Data Protection Act, 2023 (DPDP) and GDPR standards.
                  </p>
                  <p>
                    <strong>No Data Selling:</strong> We never sell, rent, or lease your personal data, livestream recordings, or thumbnail assets to third parties or advertising networks. Video processing occurs either locally on-device or via ephemeral private servers.
                  </p>
                  <p>
                    <strong>Data Principal Rights:</strong> You retain complete ownership of your content. You have the right to request full export or erasure of your account data at any time by contacting{' '}
                    <a href="mailto:support@dieme.in" className="text-cyan-400 underline">support@dieme.in</a>. All erasure requests are fulfilled within 72 hours.
                  </p>
                  <p>
                    <strong>Revoking YouTube Access:</strong> You can revoke Dieme's access to your YouTube channel at any time via your{' '}
                    <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">
                      Google Security Settings <ExternalLink className="w-2.5 h-2.5" />
                    </a>.
                  </p>
                </div>
              )}

              {activeTab === 'community' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Creator Conduct &amp; Safety Guidelines</h3>
                  <p>
                    Dieme is built to empower honest gaming creators and video editors. The following behaviors result in immediate account termination:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
                    <li>Using automated scripts to spam YouTube live chats or stream markers.</li>
                    <li>Attempting to redistribute or monetize pirated copyrighted broadcasts.</li>
                    <li>Fabricating false payment proof or manipulating UPI transaction references.</li>
                    <li>Violating community safety standards or promoting hate speech in custom generated thumbnails.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Consent Checkbox & Action Button */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-5 sm:p-6 space-y-5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#030712] text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-300 leading-normal">
                I have read, understood, and agree to Dieme's{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="text-cyan-400 underline font-semibold"
                >
                  Terms of Service
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="text-cyan-400 underline font-semibold"
                >
                  Privacy Policy
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className="text-cyan-400 underline font-semibold"
                >
                  Community Guidelines
                </button>
                . I consent to account provisioning and YouTube integration.
              </span>
            </label>

            {submitError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={!hasAgreed || isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                hasAgreed && !isSubmitting
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-cyan-500/20'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>{isSubmitting ? 'Finalizing Setup…' : 'Accept Policies & Enter Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500">
        Dieme Studio • Built for Streamers &amp; Editors • DPDP 2023 &amp; YouTube API Compliant
      </footer>
    </div>
  );
}
