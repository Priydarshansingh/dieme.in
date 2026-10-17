'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import {
  LayoutDashboard,
  Radio,
  Scissors,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Wallet,
  ShoppingBag,
  Bot,
  Trophy,
  CreditCard,
} from 'lucide-react';

const navSections = [
  {
    title: 'STUDIO',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/streams',   label: 'Streams',   icon: Radio },
      { href: '/clips',     label: 'Clips',     icon: Scissors },
      { href: '/team',      label: 'Team',      icon: Users },
    ],
  },
  {
    title: 'MARKET & REWARDS',
    items: [
      { href: '/wallet',      label: 'Wallet & Rewards', icon: Wallet },
      { href: '/assets',      label: 'Marketplace',      icon: ShoppingBag },
      { href: '/matchmaker',  label: 'AI Matchmaker',    icon: Bot },
      { href: '/leaderboard', label: 'Leaderboard',      icon: Trophy },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { href: '/pricing',  label: 'Upgrade Passes', icon: CreditCard },
      { href: '/settings', label: 'Settings',       icon: Settings },
    ],
  },
];

const mobileBottomNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/streams',   label: 'Streams',   icon: Radio },
  { href: '/clips',     label: 'Clips',     icon: Scissors },
  { href: '/wallet',    label: 'Wallet',    icon: Wallet },
  { href: '/pricing',   label: 'Passes',    icon: CreditCard },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#070910] text-slate-100 relative selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient subtle glow for depth */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[320px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[320px] bg-indigo-500/5 blur-[140px] pointer-events-none rounded-full" />

      {/* ── MOBILE TOP NAVBAR (lg:hidden) ─────────────────────────────── */}
      <header className="lg:hidden sticky top-0 inset-x-0 z-40 bg-[#070910]/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center">
          <DigicastBrandLogo size="sm" />
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE WORKSPACE
          </span>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white transition active:scale-95"
            aria-label="Toggle Navigation Menu"
          >
            {drawerOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── DESKTOP SIDEBAR (hidden on mobile, lg:flex) ───────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full bg-[#090C13]/90 backdrop-blur-2xl border-r border-white/[0.08] relative z-20">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/[0.08]">
          <DigicastBrandLogo size="md" />
        </div>

        {/* Categorized Desktop Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {section.title}
              </p>
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                      active
                        ? 'bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-cyan-500/25'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent',
                    ].join(' ')}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        {user && (
          <div className="border-t border-white/[0.08] px-4 py-4 space-y-3 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full ring-1 ring-white/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-white">
                  {user.displayName?.[0] ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── MOBILE COLLAPSIBLE DRAWER (lg:hidden) ─────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#090C13] border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-5">
                <DigicastBrandLogo size="md" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorized Drawer Navigation */}
              <nav className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {section.title}
                    </p>
                    {section.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + '/');
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDrawerOpen(false)}
                          className={[
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                            active
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                              : 'text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent',
                          ].join(' ')}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="mt-6 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Creator Mobile Mode</span>
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Monitor live chat triggers, drop markers, and review editor cuts on the go.
                </p>
              </div>
            </div>

            {/* User Drawer Footer */}
            {user && (
              <div className="border-t border-white/[0.08] pt-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-8 h-8 rounded-full ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-white">
                      {user.displayName?.[0] ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl border border-red-500/20 transition w-full"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (full-width on mobile, offset on desktop) ────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 relative z-10 w-full min-w-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (lg:hidden) ─────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#090C13]/95 backdrop-blur-2xl border-t border-white/10 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        {mobileBottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative',
                active ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              <Icon className={`w-4 h-4 mb-0.5 transition-transform ${active ? 'scale-110 text-cyan-400' : ''}`} />
              <span className="text-[10px] leading-tight">{label}</span>
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
