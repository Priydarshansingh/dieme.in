import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Shield, CheckCircle, ExternalLink, Globe, Cookie, Scale } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Dieme',
  description: 'Privacy Policy, DPDP Act compliance, cookie disclosures, and Google API Services User Data Policy for Dieme Creator Studio.',
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
            Operating Entity: Dieme (&quot;Dieme Creator Studio&quot;) &bull; Last Updated: November 2026 &bull; Version 3.2
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
              This Privacy Policy explains how <b>Dieme</b> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and safeguards information through our creator studio application <b>Dieme</b> (accessible at{' '}
              <a href="https://www.dieme.in" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                https://www.dieme.in
              </a>).
            </p>
            <p>
              We are committed to full transparency and protecting creator privacy, adhering strictly to the Google API Services User Data Policy, the Digital Personal Data Protection (DPDP) Act 2023, and applicable data protection regulations.
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

            {/* Explicit Scope Disclosures for Google OAuth Verification */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400">
                Specific YouTube API Scopes Requested &amp; Data Usage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="font-mono font-bold text-cyan-300 break-all">
                    https://www.googleapis.com/auth/youtube.readonly
                  </div>
                  <p className="text-slate-300">
                    <b>Purpose:</b> Read-only access to verify channel ownership, fetch active live broadcasts, view stream metrics (viewer count, likes), and synchronize broadcast start times.
                  </p>
                  <p className="text-slate-400">
                    <b>Data Processed:</b> Channel ID, Channel Title, Thumbnail URL, Active Live Broadcast IDs, and View Counts.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="font-mono font-bold text-cyan-300 break-all">
                    https://www.googleapis.com/auth/youtube.force-ssl
                  </div>
                  <p className="text-slate-300">
                    <b>Purpose:</b> Secure read and interactive management of live chat streams during live broadcasts to detect <code>!clip</code> trigger commands and post automated clip confirmation messages.
                  </p>
                  <p className="text-slate-400">
                    <b>Data Processed:</b> Live stream chat message timestamps, author display names, and trigger commands.
                  </p>
                </div>
              </div>
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
              <li><b>Device Information:</b> Device type, operating system version, and app version for crash reporting and compatibility.</li>
            </ul>
          </section>

          {/* Section 5: Cookies & Tracking */}
          <section className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cookie className="w-4 h-4 text-amber-400" />
              5. Cookies &amp; Tracking Technologies
            </h2>
            <p>
              Dieme uses strictly essential cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><b>Authentication Cookies:</b> Firebase session tokens to maintain your signed-in state.</li>
              <li><b>Preference Cookies:</b> Workspace layout, theme, and dashboard configuration stored in <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">localStorage</code>.</li>
              <li><b>Security Cookies:</b> CSRF protection tokens for API route authentication.</li>
            </ul>
            <p className="text-slate-400">
              We do <b>not</b> use advertising cookies, third-party tracking pixels, behavioral analytics, or fingerprinting technologies. No data is shared with ad networks or data brokers.
            </p>
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 font-mono text-xs space-y-1">
              <p><b className="text-amber-400">Cookie Retention:</b> Session cookies expire when you close the browser. Authentication tokens are valid for up to 30 days or until you sign out.</p>
              <p><b className="text-amber-400">Opt-Out:</b> You can clear cookies at any time via your browser settings. Disabling essential cookies may prevent sign-in functionality.</p>
            </div>
          </section>

          {/* Section 6: Local-First Privacy Architecture */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Local-First Processing Architecture</h2>
            <p>
              Dieme processes stream clip markers and audio/video trims locally on your device via hardware acceleration. Raw video streams are never stored on our central servers, guaranteeing creator data ownership and zero cross-account data leakage.
            </p>
          </section>

          {/* Section 7: DPDP Act 2023 Compliance */}
          <section className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              7. Digital Personal Data Protection (DPDP) Act 2023 Compliance
            </h2>
            <p>
              Dieme is committed to compliance with India&apos;s <b>Digital Personal Data Protection Act, 2023</b>. As a Data Fiduciary, we uphold the following obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
              <li><b>Lawful Purpose:</b> Personal data is collected and processed only for providing the Dieme creator studio service, subscription management, and YouTube API integration. No data is processed beyond these stated purposes.</li>
              <li><b>Informed Consent:</b> We obtain verifiable consent before collecting personal data. You may withdraw consent at any time by deleting your account or revoking Google permissions.</li>
              <li><b>Data Principal Rights:</b> You have the right to access, correct, and erase your personal data. Submit requests to <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a> for processing within 72 hours.</li>
              <li><b>Data Minimization:</b> We collect only the minimum data necessary for service delivery. No surplus personal data is stored or retained.</li>
              <li><b>Security Safeguards:</b> All data in transit is encrypted via TLS 1.3. Data at rest in Firestore is encrypted using Google Cloud&apos;s default encryption. Access controls follow the principle of least privilege.</li>
              <li><b>Breach Notification:</b> In the event of a personal data breach, we will notify affected users and the Data Protection Board of India within 72 hours as required under Section 8 of the DPDP Act.</li>
              <li><b>Children&apos;s Data:</b> Dieme does not knowingly collect personal data from individuals under the age of 18 without verifiable parental consent. If we become aware of such collection, the data will be deleted immediately.</li>
              <li><b>Cross-Border Transfer:</b> Personal data may be processed by Google Cloud (Firebase) infrastructure located outside India. Such transfers comply with DPDP Act provisions and Google&apos;s data processing agreements.</li>
            </ul>
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 font-mono text-xs space-y-1">
              <p><b className="text-cyan-400">Grievance Officer:</b> For DPDP-related grievances or data subject requests, contact our designated officer at <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a>.</p>
              <p><b className="text-cyan-400">Response Timeline:</b> All data principal requests are acknowledged within 48 hours and resolved within 30 days.</p>
            </div>
          </section>

          {/* Section 8: Data Retention & Deletion */}
          <section className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              8. Data Retention, User Rights &amp; Deletion Requests
            </h2>
            <p>
              You maintain total ownership of your data. You may request immediate deletion of your entire workspace and cached YouTube tokens at any time.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Active workspace data is retained for the duration of your subscription.</li>
              <li>Upon account deletion, all personal data, clip markers, and workspace records are permanently erased within 30 days.</li>
              <li>YouTube OAuth tokens are revoked and purged immediately upon disconnection.</li>
              <li>Payment UTR records are retained for 180 days for dispute resolution, then permanently deleted.</li>
            </ul>
            <p>
              To request complete deletion of your account and all associated data, submit a request to our compliance desk:
            </p>
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 font-mono text-xs space-y-1">
              <p><b className="text-slate-400">Email:</b> <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a></p>
              <p><b className="text-slate-400">Website:</b> <a href="https://www.dieme.in" className="text-cyan-400 hover:underline">https://www.dieme.in</a></p>
              <p><b className="text-slate-400">Response SLA:</b> Account deletion requests are processed within 24–48 hours.</p>
            </div>
          </section>

          {/* Section 9: Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">9. Contact Information</h2>
            <p>
              For legal, privacy, DPDP compliance, or data protection inquiries, contact:
            </p>
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-1 text-slate-300">
              <p><b className="text-slate-400">Entity:</b> Dieme Creator Studio</p>
              <p><b className="text-slate-400">Authorized Domains:</b> dieme.in &bull; www.dieme.in</p>
              <p><b className="text-slate-400">Developer Contact (Google OAuth):</b> <a href="mailto:johnykand8@gmail.com" className="text-emerald-400 hover:underline">johnykand8@gmail.com</a></p>
              <p><b className="text-slate-400">Grievance / Compliance Officer:</b> <a href="mailto:support@dieme.in" className="text-emerald-400 hover:underline">support@dieme.in</a></p>
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
