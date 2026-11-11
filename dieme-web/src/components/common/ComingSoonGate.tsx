'use client';

import React, { useState } from 'react';
import { useDeveloperAccess } from '@/hooks/useDeveloperAccess';
import {
  Sparkles,
  Lock,
  KeyRound,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Bell,
  Eye,
  Terminal,
  Zap,
} from 'lucide-react';

interface ComingSoonGateProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: 'MARKETPLACE' | 'AI_MATCHMAKER' | 'LEADERBOARD';
  highlights: { title: string; desc: string; tag?: string }[];
  children: React.ReactNode;
}

export function ComingSoonGate({
  title,
  subtitle,
  icon,
  category,
  highlights,
  children,
}: ComingSoonGateProps) {
  const { hasDeveloperAccess, isChecking, unlockWithDevKey } = useDeveloperAccess();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider">Verifying permissions...</span>
      </div>
    );
  }

  // If user has developer or admin access, display actual page with a developer header bar
  if (hasDeveloperAccess) {
    return (
      <div className="space-y-4">
        {/* Floating Developer Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-slate-900/60 to-cyan-950/60 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider text-cyan-300 uppercase">
                Developer Access Active
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • Unlocked module ({category})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white font-mono">
              Admin Preview
            </span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('digicast_developer_mode');
                  window.location.reload();
                }
              }}
              className="text-[11px] text-slate-400 hover:text-red-400 transition underline underline-offset-2"
              title="Test standard user view"
            >
              Simulate User View
            </button>
          </div>
        </div>

        {/* Live module content */}
        {children}
      </div>
    );
  }

  // Standard Coming Soon view for normal users
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devKeyInput.trim()) return;

    const ok = unlockWithDevKey(devKeyInput.trim());
    if (ok) {
      setUnlockError(null);
      setShowUnlockModal(false);
    } else {
      setUnlockError('Invalid developer passcode. Contact your Workspace Owner for admin access.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Hero Coming Soon Card */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0b3037]/80 via-[#06181c]/90 to-[#030e10] p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold tracking-wide">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>COMING SOON • UNDER ACTIVE DEVELOPMENT</span>
          </div>

          {/* Title & Icon Header */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-600/30 border border-cyan-400/30 text-cyan-300 shadow-inner">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setNotified(true)}
              disabled={notified}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
                notified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
              }`}
            >
              {notified ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Notification Saved! We will notify you at launch.</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Me at Public Launch</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Developer & Admin Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((h, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {h.tag || `Module 0${i + 1}`}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400/60" />
            </div>
            <h3 className="font-bold text-sm text-white">{h.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* Security and Admin info box */}
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span>Access control enabled. Workspace owners can grant Developer Preview rights in <strong>Team & App Access</strong>.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-600">v2.4-preview</span>
      </div>

      {/* Modal: Developer Passcode Unlock */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#06181c] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Developer & Admin Unlock</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Enter developer passcode or master key</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockError(null);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {unlockError && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-300 border border-red-500/20">
                {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Admin Developer Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter passcode..."
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-cyan-400 transition"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Tip: Workspace owners can use their mobile app password or master developer key to unlock.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-black transition shadow-md"
                >
                  Unlock Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

