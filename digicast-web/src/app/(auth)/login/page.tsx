'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Video,
  Radio,
  Lock,
  Send,
  Scissors,
  CheckCircle2,
  Activity,
  Zap,
  Globe,
} from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isSigningIn, authError, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Simulated live lookback buffer timecode
  const [timecode, setTimecode] = useState('02:31:18.42');
  const [pulseCount, setPulseCount] = useState(14);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const planInfoMap: Record<string, { name: string; price: string; period: string; badge: string }> = {
    intro_29: {
      name: 'Bronze 3 — VIP Creator Pass',
      price: '₹29',
      period: '30 Days Access',
      badge: 'EXCLUSIVE INTRO OFFER',
    },
    trial_14: {
      name: 'Copper 4 — Starter Evaluation Pass',
      price: 'Free Trial',
      period: '14 Days Access',
      badge: '14-DAY RISK-FREE EVALUATION',
    },
    starter: {
      name: 'Silver 2 — Monthly Pro Streamer Pass',
      price: '₹149',
      period: '30 Days Unlimited',
      badge: 'FULL MONTH UNLIMITED',
    },
    pro: {
      name: 'Gold 1 — Quarterly Studio Pass',
      price: '₹499',
      period: '90 Days Uninterrupted',
      badge: 'MOST POPULAR CREATOR TIER',
    },
    studio: {
      name: 'Diamond — Annual Studio Suite',
      price: '₹999',
      period: '365 Days Full Year',
      badge: 'ENTERPRISE CREATOR NETWORK',
    },
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      if (plan) setSelectedPlanId(plan);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setTimecode(`${h}:${m}:${s}.${ms}`);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 relative flex flex-col justify-between overflow-x-hidden">
      {/* ── Volumetric Aurora Ambient Beams (Emerald & Cyan Vibe) ────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/3 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[140px] opacity-70" />
        <div className="absolute top-[40%] -right-32 w-[520px] h-[520px] bg-cyan-500/10 rounded-full blur-[160px] opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-[480px] h-[480px] bg-emerald-600/10 rounded-full blur-[160px] opacity-50" />
        {/* Subtle dot matrix overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
      </div>

      {/* ── Floating Cyber Telemetry Badges ───────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden select-none">
        <div className="absolute top-28 left-16 text-xs font-mono font-bold text-emerald-400/40 animate-pulse">
          [12+12]
        </div>
        <div className="absolute top-1/2 left-8 text-[11px] font-mono tracking-wider text-slate-500/40 rotate-90 origin-left">
          STREAM_INGEST // RELAY_ACTIVE
        </div>
        <div className="absolute top-36 right-20 text-xs font-mono text-cyan-400/40">
          LATENCY: 240ms
        </div>
        <div className="absolute bottom-24 right-24 text-xs font-mono text-emerald-400/30">
          24
        </div>
        <div className="absolute bottom-16 left-20 text-[10px] font-mono text-slate-600/60">
          4K 60FPS • ZERO_QUOTA_BURN
        </div>
      </div>

      {/* ── 1. Top Navbar Header ─────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <DigicastBrandLogo size="md" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* ── 2. Main Ingress Grid (Balanced 2-Column Hero Portal) ─────────────── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 sm:py-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ── Left Column: Cyber-Editorial Live Stream Relay Showcase ──────── */}
          <div className="lg:col-span-7 space-y-6 lg:pr-4">
            {/* Studio Ingest Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>CREATOR STUDIO INGEST PORTAL</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Capture every moment{' '}
              <br className="hidden sm:inline" />
              your viewers{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                loved live.
              </span>
            </h1>

            {/* Description */}
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Turn YouTube livestream highlights into viral shorts in seconds. 
              Let your moderators trigger 1-tap clip markers — delivered instantly to Telegram and your video editor with zero stream latency.
            </p>

            {/* ── Interactive Live Stream Relay Telemetry HUD Card ─────────────── */}
            <div className="relative rounded-2xl bg-[#090D16]/90 border border-emerald-500/20 backdrop-blur-xl p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden group">
              {/* Top running laser line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_8px_#10B981]" />

              {/* Header of HUD */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-slate-300 font-bold">STREAM INGEST ACTIVE</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {timecode}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">RELAY: 240ms</span>
                </div>
              </div>

              {/* Lookback buffer waveform visual */}
              <div className="py-3.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    45s Lookback Rolling Buffer
                  </span>
                  <span className="text-slate-500">Buffer: 100% OK</span>
                </div>
                {/* Audio/Video timeline buffer bar */}
                <div className="h-6 w-full bg-slate-900/80 rounded-lg p-1 border border-white/5 flex items-center gap-1 overflow-hidden">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all duration-300 ${
                        i > 24
                          ? 'bg-emerald-400 h-full shadow-[0_0_6px_#10B981]'
                          : i > 16
                          ? 'bg-teal-400/80 h-3/4'
                          : i > 8
                          ? 'bg-cyan-500/60 h-1/2'
                          : 'bg-slate-700/50 h-1/3'
                      }`}
                      style={{
                        height: `${Math.max(25, ((i * 7 + pulseCount) % 100))}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live marker dispatch notification preview */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-xs truncate">
                      Clip: &quot;1v4 Clutch &amp; Ace&quot;
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                      <Send className="w-2.5 h-2.5 text-cyan-400" />
                      Dispatched to @digicast_bot
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>SYNCED</span>
                </div>
              </div>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Zero Quota Burn</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                <Video className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">45s Lookback</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-teal-300 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Telegram Sync</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Studio Sign In Glass Card ──────────────────────── */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="w-full max-w-md relative rounded-3xl bg-[#090D16]/90 border border-emerald-500/20 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Top ambient laser border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981]" />

              {/* Card Header */}
              <div className="space-y-2.5 mb-8 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 mb-1">
                  <span>STUDIO ACCESS INGRESS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Sign In to Studio
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Authenticate via Google to access your broadcast streams, clip markers, and Telegram editor relays.
                </p>
              </div>

              {/* Auth error notification */}
              {authError && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{authError}</span>
                </div>
              )}

              {/* Selected Activation Pass Banner */}
              {selectedPlanId && planInfoMap[selectedPlanId] && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left relative overflow-hidden shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      {planInfoMap[selectedPlanId].badge}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {planInfoMap[selectedPlanId].period}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm sm:text-base font-black text-white">{planInfoMap[selectedPlanId].name}</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{planInfoMap[selectedPlanId].price}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Sign in with Google to arm your live lookback buffer and activate this studio pass.
                  </p>
                </div>
              )}

              {/* Google Sign-In Action Button */}
              <button
                onClick={signInWithGoogle}
                disabled={loading || isSigningIn}
                className="w-full group relative flex items-center justify-center gap-3.5 px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 text-sm font-bold transition-all duration-200 shadow-[0_4px_24px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-emerald-500 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="tracking-tight">
                  {isSigningIn ? 'Signing into Workspace...' : 'Continue with Google'}
                </span>
              </button>

              {/* Local Security & Privacy Callout */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed font-mono space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Local Session Security</span>
                  </div>
                  <p className="text-slate-400 pl-5">
                    Your stream chat and markers remain on your device. We never store personal YouTube credentials.
                  </p>
                </div>

                {/* Legal & Help Links */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                  <Link href="/terms" className="hover:text-emerald-300 transition-colors">
                    Terms
                  </Link>
                  <span>•</span>
                  <Link href="/privacy" className="hover:text-emerald-300 transition-colors">
                    Privacy
                  </Link>
                  <span>•</span>
                  <a
                    href="https://t.me/digicast_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <span>Support Bot</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. Bottom Footer Telemetry Bar ───────────────────────────────────── */}
      <footer className="relative z-20 w-full border-t border-white/5 py-4 px-6 bg-[#06080D]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>© 2026 Digicast Technologies</span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-600 hidden sm:inline">Built for YouTube Creators &amp; Editors</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">SYSTEM OPERATIONAL</span>
            <span className="text-slate-600 font-mono">[99.9% UPTIME]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
