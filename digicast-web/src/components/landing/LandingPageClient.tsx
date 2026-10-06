'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, Zap, Shield, Sparkles, CheckCircle2,
  ArrowRight, Play, MessageSquare, Flame, Check, HelpCircle,
  ExternalLink, ChevronDown, Award, Globe, Smartphone, Laptop, Tv,
  Activity, Layers, Eye, Cpu, Terminal, Disc, Volume2, ShieldCheck,
  TrendingUp, RefreshCw, BarChart3, Clock, Lock, Sliders, PlayCircle,
  Copy, CheckCheck, Share2, Sparkle
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
  const [activeRoleView, setActiveRoleView] = useState<'owner' | 'editor'>('owner');
  const [markerCount, setMarkerCount] = useState(24);
  const [isPressingMarker, setIsPressingMarker] = useState(false);
  const [selectedTag, setSelectedTag] = useState<'CLUTCH' | 'SUPERCHAT' | 'HYPE' | 'TOPIC'>('CLUTCH');
  const [playbackSeconds, setPlaybackSeconds] = useState(5840); // 01:37:20
  const [hasCopiedMarkers, setHasCopiedMarkers] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamLog, setStreamLog] = useState([
    { id: '1', time: '01:36:50', label: '1v4 Clutch Defusal & Ace', tag: 'CLUTCH', author: 'Streamer (Phone)' },
    { id: '2', time: '01:14:10', label: '₹2,000 Superchat from AlexGaming', tag: 'SUPERCHAT', author: 'Editor (Web)' },
    { id: '3', time: '00:48:32', label: 'Funny Mic Drop Reaction', tag: 'HYPE', author: 'Streamer (Phone)' },
    { id: '4', time: '00:22:15', label: 'New Season Patch Breakdown', tag: 'TOPIC', author: 'Streamer (Phone)' },
  ]);

  // Track cursor coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Increment simulated playback seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaybackSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Interactive Web3 Canvas Node Mesh in Hero Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 700);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = 700;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const nodeCount = Math.min(Math.floor(width / 24), 50);
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Interaction with mouse cursor
        const dxMouse = node.x - mousePos.x;
        const dyMouse = node.y - mousePos.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = distMouse < 180 ? 'rgba(214, 248, 48, 0.8)' : 'rgba(255, 255, 255, 0.25)';
        ctx.fill();

        // Draw connections
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
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw line to mouse if close
        if (distMouse < 160) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          const alpha = (1 - distMouse / 160) * 0.25;
          ctx.strokeStyle = `rgba(214, 248, 48, ${alpha})`;
          ctx.lineWidth = 1;
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

  // Procedural Live Audio Waveform Canvas
  useEffect(() => {
    const canvas = audioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      step += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Base line
      ctx.beginPath();
      ctx.moveTo(0, h / 2);

      for (let x = 0; x < w; x += 3) {
        const freq1 = Math.sin(x * 0.04 + step) * 12;
        const freq2 = Math.cos(x * 0.08 - step * 1.5) * 6;
        const freq3 = Math.sin(x * 0.015 + step * 0.8) * 8;
        const y = h / 2 + freq1 + freq2 + freq3;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#D6F830'; // Electric Lime Web3 accent
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Secondary cyber wave
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x < w; x += 3) {
        const freq1 = Math.cos(x * 0.035 - step * 1.2) * 9;
        const freq2 = Math.sin(x * 0.06 + step * 0.7) * 5;
        const y = h / 2 + freq1 + freq2;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.45)'; // Cyber Cyan
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

    const tagTitles: Record<string, string> = {
      CLUTCH: 'Intense 1v3 Clutch Moment',
      SUPERCHAT: 'Superchat Shoutout & Interaction',
      HYPE: 'Crowd Hype & Chat Reaction',
      TOPIC: 'Main Topic & Strategy Discussion',
    };

    const newMarker = {
      id: String(Date.now()),
      time: timeStr,
      label: tagTitles[selectedTag] || 'Live Stream Highlight Marked',
      tag: selectedTag,
      author: 'Streamer (1-Tap)',
    };

    setStreamLog((prev) => [newMarker, ...prev.slice(0, 3)]);
    setMarkerCount((prev) => prev + 1);

    setTimeout(() => setIsPressingMarker(false), 300);
  };

  const handleCopyTimestamps = () => {
    const text = streamLog
      .map((item) => `${item.time} - ${item.label} [${item.tag}]`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setHasCopiedMarkers(true);
    setTimeout(() => setHasCopiedMarkers(false), 2500);
  };

  return (
    <div className="relative min-h-screen bg-[#040508] text-[#F8FAFC] selection:bg-[#D6F830]/30 selection:text-[#D6F830] font-sans overflow-x-hidden">
      {/* ── Raycast Spotlight Tracker ───────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(214, 248, 48, 0.06), rgba(0, 245, 255, 0.02), transparent 75%)`,
        }}
      />

      {/* ── Precision Obsidian Grid ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          }}
        />
      </div>

      {/* ── Fixed Floating Navigation Capsule ─────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#040508]/85 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#090C15] border border-white/10 p-2 flex items-center justify-center group-hover:border-[#D6F830]/50 transition duration-300 shadow-lg">
                <Image
                  src="/logo-mark.png"
                  alt="Digicast Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                DIGICAST
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D6F830]/10 text-[#D6F830] border border-[#D6F830]/25 uppercase tracking-widest">
                  LIVE HUD
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                BROADCAST COMPANION
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-slate-400">
            <a href="#console" className="hover:text-[#D6F830] transition flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              Director HUD
            </a>
            <a href="#workflow" className="hover:text-[#D6F830] transition flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Workflow
            </a>
            <a href="#passes" className="hover:text-[#D6F830] transition flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Passes
            </a>
            <a href="#faq" className="hover:text-[#D6F830] transition flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              FAQ
            </a>
            <Link href="/contact" className="hover:text-[#D6F830] transition flex items-center gap-1.5 text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Support Bot
            </Link>
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
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider text-[#040508] bg-[#D6F830] hover:bg-[#c5ea1f] shadow-lg shadow-[#D6F830]/20 hover:shadow-[#D6F830]/35 hover:scale-[1.02] active:scale-[0.98] transition duration-150"
            >
              Launch Studio
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section with Interactive Canvas Mesh ────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-white/[0.07]">
        {/* Interactive canvas node background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 opacity-60"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Telemetry Micro-Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#090C15] border border-white/10 text-xs font-mono text-slate-300 mb-8 backdrop-blur-md shadow-2xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6F830] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D6F830]" />
            </span>
            <span className="text-[#D6F830] font-bold">STREAM SYNC 2.4</span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400">0ms Capture Overhead</span>
          </div>

          {/* Punchy Monolithic Display Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.06] mb-6">
            Frame-Precise Livestream Tagging <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              For High-Stakes Streamers.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10 font-normal">
            Never scrub through 6-hour video vods again. Tag hype moments with one tap on your mobile phone or companion keypad while live, and export instant timestamp logs to your editors.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-[#D6F830] text-[#040508] shadow-2xl shadow-[#D6F830]/25 hover:shadow-[#D6F830]/40 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <span>ACTIVATE DURATION PASS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#console"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-[#090C15] hover:bg-[#0E1322] text-white border border-white/10 transition"
            >
              <Play className="w-3.5 h-3.5 text-[#D6F830]" />
              TRY DIRECTOR HUD SANDBOX
            </a>
          </div>

          {/* ── Interactive Director HUD Simulator ─────────────────────────── */}
          <div id="console" className="max-w-5xl mx-auto text-left">
            <div className="rounded-2xl p-1 bg-[#090C15] border border-white/[0.09] shadow-2xl shadow-black/80 backdrop-blur-2xl">
              <div className="rounded-xl bg-[#06080E] border border-white/[0.06] overflow-hidden">
                {/* Console Top Header */}
                <div className="px-6 py-3.5 bg-[#090C15] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-mono text-xs font-black text-rose-400 tracking-wider">LIVE_FEED</span>
                    </div>
                    <span className="text-white/20 font-mono">|</span>
                    <span className="font-bold text-sm text-white truncate">Championship Final Stream</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-slate-300">
                      REC TIME: {formatSeconds(playbackSeconds)}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#D6F830]/10 text-[#D6F830] border border-[#D6F830]/20 font-bold">
                      FEED SYNCED
                    </span>
                  </div>
                </div>

                {/* Console Body */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.07]">
                  {/* Left 2 Cols: Waveform & Tactile Pad */}
                  <div className="lg:col-span-2 p-6 flex flex-col justify-between bg-[#06080E]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-slate-400">AUDIO_CARRIER: 48kHz PCM</span>
                        <span className="text-xs font-mono text-[#D6F830] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          COMPANION CONNECTED
                        </span>
                      </div>

                      {/* Live Procedural Audio Canvas Waveform */}
                      <div className="w-full h-16 bg-[#090C15] rounded-xl border border-white/[0.07] p-2 flex items-center justify-center relative overflow-hidden mb-6">
                        <canvas
                          ref={audioCanvasRef}
                          width={480}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Tag Selection & 1-Tap Trigger */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
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
                                ? 'bg-[#D6F830]/15 text-[#D6F830] border-[#D6F830]/40 shadow-sm'
                                : 'bg-[#090C15] text-slate-400 border-white/[0.06] hover:text-white'
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
                        className={`w-full py-4 px-6 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition duration-150 ${
                          isPressingMarker
                            ? 'bg-emerald-400 text-[#040508] scale-[0.98] shadow-lg shadow-emerald-400/40'
                            : 'bg-[#D6F830] text-[#040508] hover:bg-[#c5ea1f] hover:shadow-xl hover:shadow-[#D6F830]/25 active:scale-[0.97]'
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
                  <div className="p-6 bg-[#090C15] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                          LIVE MARKER QUEUE
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#D6F830]/10 text-[#D6F830] border border-[#D6F830]/20 font-bold">
                          {markerCount} LOGGED
                        </span>
                      </div>

                      <div className="space-y-2">
                        {streamLog.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-[#0D111C] border border-white/[0.06] flex items-center justify-between group hover:border-white/20 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-white truncate">{item.label}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-[#D6F830]">{item.time}</span>
                                <span className="text-[9px] text-slate-500 font-mono">• {item.author}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 shrink-0">
                              {item.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.07] mt-4">
                      <button
                        onClick={handleCopyTimestamps}
                        className="w-full py-2.5 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-slate-200 flex items-center justify-center gap-2 transition"
                      >
                        {hasCopiedMarkers ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-[#D6F830]" />
                            <span className="text-[#D6F830] font-bold">COPIED TO CLIPBOARD</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
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

      {/* ── Interactive Role Matrix: Creator vs Editor ──────────────────── */}
      <section id="workflow" className="py-24 border-b border-white/[0.07] relative bg-[#06080E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 mb-4">
              <Users className="w-3.5 h-3.5 text-[#D6F830]" />
              SYMMETRICAL WORKFLOW
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Engineered for Streamer & Editor Harmony.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Streamers stay in the zone during broadcasts while video editors access live timecodes instantly.
            </p>

            {/* Interactive Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-[#090C15] border border-white/10 mt-8">
              <button
                onClick={() => setActiveRoleView('owner')}
                className={`px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${
                  activeRoleView === 'owner'
                    ? 'bg-[#D6F830] text-[#040508] shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Streamer Cockpit
              </button>
              <button
                onClick={() => setActiveRoleView('editor')}
                className={`px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${
                  activeRoleView === 'editor'
                    ? 'bg-[#D6F830] text-[#040508] shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Editor Terminal
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {activeRoleView === 'owner' ? (
              <div className="p-8 rounded-3xl bg-[#090C15] border border-white/[0.08] shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#D6F830]/10 border border-[#D6F830]/25 flex items-center justify-center text-[#D6F830]">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Streamer Companion Node</h3>
                    <p className="text-xs font-mono text-slate-400">Android / Companion Keypad</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-[#D6F830] font-bold mb-1">ZERO BATTERY DRAIN</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Optimized dark UI with minimal CPU overhead so your phone stays cool during 8+ hour marathon streams.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-[#D6F830] font-bold mb-1">1-TAP HOTKEYS</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Giant tactile touch pads calibrated for no-look tapping during gameplay or live podcasts.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-[#D6F830] font-bold mb-1">PRIVATE & SECURE</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Team access codes grant your editors workspace access without handing over Google credentials.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#090C15] border border-white/[0.08] shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Editor Web Terminal</h3>
                    <p className="text-xs font-mono text-slate-400">Desktop Browser Interface</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-cyan-400 font-bold mb-1">REAL-TIME INGEST</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Markers appear on the editor screen in milliseconds as the creator taps their mobile companion.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-cyan-400 font-bold mb-1">TIMELINE EXPORT</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      1-click copy formatted timestamps ready for YouTube description chapters, Premiere, or DaVinci Resolve.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0D111C] border border-white/[0.06]">
                    <p className="text-xs font-mono text-cyan-400 font-bold mb-1">SUPERCHAT ARCHIVE</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Auto-tagged superchat notes allow instant compilation of shoutout shorts and highlight reels.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Transparent Duration Passes ─────────────────────────────────── */}
      <section id="passes" className="py-24 border-b border-white/[0.07] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 mb-4">
              <Award className="w-3.5 h-3.5 text-[#D6F830]" />
              PASS ACCESS PROTOCOL
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Flexible Duration Passes.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              No hidden contracts or involuntary renewals. Activate passes on-demand with instant grace access via UPI.
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
                      ? 'bg-[#090C15] border-2 border-[#D6F830]/80 shadow-2xl shadow-black/80 scale-[1.02]'
                      : 'bg-[#090C15] border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#D6F830] text-[#040508] text-[10px] font-mono font-black uppercase tracking-wider whitespace-nowrap shadow-lg">
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
                          <Check className="w-3.5 h-3.5 text-[#D6F830] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/login"
                    className={`w-full py-3 rounded-xl font-mono font-bold text-xs text-center transition tracking-wider uppercase ${
                      isPopular
                        ? 'bg-[#D6F830] hover:bg-[#c5ea1f] text-[#040508] shadow-lg shadow-[#D6F830]/20'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
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

      {/* ── FAQ Knowledge Base ───────────────────────────────────────────── */}
      <section id="faq" className="py-24 border-b border-white/[0.07] bg-[#06080E] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-[#D6F830]" />
              KNOWLEDGE BASE & FAQ
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Clear answers designed for creators, editors, and search engines.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => (
              <details
                key={index}
                className="group p-6 rounded-2xl bg-[#090C15] border border-white/[0.08] open:border-[#D6F830]/40 transition duration-200 cursor-pointer"
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

      {/* ── Bottom Call to Action ────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-[#040508]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-12 sm:p-16 rounded-3xl bg-[#090C15] border border-white/10 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Level Up Your Stream Production.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
              Launch your studio workspace and capture broadcast highlights in real-time.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-[#D6F830] text-[#040508] shadow-2xl shadow-[#D6F830]/30 hover:shadow-[#D6F830]/50 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <span>ENTER STUDIO WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Web3 Footer ──────────────────────────────────────────────────── */}
      <footer className="py-14 border-t border-white/[0.07] bg-[#040508] text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Digicast"
              width={22}
              height={22}
              className="object-contain"
            />
            <span className="font-black text-white tracking-wider">DIGICAST</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500 font-sans">© 2026 Digicast Technologies. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 font-sans text-xs">
            <Link href="/contact" className="hover:text-[#D6F830] transition font-semibold text-slate-300">
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
              className="hover:text-[#D6F830] transition flex items-center gap-1 font-mono text-[#D6F830]"
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
