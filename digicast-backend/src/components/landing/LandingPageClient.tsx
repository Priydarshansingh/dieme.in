'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
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

export default function LandingPageClient({ faqs = [] }: LandingPageClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedProgram, setSelectedProgram] = useState<number>(4);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(true);

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

  // Ticker items
  const tickers = [
    { pair: 'YOUTUBE LIVE', val: '4K 60FPS', change: '+99.9%', up: true },
    { pair: 'MARKER RELAY', val: '240 ms', change: '-45ms', up: true },
    { pair: 'TELEGRAM BOT', val: 'ACTIVE', change: 'v2.4', up: true },
    { pair: 'DIGICAST DP', val: '₹1.00 INR', change: 'PARITY', up: true },
    { pair: 'CREATOR POOL', val: '₹4.2 Cr', change: '+18.4%', up: true },
    { pair: 'ACTIVE STREAMS', val: '1,420+', change: '+12%', up: true },
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

      {/* ── 1. NAVBAR (STICKY BLUR HEADER WITH LIVE INDICATOR) ───────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#06080D]/85 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Official Digicast Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <DigicastBrandLogo size="md" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-300">
            <a href="#hero" className="hover:text-emerald-400 transition-colors">
              Home
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#programs" className="hover:text-emerald-400 transition-colors">
              Programs
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              Pricing Passes
            </a>
            <a href="#why-digicast" className="hover:text-emerald-400 transition-colors">
              Why Digicast
            </a>
            <a href="#about-us" className="hover:text-emerald-400 transition-colors">
              About Us
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-emerald-500/30"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-xs font-bold text-black bg-white hover:bg-emerald-400 hover:text-black transition-all shadow-lg shadow-white/5 hover:shadow-emerald-500/20"
            >
              Start Free Pass
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A0D15] border-b border-white/10 px-6 py-6 space-y-4 text-sm font-medium animate-in slide-in-from-top-4 duration-300">
            <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="block text-white">
              Home
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              How It Works
            </a>
            <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Programs
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Pricing Passes
            </a>
            <a href="#why-digicast" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Why Digicast
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Support &amp; FAQ
            </a>
            <Link href="/login" className="block text-emerald-400 font-bold pt-2">
              Login / Register &rarr;
            </Link>
          </div>
        )}
      </header>

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

        <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-6">
          {/* Top Tagline Pill */}
          <ScrollReveal direction="down" delay={100}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-slate-300 uppercase tracking-widest shadow-inner">
              <span>Our Platform</span>
              <span className="text-emerald-400">&bull;</span>
              <span className="text-emerald-400">Your Success</span>
            </div>
          </ScrollReveal>

          {/* Hero Main Headline */}
          <ScrollReveal direction="up" delay={200} duration={850}>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05]">
              No Time Limit Creator Studio <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Conquer the Broadcast
              </span>
            </h1>
          </ScrollReveal>

          {/* Hero Subheadline */}
          <ScrollReveal direction="up" delay={300}>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Real-time live companion and clip highlight capture suite built for YouTube broadcasters, gaming streamers, and video editing teams.
            </p>
          </ScrollReveal>

          {/* Dual Action Buttons Group */}
          <ScrollReveal direction="up" delay={400}>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 shadow-xl shadow-white/10 transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Start Studio Pass</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/login"
                className="px-6 py-3.5 rounded-full text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-xl hover:border-emerald-500/40 hover:scale-105 transition-all duration-200"
              >
                Free 24h Pass
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Creators from more than 150 countries around the world have registered!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                We provide unique livestream tools for YouTube creators, allowing seamless collaboration with video editors without losing key stream highlight moments.
              </p>
            </div>
          </ScrollReveal>

          {/* Laser Crosshair Tracked Bento Cards */}
          <LaserCrosshairGrid>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: '₹4.2 Cr+', label: 'Payout to Digicast Creators & Editors' },
                { num: '15,000+', label: 'No. of Digicast Creators' },
                { num: '150+', label: 'No. of countries with broadcasters' },
                { num: '< 400ms', label: 'Average clip marker processing time' },
              ].map((stat, idx) => (
                <ScrollReveal key={idx} direction="up" delay={idx * 120}>
                  <SpotlightCard className="rounded-3xl bg-[#0C101A] border border-white/5 p-8 space-y-2 hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300">
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono group-hover:text-emerald-400 transition-colors">
                      {stat.num}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{stat.label}</p>
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
                What is Digicast?
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

        {/* Live Stream Ticker */}
        <div className="mt-16 border-y border-white/5 bg-[#080B12] py-3.5 overflow-x-auto">
          <div className="flex items-center gap-8 px-6 min-w-max">
            {tickers.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono hover:scale-105 transition-transform cursor-pointer">
                <span className="text-slate-400 font-bold">{t.pair}</span>
                <span className="text-white font-bold">{t.val}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                  {t.change}
                </span>
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
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-full text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 transition shadow-lg"
                >
                  Join Us
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-full text-xs font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition"
                >
                  Free Trial
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
      <section id="how-it-works" className="py-28 border-t border-white/5 bg-[#080B12] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                How does it work?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Your pathway to professional live broadcasting and viral highlight shorts.
              </p>
            </div>
          </ScrollReveal>

          {/* Stepped Tab Selector */}
          <ScrollReveal direction="up" delay={200}>
            <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-4 mb-10 text-xs font-bold font-mono">
              {[
                { id: 1, title: 'Step 1: Choose A Pass', desc: 'Select a program that suits your studio.' },
                { id: 2, title: 'Step 2: Live Stream Relay', desc: 'Drop instant highlight markers while streaming.' },
                { id: 3, title: 'Step 3: Editor Co-operation', desc: 'Editors receive Telegram alerts & produce shorts.' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={`text-left pb-2 transition duration-200 ${
                    activeStep === s.id
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 uppercase">{`[ STEP 0${s.id} ]`}</div>
                  <div className="font-bold text-white text-sm">{s.title}</div>
                  <div className="hidden sm:block text-[11px] text-slate-400 font-sans mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Dynamic Step Showcase Container with Ambient Aurora Background */}
          <ScrollReveal direction="zoom" delay={300}>
            <div className="rounded-3xl bg-[#0D121D] border border-white/10 p-8 min-h-[360px] flex items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

              {activeStep === 1 && (
                <div className="space-y-4 text-center max-w-md relative z-10 transition-all duration-500 ease-out">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Layers className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Choose Your Creator Pass</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Start with the 1st Month VIP Pass (₹29) or 14-Day Free Trial. Instant workspace activation with zero setup delays.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block px-6 py-2.5 rounded-full text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 hover:scale-105 transition shadow-lg"
                  >
                    Start Program
                  </Link>
                </div>
              )}

              {activeStep === 2 && (
                <div className="w-full max-w-xl space-y-4 relative z-10 transition-all duration-500 ease-out">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-bold text-white">LIVE YouTube Broadcast Stream</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">1,235 Viewers</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>02:31:18 &bull; 1v4 Clutch &amp; Team Fight Ace</span>
                      <span className="text-emerald-400 font-bold">[CLUTCH 96]</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>02:14:02 &bull; ₹2,000 Superchat Shoutout</span>
                      <span className="text-cyan-400 font-bold">[SUPERCHAT]</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4 text-center max-w-md relative z-10 transition-all duration-500 ease-out">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <Smartphone className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Instant Editor Collaboration</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Captured highlight timestamps instantly dispatch to your private Telegram channel via @DigicastIndiaBot with direct one-tap YouTube replay jump links.
                  </p>
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

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6">
          <ScrollReveal direction="zoom" delay={150}>
            <div className="w-full max-w-lg mx-auto rounded-3xl bg-[#0B0F19] border border-emerald-500/40 p-8 shadow-2xl space-y-4 relative hover:border-emerald-400/80 hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold text-white font-mono">DIGICAST CERTIFICATE</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>

              {/* Rotating Circular Radar Verification Seal */}
              <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-[spin_6s_linear_infinite] [background:conic-gradient(from_0deg,transparent_60%,rgba(16,185,129,0.35)_100%)]" />
                <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/50 animate-[spin_12s_linear_infinite_reverse]" />
                <div className="absolute inset-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
              </div>

              <div className="py-2 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-mono">Certified Broadcaster</p>
                <h3 className="text-2xl font-black text-white">VIKRAMADITYA SINGH</h3>
                <p className="text-3xl font-black text-emerald-400 font-mono mt-1">₹4,45,000</p>
                <p className="text-[11px] text-slate-500 font-mono">($5,400.00 USD Payout Processed)</p>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/10">
                When a creator reaches their milestone, they receive an official verified certificate showing their real-time earnings and platform credentials.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. PRICING PASSES COMPARISON MATRIX (VIDEO 00:30-00:35) ──────────── */}
      <section id="pricing" className="py-28 border-t border-white/5 bg-[#080B12] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Best prices in streaming industry!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose your creator pass and broadcast duration.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 Program Columns with Staggered Scroll Reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, idx) => (
              <ScrollReveal key={plan.id} direction="up" delay={idx * 120}>
                <div
                  className={`rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 relative overflow-hidden h-full hover:-translate-y-2 ${
                    plan.recommended
                      ? 'bg-[#0E131F] border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
                      : 'bg-[#0A0D15] border-white/5 hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 font-mono mb-3">
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                    <div className="pt-3">
                      <span className="text-3xl font-black text-white font-mono">₹{plan.priceINR}</span>
                      <span className="text-xs text-slate-500 ml-1">{plan.periodLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-2">{plan.description}</p>
                  </div>

                  <div className="pt-6">
                    <Link
                      href="/login"
                      className={`w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                        plan.recommended
                          ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-400/20'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      Buy for ₹{plan.priceINR}
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Expand Details Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowPricingDetails(!showPricingDetails)}
              className="px-5 py-2 rounded-full text-xs font-mono font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/25 transition"
            >
              {showPricingDetails ? 'Hide details ↑' : 'See more details ↓'}
            </button>
          </div>

          {/* Expanded Features Matrix Table */}
          {showPricingDetails && (
            <div className="mt-8 rounded-3xl bg-[#0A0D15] border border-white/10 p-6 overflow-x-auto transition-all duration-500">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">VIP Pass (₹29)</th>
                    <th className="py-3 px-4">Unlimited (₹149)</th>
                    <th className="py-3 px-4">Studio Pass (₹999)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">Live Stream Clipping</td>
                    <td className="py-3 px-4 text-emerald-400">Unlimited</td>
                    <td className="py-3 px-4 text-emerald-400">Unlimited</td>
                    <td className="py-3 px-4 text-emerald-400">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">Telegram Bot Alerts</td>
                    <td className="py-3 px-4">Included</td>
                    <td className="py-3 px-4">Included</td>
                    <td className="py-3 px-4">VIP Priority Relay</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">Watermark Free</td>
                    <td className="py-3 px-4 text-emerald-400">Yes</td>
                    <td className="py-3 px-4 text-emerald-400">Yes</td>
                    <td className="py-3 px-4 text-emerald-400">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── 9. "CHOOSE ONE OF OUR PROGRAMS" CARDS (VIDEO 00:36 - 00:43) ──────── */}
      <section id="programs" className="py-24 border-t border-white/5 bg-[#07090E] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Choose one of our programs
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                What is your experience and what do you prefer?
              </p>
            </div>
          </ScrollReveal>

          {/* Program Card Tabs (Copper 4, Bronze 3, Silver 2, Gold 1, Diamond) */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { id: 4, name: 'Copper 4', tag: 'Beginner' },
                { id: 3, name: 'Bronze 3', tag: 'VIP Pass' },
                { id: 2, name: 'Silver 2', tag: 'Pro Stream' },
                { id: 1, name: 'Gold 1', tag: 'Studio Pass' },
                { id: 0, name: 'Diamond', tag: 'Enterprise' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgram(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedProgram === p.id
                      ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-lg shadow-emerald-500/10 scale-105'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-lg font-black font-mono">{p.id === 0 ? '💎' : p.id}</div>
                  <div className="text-[10px] font-bold truncate">{p.name}</div>
                </button>
              ))}
            </div>

            {/* Active Program Card with Glowing Circuit Trace Lines */}
            <ScrollReveal direction="zoom" delay={150}>
              <div className="rounded-3xl bg-[#0D121D] border border-emerald-500/40 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/5 font-mono select-none pointer-events-none">
                  {selectedProgram === 0 ? 'D' : selectedProgram}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300">
                    {selectedProgram === 4 && '14-Day Free Evaluation'}
                    {selectedProgram === 3 && 'VIP Pass (₹29) 1 Month'}
                    {selectedProgram === 2 && 'Pro Monthly (₹149)'}
                    {selectedProgram === 1 && 'Quarterly Broadcast (₹449)'}
                    {selectedProgram === 0 && 'Annual Studio Pass (₹999)'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">★★★★★ Verified Program</span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  {selectedProgram === 4 && 'Free Evaluation Program'}
                  {selectedProgram === 3 && 'VIP Starter Program'}
                  {selectedProgram === 2 && 'Streamer Relay Program'}
                  {selectedProgram === 1 && 'Studio Creator Program'}
                  {selectedProgram === 0 && 'Diamond Enterprise Program'}
                </h3>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-lg">
                  Designed for YouTube streamers and editor teams seeking instant highlight capture, zero streaming limits, and automated Telegram bot dispatch.
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 hover:scale-105 transition shadow-lg shadow-emerald-400/20"
                  >
                    LEARN MORE &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
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
              Creators from more than 150 countries around the world have registered!
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250}>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Registration Ends In:
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
            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition"
              >
                Try for free
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 transition shadow-lg"
              >
                I want to join
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 11. "WHY CHOOSE DIGICAST?" 4 BENTO CARDS (VIDEO 00:49-00:56) ─────── */}
      <section id="why-digicast" className="py-24 border-t border-white/5 bg-[#080B12] relative z-10">
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
                We started developing live streaming capture tools after seeing hundreds of top streamers lose their best highlight moments without automated editor relay. Today, Digicast powers multi-channel broadcasting teams across 150+ countries.
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
                Digicast Studio Console
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
                href="https://t.me/digicast_support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 hover:scale-105 transition shadow-lg shadow-emerald-400/20"
              >
                <span>Join Community</span>
                <Send className="h-3.5 w-3.5" />
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Global Multi-Column Footer */}
        <ScrollReveal direction="up" delay={200}>
          <footer className="mt-24 pt-12 border-t border-white/5 text-xs text-slate-500 max-w-6xl mx-auto px-6 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-12">
              <div className="space-y-2">
                <p className="font-bold text-white">Programs</p>
                <p><a href="#pricing" className="hover:text-slate-300">Starter 14-Day</a></p>
                <p><a href="#pricing" className="hover:text-slate-300">VIP Pass (₹29)</a></p>
                <p><a href="#pricing" className="hover:text-slate-300">Monthly Pass (₹149)</a></p>
                <p><a href="#pricing" className="hover:text-slate-300">Annual Studio (₹999)</a></p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white">About Us</p>
                <p><a href="#faq" className="hover:text-slate-300">FAQ</a></p>
                <p><a href="#how-it-works" className="hover:text-slate-300">How It Works</a></p>
                <p><a href="#reviews" className="hover:text-slate-300">Creator Reviews</a></p>
                <p><a href="#about-us" className="hover:text-slate-300">Our Story</a></p>
                <p>
                  <a
                    href="https://t.me/digicast_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 text-slate-300 transition flex items-center gap-1"
                  >
                    <span>Support Bot</span>
                    <span className="text-[10px] font-mono text-emerald-400">(@digicast_bot)</span>
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white">Legal</p>
                <p><Link href="/terms" className="hover:text-slate-300">Terms of Service</Link></p>
                <p><Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link></p>
                <p><Link href="/refund" className="hover:text-slate-300">Refund Policy</Link></p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white">Support</p>
                <p className="text-slate-400 font-mono">support@digicast.app</p>
                <p>
                  <a
                    href="https://t.me/digicast_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 text-emerald-400 font-mono flex items-center gap-1"
                  >
                    <span>Telegram Support Bot</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="text-emerald-400 font-mono">★ Trustpilot 4.8 / 5</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 gap-3">
              <p>&copy; 2026 Digicast Live Technologies. All rights reserved.</p>
              <p className="font-mono">Decoupled Architecture &bull; Vercel Edge Deployed</p>
            </div>
          </footer>
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