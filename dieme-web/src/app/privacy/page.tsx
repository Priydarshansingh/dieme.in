import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Shield, CheckCircle, ExternalLink, Globe } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Dieme',
  description: 'Privacy Policy and Google API Services User Data Policy disclosures for Dieme Creator Studio.',
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
            OFFICIAL PRIVACY POLICY &bull; DIEME
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono">
            Operating Entity: Dieme (&quot;Dieme Creator Studio&quot;) &bull; Last Updated: November 2026 &bull; Version 3.1
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              1. Overview &amp; Introduction
            </h2>
            <p>
              This Privacy Policy explains how <b>Dieme</b> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and safeguards information through our streaming companion application <b>Dieme</b> (accessible at{' '}
              <a href="https://www.dieme.in" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                https://www.dieme.in
              </a>).
            </p>
            <p>
              We are committed to full transparency and protecting creator privacy, adhering strictly to the Google API Services User Data Policy and applicable data protection regulations.
            </p>
          </section>

          {/* Section 2: YouTube API Services & Google User Data */}
          <section className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              2. YouTube API Services &amp; Google User Data Disclosures
            </h2>
            <p>
              Dieme uses <b>YouTube API Services</b> (YouTube Data API v3) to enable live stream detection, real-time broadcast marker tagging, and creator workspace synchronization.
            </p>
            <div className="space-y-2 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10 font-mono text-slate-300">
              <p className="font-bold text-white">By using Dieme, you explicitly acknowledge and agree that:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
                <li>
                  Our application accesses YouTube API Services. You are agreeing to be bound by the{' '}
                  <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-bold inline-flex items-center gap-0.5">
                    YouTube Terms of Service <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
                <li>
                  Your data is collected and processed in accordance with the{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-bold inline-flex items-center gap-0.5">
                    Google Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
                <li>
                  <b>Revocation of Access:</b> You can revoke Dieme&apos;s access to your Google/YouTube account data at any time via the official Google Security Settings at{' '}
                  <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold inline-flex items-center gap-0.5">
                    https://myaccount.google.com/permissions <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Google API Limited Use Requirements */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Google API Services Limited Use Policy Compliance</h2>
            <p>
              Dieme&apos;s use and transfer to any other app of information received from Google APIs will strictly adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the <b>Limited Use</b> requirements:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>We only request scopes necessary to provide stream synchronization and marker tagging features.</li>
              <li>We <b>never sell</b> Google user data or YouTube data to data brokers, advertising platforms, or third parties.</li>
              <li>We do not use Google user data for serving personalized advertising or building user advertising profiles.</li>
              <li>Humans will not read your Google account data unless you explicitly give prior affirmative consent for troubleshooting or security reviews.</li>
            </ul>
          </section>

          {/* Section 4: Data Collected */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><b>Profile Data:</b> Your name, Google email address, and profile photo provided via Google Sign-In.</li>
              <li><b>YouTube Metadata:</b> Channel title, active live stream status, broadcast titles, and video IDs required for marker synchronization.</li>
              <li><b>Workspace Data:</b> Creator clip timestamps, labels, and authorized editor team logins.</li>
              <li><b>Payment Records:</b> UPI transaction reference numbers (UTR) and pass durations for subscription ledger verification.</li>
            </ul>
          </section>

          {/* Section 5: Local-First Privacy Architecture */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Local-First Processing Architecture</h2>
            <p>
              Dieme processes stream clip markers and audio/video trims locally on your device via hardware acceleration. Raw video streams are never stored on our central servers, guaranteeing creator data ownership and zero cross-account data leakage.
            </p>
          </section>

          {/* Section 6: Data Retention & Deletion */}
          <section className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              6. Data Retention, User Rights &amp; Deletion Requests
            </h2>
            <p>
              You maintain total ownership of your data. You may request immediate deletion of your entire workspace and cached YouTube tokens at any time.
            </p>
            <p>
              To request complete deletion of your account and all associated data, submit a request to our compliance desk:
            </p>
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 font-mono text-xs space-y-1">
              <p><b className="text-slate-400">Email:</b> <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a></p>
              <p><b className="text-slate-400">Website:</b> <a href="https://www.dieme.in" className="text-cyan-400 hover:underline">https://www.dieme.in</a></p>
              <p><b className="text-slate-400">Response SLA:</b> Account deletion requests are processed within 24–48 hours.</p>
            </div>
          </section>

          {/* Section 7: Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Contact Information</h2>
            <p>
              For legal, privacy, or compliance inquiries, contact:
            </p>
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-1 text-slate-300">
              <p><b className="text-slate-400">Entity:</b> Dieme Creator Studio</p>
              <p><b className="text-slate-400">Authorized Domains:</b> dieme.in &bull; www.dieme.in</p>
              <p><b className="text-slate-400">Support &amp; Compliance:</b> <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a></p>
              <p><b className="text-slate-400">Website:</b> <a href="https://www.dieme.in" className="text-cyan-400 hover:underline">https://www.dieme.in</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
