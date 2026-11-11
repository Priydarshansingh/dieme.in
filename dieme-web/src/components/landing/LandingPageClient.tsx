'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Check,
  Activity,
  Radio,
  Sparkles,
  ExternalLink,
  Layers,
  Zap,
  Globe,
  Lock,
  Menu,
  X,
  Play,
  Scissors,
  Users,
  Award,
  Laptop,
  Smartphone,
  MessageSquare,
  Cpu,
  Clock,
  Star,
  Download,
  Send,
  Eye,
  CheckCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import { PRICING_PLANS } from '@/lib/pricingPlans';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

interface FaqItem {
  q: string;
  a: string;
}

interface LandingPageClientProps {
  faqs?: FaqItem[];
}

// ── 1. Shooting Stars / Meteor Shower Canvas (Video 00:46 - 00:48) ───────────
function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    interface Star {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      size: number;
    }

    const stars: Star[] = [];
    const maxStars = 7;

    const createStar = (): Star => ({
      x: Math.random() * width + 200,
      y: Math.random() * (height * 0.4),
      length: Math.random() * 90 + 50,
      speed: Math.random() * 5 + 4,
      opacity: Math.random() * 0.7 + 0.3,
      size: Math.random() * 1.5 + 1,
    });

    for (let i = 0; i < maxStars; i++) {
      stars.push(createStar());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x -= star.speed;
        star.y += star.speed * 0.65;

        // Gradient shooting comet tail
        const grad = ctx.createLinearGradient(
          star.x,
          star.y,
          star.x + star.length,
          star.y - star.length * 0.65
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        grad.addColorStop(0.25, `rgba(34, 211, 238, ${star.opacity * 0.8})`);
        grad.addColorStop(0.7, `rgba(16, 185, 129, ${star.opacity * 0.4})`);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = star.size;
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + star.length, star.y - star.length * 0.65);
        ctx.stroke();

        // Star glowing head
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Respawn if off-screen
        if (star.x < -150 || star.y > height + 100) {
          stars[i] = createStar();
          stars[i].x = Math.random() * width + 250;
          stars[i].y = Math.random() * (height * 0.35);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />;
}

// ── 2. Laser Crosshair Tracking Grid (Video 00:06 - 00:09) ───────────────────
function LaserCrosshairGrid({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: -200, y: -200, active: false });

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className="relative"
    >
      {/* Horizontal and vertical laser crosshair lines tracking the cursor */}
      {pos.active && (
        <>
          <div
            className="pointer-events-none absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent z-20 shadow-[0_0_8px_#10B981] transition-transform duration-75 ease-out"
            style={{ transform: `translateY(${pos.y}px)` }}
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent z-20 shadow-[0_0_8px_#22D3EE] transition-transform duration-75 ease-out"
            style={{ transform: `translateX(${pos.x}px)` }}
          />
        </>
      )}
      {children}
    </div>
  );
}

