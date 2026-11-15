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
  Lock,
  Mail,
  Eye,
  EyeOff,
  Send,
  Scissors,
  CheckCircle2,
  Zap,
  Smartphone,
} from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isSigningIn, authError, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRedirectingToGateway, setIsRedirectingToGateway] = useState(false);

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
    if (user) {
      setLocalError(null);
    }
    if (!loading && user) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        let plan = params.get('plan') || selectedPlanId;
        const redirectParam = params.get('redirect');

        if (!plan && redirectParam) {
          try {
            const decoded = decodeURIComponent(redirectParam);
            const redirectUrlObj = new URL(decoded, window.location.origin);
            plan = redirectUrlObj.searchParams.get('plan');
          } catch {}
        }

        if (plan && plan !== 'free_trial') {
          setIsRedirectingToGateway(true);
          (async () => {
            try {
              const token = await user.getIdToken().catch(() => '');
              const res = await fetch('/api/payments/session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  workspaceId: user.uid,
                  planId: plan,
                  clientEmail: user.email || '',
                }),
              });
              const data = await res.json();
              if (data.gatewayCheckoutUrl) {
                window.location.href = data.gatewayCheckoutUrl;
                return;
              }
            } catch (err) {
              console.error('Failed to auto-trigger payment gateway:', err);
            }
            router.replace('/pricing');
          })();
          return;
        }

        if (redirectParam) {
          router.replace(decodeURIComponent(redirectParam));
          return;
        }
      }
      router.replace('/dashboard');
    }
  }, [user, loading, router, selectedPlanId]);

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }
    try {
      await signInWithEmail(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 relative flex flex-col justify-between overflow-x-hidden">
      {isRedirectingToGateway && (
        <div className="fixed inset-0 z-50 bg-[#06080D]/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-lg font-bold text-white">Connecting to Secure Payment Gateway...</h2>
          <p className="text-xs text-slate-400 max-w-sm">Opening your reserved checkout session with instant UPI observation.</p>
        </div>
      )}

      {/* ── Volumetric Aurora Ambient Beams ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/3 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[140px] opacity-70" />
        <div className="absolute top-[40%] -right-32 w-[520px] h-[520px] bg-cyan-500/10 rounded-full blur-[160px] opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-[480px] h-[480px] bg-emerald-600/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
      </div>

      {/* ── Top Navbar Header ──────────────────────────────────────────────── */}
      <header className="relative z-20 w-full border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md bg-[#06080D]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <DigicastBrandLogo size="md" />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* ── Main Hero & Login Split Stage ───────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12 px-6 md:px-12">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Platform Feature Showcase */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CREATOR STUDIO INGEST PORTAL</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1]">
                Capture every moment your viewers loved live.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Turn YouTube livestream highlights into viral shorts in seconds. Use the web dashboard and mobile app with the same login credentials.
              </p>
            </div>

            {/* Lookback buffer preview card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl space-y-4 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    STREAM INGEST ACTIVE
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span className="text-white font-bold">{timecode}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400">RELAY: 240ms</span>
                </div>
              </div>

              {/* Live Audio Visualizer Bars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>45s Lookback Rolling Buffer</span>
                  <span className="text-emerald-400">Buffer: 100% OK</span>
                </div>
                <div className="h-10 flex items-end gap-1 px-1 bg-[#06080D]/80 rounded-lg p-1.5 border border-white/5">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm transition-all duration-75 ${
                        i > 28
                          ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
                          : 'bg-gradient-to-t from-teal-700/60 to-emerald-500/80'
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
                      Dispatched to Telegram Editor
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
              <div className="space-y-2 mb-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 mb-1">
                  <span>{showEmailLogin ? 'EMAIL & PASSWORD LOGIN' : 'CREATOR STUDIO INGRESS'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {showEmailLogin ? 'Sign In with Email' : 'Sign In to Dieme'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {showEmailLogin
                    ? 'Enter the app email and password for your Dieme Studio account.'
                    : 'Sign in with Google to access your broadcast streams, live Nightbot clips, and creator wallet.'}
                </p>
              </div>

              {/* Auth error notification - only show if NOT currently authenticated */}
              {!user && (localError || authError) && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 leading-relaxed flex items-start gap-2.5">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{localError || authError}</span>
                </div>
              )}

              {/* Plan Banner (if passed) */}
              {selectedPlanId && planInfoMap[selectedPlanId] && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 font-mono">{planInfoMap[selectedPlanId].badge}</span>
                    <span className="font-bold text-white">{planInfoMap[selectedPlanId].price}</span>
                  </div>
                </div>
              )}

              {!showEmailLogin ? (
                /* ── DEFAULT VIEW: Google Sign-In Only ──────────────────────────── */
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={loading || isSigningIn}
                    className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm tracking-tight transition-all duration-200 shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <div className="flex items-center gap-2.5 text-slate-900">
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to Google...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Instant 1-click YouTube creator studio setup</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Zero setup password required for web access</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Synced automatically with Dieme Android companion</span>
                    </div>
                  </div>

                  {/* Downside small login button for users who already created account */}
                  <div className="pt-4 border-t border-white/[0.08] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogin(true);
                        setLocalError(null);
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span>Already created account? Sign in with email and password</span>
                      <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ── EMAIL & PASSWORD VIEW: Revealed only when tapped ────────────── */
                <div>
                  <form onSubmit={handleEmailSignIn} className="space-y-3.5 mb-4">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                        App Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="creator@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#06080D] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#06080D] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || isSigningIn}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-tight transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSigningIn ? 'Signing in...' : 'Sign In with Email'}
                    </button>
                  </form>

                  {/* Switch back to Google */}
                  <div className="pt-3 border-t border-white/[0.08] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogin(false);
                        setLocalError(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>← Back to Sign in with Google</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Local Security & Privacy Callout */}
              <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                  <Link href="/terms" className="hover:text-emerald-300 transition-colors">
                    Terms
                  </Link>
                  <span>•</span>
                  <Link href="/privacy" className="hover:text-emerald-300 transition-colors">
                    Privacy
                  </Link>
                  <span>•</span>
                  <Link href="/contact" className="hover:text-cyan-300 transition-colors">
                    Contact &amp; Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full border-t border-white/5 py-4 px-6 bg-[#06080D]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div>© 2026 Dieme Technologies • Built for YouTube Creators &amp; Editors</div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
