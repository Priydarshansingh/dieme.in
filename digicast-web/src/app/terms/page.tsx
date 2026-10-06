import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, FileText, ArrowLeft, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Digicast',
  description: 'Terms of Service, acceptable use policy, and workspace licensing agreements for Digicast Creator Studio.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07080C] text-[#F8FAFC] selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07080C]/80 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Digicast Logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-extrabold text-lg text-white">DIGICAST</span>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 mb-4">
            <FileText className="w-3.5 h-3.5" />
            LEGAL AGREEMENT
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm font-mono">
            Last Updated: October 2026 • Version 2.4
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
            <h2 className="text-lg font-bold text-white">2. Creator Workspaces & Account Security</h2>
            <p>
              When creating a Digicast Workspace, you are responsible for maintaining the confidentiality of your workspace login credentials and team editor passwords. You agree to notify Digicast immediately via our official support bot (<code>@digicast_bot</code>) upon discovering any unauthorized access or security breach.
            </p>
            <p>
              Workspace owners are strictly responsible for all actions taken by invited team editors and moderators within their studio workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Access Passes & Subscription Durations</h2>
            <p>
              Digicast offers flexible duration access passes (including the ₹29 First Month VIP Pass, ₹149 1 Month Unlimited Pass, ₹499 3 Month Quarter Pass, and ₹999 1 Year Annual Studio Pass).
            </p>
            <p>
              Submissions of payment receipts grant an immediate 24-hour grace pass to prevent workflow interruption while administrative verification of UPI UTR numbers is completed. Digicast reserves the right to suspend accounts that abuse grace period submissions without authentic payment proof.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. YouTube Content & Intellectual Property</h2>
            <p>
              Digicast acts as a technical companion for stream synchronization and highlight marker tagging. You retain all intellectual property rights to your live streams, recordings, video clips, and broadcasts. You warrant that your broadcasts and content comply with YouTube Community Guidelines and applicable laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Acceptable Use & Abuse Policy</h2>
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
            <h2 className="text-lg font-bold text-white">6. Service Modifications & Inquiries</h2>
            <p>
              Digicast reserves the right to modify or discontinue features with prior notice. For legal questions or licensing inquiries, contact us via Telegram at <a href="https://t.me/digicast_bot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">@digicast_bot</a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/[0.08] bg-[#07080C] text-xs text-slate-500 font-mono text-center">
        <p>© 2026 Digicast Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
