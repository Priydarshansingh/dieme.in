'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import { ArrowLeft, Sparkles, ShieldCheck, Video } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isSigningIn, authError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex bg-[#070910] text-[#F8FAFC] relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Left panel — obsidian brand block */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 bg-[#090C13]/90 border-r border-white/[0.08] backdrop-blur-2xl relative z-10">
        <div>
          <Link href="/" className="inline-block hover:opacity-90 transition mb-12">
            <DigicastBrandLogo size="lg" />
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              CREATOR STUDIO INGEST
            </div>
            <h2 className="text-white text-3xl font-black leading-tight tracking-tight">
              Capture every moment your viewers loved.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Let your community and moderators clip your livestream in real time — then deliver those moments straight to Telegram and your video editor.
            </p>

            <div className="pt-4 space-y-3 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero YouTube quota burn or credential leaks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>45-second smart lookback buffer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>© 2026 Digicast Technologies</span>
          <Link href="/" className="hover:text-cyan-400 flex items-center gap-1 transition">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
        </div>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        <Link
          href="/"
          className="lg:hidden mb-8 flex items-center"
        >
          <DigicastBrandLogo size="md" />
        </Link>

        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl glass-card border border-white/10 shadow-2xl relative">
          <div className="space-y-2 mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign In to Studio
            </h1>
            <p className="text-sm text-slate-400">
              Authenticate via Google to access your workspace.
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 leading-relaxed flex items-center gap-2">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading || isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 text-sm font-bold transition-all shadow-xl shadow-white/5 disabled:opacity-50"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div className="mt-8 pt-6 border-t border-white/[0.08] text-center space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              🔒 Your live chat stays on your device.
              <br />We only store stream metadata and clip markers.
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <Link href="/terms" className="hover:text-slate-300 transition">Terms</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-slate-300 transition">Privacy</Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-slate-300 transition">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
