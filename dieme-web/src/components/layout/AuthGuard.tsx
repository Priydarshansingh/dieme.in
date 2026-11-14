'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') {
        const fullPath = window.location.pathname + window.location.search;
        router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Still checking auth state — show nothing to avoid flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // Not signed in — redirect is in progress, render nothing
  if (!user) return null;

  return <>{children}</>;
}
