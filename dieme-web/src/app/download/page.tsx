import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Download Dieme Studio & AI Companion (APK) — v1.2.1',
  description:
    'Download the official Dieme Live Studio and Dg-Images Android APKs. Lossless YouTube stream clipping, instant inpainting, and in-app update notifications.',
  keywords: [
    'dieme apk',
    'dieme android download',
    'dg images apk',
    'stream clip trimmer apk',
    'youtube live clipping app',
  ],
};

const RELEASE_INFO = {
  version: '1.2.1',
  build: 4,
  releaseDate: 'November 20, 2026',
  diemeApk: {
    name: 'Dieme Live Studio',
    filename: 'dieme-app-latest.apk',
    size: '38.5 MB',
    minAndroid: 'Android 8.0+ (API 26)',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    features: [
      'Lossless 1080p60 stream trimming with hardware acceleration',
      'In-app update notifications with skippable alerts and 24h snooze',
      'Instant AI face-swap studio preview with high-res canvas exports',
      'Persistent clip archive mapped to your YouTube channel ID across logins',
      'Instant UPI plans, DP rewards wallet, and referral commissions',
    ],
  },
  dgImagesApk: {
    name: 'Dg-Images AI Companion',
    filename: 'dg-images-latest.apk',
    size: '17.6 MB',
    minAndroid: 'Android 8.0+ (API 26)',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    features: [
      'Background daemon running on 127.0.0.1:5488 for studio IPC',
      'Direct ChatGPT canvas generation with coordinate mask precision',
      'Minimal obsidian top bar with live emerald heartbeat indicator',
      'Dedicated Activity sheet with developer debug passcode bypass',
      'Automated retry handling with 180s timeout resilience',
    ],
  },
  suiteZip: {
    name: 'Complete Dieme Suite (.ZIP)',
    filename: 'dieme-suite-complete.zip',
    size: '53.2 MB',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-suite-complete.zip',
  },
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#03070A] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shadow-[0_0_8px_#10B981]" />
            <span>Official Release v{RELEASE_INFO.version} (Build {RELEASE_INFO.build})</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Download Dieme for Android
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Capture, trim, and publish high-definition broadcast clips directly to Telegram and YouTube.
            Equipped with our in-app update system that notifies you whenever new enhancements arrive.
          </p>
        </div>

        {/* APK Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Card 1: Dieme Live Studio */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0B121C] to-[#070D14] border border-cyan-500/20 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Primary App
                </span>
                <span className="font-mono text-xs text-slate-400">
                  v{RELEASE_INFO.version} &bull; {RELEASE_INFO.diemeApk.size}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <span>{RELEASE_INFO.diemeApk.name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Required for stream monitoring, live !clip alerts, and Telegram editor handoffs.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Capabilities
                </div>
                <ul className="space-y-2">
                  {RELEASE_INFO.diemeApk.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
              <a
                href={RELEASE_INFO.diemeApk.downloadUrl}
                download={RELEASE_INFO.diemeApk.filename}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Dieme APK ({RELEASE_INFO.diemeApk.size})</span>
              </a>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                Supports {RELEASE_INFO.diemeApk.minAndroid}
              </p>
            </div>
          </div>

          {/* Card 2: Dg-Images Companion */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0B121C] to-[#070D14] border border-emerald-500/20 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-emerald-950/20 hover:border-emerald-500/40 transition-all duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  AI Companion Daemon
                </span>
                <span className="font-mono text-xs text-slate-400">
                  v{RELEASE_INFO.version} &bull; {RELEASE_INFO.dgImagesApk.size}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>{RELEASE_INFO.dgImagesApk.name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Local thumbnail inpainting server running on 127.0.0.1:5488 for ChatGPT automation.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Capabilities
                </div>
                <ul className="space-y-2">
                  {RELEASE_INFO.dgImagesApk.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
              <a
                href={RELEASE_INFO.dgImagesApk.downloadUrl}
                download={RELEASE_INFO.dgImagesApk.filename}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 hover:border-emerald-400/50 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Dg-Images APK ({RELEASE_INFO.dgImagesApk.size})</span>
              </a>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                Runs silently alongside Dieme Studio
              </p>
            </div>
          </div>
        </div>

        {/* Bundle Banner */}
        <div className="rounded-xl bg-[#08111A] border border-white/10 p-5 sm:p-6 mb-14 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Need both apps in a single archive?</div>
              <div className="text-xs text-slate-400">
                Download the complete Dieme Suite (.ZIP) containing both APKs ready for offline deployment.
              </div>
            </div>
          </div>
          <a
            href={RELEASE_INFO.suiteZip.downloadUrl}
            download={RELEASE_INFO.suiteZip.filename}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Suite Bundle ({RELEASE_INFO.suiteZip.size})</span>
          </a>
        </div>

        {/* Installation & Update Protocol Guide */}
        <div className="border-t border-white/10 pt-10">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Installation &amp; Update Instructions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">01 &bull; Download &amp; Allow</div>
              <p className="text-slate-300">
                Tap either download link above. If prompted by Android, grant permission to &quot;Install unknown apps&quot; from your browser.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">02 &bull; Launch Studio</div>
              <p className="text-slate-300">
                Open Dieme Studio and connect your Google/YouTube account to sync your live streams and Telegram editor alerts.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-mono text-cyan-400 font-bold">03 &bull; Automatic Updates</div>
              <p className="text-slate-300">
                When new updates arrive, a skippable dialog appears on launch. You can update immediately or snooze for 24 hours anytime.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
