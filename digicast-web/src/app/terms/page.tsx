import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — Digicast',
  description: 'Terms of Service, acceptable use policy, and workspace licensing agreements for Digicast Creator Studio.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-20 w-full flex-1">
        <div className="mb-12 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
            <FileText className="w-3.5 h-3.5" />
            LEGAL AGREEMENT
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono">
            Last Updated: October 2026 &bull; Version 2.4
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Digicast Web Dashboard, mobile companion applications, or associated Telegram Bot services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Creator Workspaces &amp; Account Security</h2>
            <p>
              When creating a Digicast Workspace, you are responsible for maintaining the confidentiality of your workspace login credentials and team editor passwords. You agree to notify Digicast immediately via our official support bot (<code>@YT_digicast</code>) upon discovering any unauthorized access or security breach.
            </p>
            <p>
              Workspace owners are strictly responsible for all actions taken by invited team editors and moderators within their studio workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Access Passes &amp; Subscription Durations</h2>
            <p>
              Digicast offers flexible duration access passes (including the ₹29 First Month VIP Pass, ₹149 1 Month Unlimited Pass, ₹499 3 Month Quarter Pass, and ₹999 1 Year Annual Studio Pass).
            </p>
            <p>
              Submissions of payment receipts grant an immediate 24-hour grace pass to prevent workflow interruption while administrative verification of UPI UTR numbers is completed. Digicast reserves the right to suspend accounts that abuse grace period submissions without authentic payment proof.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. YouTube Content &amp; Intellectual Property</h2>
            <p>
              Digicast acts as a technical companion for stream synchronization and highlight marker tagging. You retain all intellectual property rights to your live streams, recordings, video clips, and broadcasts. You warrant that your broadcasts and content comply with YouTube Community Guidelines and applicable laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Acceptable Use &amp; Abuse Policy</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Engage in automated scraping, reverse engineering, or unauthorized API querying.</li>
              <li>Circumvent trial limitations through duplicate account cycling.</li>
              <li>Use the Service to transmit unlawful, harmful, or copyright-infringing material.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Service Modifications &amp; Inquiries</h2>
            <p>
              Digicast reserves the right to modify or discontinue features with prior notice. For legal questions or licensing inquiries, contact us via Telegram at{' '}
              <a href="https://t.me/YT_digicast?start=help" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">
                @YT_digicast
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
