import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio, Scissors, Users, Zap, Shield, Sparkles, CheckCircle2,
  ArrowRight, Play, MessageSquare, Flame, Check, HelpCircle,
  ExternalLink, ChevronDown, Award, Globe, Smartphone, Laptop, Tv
} from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricingPlans';

export const metadata: Metadata = {
  title: 'Digicast — Live Stream Clipping & Creator Intelligence Platform',
  description:
    'Capture live highlight markers, collaborate with video editors, and produce viral clips from YouTube livestreams in real time with Digicast.',
  keywords: [
    'YouTube livestream clipping',
    'live stream highlight markers',
    'stream companion app',
    'video editor team workflow',
    'YouTube live broadcast clips',
    'live stream analytics',
    'Digicast creator studio'
  ],
  openGraph: {
    title: 'Digicast — Live Stream Clipping & Creator Intelligence Platform',
    description:
      'The real-time live companion for YouTube creators and video production teams. Capture highlight markers, monitor chat, and publish clips instantly.',
    url: 'https://digicast-web.vercel.app',
    siteName: 'Digicast',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digicast — Live Stream Clipping Platform',
    description: 'Capture live highlight moments and collaborate with your production editors in real time.',
  },
};

const faqs = [
  {
    q: 'What is Digicast?',
    a: 'Digicast is a live streaming companion and highlight clipping platform built for YouTube creators, gaming streamers, podcast studios, and video production teams. It allows creators and editors to monitor live broadcasts, capture timestamped highlight markers in real time, and synchronize clip production without delay.'
  },
  {
    q: 'How does Digicast assist YouTube live streamers?',
    a: 'During live streams, memorable moments, super chats, and key highlights happen in seconds. Digicast lets streamers and their production crew drop precise marker tags on the fly. When the stream concludes, editors have an organized list of tagged moments ready for short-form video creation.'
  },
  {
    q: 'Can my video editors collaborate on my live streams?',
    a: 'Yes! Digicast workspaces allow studio owners to create dedicated editor logins. Editors can view live stream feeds, drop marker notes, and access captured clip data seamlessly across web and mobile.'
  },
  {
    q: 'What platforms and devices does Digicast support?',
    a: 'Digicast offers a full Web Dashboard for desktop workstations, alongside dedicated mobile companion applications for smartphones and tablets. Everything stays synchronized to your studio workspace in real time.'
  },
  {
    q: 'What subscription plans and access passes are available?',
    a: 'Digicast provides flexible duration passes tailored for every creator: the ₹29 First Month VIP Pass (30 days), the ₹149 1 Month Unlimited Pass, the ₹499 3 Month Quarter Pass, and the ₹999 1 Year Annual Studio Pass.'
  },
  {
    q: 'How quickly does access activate after subscribing?',
    a: 'Instantly! When you activate or submit payment proof for any pass, you receive immediate 24-hour platform access while our verification process finalizes your full membership duration.'
  }
];