// ── 3. True 3D Wireframe Rotating Cube (Video 00:11 - 00:14) ─────────────────
function WireframeCube3D() {
  return (
    <div className="w-56 h-56 flex items-center justify-center [perspective:1000px] select-none">
      <div className="relative w-28 h-28 [transform-style:preserve-3d] animate-[spin-3d_20s_linear_infinite] hover:scale-110 transition-transform cursor-pointer">
        {/* Front face */}
        <div className="absolute inset-0 border border-emerald-400/60 bg-emerald-500/10 [transform:translateZ(56px)] backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981]" />
        </div>
        {/* Back face */}
        <div className="absolute inset-0 border border-cyan-400/50 bg-cyan-500/10 [transform:rotateY(180deg)_translateZ(56px)] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" />
        </div>
        {/* Right face */}
        <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 [transform:rotateY(90deg)_translateZ(56px)] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_8px_#2DD4BF]" />
        </div>
        {/* Left face */}
        <div className="absolute inset-0 border border-cyan-400/40 bg-cyan-500/10 [transform:rotateY(-90deg)_translateZ(56px)] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67E8F9]" />
        </div>
        {/* Top face */}
        <div className="absolute inset-0 border border-teal-400/50 bg-teal-500/10 [transform:rotateX(90deg)_translateZ(56px)] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-300" />
        </div>
        {/* Bottom face */}
        <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 [transform:rotateX(-90deg)_translateZ(56px)] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>

        {/* Center Live Core Glow */}
        <div className="absolute inset-4 rounded-xl border border-dashed border-emerald-400/50 animate-ping" />
        <div className="absolute inset-6 rounded-lg bg-gradient-to-br from-emerald-400/40 to-cyan-400/40 blur-sm flex items-center justify-center">
          <Radio className="h-6 w-6 text-white animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── 4. 3D Floating Chromatic Glass Discs (Video 01:33 - 01:38) ───────────────
function ChromaticGlassDiscs() {
  return (
    <div className="relative w-full h-44 sm:h-56 max-w-2xl mx-auto -mb-14 pointer-events-none overflow-visible flex items-center justify-center select-none">
      {[
        { size: 'w-32 h-32 sm:w-44 sm:h-44', rotate: '-rotate-24', x: '-translate-x-40', delay: '0s', grad: 'from-emerald-400/30 via-teal-300/10 to-transparent' },
        { size: 'w-36 h-36 sm:w-48 sm:h-48', rotate: '-rotate-12', x: '-translate-x-20', delay: '1s', grad: 'from-cyan-400/35 via-emerald-300/10 to-transparent' },
        { size: 'w-40 h-40 sm:w-56 sm:h-56', rotate: 'rotate-0', x: 'translate-x-0', delay: '2s', grad: 'from-teal-300/40 via-cyan-400/15 to-transparent' },
        { size: 'w-36 h-36 sm:w-48 sm:h-48', rotate: 'rotate-12', x: 'translate-x-20', delay: '1.5s', grad: 'from-emerald-400/35 via-teal-400/10 to-transparent' },
        { size: 'w-32 h-32 sm:w-44 sm:h-44', rotate: 'rotate-24', x: 'translate-x-40', delay: '0.5s', grad: 'from-cyan-400/30 via-emerald-300/10 to-transparent' },
      ].map((disc, idx) => (
        <div
          key={idx}
          className={`absolute rounded-full border border-white/30 backdrop-blur-md bg-gradient-to-tr ${disc.grad} ${disc.size} ${disc.rotate} ${disc.x} animate-float-slow`}
          style={{
            animationDelay: disc.delay,
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          {/* Rainbow caustic refraction rim */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 via-transparent to-cyan-400/20 opacity-70" />
        </div>
      ))}
    </div>
  );
}

// ── 5. Ultra-Smooth Scroll-Reveal Component ──────────────────────────────────
function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 750,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade';
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  const getTransform = () => {
    if (isVisible) return 'translate-x-0 translate-y-0 scale-100 opacity-100';
    switch (direction) {
      case 'up':
        return 'translate-y-12 opacity-0';
      case 'down':
        return '-translate-y-12 opacity-0';
      case 'left':
        return 'translate-x-12 opacity-0';
      case 'right':
        return '-translate-x-12 opacity-0';
      case 'zoom':
        return 'scale-90 opacity-0';
      case 'fade':
      default:
        return 'opacity-0';
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}

// ── 6. Bento Card with Mouse Spotlight & Running Laser Border ────────────────
function SpotlightCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden group transition-all duration-300 ${className}`}
    >
      {/* Ambient Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: isHovered
            ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15), transparent 70%)`
            : undefined,
        }}
      />
      {/* Subtle Laser Rim Highlight on Hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── 7. Dynamic Typewriter Text Component ─────────────────────────────────────
const DEFAULT_HERO_WORDS = [
  '1-Tap Live Clips',
  'Instant Telegram Sync',
  'Viral YouTube Shorts',
  'Zero Latency Relays',
];

function TypewriterText({ words = DEFAULT_HERO_WORDS }: { words?: string[] }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, []);

  const wordsRef = useRef(words);
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  // Typing & deleting loop
  useEffect(() => {
    const list = wordsRef.current;
    if (!list || list.length === 0) return;
    const currentWord = list[index % list.length];

    // Finished typing current word -> hold for 2s before deleting
    if (!isDeleting && subIndex === currentWord.length) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(pauseTimer);
    }

    // Finished deleting current word -> switch to next word
    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % list.length);
      return;
    }

    // Typing: 70ms, Deleting: 35ms
    const charSpeed = isDeleting ? 35 : 70;
    const typeTimer = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, charSpeed);

    return () => clearTimeout(typeTimer);
  }, [subIndex, index, isDeleting]);

  const list = wordsRef.current || words;
  const currentWord = list[index % list.length] || '';
  const displayedText = currentWord.substring(0, subIndex);

  return (
    <span className="inline-flex items-center">
      <span>{displayedText}</span>
      <span
        className={`inline-block w-[3px] sm:w-[4px] h-[0.85em] ml-1.5 sm:ml-2 bg-emerald-400 rounded-full align-middle transition-opacity duration-150 ${
          blink ? 'opacity-100 shadow-[0_0_8px_#10B981]' : 'opacity-20'
        }`}
      />
    </span>
  );
}

export default function LandingPageClient({ faqs = [] }: LandingPageClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(true);

  // Smoothly scroll to #pricing section if someone arrives with deep link or hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('program') !== null || window.location.hash === '#programs') {
        const el = document.getElementById('pricing');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, []);

  // Dynamic Scroll Progress & Parallax Tracking
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          setScrollY(window.scrollY);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Countdown timer (e.g. 03 : 12 : 53 : 42)
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 12,
    minutes: 53,
    seconds: 42,
  });

  // Live Broadcast & Stream Telemetry Ticker Items (Realistic metrics)
  const tickers = [
    { pair: 'YOUTUBE LIVE', val: '4K 60FPS', change: 'HDR READY', up: true },
    { pair: 'MARKER RELAY', val: '240 ms', change: '-45ms', up: true },
    { pair: 'TELEGRAM BOT', val: '@YT_digicast', change: 'ONLINE', up: true },
    { pair: 'SMART LOOKBACK', val: '45 SECONDS', change: 'BUFFER 100%', up: true },
    { pair: 'ACTIVE STREAMS', val: '48 LIVE', change: 'MONITORED', up: true },
    { pair: 'QUOTA CONSUMPTION', val: '0 UNITS', change: 'ZERO BURN', up: true },
    { pair: 'CLIPS SYNCED TODAY', val: '1,284', change: '+14%', up: true },
    { pair: 'LOCAL ENCRYPTION', val: '256-BIT', change: 'ON-DEVICE', up: true },
    { pair: 'AUDIO BUFFER', val: '48 kHz', change: 'PCM STEREO', up: true },
    { pair: 'EDITOR HANDOFF', val: '1-CLICK', change: 'INSTANT LINK', up: true },
    { pair: 'SYSTEM UPTIME', val: '99.98%', change: 'OPERATIONAL', up: true },
    { pair: 'FRAME DROP RATE', val: '0.00%', change: 'ZERO LOSS', up: true },
  ];

  // Countdown clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06080D] text-[#F8FAFC] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 overflow-x-hidden">
      {/* ── Top Kinetic Scroll Progress Bar ──────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 z-[70] shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-[width] duration-150 ease-out pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ── Background Volumetric Aurora Beam (Digicast Emerald & Cyan) ──────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-[140px] opacity-70 transition-transform duration-700 ease-out"
          style={{ transform: `translate(-50%, ${scrollY * 0.08}px)` }}
        />
        <div
          className="absolute top-[45%] -right-40 w-[600px] h-[500px] bg-emerald-600/5 rounded-full blur-[160px] opacity-50 transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />
        <div
          className="absolute top-[75%] -left-40 w-[600px] h-[500px] bg-cyan-600/5 rounded-full blur-[160px] opacity-50 transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        />
      </div>

      {/* ── 1. NAVBAR (UNIVERSAL SITE HEADER) ───────────────────────────────── */}
      <SiteHeader />

      {/* ── 2. HERO SECTION WITH 3D TELEMETRY & AMBIENT AURA ─────────────────── */}
      <section id="hero" className="relative min-h-[92vh] pt-36 pb-20 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Floating Telemetry Badges with Kinetic Scroll Parallax */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute top-[28%] left-[12%] text-xs font-mono font-bold text-emerald-400/40 animate-pulse transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * -0.18}px)` }}
          >
            [12+12]
          </div>
          <div
            className="absolute top-[48%] left-[8%] text-2xl font-mono font-extrabold text-slate-700/50 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * 0.12}px)` }}
          >
            24
          </div>
          <div
            className="absolute top-[26%] right-[14%] text-xs font-mono text-emerald-400/30 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * -0.22}px)` }}
          >
            116+4
          </div>
          <div
            className="absolute top-[52%] right-[10%] text-sm font-mono text-slate-600/40 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * 0.16}px)` }}
          >
            5x8
          </div>
          <div
            className="absolute top-[68%] right-[18%] text-sm font-mono text-emerald-400/40 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          >
            -8
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 space-y-6">
          {/* Top Tagline Pill */}
          <ScrollReveal direction="down" delay={100}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-slate-300 uppercase tracking-widest shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Companion for YouTube Creators</span>
              <span className="text-emerald-400">&bull;</span>
              <span className="text-emerald-400">Zero Latency Relay</span>
            </div>
          </ScrollReveal>

          {/* Hero Main Headline with Typewriter Animation */}
          <ScrollReveal direction="up" delay={200} duration={850}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] sm:leading-[1.15]">
              <span className="block">Never Lose a Stream Highlight.</span>
              <span className="block mt-2 sm:mt-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 min-h-[1.25em]">
                <TypewriterText
                  words={[
                    '1-Tap Live Clips',
                    'Instant Telegram Sync',
                    'Viral YouTube Shorts',
                    'Zero Latency Relays',
                  ]}
                />
              </span>
            </h1>
          </ScrollReveal>

          {/* Hero Subheadline */}
          <ScrollReveal direction="up" delay={300}>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Drop instant timestamp markers while gaming or podcasting on YouTube. Your video editing team receives immediate Telegram alerts with 1-click replay links to cut viral Shorts.
            </p>
          </ScrollReveal>

          {/* Single Action Button (Free 24h Pass Removed) */}
          <ScrollReveal direction="up" delay={400}>
            <div className="pt-4 flex items-center justify-center">
              <Link
                href="/login"
                className="px-9 py-4 rounded-full text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 shadow-xl shadow-white/10 transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Start Studio Pass</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Scroll Cue */}
        <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Scroll to explore</span>
          <span className="animate-bounce text-emerald-400">&darr;</span>
        </div>
      </section>

      {/* ── 3. METRIC CARDS GRID WITH LASER CROSSHAIR TRACKING (VIDEO 00:06-00:09) ─ */}
      <section className="py-24 border-t border-white/5 bg-[#080B12] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                VERIFIED BROADCAST TELEMETRY
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Built for Live Creators Who Move Fast.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                From marathon gaming streams to live podcast broadcasts, Dieme delivers zero-delay clip markers directly to your editors&apos; Telegram with zero quota burn.
              </p>
            </div>
          </ScrollReveal>

          {/* Laser Crosshair Tracked Bento Cards */}
          <LaserCrosshairGrid>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: '500+',
                  label: 'Active YouTube Streamers',
                  sub: 'Gaming & Podcast Creators',
                },
                {
                  num: '15,000+',
                  label: 'Live Moments Clipped',
                  sub: 'Synced directly to video editors',
                },
                {
                  num: '< 350ms',
                  label: 'Telegram Bot Dispatch',
                  sub: 'Real-time lookback delivery',
                },
                {
                  num: '99.9%',
                  label: 'Marker Capture Reliability',
                  sub: 'Zero YouTube quota burn',
                },
              ].map((stat, idx) => (
                <ScrollReveal key={idx} direction="up" delay={idx * 120}>
                  <SpotlightCard className="rounded-3xl bg-[#0C101A] border border-white/5 p-7 sm:p-8 space-y-2 hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300">
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono group-hover:text-emerald-400 transition-colors">
                      {stat.num}
                    </div>
                    <p className="text-sm font-semibold text-slate-200 leading-snug">{stat.label}</p>
                    <p className="text-xs text-slate-500 font-mono">{stat.sub}</p>
                  </SpotlightCard>
                </ScrollReveal>
              ))}
            </div>
          </LaserCrosshairGrid>
        </div>
      </section>

      {/* ── 4. KINETIC TICKER & 3D WIREFRAME ROTATING CUBE (VIDEO 00:10-00:14) ─── */}
      <section className="py-20 border-t border-white/5 bg-[#06080D] overflow-hidden">
        {/* Massive Marquee Line */}
        <div className="whitespace-nowrap overflow-hidden select-none py-4">
          <div className="animate-marquee-infinite text-4xl sm:text-7xl font-black text-emerald-400/90 tracking-tight">
            <span>Zero-Delay Sync for 28 Platforms and all formats &bull; 4K 60FPS RTMP Relays &bull; Instant Telegram Marker Dispatch &bull;&nbsp;</span>
            <span>Zero-Delay Sync for 28 Platforms and all formats &bull; 4K 60FPS RTMP Relays &bull; Instant Telegram Marker Dispatch &bull;&nbsp;</span>
          </div>
        </div>

        {/* 2-Column Showcase (Wireframe Cube + Copy) */}
        <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: True 3D CSS Wireframe Spinning Cube */}
          <ScrollReveal direction="left" delay={150}>
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <WireframeCube3D />
              <div>
                <h3 className="text-2xl font-black text-white">Our Technology</h3>
                <p className="text-2xl font-black text-emerald-400">Your Broadcast</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Copy Description */}
          <ScrollReveal direction="right" delay={250}>
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                What is Dieme?
              </span>
              <h3 className="text-3xl font-extrabold text-white">
                Broadcast on YouTube and other platforms with up to 4K 60FPS!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                We provide unique highlight clipping programs for YouTube creators. Connect your studio, drop 1-tap timestamp tags while gaming or podcasting, and empower your editor crew with instant short-form assets.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Live Stream Ticker (Continuous Left-Scrolling Infinite Marquee) */}
        <div className="mt-16 border-y border-white/5 bg-[#080B12] py-3.5 overflow-hidden select-none">
          <div className="animate-marquee-infinite flex items-center gap-8">
            {/* First sequence */}
            {tickers.map((t, idx) => (
              <div
                key={`a-${idx}`}
                className="flex items-center gap-2.5 text-xs font-mono hover:scale-105 transition-transform shrink-0"
              >
                <span className="text-slate-400 font-bold tracking-wider">{t.pair}</span>
                <span className="text-white font-bold">{t.val}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  {t.change}
                </span>
                <span className="text-slate-700 ml-4">•</span>
              </div>
            ))}
            {/* Seamless duplicate sequence for continuous infinite loop */}
            {tickers.map((t, idx) => (
              <div
                key={`b-${idx}`}
                className="flex items-center gap-2.5 text-xs font-mono hover:scale-105 transition-transform shrink-0"
              >
                <span className="text-slate-400 font-bold tracking-wider">{t.pair}</span>
                <span className="text-white font-bold">{t.val}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  {t.change}
                </span>
                <span className="text-slate-700 ml-4">•</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. START STREAMING / START EARNING KINETIC STACK (VIDEO 00:15-00:17) ── */}
      <section className="py-24 border-t border-white/5 bg-[#07090E] relative overflow-hidden">
        {/* Glowing 3D Orbital Rings Behind Kinetic Text */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none opacity-40 blur-[1px]">
          <div className="w-full h-full rounded-full border border-emerald-400/40 animate-[spin_24s_linear_infinite] flex items-center justify-center">
            <div className="w-72 h-72 rounded-full border border-dashed border-cyan-400/30 animate-[spin_16s_linear_infinite_reverse]" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left CTA */}
          <ScrollReveal direction="left" delay={100}>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Stop losing your own highlight moments, join us and start clipping!
              </h2>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] group"
                >
                  <span>Start Studio Pass</span>
                  <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Repeating Kinetic Typography Stack */}
          <div className="flex flex-col space-y-1 select-none font-black text-4xl sm:text-6xl uppercase tracking-tighter">
            {[
              { text: 'Start streaming', opacity: 'text-emerald-400', delay: 100 },
              { text: 'Start clipping', opacity: 'text-emerald-400/80', delay: 180 },
              { text: 'Start earning', opacity: 'text-emerald-400/60', delay: 260 },
              { text: 'Start streaming', opacity: 'text-emerald-400/40', delay: 340 },
              { text: 'Start clipping', opacity: 'text-emerald-400/20', delay: 420 },
            ].map((item, idx) => (
              <ScrollReveal key={idx} direction="right" delay={item.delay}>
                <span className={`${item.opacity} hover:translate-x-3 transition-transform duration-300 inline-block cursor-default`}>
                  {item.text}
                </span>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. "HOW DOES IT WORK?" 3-STEP INTERACTIVE PREVIEW ────────────────── */}
      <section id="how-it-works" className="py-28 border-t border-white/5 bg-[#080B12] relative z-10 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>HOW DIGICAST WORKS // 3-STAGE PIPELINE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                How does it work?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                From live broadcast marker capture to instant Telegram editor dispatch &mdash; here is how top creators publish viral shorts without stream lag.
              </p>
            </div>
          </ScrollReveal>

          {/* Stepped Tab Selector with Active Glow & Indicators */}
          <ScrollReveal direction="up" delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                {
                  id: 1,
                  step: '01',
                  title: 'Choose A Pass',
                  subtitle: 'Select tier & activate workspace',
                  icon: Layers,
                  tag: 'Zero Setup Delay',
                  accent: 'emerald',
                },
                {
                  id: 2,
                  step: '02',
                  title: 'Stream & Mark Plays',
                  subtitle: '45s lookback buffer & chat triggers',
                  icon: Radio,
                  tag: 'Zero Stream Lag',
                  accent: 'cyan',
                },
                {
                  id: 3,
                  step: '03',
                  title: 'Instant Editor Dispatch',
                  subtitle: 'Telegram alerts & 1-tap jump links',
                  icon: Send,
                  tag: '< 280ms Relay',
                  accent: 'teal',
                },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? 'bg-[#0E1524] border-emerald-400/80 shadow-xl shadow-emerald-500/15 scale-[1.02] z-10'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Top indicator line */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_8px_#10B981]" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                            STAGE {s.step}
                          </div>
                          <div className="font-bold text-white text-sm tracking-tight">{s.title}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {s.tag}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 font-sans truncate">{s.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Dynamic Step Showcase Container */}
          <ScrollReveal direction="zoom" delay={300}>
            <div className="rounded-3xl bg-[#0B0F19]/95 border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden group min-h-[440px] flex items-center">
              {/* Subtle accent glow */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981]" />

              {/* Watermark Step Number */}
              <div className="absolute bottom-2 right-4 text-9xl font-black text-white/[0.03] font-mono select-none pointer-events-none">
                0{activeStep}
              </div>

              {/* STEP 1: CHOOSE A PASS */}
              {activeStep === 1 && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 transition-all duration-500">
                  <div className="lg:col-span-6 space-y-5 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>STAGE 01 &bull; ONBOARDING &amp; ACTIVATION</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Choose Your Pass &amp; Activate Your Studio
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Select between our 14-Day Free Evaluation, introductory ₹29 VIP Creator Pass, or high-capacity Studio passes. Connect your YouTube channel in seconds with zero quota burn.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {[
                        'Instant workspace activation with zero setup delays',
                        'Zero-quota Nightbot & StreamElements webhook triggers',
                        'Dedicated Telegram companion bot pairing (@YT_digicast)',
                        'Up to 5 team editor logins with role-based permissions',
                      ].map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href="/login"
                        className="px-6 py-3 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 transition shadow-lg shadow-emerald-400/20 flex items-center gap-2"
                      >
                        <span>Activate VIP Pass (₹29)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="px-5 py-3 rounded-full text-xs font-bold font-mono text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Live Stream Relay</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Pass Card Hologram Mockup */}
                  <div className="lg:col-span-6">
                    <div className="p-6 rounded-3xl bg-[#06080D] border border-emerald-500/40 shadow-2xl relative space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                          <span className="text-xs font-mono font-bold text-white uppercase">WORKSPACE READY</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          VIP CREATOR PASS
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Connected Broadcast Channel</p>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>YouTube Studio &bull; Broadcaster Console</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] text-slate-500 uppercase">Buffer</p>
                          <p className="text-xs font-bold text-white">45s Smart</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] text-slate-500 uppercase">Relay</p>
                          <p className="text-xs font-bold text-emerald-400">&lt; 280ms</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] text-slate-500 uppercase">Quota</p>
                          <p className="text-xs font-bold text-cyan-300">0 API Burn</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between font-mono">
                        <span>Status: 100% Armed &amp; Ready</span>
                        <span>Stage 1 Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LIVE STREAM RELAY & LOOKBACK MARKERS */}
              {activeStep === 2 && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 transition-all duration-500">
                  <div className="lg:col-span-6 space-y-5 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>STAGE 02 &bull; REAL-TIME BROADCAST ENGINE</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Broadcast Live &amp; Mark Plays with Zero Lag
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      While you stream, Dieme maintains a continuous 45s to 90s hardware lookback buffer. When an epic moment occurs, you or your viewers drop a marker using Nightbot chat triggers or hotkeys.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {[
                        'Continuous rolling lookback buffer retains full buildup',
                        'Chat commands (!clip, !highlight) allow moderators to tag',
                        'Zero CPU or GPU burden on your gaming/streaming PC',
                        'Automatic timeline timestamping with millisecond precision',
                      ].map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="px-6 py-3 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 transition shadow-lg shadow-cyan-400/20 flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Editor Dispatch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="px-5 py-3 rounded-full text-xs font-bold font-mono text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                      >
                        &larr; Back to Step 1
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Live Broadcast Timeline HUD Mockup */}
                  <div className="lg:col-span-6">
                    <div className="p-6 rounded-3xl bg-[#06080D] border border-cyan-500/40 shadow-2xl relative space-y-4">
                      {/* Top Broadcast Status */}
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-xs font-mono font-bold text-white uppercase">LIVE YOUTUBE STREAM</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-slate-400">1080p 60FPS</span>
                          <span className="text-emerald-400 font-bold">1,420 Viewers</span>
                        </div>
                      </div>

                      {/* Stream Marker Items */}
                      <div className="space-y-2">
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">01:24:18</span>
                              <span className="text-white font-sans font-bold">1v4 Clutch Ace &bull; Team Fight</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Triggered by Nightbot (!clip clutch)</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            [CLUTCH 98]
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-cyan-500/30 flex items-center justify-between font-mono text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-bold">02:08:45</span>
                              <span className="text-white font-sans font-bold">₹2,000 Superchat Shoutout</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Triggered by Streamer Hotkey</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                            [SUPERCHAT]
                          </span>
                        </div>
                      </div>

                      {/* Buffer Waveform Telemetry */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-cyan-300">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>Buffer: 45s Retained</span>
                        </span>
                        <span className="text-slate-500">Capture Latency: 18ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: INSTANT EDITOR DISPATCH */}
              {activeStep === 3 && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 transition-all duration-500">
                  <div className="lg:col-span-6 space-y-5 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-mono font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                      <span>STAGE 03 &bull; INSTANT DISPATCH &amp; SHORTS EDITING</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Editors Receive Jump Links &amp; Publish Viral Shorts
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      No more downloading 50GB stream archives or waiting hours for VOD processing. Dieme immediately delivers direct one-tap YouTube jump links (?t=...) straight to your editor&apos;s Telegram.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {[
                        'Sub-280ms Telegram bot alert to your private editor thread',
                        'Direct YouTube timestamp jump link opens exact moment in 1 tap',
                        'Mobile companion app sync keeps remote editors aligned',
                        'Fast-track short-form publishing to YouTube Shorts & Reels',
                      ].map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href="/login"
                        className="px-6 py-3 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 transition shadow-lg shadow-emerald-400/20 flex items-center gap-2"
                      >
                        <span>Start Studio Pass Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="px-5 py-3 rounded-full text-xs font-bold font-mono text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                      >
                        &larr; Back to Step 2
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Telegram Bot Message Mockup */}
                  <div className="lg:col-span-6">
                    <div className="p-6 rounded-3xl bg-[#06080D] border border-teal-500/40 shadow-2xl relative space-y-4">
                      {/* Telegram Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                            ✈️
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white font-mono">@YT_digicast</span>
                              <span className="text-[10px] text-teal-400 font-mono">&#x2713; Verified</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Live Production Bot &bull; Just now</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300">
                          &lt; 280ms Relay
                        </span>
                      </div>

                      {/* Telegram Notification Body */}
                      <div className="p-4 rounded-2xl bg-[#0C121E] border border-cyan-500/20 space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>NEW LIVE HIGHLIGHT MARKED</span>
                        </div>
                        <p className="text-white font-bold font-sans">
                          1v4 Clutch Ace &bull; Team Fight Win
                        </p>
                        <div className="space-y-1 text-slate-400 text-[11px] pt-1 border-t border-white/5">
                          <p>&bull; Stream: <span className="text-slate-200">Valorant Competitive Scrims</span></p>
                          <p>&bull; Timestamp: <span className="text-emerald-300 font-bold">01:24:18 (Lookback: 45s)</span></p>
                          <p>&bull; Tagged by: <span className="text-cyan-300">Mod @AlexGaming (!clip)</span></p>
                        </div>

                        {/* Telegram Action Buttons */}
                        <div className="pt-3 grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-center font-bold text-cyan-300 text-[11px] hover:bg-cyan-500/25 transition cursor-pointer">
                            ⚡ Open YouTube Jump
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center font-bold text-slate-300 text-[11px] hover:bg-white/10 transition cursor-pointer">
                            ✂️ Send to Editor Seat
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                        <span>One-tap VOD Jump: ?t=5058s</span>
                        <span className="text-emerald-400 font-bold">Editor Alert Sent</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. PAYOUTS CERTIFICATES WITH ROTATING RADAR VERIFICATION RING (00:26-00:29) ── */}
      <section className="py-24 border-t border-white/5 bg-[#06080D] relative overflow-hidden">
        {/* Massive Background Watermark that moves horizontally with scroll */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none transition-transform duration-300 ease-out whitespace-nowrap"
          style={{ transform: `translateX(${(scrollY - 2000) * 0.12}px)` }}
        >
          <span className="text-8xl sm:text-[180px] font-black uppercase text-white tracking-tighter">
            Payouts Certificates
          </span>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
          {/* Section Header */}
          <ScrollReveal direction="down" delay={100}>
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                VERIFIED SETTLEMENTS &amp; MILESTONES
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Verified Milestone Certificates
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                When creators and video editing teams complete broadcast tiers, they receive official verifiable digital certificates and direct instant settlements.
              </p>
            </div>
          </ScrollReveal>

          {/* 3-Card Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: 'LEAD SHORTS EDITOR',
                name: 'VIKRAMADITYA SINGH',
                milestone: '50 Stream Shorts Milestone',
                inr: '₹24,500',
                usd: '($295.00 USD Payout Processed)',
                desc: 'Paid via instant UPI settlement upon 48h delivery of viral highlight shorts.',
                tag: 'VERIFIED SETTLEMENT',
                delay: 150,
                border: 'border-emerald-500/30 hover:border-emerald-400',
                accent: 'text-emerald-400',
              },
              {
                role: 'GAMING STREAMER',
                name: 'AARAV SHARMA',
                milestone: '100 Stream Highlights Dispatched',
                inr: '₹36,000',
                usd: '($430.00 USD Creator Pool Dispatched)',
                desc: 'Earned via stream lookback markers and verified viewer engagement tiers.',
                tag: 'CREATOR POOL ACTIVE',
                delay: 250,
                border: 'border-cyan-500/40 hover:border-cyan-300 shadow-xl shadow-cyan-500/5',
                accent: 'text-cyan-300',
              },
              {
                role: 'PODCAST CLIPPING LEAD',
                name: 'PRIYA NAIR',
                milestone: 'Monthly Studio Retainer Tier',
                inr: '₹28,500',
                usd: '($345.00 USD Payout Processed)',
                desc: 'Monthly retainer settlement for multi-camera live marker synchronization.',
                tag: 'MONTHLY TIER COMPLETE',
                delay: 350,
                border: 'border-teal-500/30 hover:border-teal-400',
                accent: 'text-teal-300',
              },
            ].map((cert, idx) => (
              <ScrollReveal key={idx} direction="up" delay={cert.delay}>
                <div
                  className={`rounded-3xl bg-[#0B0F19]/90 border ${cert.border} p-7 shadow-2xl relative hover:shadow-[0_0_35px_rgba(16,185,129,0.18)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden`}
                >
                  {/* Top glowing laser line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_8px_#10B981]" />

                  <div>
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
                      <span className="text-[11px] font-bold text-white font-mono tracking-wider">
                        DIGICAST CERTIFICATE
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {cert.tag}
                      </span>
                    </div>

                    {/* Rotating Circular Radar Verification Seal */}
                    <div className="relative w-20 h-20 mx-auto my-3 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-[spin_6s_linear_infinite] [background:conic-gradient(from_0deg,transparent_60%,rgba(16,185,129,0.35)_100%)]" />
                      <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/50 animate-[spin_12s_linear_infinite_reverse]" />
                      <div className="absolute inset-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center text-center">
                        <CheckCircle className="h-5 w-5 text-emerald-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Recipient & Amount Details */}
                    <div className="text-center py-2 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">
                        {cert.role}
                      </p>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {cert.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {cert.milestone}
                      </p>
                      <p className={`text-3xl font-black ${cert.accent} font-mono pt-2`}>
                        {cert.inr}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {cert.usd}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-3 border-t border-white/10 text-center mt-3">
                    {cert.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PRICING PASSES COMPARISON MATRIX (VIDEO 00:30-00:35) ──────────── */}
      <section id="pricing" className="py-28 border-t border-white/5 bg-[#080B12] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                TRANSPARENT PASS PRICING
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Creator Passes Built for Every Stage
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Choose your studio pass and broadcast duration. Zero automated card renewals — pay only for what you stream.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 Spacious Package Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7 items-stretch">
            {PRICING_PLANS.map((plan, idx) => (
              <ScrollReveal key={plan.id} direction="up" delay={idx * 100}>
                <div
                  className={`rounded-3xl p-7 flex flex-col justify-between border transition-all duration-300 relative overflow-hidden h-full hover:-translate-y-2 group ${
                    plan.recommended
                      ? 'bg-[#0E1524] border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.16)] scale-[1.02] z-10'
                      : 'bg-[#0A0D15]/90 border-white/10 hover:border-emerald-500/30 shadow-xl'
                  }`}
                >
                  {/* Top glowing laser line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Badge */}
                    <div className="min-h-[28px] mb-2 flex items-center">
                      {plan.badge ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                            plan.recommended
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-slate-300 border border-white/10'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    {/* Plan Title & Pricing */}
                    <h3 className="text-base font-extrabold text-white tracking-tight">{plan.name}</h3>
                    <div className="pt-3 pb-2 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono">₹{plan.priceINR}</span>
                      <span className="text-xs text-slate-400 font-mono font-medium">{plan.periodLabel}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{plan.description}</p>

                    {/* Key Feature Checkmarks */}
                    <div className="py-4 space-y-2.5 border-t border-white/[0.08] mt-4">
                      {plan.features.slice(1, 6).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat.replace(/^[⚡\s]+/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    <Link
                      href={`/login?plan=${plan.id}`}
                      className={`w-full py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 group/btn ${
                        plan.recommended
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-400/25'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-emerald-500/30'
                      }`}
                    >
                      <span>Buy for ₹{plan.priceINR}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Expand Details Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowPricingDetails(!showPricingDetails)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-mono font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-md"
            >
              <span>{showPricingDetails ? 'Hide comparison details' : 'See all feature comparisons'}</span>
              <span className="text-emerald-400 font-bold">{showPricingDetails ? '↑' : '↓'}</span>
            </button>
          </div>

          {/* Expanded Features Matrix Table for ALL 4 Plans */}
          {showPricingDetails && (
            <div className="mt-10 rounded-3xl bg-[#090D16]/95 border border-white/10 p-6 sm:p-8 overflow-x-auto transition-all duration-500 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="min-w-[760px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-4 px-4 w-1/3 text-white">Capabilities &amp; Features</th>
                      <th className="py-4 px-3 text-center">VIP Pass (₹29)</th>
                      <th className="py-4 px-3 text-center">Unlimited (₹149)</th>
                      <th className="py-4 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20">
                        Quarter Pass (₹499)
                      </th>
                      <th className="py-4 px-3 text-center text-cyan-300">Studio Pass (₹999)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {/* Category 1: Streaming & Buffering */}
                    <tr className="bg-white/[0.02]">
                      <td colSpan={5} className="py-2.5 px-4 font-bold text-[10px] text-emerald-400 uppercase tracking-widest">
                        Stream Ingest &amp; Lookback Buffer
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Lookback Rolling Buffer</td>
                      <td className="py-3.5 px-3 text-center">45s Rolling</td>
                      <td className="py-3.5 px-3 text-center">45s Rolling</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">60s Priority</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">90s Ultra Buffer</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Live Clip Marker Limit</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Unlimited</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Unlimited</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/20 font-bold">Unlimited</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">YouTube API Quota Burn</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">0 Quota (Local)</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">0 Quota (Local)</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/20">0 Quota (Local)</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">0 Quota (Local)</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Export Resolution &amp; Bitrate</td>
                      <td className="py-3.5 px-3 text-center">1080p 60FPS</td>
                      <td className="py-3.5 px-3 text-center">1080p 60FPS</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">4K 60FPS HDR</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">4K 60FPS Ultra HDR</td>
                    </tr>

                    {/* Category 2: Telegram & Automation */}
                    <tr className="bg-white/[0.02]">
                      <td colSpan={5} className="py-2.5 px-4 font-bold text-[10px] text-cyan-400 uppercase tracking-widest">
                        Telegram Dispatch &amp; Automation
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Telegram Bot Ingest</td>
                      <td className="py-3.5 px-3 text-center">@YT_digicast</td>
                      <td className="py-3.5 px-3 text-center">@YT_digicast</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">Priority Direct Channel</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">Dedicated Multi-Channel</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Marker Dispatch Latency</td>
                      <td className="py-3.5 px-3 text-center">&lt; 350ms</td>
                      <td className="py-3.5 px-3 text-center">&lt; 350ms</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">&lt; 240ms</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">&lt; 180ms Ultra VIP</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">1-Click Replay Links</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Included</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Included</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/20">Included</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">Cloud Auto-Sync</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Nightbot !clip Chat Commands</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Included</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">Included</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20">Custom Prefixes</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300">Custom Multi-Bot</td>
                    </tr>

                    {/* Category 3: Team & Workspace */}
                    <tr className="bg-white/[0.02]">
                      <td colSpan={5} className="py-2.5 px-4 font-bold text-[10px] text-teal-300 uppercase tracking-widest">
                        Team &amp; Workspace Collaboration
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Team Editor Logins</td>
                      <td className="py-3.5 px-3 text-center">1 Editor</td>
                      <td className="py-3.5 px-3 text-center">2 Editors</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">5 Editors</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">Unlimited Seats</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Local Chat Encryption</td>
                      <td className="py-3.5 px-3 text-center">256-bit Local</td>
                      <td className="py-3.5 px-3 text-center">256-bit Local</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20">256-bit Local</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">Studio Vault</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Watermark Free Guarantee</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">100% Free</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">100% Free</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/20">100% Free</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400">100% Free</td>
                    </tr>

                    {/* Category 4: Duration & Pricing Value */}
                    <tr className="bg-white/[0.02]">
                      <td colSpan={5} className="py-2.5 px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                        Duration &amp; Value Breakdown
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Pass Duration</td>
                      <td className="py-3.5 px-3 text-center">30 Days</td>
                      <td className="py-3.5 px-3 text-center">30 Days</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">90 Days (Quarter)</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">365 Days (Full Year)</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Effective Monthly Cost</td>
                      <td className="py-3.5 px-3 text-center text-slate-400">₹29 total</td>
                      <td className="py-3.5 px-3 text-center text-slate-400">₹149/mo</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/20 font-bold">₹166/mo</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">₹83/mo (Save 55%)</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-white">Support SLA</td>
                      <td className="py-3.5 px-3 text-center">Community Discord</td>
                      <td className="py-3.5 px-3 text-center">Standard Support</td>
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 border-x border-emerald-500/20 font-bold">Priority Telegram</td>
                      <td className="py-3.5 px-3 text-center text-cyan-300 font-bold">24/7 Dedicated Concierge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ── 10. GLOBAL COUNTDOWN HORIZON WITH SHOOTING STARS (VIDEO 00:44-00:48) ─ */}
      <section className="py-28 border-t border-white/5 bg-[#06080D] relative overflow-hidden text-center min-h-[500px]">
        {/* Shooting Stars Canvas Shower */}
        <ShootingStars />

        {/* Curved Planet Horizon that expands and rises as you scroll past */}
        <div
          className="absolute -bottom-96 left-1/2 w-[1200px] h-[550px] rounded-[100%] bg-gradient-to-t from-emerald-500/25 to-transparent border-t border-emerald-400/50 pointer-events-none transition-transform duration-500 ease-out z-0"
          style={{
            transform: `translateX(-50%) translateY(${(scrollY - 3000) * -0.06}px)`,
          }}
        />

        <div className="max-w-4xl mx-auto px-6 relative z-20 space-y-6">
          <ScrollReveal direction="down" delay={100}>
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-slate-300">
              Next Creator Tournament &bull; Season 2
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Turn Your Live Streams into Viral Shorts?
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250}>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Creator Studio Pass Access Ends In:
            </p>
          </ScrollReveal>

          {/* Countdown Clock Display */}
          <div className="flex items-center justify-center gap-4 text-center font-mono">
            {[
              { val: String(timeLeft.days).padStart(2, '0'), label: 'DAYS' },
              { val: String(timeLeft.hours).padStart(2, '0'), label: 'HOURS' },
              { val: String(timeLeft.minutes).padStart(2, '0'), label: 'MINUTES' },
              { val: String(timeLeft.seconds).padStart(2, '0'), label: 'SECONDS' },
            ].map((unit, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 80 + 300}>
                <div className="rounded-2xl bg-[#0D121D]/90 backdrop-blur-md border border-white/10 p-4 min-w-[72px] hover:border-emerald-400/50 hover:scale-105 transition-all shadow-xl">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">{unit.val}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{unit.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal direction="up" delay={450}>
            <div className="pt-4 flex items-center justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] group"
              >
                <span>Start Studio Pass</span>
                <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 11. "WHY CHOOSE DIGICAST?" 4 BENTO CARDS (VIDEO 00:49-00:56) ─────── */}
      <section id="why-dieme" className="py-24 border-t border-white/5 bg-[#080B12] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Why choose our Creator Studio?
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'No Time Limit Streaming',
                desc: 'Here creators have the freedom to broadcast live sessions without strict time limits. Clip at your own pace and publish to shorts seamlessly.',
                icon: Clock,
              },
              {
                title: 'Fast Instant Progress',
                desc: 'Sub-second capture relays and automated Telegram dispatch ensures your editors never miss a beat during multi-hour marathons.',
                icon: Zap,
              },
              {
                title: 'Unique Highlight AI Programs',
                desc: 'Chat command triggers (!clip) enable your active community to vote and mark epic plays while you stay focused on the game.',
                icon: Sparkles,
              },
              {
                title: 'A Modern Studio Engine',
                desc: 'All-in-one companion platform connected directly to YouTube APIs and high-efficiency local hardware encoders.',
                icon: Laptop,
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <ScrollReveal key={idx} direction="up" delay={idx * 120}>
                  <SpotlightCard className="rounded-3xl bg-[#0D121D] border border-white/5 p-8 space-y-4 hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{card.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                  </SpotlightCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 12. "WHO WE ARE & HOW IT ALL STARTED" (VIDEO 00:58 - 01:11) ──────── */}
      <section id="about-us" className="py-28 border-t border-white/5 bg-[#06080D] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Narrative */}
          <ScrollReveal direction="left" delay={100}>
            <div className="space-y-6">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                [ Who We Are ]
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Our clients have the potential to produce viral shorts in a relatively short time.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                We started developing live streaming capture tools after seeing hundreds of top streamers lose their best highlight moments without automated editor relay. Today, Dieme powers multi-channel broadcasting teams across 150+ countries.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-400/20"
                >
                  More about us
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Interactive Neon Stepping Grid Graph (From Video 01:03 - 01:11) */}
          <ScrollReveal direction="right" delay={250}>
            <div className="rounded-3xl bg-[#0B0F19] border border-white/10 p-8 shadow-2xl relative">
              <div className="h-48 border-b border-l border-white/10 relative flex items-end">
                {/* Neon Stepping Line */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path
                    d="M 10 170 L 120 170 L 120 120 L 240 120 L 240 60 L 360 60 L 360 10 L 440 10"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_#10B981]"
                  />
                </svg>

                {/* Milestone Pulsing Nodes */}
                <div className="absolute left-[10px] bottom-0 -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 mt-2">2021</span>
                </div>
                <div className="absolute left-[120px] bottom-[50px] -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE] animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 mt-2">2023</span>
                </div>
                <div className="absolute left-[240px] bottom-[110px] -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 mt-2">2025</span>
                </div>
                <div className="absolute left-[360px] bottom-[160px] -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-teal-300 shadow-[0_0_12px_#2DD4BF] animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-300 font-bold mt-2">Present</span>
                </div>
              </div>

              {/* Stats telemetry chips */}
              <div className="grid grid-cols-3 gap-3 mt-8 pt-4 border-t border-white/5 font-mono text-center">
                <div>
                  <div className="text-[10px] text-slate-500">EXPERIENCE</div>
                  <div className="text-lg font-black text-white">5+ Years</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">COMMUNITY</div>
                  <div className="text-lg font-black text-emerald-400">15,000+</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">PAYOUT POOL</div>
                  <div className="text-lg font-black text-cyan-400">₹4.2 Cr</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 13. "ALL IN ONE PLACE" DASHBOARD WITH VOLUMETRIC SPOTLIGHT CONE (01:21-01:24) ── */}
      <section className="py-28 border-t border-white/5 bg-[#06080D] relative z-10 text-center overflow-hidden">
        {/* Overhead Volumetric Spotlight Beam projecting down onto the console */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none opacity-30"
          style={{
            background: 'conic-gradient(from 180deg at 50% 0%, rgba(16,185,129,0.3) 0deg, transparent 60deg, transparent 300deg, rgba(34,211,238,0.3) 360deg)',
            filter: 'blur(30px)',
          }}
        />

        <div className="max-w-6xl mx-auto px-6 space-y-8 relative z-10">
          <ScrollReveal direction="up" delay={100}>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Dieme Studio Console
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
                All in one place
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2">
                With our unique creator workspace, you have live chat capture, highlight markers, and editor sync right at your fingertips.
              </p>
            </div>
          </ScrollReveal>

          {/* Perspective 3D Tilted Studio Dashboard Mockup */}
          <ScrollReveal direction="up" delay={250}>
            <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#0C101A] border border-white/10 p-6 shadow-2xl relative overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">studio.digicast.app/console</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">4K 60FPS RELAY ACTIVE</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-mono">
                <div className="rounded-2xl bg-black/60 p-4 border border-white/5 space-y-1 hover:border-emerald-500/30 transition-colors">
                  <p className="text-[10px] text-slate-500">LIVE CONCURRENT</p>
                  <p className="text-2xl font-black text-white">1,235</p>
                  <p className="text-[10px] text-emerald-400">+18% Peak Viewers</p>
                </div>
                <div className="rounded-2xl bg-black/60 p-4 border border-white/5 space-y-1 hover:border-cyan-500/30 transition-colors">
                  <p className="text-[10px] text-slate-500">CAPTURED CLIPS</p>
                  <p className="text-2xl font-black text-cyan-400">42 Markers</p>
                  <p className="text-[10px] text-slate-400">All Synced to Telegram</p>
                </div>
                <div className="rounded-2xl bg-black/60 p-4 border border-white/5 space-y-1 hover:border-emerald-500/30 transition-colors">
                  <p className="text-[10px] text-slate-500">WALLET EARNINGS</p>
                  <p className="text-2xl font-black text-emerald-400">₹44,341</p>
                  <p className="text-[10px] text-slate-400">Verified Payout Active</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/login"
                  className="px-8 py-2.5 rounded-full text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 transition"
                >
                  Register &amp; Open Studio
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 14. TRUSTPILOT REVIEWS (VIDEO 01:25 - 01:28) ─────────────────────── */}
      <section id="reviews" className="py-24 border-t border-white/5 bg-[#080B12]">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Here you can find our reviews</h2>
                <p className="text-xs text-slate-400">Verified creators sharing real production experiences.</p>
              </div>
              <div className="flex items-center gap-2 bg-[#0D121D] px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-emerald-400">★ Trustpilot</span>
                <span className="text-xs font-bold text-white">4.8 out of 5</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Siddharth R.', role: 'Valorant Broadcaster', text: 'Professional and attentive. Doubled my short-form output in week 1.' },
              { name: 'R. Sharma', role: 'Esports Studio Producer', text: 'Zero latency between streamer marker tap and editor Telegram alerts.' },
              { name: 'Alex M.', role: 'GTA Roleplay Streamer', text: 'The !clip chat integration with Nightbot changed how our mods interact.' },
              { name: 'Liam T.', role: 'Podcast Host', text: 'Best ₹29 investment we made. Unlimited clipping and reliable hardware trim.' },
            ].map((rev, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 100}>
                <div className="rounded-3xl bg-[#0D121D] border border-white/5 p-6 space-y-3 hover:border-emerald-500/30 hover:-translate-y-1 transition-all h-full">
                  <div className="flex text-amber-400 text-xs">★★★★★</div>
                  <p className="text-xs text-slate-300 leading-relaxed">"{rev.text}"</p>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs font-bold text-white">{rev.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{rev.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 15. FAQ ACCORDION (VIDEO 01:15 - 01:20) ─────────────────────────── */}
      <section id="faq" className="py-24 border-t border-white/5 bg-[#06080D]">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">
                Answers to the most frequently asked questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="divide-y divide-white/5 border-y border-white/5">
            {faqs.map((faq, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 60}>
                <div className="py-5">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-bold text-white hover:text-emerald-400 transition"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-500 text-lg font-mono">{activeFaq === idx ? '−' : '+'}</span>
                  </button>

                  {activeFaq === idx && (
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed pr-8 animate-in fade-in slide-in-from-top-2 duration-200">
                      {faq.a}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 16. KINETIC "LET'S TALK" WITH CHROMATIC GLASS DISCS (VIDEO 01:33-01:38) ── */}
      <section className="py-28 border-t border-white/5 bg-[#05070B] relative overflow-hidden text-center">
        {/* Floating Chromatic Glass Prism Discs Arc (From Video 01:33 - 01:36) */}
        <ChromaticGlassDiscs />

        {/* Giant Watermark Typography "Let's Talk" with horizontal scroll parallax */}
        <div
          className="select-none font-black text-6xl sm:text-9xl text-white/5 tracking-tighter uppercase mb-8 whitespace-nowrap transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${-(scrollY - 4400) * 0.08}px)` }}
        >
          Let's Talk
        </div>

        <div className="max-w-xl mx-auto px-6 space-y-4 relative z-10">
          <ScrollReveal direction="zoom" delay={100}>
            <h3 className="text-2xl font-extrabold text-white">Join Our Discord &amp; Telegram Community</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Connect with verified creators, editors, and technical staff to elevate your production workflow.
            </p>
            <div className="pt-4">
              <a
                href="https://t.me/YT_digicast?start=help"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 hover:scale-105 transition shadow-lg shadow-emerald-400/20"
              >
                <span>Join Community &amp; Support</span>
                <Send className="h-3.5 w-3.5" />
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Global Multi-Column Universal Site Footer */}
        <ScrollReveal direction="up" delay={200}>
          <SiteFooter />
        </ScrollReveal>
      </section>

      {/* ── Cookie Consent Floating Bar ──────────────────────────────────────── */}
      {cookieConsent && (
        <div className="fixed bottom-6 inset-x-6 max-w-2xl mx-auto z-50 rounded-2xl bg-[#0D121D]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs animate-in slide-in-from-bottom-4 duration-300">
          <p className="text-slate-300 text-[11px] leading-relaxed">
            We use cookies and telemetry technologies to optimize your livestream sync performance and analytics.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCookieConsent(false)}
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 text-[11px] font-bold transition"
            >
              Decline
            </button>
            <button
              onClick={() => setCookieConsent(false)}
              className="px-4 py-1.5 rounded-full text-black bg-white hover:bg-slate-200 text-[11px] font-bold transition shadow-md"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}