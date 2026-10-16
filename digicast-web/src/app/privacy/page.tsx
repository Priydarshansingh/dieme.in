import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Digicast',
  description: 'Privacy Policy detailing data collection, local processing guarantees, and user rights for Digicast Creator Studio.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-20 w-full flex-1">
        <div className="mb-12 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
            <Lock className="w-3.5 h-3.5" />
            DATA PROTECTION &amp; PRIVACY
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono">
            Last Updated: October 2026 &bull; Version 2.4
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              When you create an account or sign in to Digicast, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><b>Account Information:</b> Name, Gmail address, profile display name, and workspace identifier.</li>
              <li><b>Workspace Data:</b> Stream marker timestamps, clip labels, and invited editor credentials.</li>
              <li><b>Payment Records:</b> Transaction reference numbers (UTR), submitted receipts, and duration pass tiers for billing verification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Local-First Processing Guarantee</h2>
            <p>
              Digicast is built with a local-first privacy architecture. Stream markers and chat messages processed during live broadcasts are parsed in-memory and cached in local encrypted databases on your client device.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How We Use Your Data</h2>
            <p>
              We use the collected information strictly to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Provide real-time broadcast synchronization between your workspace and mobile companion apps.</li>
              <li>Verify duration pass subscriptions and process grace period activations.</li>
              <li>Authenticate team editor roles and secure workspace data against cross-account leakage.</li>
              <li>Provide automated customer support and ticket routing via our official Telegram bot.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Zero Data Selling &amp; Third-Party Sharing</h2>
            <p>
              We never sell, rent, or trade your personal data, stream markers, or team credentials to advertisers or third-party brokers. Data is stored securely in Google Cloud infrastructure with strict role-based access control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Your Data Rights &amp; Deletion Requests</h2>
            <p>
              You have the right to request a complete copy of your workspace data or ask for total account deletion at any time. Simply message our official support bot at{' '}
              <a href="https://t.me/YT_digicast?start=help" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">
                @YT_digicast
              </a>{' '}
              or email our compliance desk.
            </p>
          </section>
        </div>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
