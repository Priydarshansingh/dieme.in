'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading, isSigningIn, authError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F9' }}>
      {/* Left panel — navy brand block */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-10"
        style={{ backgroundColor: '#1B2237' }}
      >
        {/* Logo — transparent mark + text inverted to white */}
        <div className="flex items-center gap-2">
          <Image src="/logo-mark.png" alt="" width={38} height={38} className="object-contain" priority />
          <Image src="/logo-text.png" alt="Digicast" width={110} height={30} className="object-contain brightness-0 invert" priority />
        </div>

        <div className="space-y-4">
          <p className="text-white/90 text-2xl font-bold leading-snug">
            Capture every moment your viewers loved.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Let your audience clip your livestream in real time — then deliver those moments straight to Telegram.
          </p>
        </div>

        <p className="text-white/25 text-xs">© 2026 Digicast</p>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo — mark + wordmark in original colors */}
        <div className="lg:hidden mb-10 flex items-center gap-2">
          <Image src="/logo-mark.png" alt="" width={36} height={36} className="object-contain" priority />
          <Image src="/logo-text.png" alt="Digicast" width={110} height={30} className="object-contain" priority />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold" style={{ color: '#1B2237' }}>
              Sign in
            </h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Use your Google account to continue.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
              ⚠️ {authError}
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading || isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border bg-white text-sm font-semibold transition-all hover:shadow-md active:scale-98 disabled:opacity-50"
            style={{ borderColor: '#E5E7EB', color: '#1B2237' }}
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isSigningIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
            Your live chat stays on your device.
            <br />We only store stream metadata and clip markers.
          </p>
        </div>
      </div>
    </div>
  );
}
