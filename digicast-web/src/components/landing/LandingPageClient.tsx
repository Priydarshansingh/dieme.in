'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, ArrowRight, Play, MessageSquare,
  HelpCircle, ExternalLink, ChevronDown, Award, Laptop,
  Activity, Layers, Copy, CheckCheck, Youtube, Video, Wifi,
  Sparkles, Check, Clock, ShieldCheck, Flame, Cpu, Terminal
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
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [scrollY, setScrollY] = useState(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'control' | 'chat' | 'health' | 'clips'>('control');
  const [activeRoleView, setActiveRoleView] = useState<'streamer' | 'editor'>('streamer');
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
    { id: '4', time: '01:12:15', label: 'Tournament Update Breakdown', tag: 'TOPIC', author: 'Streamer (Phone)', score: 79 },
  ]);

  // Track cursor coordinates for subtle cyan ambient lighting
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaybackSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtle Cyan Node Mesh in Hero Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 760);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = 760;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(Math.floor(width / 28), 45);
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
        ctx.fillStyle = distMouse < 180 ? 'rgba(34, 211, 238, 0.7)' : 'rgba(248, 250, 252, 0.2)';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            const alpha = (1 - dist / 130) * 0.12;
            ctx.strokeStyle = `rgba(139, 147, 167, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        if (distMouse < 160) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          const alpha = (1 - distMouse / 160) * 0.25;
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
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
        const freq1 = Math.sin(x * 0.035 + step) * 12;
        const freq2 = Math.cos(x * 0.07 - step * 1.4) * 6;
        const freq3 = Math.sin(x * 0.015 + step * 0.9) * 7;
        const y = h / 2 + freq1 + freq2 + freq3;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Secondary controlled rose broadcast wave
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x < w; x += 3) {
        const freq1 = Math.cos(x * 0.03 - step * 1.1) * 8;
        const freq2 = Math.sin(x * 0.055 + step * 0.7) * 5;
        const y = h / 2 + freq1 + freq2;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `0${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCaptureMarker = () => {
    setIsPressingMarker(true);
    const timeStr = formatSeconds(playbackSeconds);

    const tagTitles: Record<string, { label: string; score: number }> = {
      CLUTCH: { label: 'High Stakes 1v3 Clutch Moment', score: 96 },
      SUPERCHAT: { label: 'Superchat Shoutout & Interaction', score: 88 },
      HYPE: { label: 'Viewer Crowd Hype Spike', score: 92 },
      TOPIC: { label: 'Key Strategy & Update Discussion', score: 82 },
    };

    const item = tagTitles[selectedTag] || { label: 'Live Stream Highlight', score: 90 };

    const newMarker = {
      id: String(Date.now()),
      time: timeStr,
      label: item.label,
      tag: selectedTag,
      author: 'Streamer (1-Tap)',
      score: item.score,
    };

    setStreamLog((prev) => [newMarker, ...prev.slice(0, 3)]);
    setMarkerCount((prev) => prev + 1);

    setTimeout(() => setIsPressingMarker(false), 260);
  };

  const handleCopyTimestamps = () => {
    const text = streamLog
      .map((item) => `${item.time} - ${item.label} [${item.tag}] (Viral Score: ${item.score})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setHasCopiedMarkers(true);
    setTimeout(() => setHasCopiedMarkers(false), 2400);
  };

  // Dynamic parallax offset for elements descending on scroll
  const scrollOffset = Math.min(scrollY * 0.18, 120);

  return (
    <div className="relative min-h-screen bg-[#070910] text-[#F8FAFC] selection:bg-[#22D3EE]/25 selection:text-[#22D3EE] font-sans overflow-x-hidden">
      {/* ── Ambient Radial Lighting (Cyan & Rose) ───────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.08), rgba(244, 63, 94, 0.03), transparent 70%)`,
        }}
      />

      {/* ── Subtle Background Grid Lines ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          }}
        />
      </div>

      {/* ── Fixed Floating Navigation Bar ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070910]/85 border-b border-[#252A38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#10131C] border border-[#252A38] p-1.5 flex items-center justify-center group-hover:border-[#22D3EE]/50 transition duration-200">
              <Image
                src="/logo-mark.png"
                alt="Digicast Logo"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                DIGICAST
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#151925] text-[#22D3EE] border border-[#252A38]">
                STUDIO
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#8B93A7]">
            <a href="#console" className="hover:text-white transition flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#F43F5E]" />
              Control Room
            </a>
            <a href="#intelligence" className="hover:text-white transition flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#22D3EE]" />
              Intelligence
            </a>
            <a href="#workflow" className="hover:text-white transition flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-300" />
              Workflow
            </a>
            <a href="#passes" className="hover:text-white transition flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#22C55E]" />
              Access Passes
            </a>
            <a href="#faq" className="hover:text-white transition flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#8B93A7]" />
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-semibold text-[#8B93A7] hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-xs font-bold text-[#070910] bg-[#22D3EE] hover:bg-[#38bdf8] shadow-md shadow-[#22D3EE]/20 transition duration-150"
            >
              Launch Studio
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-[#252A38]">
        {/* Subtle Canvas Mesh */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 opacity-40"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10131C] border border-[#252A38] text-xs font-medium text-[#8B93A7] mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F43F5E]" />
            </span>
            <span className="text-white font-semibold">LIVE CONTROL ROOM</span>
            <span className="text-[#8B93A7]">·</span>
            <span className="text-[#22D3EE] font-medium">YouTube Studio Companion</span>
          </div>

          {/* Simple, confident heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
            Command Your Broadcast. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-sky-200 to-white">
              Automate Every Highlight.
            </span>
          </h1>

          {/* Concise subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#8B93A7] leading-relaxed mb-10 font-normal">
            Real-time live stream telemetry, YouTube chat intelligence, and instant viral highlight capture for creators and video editor teams.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#22D3EE] text-[#070910] hover:bg-[#38bdf8] shadow-lg shadow-[#22D3EE]/25 transition"
            >
              <span>ENTER STUDIO WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#console"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#10131C] hover:bg-[#151925] text-white border border-[#252A38] transition"
            >
              <Play className="w-3.5 h-3.5 text-[#22D3EE]" />
              TEST DIRECTOR HUD
            </a>
          </div>

          {/* ── Scroll-Descended Telemetry Highlights (Animated Floating Elements) */}
          <div
            className="hidden lg:grid grid-cols-4 gap-3 max-w-4xl mx-auto mb-10 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollOffset * 0.35}px)` }}
          >
            <div className="p-3.5 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-md text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E]">
                <Youtube className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">YouTube Live</p>
                <p className="text-xs font-bold text-white">Active Stream Sync</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-md text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Highlight Engine</p>
                <p className="text-xs font-bold text-white">1-Tap Clip Markers</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-md text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Stream Health</p>
                <p className="text-xs font-bold text-white">60 FPS · 8.2 Mbps</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#10131C]/90 border border-[#252A38] backdrop-blur-md text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#8B93A7] uppercase tracking-wider">Team Ingest</p>
                <p className="text-xs font-bold text-white">Zero Credential Sharing</p>
              </div>
            </div>
          </div>

          {/* ── Interactive Command Center Console (Hero HUD) ─────────────── */}
          <div id="console" className="max-w-5xl mx-auto text-left">
            <div className="rounded-2xl p-1 bg-[#10131C] border border-[#252A38] shadow-2xl shadow-black/80 backdrop-blur-xl">
              <div className="rounded-xl bg-[#0B0D14] border border-[#252A38]/60 overflow-hidden">
                {/* Console Header Bar */}
                <div className="px-5 py-3 bg-[#10131C] border-b border-[#252A38] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] animate-pulse" />
                      <span className="font-mono text-xs font-extrabold text-[#F43F5E] tracking-wider">LIVE</span>
                    </div>
                    <span className="text-[#252A38] font-mono">|</span>
                    <span className="font-bold text-sm text-white truncate">Gaming Marathon — Championship Final</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-[#151925] border border-[#252A38] text-slate-300">
                      TIME: {formatSeconds(playbackSeconds)}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-semibold">
                      98% STABLE
                    </span>
                  </div>
                </div>

                {/* Console Subtabs */}
                <div className="px-5 py-2.5 bg-[#0B0D14] border-b border-[#252A38] flex items-center gap-2 overflow-x-auto text-xs font-medium">
                  <button
                    onClick={() => setActiveConsoleTab('control')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeConsoleTab === 'control'
                        ? 'bg-[#151925] text-white border border-[#252A38] font-bold'
                        : 'text-[#8B93A7] hover:text-white'
                    }`}
                  >
                    Live Control
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('chat')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeConsoleTab === 'chat'
                        ? 'bg-[#151925] text-white border border-[#252A38] font-bold'
                        : 'text-[#8B93A7] hover:text-white'
                    }`}
                  >
                    Chat Intelligence (68% Pos)
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('health')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeConsoleTab === 'health'
                        ? 'bg-[#151925] text-white border border-[#252A38] font-bold'
                        : 'text-[#8B93A7] hover:text-white'
                    }`}
                  >
                    Stream Health (8.2 Mbps)
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('clips')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeConsoleTab === 'clips'
                        ? 'bg-[#151925] text-white border border-[#252A38] font-bold'
                        : 'text-[#8B93A7] hover:text-white'
                    }`}
                  >
                    AI Moments ({markerCount})
                  </button>
                </div>

                {/* Console Body */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#252A38]">
                  {/* Left 2 Cols: Waveform & Tactile Pad */}
                  <div className="lg:col-span-2 p-6 flex flex-col justify-between bg-[#0B0D14]">
                    <div>
                      {activeConsoleTab === 'control' && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-[#8B93A7]">BROADCAST AUDIO CARRIER</span>
                            <span className="text-xs font-mono text-[#22D3EE] flex items-center gap-1.5 font-medium">
                              <Activity className="w-3.5 h-3.5 animate-pulse" />
                              COMPANION CONNECTED
                            </span>
                          </div>

                          {/* Live Procedural Audio Canvas Waveform */}
                          <div className="w-full h-16 bg-[#10131C] rounded-xl border border-[#252A38] p-2 flex items-center justify-center relative overflow-hidden mb-6">
                            <canvas
                              ref={audioCanvasRef}
                              width={480}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </>
                      )}

                      {activeConsoleTab === 'chat' && (
                        <div className="p-4 rounded-xl bg-[#10131C] border border-[#252A38] mb-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">CHAT SENTIMENT</span>
                            <span className="text-xs text-[#22C55E] font-bold">Positive (68%)</span>
                          </div>
                          <div className="w-full bg-[#151925] h-2 rounded-full overflow-hidden flex">
                            <div className="bg-[#22C55E] h-full" style={{ width: '68%' }} />
                            <div className="bg-[#8B93A7] h-full" style={{ width: '24%' }} />
                            <div className="bg-[#F43F5E] h-full" style={{ width: '8%' }} />
                          </div>
                          <div className="grid grid-cols-3 text-[11px] text-[#8B93A7] pt-1">
                            <span>68% Positive</span>
                            <span className="text-center">24% Neutral</span>
                            <span className="text-right text-[#F43F5E]">8% Toxic</span>
                          </div>
                          <div className="pt-2 border-t border-[#252A38] flex items-center justify-between text-xs">
                            <span className="text-[#8B93A7]">Moderation Filter</span>
                            <span className="text-white font-medium">3 Spam Accounts Blocked</span>
                          </div>
                        </div>
                      )}

                      {activeConsoleTab === 'health' && (
                        <div className="p-4 rounded-xl bg-[#10131C] border border-[#252A38] mb-6 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono">Connection</span>
                            <span className="text-white font-bold">Excellent</span>
                          </div>
                          <div>
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono">Bitrate</span>
                            <span className="text-[#22D3EE] font-bold">8.2 Mbps</span>
                          </div>
                          <div>
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono">Frame Rate</span>
                            <span className="text-white font-bold">60 FPS</span>
                          </div>
                          <div>
                            <span className="text-[#8B93A7] block text-[10px] uppercase font-mono">Latency</span>
                            <span className="text-white font-bold">2.4 sec</span>
                          </div>
                        </div>
                      )}

                      {activeConsoleTab === 'clips' && (
                        <div className="p-4 rounded-xl bg-[#10131C] border border-[#252A38] mb-6 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono text-[#8B93A7]">
                            <span>AI HIGHLIGHT PREDICTION</span>
                            <span className="text-[#22D3EE] font-bold">VIRAL SCORE 94/100</span>
                          </div>
                          <p className="text-white font-semibold">"Team fight win at Baron Pit with 428 new subscribers"</p>
                          <div className="flex gap-2 pt-2">
                            <span className="px-2 py-0.5 rounded bg-[#151925] border border-[#252A38] text-[10px] text-slate-300">Auto-Captioned</span>
                            <span className="px-2 py-0.5 rounded bg-[#151925] border border-[#252A38] text-[10px] text-slate-300">9:16 Crop Ready</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tag Selection & 1-Tap Trigger */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#8B93A7] uppercase tracking-wider">
                          Select Tag Type:
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">HOTKEY: [SPACE]</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['CLUTCH', 'SUPERCHAT', 'HYPE', 'TOPIC'] as const).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase transition border ${
                              selectedTag === tag
                                ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/40 shadow-sm'
                                : 'bg-[#10131C] text-[#8B93A7] border-[#252A38] hover:text-white'
                            }`}
                          >
                            {tag === 'CLUTCH' && '🎯 CLUTCH'}
                            {tag === 'SUPERCHAT' && '💰 SUPERCHAT'}
                            {tag === 'HYPE' && '⚡ HYPE'}
                            {tag === 'TOPIC' && '🗣️ TOPIC'}
                          </button>
                        ))}
                      </div>

                      {/* Tactile Push Button */}
                      <button
                        onClick={handleCaptureMarker}
                        className={`w-full py-3.5 px-6 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition duration-150 ${
                          isPressingMarker
                            ? 'bg-[#22C55E] text-[#070910] scale-[0.98]'
                            : 'bg-[#22D3EE] text-[#070910] hover:bg-[#38bdf8] shadow-md shadow-[#22D3EE]/20 active:scale-[0.98]'
                        }`}
                      >
                        <Scissors className="w-4 h-4" />
                        <span>
                          {isPressingMarker
                            ? 'MARKER CAPTURED TO TIMELINE!'
                            : `DROP 1-TAP HIGHLIGHT [${selectedTag}]`}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Right Col: Live Marker Queue & Export */}
                  <div className="p-6 bg-[#10131C] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                          LIVE MARKER QUEUE
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 font-bold">
                          {markerCount} LOGGED
                        </span>
                      </div>

                      <div className="space-y-2">
                        {streamLog.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-[#151925] border border-[#252A38] flex items-center justify-between group hover:border-[#22D3EE]/30 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-white truncate">{item.label}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-[#22D3EE]">{item.time}</span>
                                <span className="text-[9px] text-[#8B93A7] font-mono">• {item.author}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 block">
                                {item.tag}
                              </span>
                              <span className="text-[9px] text-[#22D3EE] font-mono font-bold">
                                {item.score} SCORE
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#252A38] mt-4">
                      <button
                        onClick={handleCopyTimestamps}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#151925] hover:bg-[#1f2538] border border-[#252A38] text-xs font-mono text-slate-200 flex items-center justify-center gap-2 transition"
                      >
                        {hasCopiedMarkers ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                            <span className="text-[#22C55E] font-bold">COPIED TO CLIPBOARD</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#8B93A7]" />
                            <span>EXPORT TIMESTAMPS (.MD)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intelligence Suite (Features) ─────────────────────────────────── */}
      <section id="intelligence" className="py-24 border-b border-[#252A38] bg-[#070910]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-xs font-medium text-[#22D3EE] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              INTELLIGENCE ENGINE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Control Room Precision.
            </h2>
            <p className="text-[#8B93A7] text-sm sm:text-base leading-relaxed">
              Every tool is engineered for dense, real-time broadcast telemetry — no generic template fluff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Live Chat Intelligence */}
            <div className="p-7 rounded-2xl bg-[#10131C] border border-[#252A38] hover:border-[#22D3EE]/30 transition duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Live Chat Intelligence</h3>
                <p className="text-xs text-[#8B93A7] leading-relaxed mb-6">
                  Continuously calculates viewer sentiment, flags spam, and detects viewer-driven <code className="text-[#22D3EE] font-mono">!clip</code> commands on-device without cloud lag.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#151925] border border-[#252A38] text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Sentiment:</span>
                  <span className="text-[#22C55E] font-bold">68% Positive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Chat Spike:</span>
                  <span className="text-white">+180 msg/min</span>
                </div>
              </div>
            </div>

            {/* Card 2: AI Viral Moment Scoring */}
            <div className="p-7 rounded-2xl bg-[#10131C] border border-[#252A38] hover:border-[#22D3EE]/30 transition duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center text-[#F43F5E] mb-5">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Clip Studio & Scoring</h3>
                <p className="text-xs text-[#8B93A7] leading-relaxed mb-6">
                  Evaluates moments on a rigorous 0–100 Viral Potential scale based on chat velocity, retention spikes, and audio intensity.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#151925] border border-[#252A38] text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Viral Potential:</span>
                  <span className="text-[#22D3EE] font-bold">98 / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Highlight:</span>
                  <span className="text-white truncate">1v4 Clutch Win</span>
                </div>
              </div>
            </div>

            {/* Card 3: Stream Health & Broadcast Telemetry */}
            <div className="p-7 rounded-2xl bg-[#10131C] border border-[#252A38] hover:border-[#22D3EE]/30 transition duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-5">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Broadcast Health Monitoring</h3>
                <p className="text-xs text-[#8B93A7] leading-relaxed mb-6">
                  Track bitrate drops, encoder health, FPS stability, and broadcast latency so you know when your YouTube stream is healthy.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#151925] border border-[#252A38] text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Bitrate / FPS:</span>
                  <span className="text-white font-bold">8.2 Mbps · 60 FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B93A7]">Dropped Frames:</span>
                  <span className="text-[#22C55E] font-bold">0.02% (Good)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Streamer & Editor Workflow ───────────────────────────────────── */}
      <section id="workflow" className="py-24 border-b border-[#252A38] bg-[#0B0D14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-xs font-medium text-slate-300 mb-4">
              <Users className="w-3.5 h-3.5 text-[#22D3EE]" />
              SYMMETRICAL ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Built for Streamers & Editors.
            </h2>
            <p className="text-[#8B93A7] text-sm sm:text-base leading-relaxed">
              Streamers stay focused on gameplay while editors receive instant timestamps and clips in their terminal.
            </p>

            {/* Role switch toggle */}
            <div className="inline-flex p-1 rounded-xl bg-[#10131C] border border-[#252A38] mt-8">
              <button
                onClick={() => setActiveRoleView('streamer')}
                className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  activeRoleView === 'streamer'
                    ? 'bg-[#151925] text-white border border-[#252A38] shadow-sm'
                    : 'text-[#8B93A7] hover:text-white'
                }`}
              >
                Streamer Cockpit
              </button>
              <button
                onClick={() => setActiveRoleView('editor')}
                className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  activeRoleView === 'editor'
                    ? 'bg-[#151925] text-white border border-[#252A38] shadow-sm'
                    : 'text-[#8B93A7] hover:text-white'
                }`}
              >
                Editor Web Terminal
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {activeRoleView === 'streamer' ? (
              <div className="p-8 rounded-2xl bg-[#10131C] border border-[#252A38]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Streamer Mobile Companion</h3>
                    <p className="text-xs text-[#8B93A7]">Android App / Mobile Control</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-[#22D3EE] font-bold mb-1">1-TAP MARKERS</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Drop tags with no-look tactile buttons during gameplay without tabbing out of your game.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-[#22D3EE] font-bold mb-1">ZERO STREAM LAG</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Lightweight architecture runs in isolated sandbox on-device with zero CPU impact on your stream PC.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-[#22D3EE] font-bold mb-1">ZERO KEY LEAKS</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Editors never touch your YouTube channel keys or Google password. Access is granted via team sessions.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#10131C] border border-[#252A38]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Editor Desktop Terminal</h3>
                    <p className="text-xs text-[#8B93A7]">Next.js Web Workstation</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-sky-400 font-bold mb-1">INSTANT INGEST</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Markers dropped on the streamer's phone appear on the editor's screen in real time via live websocket sync.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-sky-400 font-bold mb-1">NLE EXPORT</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      1-click copy formatted timestamps ready for Premiere Pro, DaVinci Resolve, or YouTube chapter marks.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#151925] border border-[#252A38]">
                    <p className="text-xs font-mono text-sky-400 font-bold mb-1">TELEGRAM BOT</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Finished clips and markers can be piped straight to your team Telegram channel automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Transparent Duration Passes ─────────────────────────────────── */}
      <section id="passes" className="py-24 border-b border-[#252A38] bg-[#070910]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-xs font-medium text-[#22C55E] mb-4">
              <Award className="w-3.5 h-3.5" />
              ACCESS PASSES
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Workspace Access Passes.
            </h2>
            <p className="text-[#8B93A7] text-sm sm:text-base leading-relaxed">
              No hidden contracts or unexpected card charges. Pay with instant UPI verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const isPopular = plan.recommended || plan.id === 'pro';
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl flex flex-col justify-between transition-all duration-200 relative ${
                    isPopular
                      ? 'bg-[#151925] border-2 border-[#22D3EE] shadow-xl shadow-[#22D3EE]/10'
                      : 'bg-[#10131C] border border-[#252A38] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#22D3EE] text-[#070910] text-[10px] font-mono font-extrabold uppercase tracking-wider whitespace-nowrap shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-[#8B93A7] mb-5 leading-relaxed">{plan.description}</p>

                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-3xl font-extrabold text-white font-mono">₹{plan.priceINR}</span>
                      <span className="text-xs font-mono text-[#8B93A7]">{plan.periodLabel}</span>
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-[#22D3EE] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/login"
                    className={`w-full py-2.5 rounded-lg font-semibold text-xs text-center transition tracking-wider uppercase ${
                      isPopular
                        ? 'bg-[#22D3EE] hover:bg-[#38bdf8] text-[#070910] shadow-md shadow-[#22D3EE]/20'
                        : 'bg-[#151925] hover:bg-[#1e2436] text-white border border-[#252A38]'
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

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 border-b border-[#252A38] bg-[#0B0D14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-xs font-medium text-slate-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
              KNOWLEDGE BASE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[#8B93A7] text-sm sm:text-base">
              Clear answers for YouTube creators and video editor teams.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-[#10131C] border border-[#252A38] overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-white text-sm flex items-center justify-between gap-4"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#8B93A7] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-[#8B93A7] text-xs sm:text-sm leading-relaxed border-t border-[#252A38]/50 mt-1">
                      <p className="pt-3">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-[#070910]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-14 rounded-2xl bg-[#10131C] border border-[#252A38] shadow-2xl relative">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Ready to Upgrade Your Stream Workflow?
            </h2>
            <p className="text-[#8B93A7] text-sm sm:text-base max-w-lg mx-auto mb-8 font-normal leading-relaxed">
              Launch your studio workspace and capture broadcast highlights in real time.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#22D3EE] text-[#070910] shadow-lg shadow-[#22D3EE]/25 hover:bg-[#38bdf8] transition"
            >
              <span>ENTER STUDIO WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Broadcast Footer ────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-[#252A38] bg-[#070910] text-xs text-[#8B93A7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Digicast"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="font-extrabold text-white tracking-wider">DIGICAST</span>
            <span className="text-[#252A38]">|</span>
            <span className="text-slate-500">© 2026 Digicast Technologies. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
            <Link href="/contact" className="hover:text-white transition font-medium">
              Contact & Support
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/refund" className="hover:text-white transition">
              Refund Policy
            </Link>
            <a
              href="https://t.me/digicast_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#22D3EE] transition flex items-center gap-1 font-mono text-[#22D3EE]"
            >
              @digicast_bot
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
