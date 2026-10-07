'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, Award, Laptop,
  Activity, Check, ExternalLink, ChevronDown,
  Smartphone, ArrowRight, Play, MessageSquare,
  HelpCircle, Cpu, Terminal, Copy, CheckCheck, Flame, ShieldCheck, Youtube
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricingPlans';
import { DigicastSidebarLogo } from '@/components/brand/DigicastLogo';

// --- Premium Reusable Sub-Components ---
const SectionHeader = ({ label, title, subtitle }: { label: string; title: string; subtitle: string }) => (
  <div className="text-center max-w-2xl mx-auto mb-16 px-4">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-[10px] font-mono font-bold text-[#22D3EE] mb-6 uppercase tracking-[0.15em]">
      {label}
    </div>
    <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F8FAFC] tracking-tight mb-4 leading-tight">
      {title}
    </h2>
    <p className="text-[#8B93A7] text-sm sm:text-base leading-relaxed">{subtitle}</p>
  </div>
);

interface FaqItem {
  q: string;
  a: string;
}

interface LandingPageClientProps {
  faqs: FaqItem[];
}

export default function LandingPageClient({ faqs }: LandingPageClientProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [scrollY, setScrollY] = useState(0);

  // Command Center State
  const [activeConsoleTab, setActiveConsoleTab] = useState<'control' | 'chat' | 'health' | 'clips'>('control');
  const [activeRoleView, setActiveRoleView] = useState<'streamer' | 'editor'>('streamer');

  // HUD Simulation State
  const [markerCount, setMarkerCount] = useState(24);
  const [isPressingMarker, setIsPressingMarker] = useState(false);
  const [selectedTag, setSelectedTag] = useState<'CLUTCH' | 'SUPERCHAT' | 'HYPE' | 'TOPIC'>('CLUTCH');
  const [playbackSeconds, setPlaybackSeconds] = useState(9102); // 02:31:42
  const [hasCopiedMarkers, setHasCopiedMarkers] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamLog, setStreamLog] = useState([
    { id: '1', time: '02:31:18', label: '1v4 Clutch & Team Fight Ace', tag: 'CLUTCH', author: 'Streamer (Phone)', score: 98 },
    { id: '2', time: '02:14:02', label: '₹2,000 Superchat from AlexGaming', tag: 'SUPERCHAT', author: 'Editor (Web)', score: 85 },
    { id: '3', time: '01:48:32', label: 'Chat Goes Crazy Over Snipe', tag: 'HYPE', author: 'Streamer (Phone)', score: 94 },
  ]);

  // Track cursor & scroll for ambient light offsets
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => setPlaybackSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtle Cyan Canvas Mesh in Hero Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = 800;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(Math.floor(width / 32), 40);
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.5 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const dxMouse = node.x - mousePos.x;
        const dyMouse = node.y - mousePos.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = distMouse < 180 ? 'rgba(34, 211, 238, 0.6)' : 'rgba(139, 147, 167, 0.15)';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(139, 147, 167, ${(1 - dist / 120) * 0.1})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
        if (distMouse < 160) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - distMouse / 160) * 0.2})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  // Procedural Live Audio Waveform (Electric Cyan & Rose)
  useEffect(() => {
    const canvas = audioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      step += 0.045;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Primary cyan waveform
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x < w; x += 3) {
        const y = h / 2 + Math.sin(x * 0.035 + step) * 12 + Math.cos(x * 0.07 - step * 1.4) * 6 + Math.sin(x * 0.015 + step * 0.9) * 7;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Secondary controlled rose broadcast wave
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x < w; x += 3) {
        const y = h / 2 + Math.cos(x * 0.03 - step * 1.1) * 8 + Math.sin(x * 0.055 + step * 0.7) * 5;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `0${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCaptureMarker = () => {
    setIsPressingMarker(true);
    const tagTitles: Record<string, { label: string; score: number }> = {
      CLUTCH: { label: 'High Stakes 1v3 Clutch Moment', score: 96 },
      SUPERCHAT: { label: 'Superchat Shoutout & Interaction', score: 88 },
      HYPE: { label: 'Viewer Crowd Hype Spike', score: 92 },
      TOPIC: { label: 'Key Strategy & Update Discussion', score: 82 },
    };
    const item = tagTitles[selectedTag] || { label: 'Live Stream Highlight', score: 90 };
    setStreamLog((prev) => [{
      id: String(Date.now()),
      time: formatSeconds(playbackSeconds),
      label: item.label,
      tag: selectedTag,
      author: 'Streamer (1-Tap)',
      score: item.score,
    }, ...prev.slice(0, 3)]);
    setMarkerCount((prev) => prev + 1);
    setTimeout(() => setIsPressingMarker(false), 260);
  };

  const handleCopyTimestamps = () => {
    const text = streamLog.map((item) => `${item.time} - ${item.label} [${item.tag}]`).join('\n');
    navigator.clipboard.writeText(text);
    setHasCopiedMarkers(true);
    setTimeout(() => setHasCopiedMarkers(false), 2400);
  };

  const parallaxOffset = Math.min(scrollY * 0.15, 120);

  return (
    <div className="relative min-h-screen bg-[#070910] text-[#F8FAFC] selection:bg-[#22D3EE]/25 selection:text-[#22D3EE] font-sans antialiased overflow-x-hidden">

      {/* ── Ambient Radial Lighting (Cyan & Rose) ───────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.08), rgba(244, 63, 94, 0.03), transparent 70%)`
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay">
        <div className="w-full h-full" style={{ backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
      </div>

      {/* ── BROADCAST TOP NAV ────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#070910]/85 backdrop-blur-xl border-b border-[#252A38]">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <DigicastSidebarLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-[#8B93A7] uppercase tracking-[0.1em]">
            <Link href="#console" className="hover:text-white transition flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-[#F43F5E]" /> Live HUD</Link>
            <Link href="#intelligence" className="hover:text-white transition flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-[#22D3EE]" /> Intelligence</Link>
            <Link href="#workflow" className="hover:text-white transition flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-300" /> Team Access</Link>
            <Link href="#passes" className="hover:text-white transition flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-[#22C55E]" /> Passes</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-[11px] font-bold text-[#8B93A7] hover:text-white uppercase tracking-wider transition">Sign In</Link>
            <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#070910] text-[11px] font-extrabold uppercase tracking-wider hover:bg-[#38bdf8] transition-all focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 focus:ring-offset-[#070910]">
              <Terminal className="w-3.5 h-3.5" />
              Launch Studio
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN HERO: COMMAND CENTER ───────────────────────────────────── */}
      <main className="relative pt-[120px] pb-24 md:pt-[160px] md:pb-32 overflow-hidden border-b border-[#252A38]">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Trial / Live Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#10131C] border border-[#252A38] text-[11px] font-mono text-[#F43F5E] mb-8 shadow-2xl backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F43F5E]" />
            </span>
            <span className="font-bold tracking-widest text-[#F8FAFC]">14-DAY PRO TRIAL ACTIVE</span>
            <span className="text-[#252A38]">|</span>
            <span className="text-[#8B93A7] font-medium tracking-wide">For All New Creators</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
            Command Your Broadcast. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-sky-300 to-white">
              Automate Every Highlight.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#8B93A7] leading-relaxed mb-12 font-normal">
            Real-time live stream telemetry, YouTube chat intelligence, and instant viral highlight capture. Built for high-stakes creators, managed by production editors.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#22D3EE] text-[#070910] shadow-lg shadow-[#22D3EE]/20 hover:scale-[1.02] active:scale-[0.98] transition">
              <span>ENTER STUDIO WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#console" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#10131C] text-white border border-[#252A38] hover:bg-[#151925] transition">
              <Play className="w-4 h-4 text-[#22D3EE]" />
              TRY DIRECTOR HUD
            </Link>
          </div>

          {/* Scrolling Floating Telemetry (Parallax effect) */}
          <div
            className="hidden lg:grid grid-cols-4 gap-4 max-w-5xl mx-auto mb-16 transition-transform duration-200 ease-out will-change-transform"
            style={{ transform: `translateY(${parallaxOffset}px)` }}
          >
            <div className="p-4 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E]">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">YouTube Live</p>
                <p className="text-sm font-bold text-white leading-tight">Active Stream Sync</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Highlight Engine</p>
                <p className="text-sm font-bold text-white leading-tight">1-Tap Clip Markers</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Stream Health</p>
                <p className="text-sm font-bold text-white leading-tight">60 FPS · 8.2 Mbps</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Team Ingest</p>
                <p className="text-sm font-bold text-white leading-tight">Zero Credential Leaks</p>
              </div>
            </div>
          </div>

          {/* ── Interactive Command Center HUD ────────────────────────────── */}
          <div id="console" className="max-w-5xl mx-auto text-left relative z-20">
            <div className="rounded-2xl p-1 bg-[#10131C] border border-[#252A38] shadow-2xl backdrop-blur-2xl">
              <div className="rounded-xl bg-[#0B0D14] border border-[#252A38]/50 overflow-hidden">

                {/* HUD Header */}
                <div className="px-6 py-4 bg-[#10131C] border-b border-[#252A38] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F43F5E]" /></span>
                      <span className="font-mono text-xs font-black text-[#F43F5E] tracking-widest leading-none">LIVE</span>
                    </div>
                    <div className="h-4 w-px bg-[#252A38]" />
                    <span className="font-bold text-sm text-white truncate">Gaming Marathon — Championship Final</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-lg bg-[#151925] border border-[#252A38] text-slate-300">
                      REC: {formatSeconds(playbackSeconds)}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-bold tracking-wide">
                      98% STABLE
                    </span>
                  </div>
                </div>

                {/* HUD Subtabs */}
                <div className="px-6 py-3 bg-[#0B0D14] border-b border-[#252A38] flex items-center gap-3 overflow-x-auto text-[11px] font-bold uppercase tracking-wider">
                  <button onClick={() => setActiveConsoleTab('control')} className={`px-4 py-2 rounded-lg transition ${activeConsoleTab === 'control' ? 'bg-[#151925] text-white border border-[#252A38]' : 'text-[#8B93A7] hover:text-white'}`}>Live Control</button>
                  <button onClick={() => setActiveConsoleTab('chat')} className={`px-4 py-2 rounded-lg transition ${activeConsoleTab === 'chat' ? 'bg-[#151925] text-white border border-[#252A38]' : 'text-[#8B93A7] hover:text-white'}`}>Chat Intelligence</button>
                  <button onClick={() => setActiveConsoleTab('health')} className={`px-4 py-2 rounded-lg transition ${activeConsoleTab === 'health' ? 'bg-[#151925] text-white border border-[#252A38]' : 'text-[#8B93A7] hover:text-white'}`}>Stream Health</button>
                  <button onClick={() => setActiveConsoleTab('clips')} className={`px-4 py-2 rounded-lg transition ${activeConsoleTab === 'clips' ? 'bg-[#151925] text-white border border-[#252A38]' : 'text-[#8B93A7] hover:text-white'}`}>AI Moments ({markerCount})</button>
                </div>

                {/* HUD Body */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#252A38]">

                  {/* Left Col: Controls/Visuals */}
                  <div className="lg:col-span-2 p-8 flex flex-col justify-between bg-[#0B0D14]">
                    <div className="mb-10">
                      {activeConsoleTab === 'control' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono text-[#8B93A7] tracking-widest uppercase">Broadcast Audio Carrier</span>
                            <span className="text-[10px] font-mono text-[#22D3EE] flex items-center gap-1.5 font-bold tracking-widest">
                              <Activity className="w-3.5 h-3.5 animate-pulse" /> COMPANION CONNECTED
                            </span>
                          </div>
                          <div className="w-full h-20 bg-[#10131C] rounded-xl border border-[#252A38] p-2 flex items-center justify-center overflow-hidden">
                            <canvas ref={audioCanvasRef} width={500} height={64} className="w-full h-full object-cover" />
                          </div>
                        </>
                      )}

                      {activeConsoleTab === 'chat' && (
                        <div className="p-6 rounded-xl bg-[#10131C] border border-[#252A38] space-y-4">
                          <div className="flex items-center justify-between border-b border-[#252A38] pb-4">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Chat Sentiment Monitor</span>
                            <span className="text-xs text-[#22C55E] font-bold bg-[#22C55E]/10 px-2 py-1 rounded border border-[#22C55E]/20">Positive Focus</span>
                          </div>
                          <div className="w-full bg-[#151925] h-3 rounded-full overflow-hidden flex">
                            <div className="bg-[#22C55E] h-full" style={{ width: '68%' }} />
                            <div className="bg-[#8B93A7] h-full" style={{ width: '24%' }} />
                            <div className="bg-[#F43F5E] h-full" style={{ width: '8%' }} />
                          </div>
                          <div className="grid grid-cols-3 text-[11px] font-bold font-mono text-[#8B93A7] pt-1">
                            <span className="text-[#22C55E]">68% POS</span>
                            <span className="text-center">24% NEU</span>
                            <span className="text-right text-[#F43F5E]">8% TOX</span>
                          </div>
                          <div className="pt-4 mt-2 flex items-center justify-between text-xs">
                            <span className="text-[#8B93A7] flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Auto-Moderation</span>
                            <span className="text-white font-mono font-bold tracking-wider">3 SPAM FLAGS BLOCKED</span>
                          </div>
                        </div>
                      )}

                      {activeConsoleTab === 'health' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl bg-[#10131C] border border-[#252A38]">
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono tracking-widest mb-1.5">Connection</span>
                            <span className="text-[#22C55E] font-bold text-lg">Excellent</span>
                          </div>
                          <div className="p-5 rounded-xl bg-[#10131C] border border-[#252A38]">
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono tracking-widest mb-1.5">Bitrate Output</span>
                            <span className="text-[#22D3EE] font-bold text-lg font-mono">8.2 Mbps</span>
                          </div>
                          <div className="p-5 rounded-xl bg-[#10131C] border border-[#252A38]">
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono tracking-widest mb-1.5">Refresh Rate</span>
                            <span className="text-white font-bold text-lg font-mono">60 FPS Fixed</span>
                          </div>
                          <div className="p-5 rounded-xl bg-[#10131C] border border-[#252A38]">
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono tracking-widest mb-1.5">Network Latency</span>
                            <span className="text-white font-bold text-lg font-mono">2.4 sec</span>
                          </div>
                        </div>
                      )}

                      {activeConsoleTab === 'clips' && (
                        <div className="p-6 rounded-xl bg-[#10131C] border border-[#252A38]">
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#252A38]">
                            <span className="text-[10px] font-mono text-[#8B93A7] tracking-widest uppercase flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-[#22D3EE]" /> AI ENGINE PREDICTION
                            </span>
                            <span className="text-[#22D3EE] font-extrabold text-sm tracking-wider font-mono">SCORE: 96/100</span>
                          </div>
                          <p className="text-white font-bold text-lg mb-4 leading-snug">"High Stakes 1v3 Clutch Moment & Chat Explosion"</p>
                          <div className="flex gap-2">
                            <span className="px-2.5 py-1 rounded bg-[#151925] border border-[#252A38] text-[10px] font-bold text-slate-300 uppercase tracking-widest">Auto-Captioned</span>
                            <span className="px-2.5 py-1 rounded bg-[#151925] border border-[#252A38] text-[10px] font-bold text-slate-300 uppercase tracking-widest">9:16 Crop</span>
                            <span className="px-2.5 py-1 rounded bg-[#151925] border border-[#252A38] text-[10px] font-bold text-slate-300 uppercase tracking-widest">Silent Dead-air Removed</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tag Selection & 1-Tap Trigger */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-[0.15em] font-bold">
                          Select Tag Variant:
                        </span>
                        <span className="text-[10px] font-mono text-[#8B93A7] tracking-widest">HOTKEY: [SPACE]</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(['CLUTCH', 'SUPERCHAT', 'HYPE', 'TOPIC'] as const).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`py-2.5 px-3 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all border ${
                              selectedTag === tag
                                ? 'bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/40 shadow-sm'
                                : 'bg-[#10131C] text-[#8B93A7] border-[#252A38] hover:bg-[#151925] hover:text-white'
                            }`}
                          >
                            {tag === 'CLUTCH' && '🎯 CLUTCH'}
                            {tag === 'SUPERCHAT' && '💰 SUPERCHAT'}
                            {tag === 'HYPE' && '⚡ HYPE'}
                            {tag === 'TOPIC' && '🗣️ TOPIC'}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleCaptureMarker}
                        className={`w-full py-4 px-6 rounded-xl font-mono text-sm font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-200 outline-none ${
                          isPressingMarker
                            ? 'bg-[#22C55E] text-[#070910] scale-[0.98]'
                            : 'bg-[#22D3EE] text-[#070910] hover:bg-[#38bdf8] shadow-lg shadow-[#22D3EE]/20 active:scale-[0.98]'
                        }`}
                      >
                        <Scissors className="w-5 h-5" />
                        <span>{isPressingMarker ? 'MARKER COMMITTED TO TIMELINE' : `DROP HIGHLIGHT [${selectedTag}]`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Col: Timeline */}
                  <div className="p-6 bg-[#10131C] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                          LIVE MARKER QUEUE
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 font-bold">
                          {markerCount} LOGGED
                        </span>
                      </div>
                      <div className="space-y-3">
                        {streamLog.map((item) => (
                          <div key={item.id} className="p-3.5 rounded-xl bg-[#0B0D14] border border-[#252A38] flex items-center justify-between group hover:border-[#22D3EE]/30 transition-all">
                            <div className="min-w-0 pr-3">
                              <p className="text-xs font-bold text-white truncate leading-tight mb-1">{item.label}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-[#22D3EE]">{item.time}</span>
                                <span className="text-[9px] text-[#8B93A7] font-mono tracking-wide">• {item.author}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col gap-1">
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#151925] border border-[#252A38] text-slate-300 leading-none">
                                {item.tag}
                              </span>
                              <span className="text-[9px] text-[#22D3EE] font-mono font-bold tracking-wider leading-none mt-1 text-center">
                                {item.score} SCR
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-5 border-t border-[#252A38] mt-6">
                      <button
                        onClick={handleCopyTimestamps}
                        className="w-full py-3 px-4 rounded-xl bg-[#151925] hover:bg-[#1a2035] border border-[#252A38] text-[11px] font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center justify-center gap-2 transition"
                      >
                        {hasCopiedMarkers ? (
                          <><CheckCheck className="w-4 h-4 text-[#22C55E]" /><span className="text-[#22C55E]">COPIED TO CLIPBOARD</span></>
                        ) : (
                          <><Copy className="w-4 h-4 text-[#8B93A7]" /><span>EXPORT TIMESTAMPS (.MD)</span></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── INTELLIGENCE ENGINE ─────────────────────────────────────────── */}
      <section id="intelligence" className="py-28 border-b border-[#252A38] bg-[#070910]">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Intelligence Engine"
            title="Control Room Precision."
            subtitle="Every tool is engineered for dense, real-time broadcast telemetry — no generic template fluff. Know your stream intimately."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="p-8 rounded-2xl bg-[#10131C] border border-[#252A38] flex flex-col justify-between group hover:border-[#22D3EE]/30 transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-6">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Chat Intelligence</h3>
                <p className="text-sm text-[#8B93A7] leading-relaxed mb-8">
                  Continuously calculates viewer sentiment, flags spam, and detects viewer-driven <code className="text-[#22D3EE] font-mono font-bold tracking-widest text-xs px-1">!clip</code> commands on-device without cloud lag.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-[#252A38] text-xs font-mono font-semibold text-slate-300 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Sentiment</span><span className="text-[#22C55E]">68% POSITIVE</span></div>
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Velocity</span><span className="text-white">+180 MSG/MIN</span></div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#10131C] border border-[#252A38] flex flex-col justify-between group hover:border-[#22D3EE]/30 transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E] mb-6">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Clip Studio & Scoring</h3>
                <p className="text-sm text-[#8B93A7] leading-relaxed mb-8">
                  Evaluates highlighting moments on a rigorous 0–100 Viral Potential scale based on chat velocity, viewer retention spikes, and audio intensity.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-[#252A38] text-xs font-mono font-semibold text-slate-300 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Viral Potential</span><span className="text-[#22D3EE]">V-SCORE 98</span></div>
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Auto-Marker</span><span className="text-white truncate max-w-[120px] text-right">1v4 Clutch Win</span></div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#10131C] border border-[#252A38] flex flex-col justify-between group hover:border-[#22D3EE]/30 transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-6">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Broadcast Health Monitor</h3>
                <p className="text-sm text-[#8B93A7] leading-relaxed mb-8">
                  Track bitrate drops, encoder health, FPS stability, and broadcast latency from the dashboard so you know exactly when your YouTube stream is healthy.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-[#252A38] text-xs font-mono font-semibold text-slate-300 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Throughput</span><span className="text-white">8.2 MBPS · 60F</span></div>
                <div className="flex justify-between items-center"><span className="text-[#8B93A7] tracking-widest uppercase text-[10px]">Dropped Frames</span><span className="text-[#22C55E]">0.02% (STABLE)</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SYMMETRICAL WORKFLOW ────────────────────────────────────────── */}
      <section id="workflow" className="py-28 border-b border-[#252A38] bg-[#0B0D14]">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            label="Symmetrical Architecture"
            title="Built for Streamers & Editors."
            subtitle="Streamers stay focused on gameplay while editors receive instant timestamps and clips in their terminal. One workspace, two dedicated views."
          />

          <div className="text-center mb-12">
            <div className="inline-flex p-1.5 rounded-xl bg-[#10131C] border border-[#252A38] shadow-lg">
              <button onClick={() => setActiveRoleView('streamer')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoleView === 'streamer' ? 'bg-[#151925] text-white border border-[#252A38] shadow-sm' : 'text-[#8B93A7] hover:text-white'}`}>Streamer Cockpit</button>
              <button onClick={() => setActiveRoleView('editor')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoleView === 'editor' ? 'bg-[#151925] text-white border border-[#252A38] shadow-sm' : 'text-[#8B93A7] hover:text-white'}`}>Editor Web Terminal</button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {activeRoleView === 'streamer' ? (
              <div className="p-10 rounded-3xl bg-[#10131C] border border-[#252A38] shadow-2xl flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-6"><Smartphone className="w-7 h-7" /></div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Streamer Mobile Companion Node</h3>
                  <p className="text-[#8B93A7] text-sm leading-relaxed mb-6">Designed as an isolated tactile surface for Android. Turn your phone into an intelligent macro pad that watches your chat so you don't have to.</p>
                  <ul className="space-y-4 text-sm font-medium text-slate-300">
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-[#22D3EE]" /> 1-Tap Tactile Markers inside gameplay</li>
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-[#22D3EE]" /> Zero stream lag (runs off-PC)</li>
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-[#22D3EE]" /> Private team access protocols</li>
                  </ul>
                </div>
                <div className="w-full md:w-[320px] shrink-0 border-[8px] border-[#070910] rounded-[2.5rem] bg-[#070910] shadow-2xl relative overflow-hidden h-[540px]">
                  <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-t-3xl flex justify-center"><div className="w-20 h-4 bg-black rounded-b-xl absolute top-0" /></div>
                  <div className="pt-10 px-4 pb-6 h-full flex flex-col">
                    <div className="text-center font-extrabold text-white mb-6 uppercase tracking-wider text-xs border-b border-[#252A38] pb-4">Digicast Companion</div>
                    <div className="bg-[#151925] border border-[#252A38] p-4 rounded-xl mb-4 text-center">
                      <div className="text-[10px] text-[#8B93A7] font-mono font-bold mb-1 tracking-widest">RECORDING</div>
                      <div className="text-[#22D3EE] font-mono text-2xl font-black">02:31:42</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-grow">
                      <div className="bg-[#151925] border border-[#252A38] rounded-xl flex flex-col items-center justify-center p-2"><span className="text-3xl mb-2">🎯</span><span className="text-[10px] font-bold text-white tracking-wider">CLUTCH</span></div>
                      <div className="bg-[#151925] border border-[#252A38] rounded-xl flex flex-col items-center justify-center p-2"><span className="text-3xl mb-2">💰</span><span className="text-[10px] font-bold text-white tracking-wider">SUPERCHAT</span></div>
                      <div className="bg-[#151925] border border-[#252A38] rounded-xl flex flex-col items-center justify-center p-2"><span className="text-3xl mb-2">⚡</span><span className="text-[10px] font-bold text-white tracking-wider">HYPE</span></div>
                      <div className="bg-[#151925] border border-[#252A38] rounded-xl flex flex-col items-center justify-center p-2"><span className="text-3xl mb-2">🗣️</span><span className="text-[10px] font-bold text-white tracking-wider">TOPIC</span></div>
                    </div>
                    <div className="h-14 bg-[#22D3EE] rounded-xl mt-4 flex items-center justify-center font-black text-[#070910] text-sm tracking-widest uppercase">DROP MARKER</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-3xl bg-[#10131C] border border-[#252A38] shadow-2xl flex flex-col md:flex-row-reverse gap-10 items-center">
                 <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6"><Laptop className="w-7 h-7" /></div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Editor Desktop Terminal</h3>
                  <p className="text-[#8B93A7] text-sm leading-relaxed mb-6">Your video editor deserves professional ingestion tools, not a disorganized document of chat timestamps. Digicast syncs via WebSocket.</p>
                  <ul className="space-y-4 text-sm font-medium text-slate-300">
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-sky-400" /> Instant Ingest in milliseconds</li>
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-sky-400" /> 1-Click DaVinci / Premiere NLE Export</li>
                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-sky-400" /> Automated Telegram Bot Dispatch</li>
                  </ul>
                </div>
                <div className="w-full md:w-[480px] shrink-0 border border-[#252A38] rounded-xl bg-[#0B0D14] shadow-2xl overflow-hidden h-[340px] flex flex-col">
                  <div className="h-10 border-b border-[#252A38] bg-[#10131C] flex items-center px-4 gap-2">
                    <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-600"/><div className="w-2.5 h-2.5 rounded-full bg-slate-600"/><div className="w-2.5 h-2.5 rounded-full bg-slate-600"/></div>
                    <div className="mx-auto px-6 py-1 bg-[#070910] text-[#8B93A7] text-[10px] font-mono rounded border border-[#252A38]">studio.digicast.app</div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-white uppercase tracking-wider">Timeline Ingest</span>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">CONNECTED</span>
                    </div>
                    {[98, 85, 94].map((score, i) => (
                       <div key={i} className="bg-[#151925] border border-[#252A38] p-3 rounded-lg flex items-center justify-between">
                         <div className="flex flex-col gap-1"><span className="text-[10px] font-mono text-[#8B93A7]">0{i+1}:4{i}:12</span><span className="text-xs font-bold text-white">Streamer Marker Dropped</span></div>
                         <div className="bg-[#10131C] px-2 py-1 rounded text-[10px] font-mono text-sky-400 border border-[#252A38]">{score} SCR</div>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ACCESS PASSES SECTION ───────────────────────────────────────── */}
      <section id="passes" className="py-28 border-b border-[#252A38] bg-[#070910]">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader label="Access Protocol" title="Workspace Access Passes" subtitle="Simple, transparent duration passes. 14-day free trial on all new registrations. Pay via instant UPI." />

          <div className="grid md:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.id} className={`p-8 rounded-3xl flex flex-col relative ${plan.recommended ? 'bg-[#10131C] border-2 border-[#22D3EE] shadow-2xl shadow-[#22D3EE]/10 scale-105 z-10' : 'bg-[#0B0D14] border border-[#252A38] hover:border-[#8B93A7] transition-all'}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#22D3EE] text-[#070910] text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <h4 className="text-[11px] font-bold text-[#8B93A7] uppercase tracking-wider mb-5 text-center">{plan.name}</h4>
                <div className="text-center mb-6 border-b border-[#252A38] pb-6">
                  <span className="text-4xl font-extrabold text-white">₹{plan.priceINR}</span>
                  <span className="text-xs text-[#8B93A7] font-medium tracking-wide"> {plan.periodLabel}</span>
                </div>

                <p className="text-[11px] text-[#8B93A7] leading-relaxed mb-8 text-center">{plan.description}</p>

                <div className="space-y-4 mb-10 flex-grow">
                  {plan.features.slice(0, 5).map((f) => (
                    <div key={f} className="flex gap-3 text-xs text-[#F8FAFC] leading-snug">
                      <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Link href="/login" className={`block w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-center transition-all ${plan.recommended ? 'bg-[#22D3EE] text-[#070910] hover:bg-[#38bdf8] shadow-lg shadow-[#22D3EE]/20' : 'bg-[#151925] text-white border border-[#252A38] hover:bg-white hover:text-[#070910]'}`}>
                  {plan.id === 'studio' ? 'Contact Sales' : 'Activate Pass'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 border-b border-[#252A38] bg-[#0B0D14]">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader label="Knowledge Base" title="Frequently Asked Questions" subtitle="Clear operational answers for creators and production teams." />
          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="rounded-xl bg-[#10131C] border border-[#252A38] overflow-hidden transition-all duration-200">
                  <button onClick={() => setOpenFaq(isOpen ? null : index)} className="w-full p-6 text-left font-bold text-white text-sm flex items-center justify-between gap-4 focus:outline-none">
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#8B93A7] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-[#8B93A7] text-sm leading-relaxed border-t border-[#252A38]/50 mt-1">
                      <p className="pt-4">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden bg-[#070910]">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="p-12 md:p-20 rounded-3xl bg-[#10131C] border border-[#252A38] shadow-2xl relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Level Up Your Stream Production.</h2>
            <p className="text-[#8B93A7] text-base max-w-xl mx-auto mb-10 leading-relaxed text-balance">
              Launch your studio workspace, invite your editors, and capture high-stakes broadcast highlights in real time.
            </p>
            <Link href="/login" className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-extrabold text-xs uppercase tracking-[0.15em] bg-[#22D3EE] text-[#070910] shadow-2xl shadow-[#22D3EE]/25 hover:bg-[#38bdf8] hover:scale-105 active:scale-95 transition-all">
              <span>Initialize Workspace</span>
              <Terminal className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BROADCAST FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[#151925] py-16 px-6 bg-[#0B0D14]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <Image src="/logo-mark.png" alt="Digicast Logo" width={24} height={24} className="opacity-90" />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white tracking-widest uppercase">Digicast Technologies</span>
                <span className="text-[10px] font-mono text-[#8B93A7] mt-0.5">© 2026 Systems Operational</span>
              </div>
           </div>
           <div className="flex flex-wrap items-center justify-center gap-8 text-[11px] font-bold text-[#8B93A7] uppercase tracking-wider">
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/refund" className="hover:text-white transition">Refund</Link>
              <a href="https://t.me/digicast_bot" target="_blank" rel="noopener noreferrer" className="hover:text-[#22D3EE] transition flex items-center gap-1.5 text-[#22D3EE]">
                @digicast_bot <ExternalLink className="w-3.5 h-3.5" />
              </a>
           </div>
        </div>
      </footer>
    </div>
  );
}