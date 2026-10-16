import type { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Refund Policy & Dispute Resolution — Digicast',
  description: 'Refund policy, payment dispute handling, and grace period guidelines for Digicast Creator Studio.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-20 w-full flex-1">
        <div className="mb-12 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400 mb-4">
            <RefreshCw className="w-3.5 h-3.5" />
            TRANSPARENT BILLING GUIDELINES
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono">
            Last Updated: October 2026 &bull; Version 2.4
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Duration Pass Nature &amp; Instant Access</h2>
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
              To request a review or plan correction, send a message to our official Telegram support bot at{' '}
              <a href="https://t.me/YT_digicast?start=help" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">
                @YT_digicast
              </a>{' '}
              or use the command <code>/support &lt;details&gt;</code> with your:
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

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
