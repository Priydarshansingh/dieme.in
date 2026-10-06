'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, Zap, Shield, Sparkles, CheckCircle2,
  ArrowRight, Play, MessageSquare, Flame, Check, HelpCircle,
  ExternalLink, ChevronDown, Award, Globe, Smartphone, Laptop, Tv,
  Activity, Layers, Eye, Cpu, Terminal, Disc, Volume2, ShieldCheck,
  TrendingUp, RefreshCw, BarChart3, Clock, Lock
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricingPlans';

interface FaqItem {
  q: string;
  a: string;
}

interface LandingPageClientProps {
  faqs: FaqItem[];
}

export default function LandingPageClient({ faqs }: LandingPageClientProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'stream' | 'chat' | 'markers'>('stream');
  const [markerCount, setMarkerCount] = useState(14);
  const [isSimulating, setIsSimulating] = useState(false);
  const [recentMarkers, setRecentMarkers] = useState<Array<{ id: string; time: string; label: string; type: string }>>([
    { id: '1', time: '01:42:18', label: '🔥 Triple Kill Clutch in Apex', type: 'clutch' },
    { id: '2', time: '01:15:04', label: '💬 ₹1,000 Super Chat & Song Request', type: 'donation' },
    { id: '3', time: '00:48:30', label: '😂 Funny Mic Bug Reaction', type: 'highlight' },
  ]);

  // Global cursor spotlight tracker for Web3 glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Interactive Live Marker simulator trigger
  const handleDropSimulatedMarker = () => {
    setIsSimulating(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newMarker = {
      id: String(Date.now()),
      time: timeStr,
      label: '⚡ Live Highlight Marker Dropped',
      type: 'instant'
    };
    setRecentMarkers(prev => [newMarker, ...prev.slice(0, 3)]);
    setMarkerCount(prev => prev + 1);
    setTimeout(() => setIsSimulating(false), 600);
  };

  return (
    <div className="relative min-h-screen bg-[#07080C] text-[#F8FAFC] overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300 font-sans">
      {/* ── Web3 Dynamic Interactive Mouse Cursor Spotlight ─────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-60"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.08), rgba(139, 92, 246, 0.03), transparent 80%)`,
        }}
      />

      {/* ── Cyber Matrix Grid Background ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
      </div>

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07080C]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-sm opacity-40 group-hover:opacity-80 transition duration-300" />
              <div className="relative bg-[#0E1118] border border-white/10 rounded-xl p-1.5 flex items-center justify-center">
                <Image
                  src="/logo-mark.png"
                  alt="Digicast Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-wider text-white flex items-center gap-1.5">
                DIGICAST
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-normal">
                  STUDIO
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                Creator Live Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-mono text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Features
            </a>
            <a href="#simulator" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              Live HUD
            </a>
            <a href="#workflow" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Workflow
            </a>
            <a href="#pricing" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Passes
            </a>
            <a href="#faq" className="hover:text-cyan-400 transition flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#07080C] bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1.5 font-black">
                Launch Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Web3 Hero Section with Live Telemetry ────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden border-b border-white/[0.08]">
        {/* Luminous Web3 Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-purple-600/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Top Live Telemetry Chip */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#11141E]/90 border border-white/10 text-xs font-mono text-cyan-300 mb-8 backdrop-blur-xl shadow-xl shadow-cyan-950/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="tracking-wider">TELEMETRY ONLINE</span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 font-sans">0ms Companion Latency</span>
          </div>

          {/* Main Title with Metallic Gradient */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
            Real-Time Livestream Tagging{' '}
            <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 drop-shadow-sm">
              for Next-Gen YouTube Studios.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-normal leading-relaxed mb-10">
            Monitor broadcasts, drop frame-precise highlight markers with a single tap, and sync seamless clip generation with your entire production crew.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07080C] shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] transition font-mono"
            >
              <span>ACCESS STUDIO WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm bg-[#11141E] hover:bg-[#161A26] text-white border border-white/10 transition font-mono"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              INTERACTIVE DEMO HUD
            </a>
          </div>

          {/* Web3 Live Telemetry HUD Mockup */}
          <div id="simulator" className="max-w-5xl mx-auto text-left">
            <div className="rounded-3xl p-1 bg-gradient-to-b from-cyan-500/30 via-white/10 to-white/5 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl">
              <div className="rounded-[22px] bg-[#0A0C13] border border-white/10 overflow-hidden">
                {/* HUD Top Bar */}
                <div className="px-6 py-4 bg-[#0E111A] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-mono text-xs font-black text-rose-400 tracking-wider">LIVE</span>
                    </div>
                    <span className="text-white/20 font-mono">|</span>
                    <span className="font-bold text-sm text-white truncate">Apex Legends Championship Grand Finals</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 text-cyan-300">
                      1080p60 • SYNCED
                    </span>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      24.8K VIEWERS
                    </span>
                  </div>
                </div>

                {/* HUD Main Workspace Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
                  {/* Stream Canvas Simulation */}
                  <div className="lg:col-span-2 p-6 flex flex-col justify-between relative bg-gradient-to-br from-[#0C0F17] to-[#07080C] min-h-[300px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">CANVAS_FEED #01</span>
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        ACTIVE_STREAM_INGEST
                      </span>
                    </div>

                    {/* Interactive Stream HUD Center */}
                    <div className="my-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-xl shadow-cyan-500/20">
                        <Radio className="w-8 h-8 animate-pulse" />
                      </div>
                      <p className="text-sm font-mono text-slate-300">YouTube Stream Buffer Synced</p>
                      <p className="text-xs text-slate-500 mt-1">Tap below to simulate dropping a live marker</p>
                    </div>

                    {/* Timeline & Interactive Marker Action */}
                    <div className="space-y-3">
                      {/* Audio Waveform Simulator */}
                      <div className="flex items-end justify-between h-8 gap-1 px-2 py-1 bg-[#11141E] rounded-lg border border-white/[0.06]">
                        {[40, 65, 30, 80, 95, 45, 70, 85, 60, 90, 100, 75, 40, 60, 85, 95, 50, 70, 90, 100, 65, 80, 45, 90, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-sm transition-all duration-300"
                            style={{ height: `${h}%`, opacity: (i % 2 === 0 ? 0.9 : 0.6) }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <button
                          onClick={handleDropSimulatedMarker}
                          className={`flex-1 py-3 px-4 rounded-xl font-mono text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 ${
                            isSimulating
                              ? 'bg-emerald-400 text-[#07080C] scale-95 shadow-lg shadow-emerald-400/40'
                              : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07080C] hover:shadow-lg hover:shadow-cyan-400/30'
                          }`}
                        >
                          <Scissors className="w-4 h-4" />
                          <span>{isSimulating ? 'MARKER SAVED TO ROOM DB!' : 'DROP 1-TAP LIVE MARKER'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Telemetry & Marker Feed */}
                  <div className="p-6 bg-[#0B0E16] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                          LIVE MARKER QUEUE
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {markerCount} TAGGED
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {recentMarkers.map((m) => (
                          <div
                            key={m.id}
                            className="p-3 rounded-xl bg-[#11141E] border border-white/[0.08] flex items-center justify-between animate-fadeIn"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-white truncate">{m.label}</p>
                              <p className="text-[10px] font-mono text-cyan-400 mt-0.5">{m.time}</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 shrink-0">
                              READY
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.08] mt-6">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                        <span>WORKSPACE_AUTH</span>
                        <span className="text-emerald-400">VERIFIED</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>TEAM_EDITORS</span>
                        <span className="text-cyan-400">3 CONNECTED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Web3 Bento Grid Features ─────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono font-bold text-cyan-400 mb-4">
              <Cpu className="w-3.5 h-3.5" />
              INTELLIGENCE MODULES
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Architected for Speed & High Volume.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Eliminate hours of manual timeline scrubbing. Equip your team with instantaneous stream capture tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Stream Sync */}
            <div className="p-8 rounded-3xl bg-[#10131C] border border-white/[0.08] hover:border-cyan-500/40 transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Stream Auto-Ingest</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Direct integration with YouTube Live. Broadcasts and chat messages synchronize into your studio workspace with zero manual stream key sharing.
              </p>
              <div className="font-mono text-[11px] text-cyan-400/80 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-500/20 inline-block">
                INGEST_PROTOCOL: AUTO_DISCOVER
              </div>
            </div>

            {/* Bento 2: Marker Engine */}
            <div className="p-8 rounded-3xl bg-[#10131C] border border-white/[0.08] hover:border-blue-500/40 transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1-Click Marker Tagging</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Tag highlight ranges instantly with notes. When a hype battle or joke occurs, one tap flags the starting and ending frames for editor handoff.
              </p>
              <div className="font-mono text-[11px] text-blue-400/80 bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-500/20 inline-block">
                TAGGING_SPEED: 0ms_LATENCY
              </div>
            </div>

            {/* Bento 3: Team Collaboration */}
            <div className="p-8 rounded-3xl bg-[#10131C] border border-white/[0.08] hover:border-emerald-500/40 transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Editor Team Workspaces</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Create dedicated login credentials for video editors and production assistants. Share real-time marker lists without sharing Google account passwords.
              </p>
              <div className="font-mono text-[11px] text-emerald-400/80 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/20 inline-block">
                ROLE_RBAC: OWNER_ADMIN_EDITOR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Web3 Duration Passes (Pricing) ─────────────────────────────────── */}
      <section id="pricing" className="py-24 border-b border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-400 mb-4">
              <Award className="w-3.5 h-3.5" />
              DURATION PASS PROTOCOL
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Transparent Access Passes.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              No hidden fees or recurring traps. Activate access passes on-demand via direct UPI with instant 24-hour grace access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const isPopular = plan.recommended || plan.id === 'pro';
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 relative group ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#182136] to-[#10131D] border-2 border-cyan-400/60 shadow-2xl shadow-cyan-950/60 scale-[1.02]'
                      : 'bg-[#10131D] border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-cyan-400 text-[#07080C] text-[10px] font-mono font-black uppercase tracking-wider whitespace-nowrap shadow-lg shadow-cyan-400/30">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mb-5 leading-relaxed">{plan.description}</p>

                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-3xl font-black text-white font-mono">₹{plan.priceINR}</span>
                      <span className="text-xs font-mono text-slate-400">{plan.periodLabel}</span>
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/login"
                    className={`w-full py-3 rounded-xl font-mono font-bold text-xs text-center transition tracking-wider uppercase ${
                      isPopular
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-[#07080C] shadow-lg shadow-cyan-400/20'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10'
                    }`}
                  >
                    Activate Pass
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ Section (Optimized for AI Search & Google Crawling) ────────── */}
      <section id="faq" className="py-24 border-b border-white/[0.08] bg-[#0A0D14]/50 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono font-bold text-slate-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              KNOWLEDGE BASE & FAQ
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Detailed answers structured for stream teams and AI conversational models.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => (
              <details
                key={index}
                className="group p-6 rounded-2xl bg-[#10131D] border border-white/[0.08] open:border-cyan-500/40 transition duration-200 cursor-pointer"
              >
                <summary className="font-bold text-white text-base flex items-center justify-between list-none">
                  <span>{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition duration-200" />
                </summary>
                <p className="text-slate-400 text-sm leading-relaxed mt-4 pt-4 border-t border-white/[0.06]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Web3 Studio CTA Banner ───────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Upgrade Your Broadcast Workflow Today.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
              Launch your studio workspace and give your production team the real-time highlight capture edge.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07080C] shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <span>ENTER STUDIO DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Web3 Footer ──────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/[0.08] bg-[#07080C] text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Digicast"
              width={22}
              height={22}
              className="object-contain"
            />
            <span className="font-bold text-white tracking-wider">DIGICAST</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500 font-sans">© 2026 Digicast Technologies. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-sans">
            <a
              href="https://t.me/digicast_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition flex items-center gap-1.5"
            >
              Telegram Bot (@digicast_bot)
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/login" className="hover:text-white transition">
              Creator Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
