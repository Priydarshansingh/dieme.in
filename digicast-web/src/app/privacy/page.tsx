import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, ArrowLeft, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Digicast',
  description: 'Privacy Policy detailing data collection, local processing guarantees, and user rights for Digicast Creator Studio.',
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
            <Lock className="w-3.5 h-3.5" />
            DATA PROTECTION & PRIVACY
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm font-mono">
            Last Updated: October 2026 • Version 2.4
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
            <h2 className="text-lg font-bold text-white">4. Zero Data Selling & Third-Party Sharing</h2>
            <p>
              We never sell, rent, or trade your personal data, stream markers, or team credentials to advertisers or third-party brokers. Data is stored securely in Google Cloud infrastructure with strict role-based access control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Your Data Rights & Deletion Requests</h2>
            <p>
              You have the right to request a complete copy of your workspace data or ask for total account deletion at any time. Simply message our official support bot at <a href="https://t.me/digicast_bot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">@digicast_bot</a> or email our compliance desk.
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
