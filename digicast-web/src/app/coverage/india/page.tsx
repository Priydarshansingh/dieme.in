'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';
import {
  ALL_INDIAN_STATES_AND_UTS,
  CREATOR_KEYWORD_CATEGORIES,
} from '@/lib/coverageData';

export default function IndiaCoveragePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'State' | 'Union Territory'>('All');

  const filteredStates = useMemo(() => {
    return ALL_INDIAN_STATES_AND_UTS.filter((item) => {
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.capital.toLowerCase().includes(q) ||
        item.majorCities.some((c) => c.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        item.creatorNiche.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, typeFilter]);

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/5 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Dedicated India Regional Coverage &bull; 28 States &amp; 8 UTs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            YouTube Auto Clipping &amp; Live Stream Shorts in India
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From BGMI tournaments in Mumbai to podcast studios in Bangalore and Delhi NCR, Digicast powers Indian broadcasters with instant 45s smart buffers, Nightbot !clip triggers, and automated Telegram bot dispatch.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/coverage/international"
              className="px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <span>Switch to International Page (40+ Countries)</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>

          {/* Search Input */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any Indian state, city or keyword (e.g. Mumbai, Pune, BGMI, Bangalore)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition shadow-xl"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {(['All', 'State', 'Union Territory'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  typeFilter === type
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'All' ? 'All Indian Regions' : type === 'State' ? '28 States' : '8 Union Territories'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Directory Grid ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* State / UT Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStates.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                    {item.name}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-500">
                    {item.type} &bull; Capital: {item.capital}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Live Hub
                </span>
              </div>

              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Major Cities in {item.name}:
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.majorCities.join(', ')}</p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Creator Ecosystem:</p>
                <p className="text-[11px] text-slate-400 leading-snug">{item.creatorNiche}</p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Target Search Queries:</p>
                <div className="flex flex-wrap gap-1">
                  {item.keywords.map((kw, kwIdx) => (
                    <span
                      key={kwIdx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-400"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* High-Intent Keywords Matrix for India */}
        <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-5">
          <div>
            <h3 className="text-xl font-black text-white">Popular Search Terms for Indian Streamers &amp; Editors</h3>
            <p className="text-xs text-slate-400 mt-1">
              Top keywords searched by Indian YouTube broadcasters for zero-quota highlight clipping and automated shorts:
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {[
              'YouTube auto clipping Mumbai',
              'YouTuber free clips Delhi NCR',
              'YouTube long video to short Bangalore',
              'BGMI live stream highlight bot Hyderabad',
              'GTA V RP stream clips Pune',
              'Nightbot clip command Hindi',
              'Telegram stream highlights Kolkata',
              'Free YouTube clips generator Chennai',
              'YouTube shorts auto editor Ahmedabad',
              'Stream clipping software Jaipur',
              'Live broadcast highlight bot Lucknow',
              'Watermark-free YouTube clips Chandigarh',
              'Streamer editor sync Kochi',
              'YouTube live chat highlight trigger Indore',
              'Esports tournament highlight recorder India',
            ].map((term, tIdx) => (
              <span
                key={tIdx}
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 transition cursor-default"
              >
                {term}
              </span>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Start clipping your Indian YouTube livestreams today
            </h2>
            <p className="text-xs text-slate-400">
              Plans start at just ₹29 for 30 full days of VIP creator access.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 px-7 py-3 rounded-full text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-400/20 flex items-center gap-2"
          >
            <span>Activate ₹29 VIP Pass</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
