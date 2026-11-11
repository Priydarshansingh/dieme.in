'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DigicastSidebarLogo } from '@/components/brand/DigicastLogo';
import {
  LayoutDashboard,
  Radio,
  Scissors,
  Users,
  Settings,
  Coins,
  Video,
  Trophy,
  Sparkles,
  Palette,
  CreditCard,
  LogOut,
  Smartphone,
  Download,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/streams',     label: 'Streams',          icon: Radio },
  { href: '/clips',       label: 'Clips',            icon: Scissors },
  { href: '/wallet',      label: 'Coins & Tasks',    icon: Coins },
  { href: '/editors',     label: 'Editors Showcase', icon: Video },
  { href: '/leaderboard', label: 'Leaderboard',      icon: Trophy },
  { href: '/matchmaker',  label: 'AI Matchmaker',    icon: Sparkles },
  { href: '/assets',      label: 'Stream Assets',    icon: Palette },
  { href: '/pricing',     label: 'Subscriptions',    icon: CreditCard },
  { href: '/team',        label: 'Team',             icon: Users },
  { href: '/settings',    label: 'Settings',         icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full bg-[#090C13]/90 backdrop-blur-2xl border-r border-white/[0.08] relative z-20"
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <DigicastSidebarLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.06)] border border-white/15'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent',
              ].join(' ')}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Download Mobile App Link */}
      <div className="px-3 pb-3">
        <a
          href="https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/digicast-app-latest.apk"
          target="_blank"
          rel="noopener noreferrer"
          download="digicast-app-latest.apk"
          className="group block p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-200 shadow-sm"
          title="Download the latest Dieme Studio Android App (APK)"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Android App</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
              APK
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            Latest build with Ad Pass, Wallet &amp; Stream capture.
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-white bg-white/10 group-hover:bg-cyan-500/20 px-2 py-1 rounded-lg border border-white/10 group-hover:border-cyan-400/30 transition-all">
            <span>Download APK</span>
            <Download className="w-3 h-3 text-cyan-400" />
          </div>
        </a>
      </div>

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
  );
}
