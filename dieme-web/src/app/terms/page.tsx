import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ExternalLink, Shield, CheckCircle, Scale } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — Dieme',
  description: 'Terms of Service, acceptable use policy, DPDP Act compliance, and YouTube API Services agreements for Dieme Creator Studio.',
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
            LEGAL AGREEMENT &bull; DIEME
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono">
            Operating Entity: Dieme (&quot;Dieme Creator Studio&quot;) &bull; Last Updated: November 2026 &bull; Version 3.2
          </p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Dieme Web Dashboard, mobile companion applications, or associated APIs (collectively, the &quot;Service&quot;) operated by <b>Dieme</b> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service, our{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>, and our{' '}
              <Link href="/refund" className="text-emerald-400 hover:underline">
                Refund Policy
              </Link>
              . If you do not agree to all terms, you may not access or use the Service.
            </p>
          </section>

          {/* Mandatory YouTube API Services Agreement */}
          <section className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              2. YouTube API Services &amp; Google Developer Terms Agreement
            </h2>
            <p>
              Dieme uses <b>YouTube API Services</b> (YouTube Data API v3) to detect active live broadcasts, sync stream timestamps, and enable instant highlight clipping.
            </p>
            <div className="space-y-2 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10 font-mono text-slate-300">
              <p className="font-bold text-white">By using Dieme, you explicitly agree and acknowledge:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
                <li>
                  You agree to be bound by the{' '}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline font-bold inline-flex items-center gap-0.5"
                  >
                    YouTube Terms of Service <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
                <li>
                  Your user data is handled and processed in accordance with the{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline font-bold inline-flex items-center gap-0.5"
                  >
                    Google Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
                <li>
                  <b>Revoking Access:</b> You may revoke Dieme&apos;s access to your Google / YouTube account data at any time via Google&apos;s official security settings at{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 underline font-bold inline-flex items-center gap-0.5"
                  >
                    https://myaccount.google.com/permissions <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Creator Workspaces &amp; Account Security</h2>
            <p>
              When creating a Dieme Workspace, you are responsible for maintaining the confidentiality of your workspace login credentials and team editor passwords. You agree to notify Dieme immediately upon discovering any unauthorized access or security breach.
            </p>
            <p>
              Workspace owners are strictly responsible for all actions taken by invited team editors and moderators within their studio workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Subscriptions, Passes &amp; Automated Verification</h2>
            <p>
              Dieme offers flexible duration access passes (including the ₹29 First Month VIP Pass, ₹149 1 Month Unlimited Pass, ₹499 3 Month Quarter Pass, and ₹999 1 Year Annual Studio Pass).
            </p>
            <p>
              Payments are verified via our direct UPI payment gateway. Submissions of payment reference numbers (UTR) trigger instant verification against our banking observers. Users also receive an immediate grace window to prevent stream workflow interruptions while automated confirmation concludes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. YouTube Content &amp; Intellectual Property</h2>
            <p>
              Dieme acts as a technical companion for stream synchronization and highlight marker tagging. You retain all intellectual property rights to your live streams, recordings, video clips, and broadcasts. You warrant that your broadcasts and content comply with YouTube Community Guidelines and applicable laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Acceptable Use &amp; Abuse Policy</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Engage in automated scraping, reverse engineering, or unauthorized API querying.</li>
              <li>Circumvent trial or duration limitations through fraudulent transaction submission.</li>
              <li>Use the Service to transmit unlawful, harmful, or copyright-infringing material.</li>
              <li>Share workspace credentials with unauthorized individuals or attempt to access other users&apos; workspaces.</li>
            </ul>
          </section>

          {/* DPDP Compliance in Terms */}
          <section className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              7. DPDP Act 2023 &amp; Data Protection Rights
            </h2>
            <p>
              Under India&apos;s Digital Personal Data Protection Act, 2023, you have the following rights as a Data Principal:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><b>Right to Access:</b> Request a summary of your personal data processed by Dieme.</li>
              <li><b>Right to Correction:</b> Request correction of inaccurate or incomplete personal data.</li>
              <li><b>Right to Erasure:</b> Request deletion of your personal data, subject to legal retention obligations.</li>
              <li><b>Right to Grievance Redressal:</b> File complaints with our Grievance Officer or the Data Protection Board of India.</li>
              <li><b>Right to Withdraw Consent:</b> Withdraw your consent for data processing at any time. Withdrawal does not affect the lawfulness of processing performed before withdrawal.</li>
            </ul>
            <p className="text-slate-400">
              Exercise these rights by contacting <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a>. All requests are resolved within 30 days.
            </p>
          </section>

          {/* Cookie Disclosure */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Cookies &amp; Local Storage</h2>
            <p>
              Dieme uses essential cookies and browser local storage for authentication, session persistence, and workspace preferences. We do not deploy tracking cookies, advertising pixels, or behavioral profiling technologies. Full details are available in our <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">9. Limitation of Liability</h2>
            <p>
              Dieme is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. We do not guarantee uninterrupted service availability during YouTube API outages, Google platform incidents, or third-party infrastructure failures. Our total liability is limited to the amount paid for your current active subscription pass.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">10. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from the use of Dieme shall be subject to the exclusive jurisdiction of courts in India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">11. Governing Entity &amp; Inquiries</h2>
            <p>
              For legal notices, licensing inquiries, or support requests, contact:
            </p>
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-1 text-slate-300">
              <p><b className="text-slate-400">Entity:</b> Dieme Creator Studio</p>
              <p><b className="text-slate-400">Authorized Domains:</b> dieme.in &bull; www.dieme.in</p>
              <p><b className="text-slate-400">Compliance &amp; Grievance Officer:</b> <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a></p>
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
