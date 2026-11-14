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
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  Zap,
} from 'lucide-react';

export default function SignUpPage() {
  const { user, loading, isSigningIn, authError, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRedirectingToGateway, setIsRedirectingToGateway] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        let plan = params.get('plan');
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
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await signUpWithEmail(email, password, displayName);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to create account.');
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

      {/* ── Main Signup Card Section ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="relative rounded-3xl p-8 sm:p-10 border border-white/10 bg-[#0A0E17]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400" />

            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Studio Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Get Started with Digicast
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register once on web — sign in seamlessly on both web dashboard and the Android clipping app.
              </p>
            </div>

            {/* Success Message Banner */}
            {isSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Account created successfully! Redirecting to studio...</span>
              </div>
            )}

            {/* Error Message Banner */}
            {(localError || authError) && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {localError || authError}
              </div>
            )}

            {/* Email & Password Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                  Creator / Studio Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Shivam Gaming"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06080D]/90 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                  App Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06080D]/90 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                  Password * (Min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#06080D]/90 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06080D]/90 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningIn || isSuccess}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-tight transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSigningIn ? 'Creating Studio Account...' : 'Create Studio Account & Mobile Pass'}
              </button>
            </form>

            {/* Mobile App Callout Note */}
            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use this same email and password to log in to the <strong className="text-white">Digicast Android App</strong> anytime.
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-[#0A0E17] text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Or Continue With
              </span>
            </div>

            {/* Google Sign-In Option */}
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all duration-200"
            >
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
            </button>

            {/* Switch to Sign In */}
            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold underline">
                Sign In to Studio
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full border-t border-white/5 py-4 px-6 bg-[#06080D]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div>© 2026 Digicast Technologies • Studio Platform</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