export default function LandingPage() {
  // Schema.org Structured Data for Google, Gemini, and AI Search Crawlers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://digicast-web.vercel.app/#organization',
        name: 'Digicast',
        url: 'https://digicast-web.vercel.app',
        logo: 'https://digicast-web.vercel.app/logo-mark.png',
        description: 'Real-time live stream companion and clip highlight capture platform for YouTube creators.',
        sameAs: ['https://t.me/digicast_bot']
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://digicast-web.vercel.app/#software',
        name: 'Digicast Creator Studio',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: '29',
          highPrice: '999',
          offerCount: '4'
        },
        description:
          'Real-time livestream monitoring, highlight marker tagging, team editor management, and clip workflow suite for YouTube broadcasters.'
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://digicast-web.vercel.app/#faq',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-[#F8FAFC] selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Inject JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07080C]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="Digicast Logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
            <span className="font-extrabold text-xl tracking-tight text-white">
              DIGICAST
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">How It Works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing Passes</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4.5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Launch Studio
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 border-b border-white/[0.06]">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-semibold text-cyan-300 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Premier Live Stream Clipping & Marker Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Capture Live Stream Highlights{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Without Missing a Beat.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-normal leading-relaxed mb-10">
            Digicast empowers YouTube creators and production teams to monitor live broadcasts, mark viral moments in real time, and turn hours of footage into engaging clips instantly.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Get Started with Studio Pass
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/10 transition"
            >
              <Play className="w-4 h-4 text-slate-400" />
              Explore Workflow
            </a>
          </div>

          {/* Metric Stats Bento Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#11141E] border border-white/[0.08] text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">0 ms</p>
              <p className="text-xs text-slate-400 font-medium">Lag Companion Sync</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#11141E] border border-white/[0.08] text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mb-1">1-Click</p>
              <p className="text-xs text-slate-400 font-medium">Instant Marker Tagging</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#11141E] border border-white/[0.08] text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">100%</p>
              <p className="text-xs text-slate-400 font-medium">Team Editor Sync</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#11141E] border border-white/[0.08] text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-1">24h</p>
              <p className="text-xs text-slate-400 font-medium">Instant Access Activation</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features Section ─────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 mb-4">
              <Zap className="w-3.5 h-3.5" />
              BUILT FOR CREATORS & EDITORS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Everything Your Stream Needs to Go Viral
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Designed specifically for fast-paced live environments where timing is everything. No complicated setup required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-cyan-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Stream Synchronization</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your YouTube channel and automatically synchronize live broadcasts, view counts, and chat stream moments into your studio workspace.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-blue-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Marker Tagging</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drop timestamped highlight tags with a single tap from web or mobile while the stream is ongoing. Never lose track of a clutch play or funny moment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-emerald-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Collaborative Editor Access</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Invite video editors and moderators with individual access credentials. Editors can monitor tags and extract clips without needing full channel ownership.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-amber-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cross-Platform Companion</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Control and monitor your broadcast from anywhere. Use your mobile device as a dedicated physical marker companion while streaming from your PC.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-indigo-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Private & Isolated Workspaces</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Each creator studio workspace is fully isolated. Your markers, team accounts, and stream metadata remain strictly private to your team.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] hover:border-rose-500/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rapid Short-Form Turnaround</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cut down hours of post-stream review time. Export tagged clip ranges directly to your editing workflow within minutes of ending your broadcast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Section ─────────────────────────────────────────────── */}
      <section id="workflow" className="py-24 border-b border-white/[0.06] bg-[#0A0D14]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              How Digicast Fits Into Your Stream Routine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A frictionless 3-step workflow designed to turn stream hours into viral highlights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-[#11141E] border border-white/[0.08] relative">
              <div className="text-4xl font-black text-cyan-400/20 mb-4">01</div>
              <h3 className="text-lg font-bold text-white mb-2">Connect Your Stream</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Link your YouTube channel in your studio workspace. Digicast detects when you go live and starts monitoring stream timestamps automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-[#11141E] border border-white/[0.08] relative">
              <div className="text-4xl font-black text-blue-400/20 mb-4">02</div>
              <h3 className="text-lg font-bold text-white mb-2">Drop Live Markers</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Whenever a clutch moment, hype reaction, or super chat occurs, tap the marker button on web or mobile to capture the exact time window.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-[#11141E] border border-white/[0.08] relative">
              <div className="text-4xl font-black text-emerald-400/20 mb-4">03</div>
              <h3 className="text-lg font-bold text-white mb-2">Produce & Publish</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your editors immediately see all marked timestamps in the workspace. Export clip segments for YouTube Shorts, Reels, and TikTok with zero guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Passes Section ───────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-b border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 mb-4">
              <Award className="w-3.5 h-3.5" />
              SIMPLE DURATION PASSES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Flexible Plans for Every Creator
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              No hidden fees or complicated contracts. Choose the duration pass that fits your production schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const isPopular = plan.recommended || plan.id === 'pro';
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl flex flex-col justify-between transition relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#182032] to-[#11141E] border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                      : 'bg-[#11141E] border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-[#07080C] text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-3xl font-extrabold text-white">₹{plan.priceINR}</span>
                      <span className="text-xs font-semibold text-slate-400">{plan.periodLabel}</span>
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/login"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs text-center transition ${
                      isPopular
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-[#07080C]'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white'
                    }`}
                  >
                    Activate Pass
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ Section (Optimized for AI & Search Engines) ──────────────── */}
      <section id="faq" className="py-24 border-b border-white/[0.06] bg-[#0A0D14]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Common Questions About Digicast
            </h2>
            <p className="text-slate-400 text-sm">
              Clear answers for creators, stream managers, and AI assistants.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => (
              <details
                key={index}
                className="group p-5 rounded-2xl bg-[#11141E] border border-white/[0.08] open:border-cyan-500/40 transition cursor-pointer"
              >
                <summary className="font-bold text-white text-base flex items-center justify-between list-none">
                  <span>{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition" />
                </summary>
                <p className="text-slate-400 text-sm leading-relaxed mt-3 pt-3 border-t border-white/[0.06]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-cyan-900/30 via-blue-900/20 to-indigo-900/30 border border-cyan-500/30 backdrop-blur-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Elevate Your Live Streaming Studio Today
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Join live creators and production teams using Digicast to capture unforgettable moments in real time.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Enter Studio Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Public Footer ────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/[0.06] bg-[#07080C] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="Digicast"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-bold text-white text-sm">DIGICAST</span>
            <span className="text-slate-600">|</span>
            <span>© 2026 Digicast Creator Technologies. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a
              href="https://t.me/digicast_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              Telegram Bot (@digicast_bot)
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/login" className="hover:text-white transition">
              Creator Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
