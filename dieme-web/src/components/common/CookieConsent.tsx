'use client';
import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('dieme_cookie_consent');
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('dieme_cookie_consent', 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('dieme_cookie_consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 pointer-events-auto"
    >
      <div className="max-w-3xl mx-auto rounded-2xl bg-[#0E111A]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 leading-relaxed">
              Dieme uses essential cookies for authentication, session management, and workspace preferences. We do not use tracking or advertising cookies. By continuing, you consent to our use of cookies as described in our{' '}
              <a href="/privacy" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
                Privacy Policy
              </a>.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={accept}
                className="px-5 py-2.5 rounded-lg bg-emerald-400 text-slate-950 text-xs font-extrabold hover:bg-emerald-300 transition shadow-sm"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={decline}
                className="px-5 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 transition"
              >
                Decline Non-Essential
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={decline}
            aria-label="Close cookie consent banner"
            className="shrink-0 p-1 text-slate-400 hover:text-white transition rounded-md hover:bg-white/5"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

