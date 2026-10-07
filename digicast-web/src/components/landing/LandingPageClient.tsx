'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, Award, Laptop,
  Activity, Check, ExternalLink, ChevronDown,
  Smartphone, ArrowRight, Menu, X
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricingPlans';
import { DigicastSidebarLogo } from '@/components/brand/DigicastLogo';

// --- Reused Premium Sub-Components ---
const SectionHeader = ({ label, title, subtitle }: { label: string; title: string; subtitle: string }) => (
  <div className="text-center max-w-2xl mx-auto mb-16">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10131C] border border-[#252A38] text-[9px] font-mono font-bold text-[#22D3EE] mb-4 uppercase tracking-[0.15em]">
      {label}
    </div>
    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight mb-3">
      {title}
    </h2>
    <p className="text-[#8B93A7] text-sm leading-relaxed">{subtitle}</p>
  </div>
);

export default function LandingPageClient({ faqs }: { faqs: { q: string; a: string; }[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070910] text-[#F8FAFC] font-sans">

      {/* ── BROADCAST TOP NAV ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#070910]/95 backdrop-blur-xl border-b border-[#151925]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <DigicastSidebarLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-[#8B93A7] uppercase tracking-wider">
            <Link href="#solutions" className="hover:text-[#22D3EE] transition">Broadcast Intelligence</Link>
            <Link href="#workflow" className="hover:text-[#22D3EE] transition">Team Workflow</Link>
            <Link href="#passes" className="hover:text-[#22D3EE] transition">Access Passes</Link>
            <Link href="#faq" className="hover:text-[#22D3EE] transition">FAQ</Link>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-[11px] font-bold text-[#8B93A7] hover:text-white uppercase tracking-wider transition">Sign In</Link>
            <Link href="/login" className="px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#070910] text-[11px] font-extrabold uppercase tracking-wider hover:bg-[#38bdf8] transition-all">Launch Studio</Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <section className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151925] border border-[#252A38] text-[9px] font-bold text-[#F43F5E] mb-6 uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-pulse"></span>
            14-Day Pro Trial Active For All New Studios
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            The Professional <br />
            <span className="text-[#22D3EE]">Broadcasting Command.</span>
          </h1>
          <p className="max-w-lg mx-auto text-sm text-[#8B93A7] mb-10 leading-relaxed">
            Real-time telemetry, AI chat intelligence, and instant highlight automation. Built for creators, managed by production editors.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#22D3EE] text-[#070910] font-bold text-xs uppercase tracking-wider hover:bg-[#38bdf8] transition-all">
            Start Your Free 14-Day Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ── ACCESS PASSES SECTION ───────────────────────────────────────── */}
        <section id="passes" className="mb-24 py-16 border-t border-b border-[#151925]">
          <SectionHeader label="Access Protocol" title="Workspace Access Passes" subtitle="Simple, transparent duration passes. 14-day free trial on all new registrations." />
          <div className="grid md:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.id} className="p-6 rounded-2xl bg-[#0B0D14] border border-[#151925] flex flex-col">
                <h4 className="text-[10px] font-bold text-[#8B93A7] uppercase mb-4">{plan.name}</h4>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-white">₹{plan.priceINR}</span>
                  <span className="text-xs text-[#8B93A7] font-medium">{plan.periodLabel}</span>
                </div>
                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.slice(0, 4).map((f) => (
                    <div key={f} className="flex gap-2 text-[10px] text-[#F8FAFC]">
                      <Check className="w-3 h-3 text-[#22D3EE] mt-0.5 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/login" className="block w-full py-2.5 rounded-lg border border-[#252A38] text-[11px] font-bold text-white text-center hover:bg-white hover:text-[#070910] transition">
                  {plan.id === 'studio' ? 'Contact' : 'Activate'}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#151925] py-12 px-6 bg-[#0B0D14]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
              <Image src="/logo-mark.png" alt="" width={16} height={16} />
              <span className="text-[10px] font-bold text-[#8B93A7]">DIGICAST © 2026</span>
           </div>
           <div className="flex gap-6 text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider">
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
