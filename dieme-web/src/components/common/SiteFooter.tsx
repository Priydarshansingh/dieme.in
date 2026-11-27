'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface SiteFooterProps {
  onSelectProgram?: (programId: number) => void;
  className?: string;
}

export function SiteFooter({ onSelectProgram, className = '' }: SiteFooterProps) {
  return (
    <footer className={`mt-24 pt-12 border-t border-white/5 text-xs text-slate-400 max-w-6xl mx-auto px-4 sm:px-6 text-left ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pb-12">
        {/* Column 1: Pricing Passes */}
        <div className="space-y-2">
          <p className="font-bold text-white tracking-wide">Pricing Passes</p>
          <p>
            <Link
              href="/#pricing"
              className="hover:text-emerald-400 text-slate-300 hover:underline transition cursor-pointer"
            >
              Starter Evaluation
            </Link>
          </p>
          <p>
            <Link
              href="/#pricing"
              className="hover:text-emerald-400 text-slate-300 hover:underline transition cursor-pointer font-medium"
            >
              VIP Pass (₹29)
            </Link>
          </p>
          <p>
            <Link
              href="/#pricing"
              className="hover:text-emerald-400 text-slate-300 hover:underline transition cursor-pointer"
            >
              Monthly Pass (₹149)
            </Link>
          </p>
          <p>
            <Link
              href="/#pricing"
              className="hover:text-emerald-400 text-slate-300 hover:underline transition cursor-pointer"
            >
              Quarter Pass (₹499)
            </Link>
          </p>
          <p>
            <Link
              href="/#pricing"
              className="hover:text-emerald-400 text-slate-300 hover:underline transition cursor-pointer"
            >
              Annual Studio (₹999)
            </Link>
          </p>
          <p>
            <Link href="/coverage" className="hover:text-emerald-400 text-slate-300 hover:underline transition">
              Where We Serve
            </Link>
          </p>
        </div>

        {/* Column 2: About Us */}
        <div className="space-y-2">
          <p className="font-bold text-white tracking-wide">About Us</p>
          <p>
            <Link href="/#faq" className="hover:text-slate-100 hover:underline transition text-slate-300">
              FAQ
            </Link>
          </p>
          <p>
            <Link href="/#how-it-works" className="hover:text-slate-100 hover:underline transition text-slate-300">
              How It Works
            </Link>
          </p>
          <p>
            <Link href="/#reviews" className="hover:text-slate-100 hover:underline transition text-slate-300">
              Creator Reviews
            </Link>
          </p>
          <p>
            <Link href="/#about-us" className="hover:text-slate-100 hover:underline transition text-slate-300">
              Our Story
            </Link>
          </p>
          <p>
            <Link href="/coverage" className="hover:text-emerald-400 hover:underline text-slate-300 transition">
              Global Hubs
            </Link>
          </p>
        </div>

        {/* Column 3: Legal */}
        <div className="space-y-2">
          <p className="font-bold text-white tracking-wide">Legal</p>
          <p>
            <Link href="/terms" className="hover:text-slate-100 hover:underline transition text-slate-300">
              Terms of Service
            </Link>
          </p>
          <p>
            <Link href="/privacy" className="hover:text-slate-100 hover:underline transition text-slate-300">
              Privacy Policy
            </Link>
          </p>
          <p>
            <Link href="/refund" className="hover:text-slate-100 hover:underline transition text-slate-300">
              Refund Policy
            </Link>
          </p>
        </div>

        {/* Column 4: Downloads & Support */}
        <div className="space-y-2">
          <p className="font-bold text-white tracking-wide">Downloads &amp; Apps</p>
          <p>
            <Link href="/download" className="hover:text-cyan-400 text-slate-300 hover:underline transition">
              Android Studio APK
            </Link>
          </p>
          <p>
            <Link href="/pricing" className="hover:text-cyan-400 text-slate-300 hover:underline transition">
              Plans &amp; Pricing
            </Link>
          </p>
          <div className="pt-2">
            <a
              href="https://t.me/YT_dieme?start=help"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-md shadow-emerald-400/20"
            >
              <span>Support</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Operational Status Bar */}
      <div className="border-t border-white/5 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
        <p>&copy; 2026 Dieme Live Technologies. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block shadow-[0_0_8px_#10B981]" />
            <span>All Systems Operational</span>
          </span>
          <span className="text-white/20 hidden sm:inline">&bull;</span>
          <span className="text-slate-400">99.98% Stream Uptime</span>
          <span className="text-white/20 hidden sm:inline">&bull;</span>
          <span className="text-slate-300">Built for Live Creators &amp; Editors</span>
        </div>
      </div>
    </footer>
  );
}
