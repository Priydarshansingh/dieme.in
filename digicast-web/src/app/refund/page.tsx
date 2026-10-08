import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, RefreshCw, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';

export const metadata: Metadata = {
  title: 'Refund Policy & Dispute Resolution — Digicast',
  description: 'Refund policy, payment dispute handling, and grace period guidelines for Digicast Creator Studio.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#07080C] text-[#F8FAFC] selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07080C]/80 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <DigicastBrandLogo size="md" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mb-12 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400 mb-4">
            <RefreshCw className="w-3.5 h-3.5" />
            TRANSPARENT BILLING GUIDELINES
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Refund & Cancellation Policy
          </h1>
          <p className="text-slate-400 text-sm font-mono">
            Last Updated: October 2026 • Version 2.4
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Duration Pass Nature & Instant Access</h2>
            <p>
              Digicast access passes (such as the ₹29 First Month VIP Pass, ₹149 1 Month Unlimited Pass, ₹499 3 Month Quarter Pass, and ₹999 1 Year Annual Studio Pass) provide immediate digital activation and instant 24-hour grace periods upon proof submission.
            </p>
            <p>
              Due to the immediate provisioning of digital studio resources and stream synchronization capacity, passes are generally non-refundable once activated and utilized.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Eligible Refund Circumstances</h2>
            <p>
              We want every creator to have an exceptional experience. You are entitled to a full refund or subscription extension under the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><b>Duplicate Transactions:</b> If you were charged multiple times for the same duration pass due to a UPI banking delay.</li>
              <li><b>System Verification Failure:</b> If payment was deducted but your workspace was not provisioned within 24 hours and could not be resolved by support.</li>
              <li><b>Technical Incompatibility:</b> If Digicast is fundamentally unable to synchronize with your verified YouTube broadcast due to a core platform outage.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How to Request a Refund or Plan Correction</h2>
            <p>
              To request a review or plan correction, send a message to our official Telegram support bot at <a href="https://t.me/digicast_bot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">@digicast_bot</a> or use the command <code>/support &lt;details&gt;</code> with your:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Registered Gmail address and Workspace ID.</li>
              <li>12-digit UPI UTR number and transaction receipt.</li>
              <li>Brief explanation of the dispute.</li>
            </ul>
            <p>
              Our support team investigates and responds to all ticket reviews within 12–24 business hours.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/[0.08] bg-[#07080C] text-xs text-slate-500 font-mono">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DigicastBrandLogo size="sm" />
            <span className="text-slate-700">|</span>
            <span>© 2026 Digicast Technologies. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/refund" className="hover:text-white transition">Refund</Link>
            <Link href="/contact" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
