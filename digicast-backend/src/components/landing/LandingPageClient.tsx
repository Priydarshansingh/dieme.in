'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import LiquidOrbCanvas from './LiquidOrbCanvas';
import { PRICING_PLANS } from '@/lib/pricingPlans';

interface FaqItem {
  q: string;
  a: string;
}

interface LandingPageClientProps {
  faqs?: FaqItem[];
}

export default function LandingPageClient({ faqs = [] }: LandingPageClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [tradingDropdownOpen, setTradingDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('ENG');

  return (
    <div className="relative min-h-screen bg-[#07080D] text-[#F8FAFC] font-sans antialiased selection:bg-amber-500/20 selection:text-amber-200 overflow-x-hidden">
      {/* ── Background Subtle Cosmic Starfield ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── 1. NAVBAR (EXACT REPLICA FROM VIDEO) ───────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#07080D]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Left Brand: Liquid Brokers / Digicast Live */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500/40 via-yellow-400/20 to-transparent border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Digicast <span className="font-normal text-slate-400 text-xs">Live</span>
            </span>
          </Link>

          {/* Center Links (About, Trading ▾, Contact, FAQ, ENG ▾) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition">
              About
            </a>

            {/* Features / Trading Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTradingDropdownOpen(!tradingDropdownOpen)}
                className="flex items-center gap-1 hover:text-white transition"
              >
                <span>Features</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {tradingDropdownOpen && (
                <div className="absolute top-full mt-2 w-48 rounded-2xl bg-[#0D0F16] border border-white/10 p-2 shadow-2xl space-y-1">
                  <a
                    href="#features"
                    onClick={() => setTradingDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-slate-300 hover:text-white"
                  >
                    Ultra-Low Latency RTMP
                  </a>
                  <a
                    href="#features"
                    onClick={() => setTradingDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-slate-300 hover:text-white"
                  >
                    Highlight Clip Markers
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setTradingDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-slate-300 hover:text-white"
                  >
                    Creator Subscription Passes
                  </a>
                </div>
              )}
            </div>

            <a href="#contact" className="hover:text-white transition">
              Contact
            </a>

            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>

            {/* Language Selector (ENG ▾) */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition font-mono uppercase"
              >
                <span>{selectedLang}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {langDropdownOpen && (
                <div className="absolute top-full mt-2 w-24 rounded-xl bg-[#0D0F16] border border-white/10 p-1 shadow-2xl">
                  {['ENG', 'HIN', 'ESP'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action: Login text link + White rounded Sign up pill button */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Login
            </Link>

            <Link
              href="/login"
              className="px-6 py-2 rounded-full text-xs font-semibold text-black bg-white hover:bg-slate-200 shadow-md shadow-white/10 transition duration-150"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#07080D] border-b border-white/5 px-6 py-6 space-y-4 text-sm font-medium">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              About
            </a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Features
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Pricing Passes
            </a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              Contact
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300">
              FAQ
            </a>
            <div className="pt-4 flex items-center gap-4">
              <Link href="/login" className="text-xs text-slate-300">
                Login
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 rounded-full text-xs font-bold text-black bg-white"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (EXACT COMPOSITION FROM VIDEO) ─────────────────── */}
      <section className="relative min-h-screen pt-32 pb-20 flex flex-col items-center justify-between overflow-hidden">
        {/* Background 3D Liquid Molten Gold & Obsidian Orb Canvas */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <LiquidOrbCanvas />
        </div>

        {/* Center Text & Heading */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 mt-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            Elevate Your <br />
            Streaming Experience
          </h1>

          <p className="mt-5 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
            Unlock your streaming potential in a fully integrated, ultra-low latency environment, powered by Digicast Studio.
          </p>

          {/* Central Glass CTA Button (Exact from video: "Sign Up & Trade") */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs font-semibold text-white bg-white/5 border border-white/15 backdrop-blur-xl hover:bg-white/10 hover:border-white/25 transition shadow-2xl shadow-black/80"
            >
              <span>Sign Up &amp; Stream</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* The Two Floating Glass Cards Flanking the Liquid Molten Orb */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 pointer-events-none mt-12 mb-6">
          {/* Floating Card 1 (Left): Trading Pairs / Unparalleled Market Access 300+ */}
          <div className="flex justify-start md:translate-y-8 pointer-events-auto">
            <div className="w-full max-w-xs rounded-2xl bg-[#0D0F16]/80 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Streaming Pairs
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Unparalleled Market Access
              </h3>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Global Relays</span>
                <span className="text-xs font-bold text-white font-mono bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  300+
                </span>
              </div>
            </div>
          </div>

          {/* Floating Card 2 (Right): Trading Rate 96% with Progress Bar */}
          <div className="flex justify-end md:translate-y-8 pointer-events-auto">
            <div className="w-full max-w-xs rounded-2xl bg-[#0D0F16]/80 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Streaming Rate
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white font-mono">96%</span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">Stable 60 FPS</span>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 rounded-full w-[96%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES SECTION (CLEAN MONOCHROME OBSIDIAN) ────────────────── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Core Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Engineered for High-Stakes Broadcasting
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Designed for YouTube livestreamers, esports competitions, and distributed production teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Sub-Second Marker Sync',
              desc: 'Streamers drop highlights from phone or web while broadcasting. Captured moments reach video editors in under 400 milliseconds.',
              icon: Zap,
            },
            {
              title: 'Zero-Quota Telegram Bot',
              desc: 'Instant highlight alerts posted to your private production group with one-tap timestamp replay jump links.',
              icon: ShieldCheck,
            },
            {
              title: 'Multi-Role Workspace',
              desc: 'Dedicated logins for studio owners, live broadcasters, and video editing staff with separate permissions.',
              icon: Layers,
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#0D0F16]/60 border border-white/5 p-6 space-y-3 hover:border-white/10 transition"
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. SUBSCRIPTION PASSES MATRIX (PRICING) ────────────────────────── */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Membership Plans
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Clear, Transparent Creator Passes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Activate with instant UPI confirmation and zero recurring surprise charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between border transition ${
                plan.recommended
                  ? 'bg-[#0E121B] border-white/20 shadow-xl'
                  : 'bg-[#0A0C13] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="space-y-3">
                {plan.badge && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white font-mono">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                <div className="pt-2">
                  <span className="text-2xl font-black text-white font-mono">₹{plan.priceINR}</span>
                  <span className="text-xs text-slate-500 ml-1">{plan.periodLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{plan.description}</p>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  className={`w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center transition ${
                    plan.recommended
                      ? 'bg-white text-black hover:bg-slate-200'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  Activate Pass
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FAQ SECTION ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Support &amp; Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-white/5 border-y border-white/5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-5">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-white hover:text-slate-300 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {activeFaq === idx && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed pr-8">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. FOOTER ──────────────────────────────────────────────────────── */}
      <footer id="contact" className="py-12 border-t border-white/5 bg-[#05060A] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Digicast Live</span>
            <span>&bull;</span>
            <span>Creator Studio &amp; Real-time Companion</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition">
              Terms
            </Link>
            <Link href="/refund" className="hover:text-slate-300 transition">
              Refunds
            </Link>
            <Link href="/godpanel" className="hover:text-slate-300 transition font-mono">
              Admin GodPanel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}