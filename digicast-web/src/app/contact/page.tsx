import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare, Send, Bot, Shield, HelpCircle, ExternalLink,
  ArrowRight, CheckCircle2, AlertCircle, Clock, Zap, Headphones,
  Mail, Sparkles, ChevronDown
} from 'lucide-react';

import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';

export const metadata: Metadata = {
  title: 'Contact Support & Helpdesk — Digicast',
  description:
    'Need help with your workspace, livestream sync, or subscription pass? Contact our official Telegram support bot @YT_digicast for instant resolution.',
};

const supportFaqs = [
  {
    q: 'How do I reach the official Digicast Support team?',
    a: 'All official creator support, account lookups, payment verifications, and technical inquiries are handled directly via our verified Telegram Bot @YT_digicast. You can start a private chat at https://t.me/YT_digicast?start=help.'
  },
  {
    q: 'How do I look up my active subscription or workspace validity?',
    a: 'Simply send your registered Gmail address or Workspace ID directly to @YT_digicast in a private message. The bot will automatically verify your Firestore record and display your active plan, expiration date, and connected YouTube channel.'
  },
  {
    q: 'How do I submit payment proof or UTR numbers?',
    a: 'You can submit your screenshot and 12-digit UPI UTR directly via the Web Dashboard payment modal, or send the screenshot directly in a private DM to @YT_digicast. You receive instant 24-hour grace access immediately upon submission.'
  },
  {
    q: 'How do I report a bug or suggest a feature?',
    a: 'Send "/support <your message>" to @YT_digicast. Our engineering team logs every concern into our active monitoring queue and provides prompt updates.'
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* ── Hero / Contact Header ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 mb-6 backdrop-blur-xl">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>OFFICIAL TELEGRAM HELPDESK ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Instant Support &amp; Ticket Routing via{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              @YT_digicast
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            We provide direct, real-time support exclusively through our verified Telegram Bot. Send your concerns, payment screenshots, or Gmail queries for instantaneous automated lookup and engineering dispatch.
          </p>
        </div>

        {/* ── Primary Telegram Bot Connect Card ────────────────────────────── */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="p-1 rounded-3xl bg-gradient-to-r from-cyan-500/40 via-blue-500/20 to-purple-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl">
            <div className="rounded-[22px] bg-[#0E111A] border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-6 shadow-xl shadow-cyan-500/20">
                <Send className="w-10 h-10 -rotate-12 translate-x-0.5" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                Open Chat with @YT_digicast
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
                Connect with our automated bot in Telegram to check account validity, report an issue, or verify payment proof.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://t.me/YT_digicast?start=help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07080C] shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <Send className="w-4 h-4" />
                  <span>LAUNCH TELEGRAM BOT (@YT_digicast)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-xl bg-[#11141E] border border-white/[0.06]">
                  <p className="font-mono text-xs text-cyan-400 font-bold mb-1">COMMAND: /help</p>
                  <p className="text-xs text-slate-400">View complete command menu and troubleshooting guides.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#11141E] border border-white/[0.06]">
                  <p className="font-mono text-xs text-emerald-400 font-bold mb-1">GMAIL / WS ID</p>
                  <p className="text-xs text-slate-400">Send your Gmail in DM to fetch your live plan validity instantly.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#11141E] border border-white/[0.06]">
                  <p className="font-mono text-xs text-amber-400 font-bold mb-1">COMMAND: /support</p>
                  <p className="text-xs text-slate-400">File a support ticket; logged directly to our admin panel.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Support Knowledge Base & FAQ ─────────────────────────────────── */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>FREQUENTLY ASKED SUPPORT QUERIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Self-Serve Troubleshooting
            </h2>
          </div>

          <div className="space-y-4">
            {supportFaqs.map((faq, index) => (
              <details
                key={index}
                className="group p-6 rounded-2xl bg-[#11141E] border border-white/[0.08] open:border-cyan-500/40 transition duration-200 cursor-pointer"
              >
                <summary className="font-bold text-white text-base flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition duration-200" />
                </summary>
                <p className="text-slate-400 text-sm leading-relaxed mt-4 pt-4 border-t border-white/[0.06]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
