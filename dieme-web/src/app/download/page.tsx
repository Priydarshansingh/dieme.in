import React from 'react';
import type { Metadata } from 'next';
import {
  Download,
  Smartphone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';
import versionData from '../../../public/version.json';

export const metadata: Metadata = {
  title: `Download Dieme Studio (APK) — v${versionData.dieme.versionName}`,
  description:
    'Download the official Dieme Live Studio Android APK. Lossless YouTube stream clipping, integrated AI Thumbnail Studio, and in-app update notifications.',
  keywords: [
    'dieme apk',
    'dieme android download',
    'youtube thumbnail ai',
    'stream clip trimmer apk',
    'youtube live clipping app',
  ],
};

const RELEASE_INFO = {
  version: versionData.dieme.versionName,
  build: versionData.dieme.versionCode,
  releaseDate: versionData.dieme.releaseDate || 'November 27, 2026',
  diemeApk: {
    name: 'Dieme Live Studio',
    filename: 'dieme-app-latest.apk',
    size: '39.8 MB',
    minAndroid: 'Android 8.0+ (API 26)',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    features: [
      'Built-in AI Thumbnail Studio with 16:9 photorealistic revisions and pin targeting',
      'Direct cloud-shuffled AI engines (FLUX, SDXL & Gemini Imagen) with zero setup',
      'Lossless 1080p60 stream trimming with hardware acceleration and instant Telegram alerts',
      'In-app update notifications with skippable alerts and 24h snooze',
      'Persistent clip archive and creator workspace mapped across logins',
    ],
  },
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#03070A] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      <SiteHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shadow-[0_0_8px_#10B981]" />
            <span>Official Release v{RELEASE_INFO.version} (Build {RELEASE_INFO.build})</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Download Dieme for Android
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The all-in-one broadcast workspace for YouTube creators. Trim live streams without quality loss,
            synthesize high-CTR thumbnails with integrated AI, and automate clip handoffs directly to Telegram.
          </p>
        </div>

        {/* Featured Dieme Studio Card */}
        <div className="max-w-2xl mx-auto mb-14">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0B1522] via-[#08101A] to-[#04080E] border border-cyan-500/30 p-6 sm:p-10 flex flex-col justify-between shadow-2xl shadow-cyan-950/30 hover:border-cyan-500/50 transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>All-In-One Creator App</span>
                </span>
                <span className="font-mono text-xs text-slate-400">
                  v{RELEASE_INFO.version} &bull; {RELEASE_INFO.diemeApk.size}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                  <span>{RELEASE_INFO.diemeApk.name}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2">
                  Complete suite with live YouTube stream monitoring, one-tap !clip captures, and integrated Cloud AI Thumbnail Studio.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Included Capabilities
                </div>
                <ul className="space-y-2.5">
                  {RELEASE_INFO.diemeApk.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 space-y-3">
              <a
                href={RELEASE_INFO.diemeApk.downloadUrl}
                download={RELEASE_INFO.diemeApk.filename}
                className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-cyan-500/25"
              >
                <Download className="w-5 h-5" />
                <span>Download Dieme APK ({RELEASE_INFO.diemeApk.size})</span>
              </a>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                Requires {RELEASE_INFO.diemeApk.minAndroid} &bull; Standalone installation, zero extra companion apps needed
              </p>
            </div>
          </div>
        </div>

        {/* Installation Protocol Guide */}
        <div className="border-t border-white/10 pt-10">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Installation Instructions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">01 &bull; Download APK</div>
              <p className="text-slate-300">
                Tap the download button above. When prompted by Android, permit &quot;Install unknown apps&quot; for your browser.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">02 &bull; Sign In &amp; Sync</div>
              <p className="text-slate-300">
                Open Dieme Studio and log in to link your YouTube channel, sync stream events, and configure Telegram editor notifications.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">03 &bull; AI Thumbnail Studio</div>
              <p className="text-slate-300">
                Access Thumbnail Studio directly from the top navigation. Paste any YouTube link, mark revision pins, and generate 1080p revisions on demand.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
