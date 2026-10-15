import Link from 'next/link';

export default function BackendHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-4xl space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Digicast Backend & Security Gateway
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Decoupled Node.js Microservice Hub &bull; Separate Vercel Deployment &bull; Zero-Trust Ledger
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
              API Operational
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Dual Currency</h3>
            <p className="text-2xl font-bold text-white">10 D = 1 DP = ₹1</p>
            <p className="text-xs text-slate-400">Tamper-proof double-entry ledger. External bank withdrawals blocked.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Ad-Watch Passes</h3>
            <p className="text-2xl font-bold text-white">24h Access</p>
            <p className="text-xs text-slate-400">Cryptographically signed nonces grant 24h uninterrupted stream intelligence.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Monetization KPI</h3>
            <p className="text-2xl font-bold text-white">50 @ ₹150</p>
            <p className="text-xs text-slate-400">Target ₹7,500/mo run-rate. ₹29 intro, ₹149 monthly, ₹449 quarterly, ₹999 annual.</p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800">
          <Link
            href="/api/health"
            target="_blank"
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition border border-slate-700"
          >
            Check API Health
          </Link>
          <Link
            href="/api/security/verify"
            target="_blank"
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition border border-slate-700"
          >
            HMAC Security Test
          </Link>
          <Link
            href="/godpanel"
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition"
          >
            Access God Panel (Admin) &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
