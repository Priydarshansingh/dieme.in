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
  ALL_INTERNATIONAL_COUNTRIES,
  CREATOR_KEYWORD_CATEGORIES,
} from '@/lib/coverageData';

export default function InternationalCoveragePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState<string>('All');

  const continents = ['All', 'North America', 'Europe', 'Asia-Pacific', 'Middle East', 'Latin America', 'Oceania', 'Africa'];

  const filteredCountries = useMemo(() => {
    return ALL_INTERNATIONAL_COUNTRIES.filter((item) => {
      if (continentFilter !== 'All' && item.continent !== continentFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.country.toLowerCase().includes(q) ||
        item.continent.toLowerCase().includes(q) ||
        item.majorCities.some((c) => c.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        item.creatorNiche.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, continentFilter]);

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/5 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>International Creator Network &bull; 40+ Countries Across 6 Continents</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Worldwide Live Stream Clipping &amp; YouTuber Highlights
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Digicast powers international YouTube and Twitch creators with 1080p and 4K stream buffering, Nightbot webhook triggers, and automated Telegram bot clip dispatch across North America, Europe, Asia-Pacific, Latin America, and the Middle East.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/coverage/india"
              className="px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <span>Switch to India Regional Page (28 States &amp; 8 UTs)</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
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
                placeholder="Search any country, city, or international keyword (e.g. Los Angeles, London, Tokyo, Valorant)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition shadow-xl"
              />
            </div>
          </div>

          {/* Continent Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {continents.map((cont) => (
              <button
                key={cont}
                onClick={() => setContinentFilter(cont)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  continentFilter === cont
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {cont}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Directory Grid ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Country Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCountries.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] transition space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{item.flag}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                      {item.country}
                    </h2>
                    <p className="text-[11px] font-mono text-slate-500">{item.continent}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                  Global Edge
                </span>
              </div>

              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Major Creator Hub Cities:
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

        {/* Global SEO Matrix */}
        <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-5">
          <div>
            <h3 className="text-xl font-black text-white">Popular International Streamer Search Queries</h3>
            <p className="text-xs text-slate-400 mt-1">
              Top global search phrases for automated live highlight buffering and YouTube-to-shorts AI:
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {[
              'YouTube auto clipping Los Angeles',
              'Free YouTube clips New York',
              'Live stream clipping tool London',
              'YouTube long video to short Toronto',
              'Stream clip generator Sydney',
              'YouTube live highlights Dubai',
              'Automated stream clipper Singapore',
              'VTuber highlight marker Tokyo',
              'LCK live replay bot Seoul',
              'Gaming stream highlights Berlin',
              'YouTube podcast shorts Paris',
              'CS2 stream highlights São Paulo',
              'Pinoy streamer highlight bot Manila',
              'Mobile Legends clip bot Jakarta',
              'Esports tournament highlight recorder Katowice',
            ].map((term, tIdx) => (
              <span
                key={tIdx}
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition cursor-default"
              >
                {term}
              </span>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-transparent border border-cyan-400/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Automate your stream highlight clipping worldwide
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency edge dispatch to YouTube creators, esports teams, and broadcast studios across 40+ countries.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 px-7 py-3 rounded-full text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20 flex items-center gap-2"
          >
            <span>Start Free Evaluation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* Universal Site Footer */}
      <SiteFooter />
    </div>
  );
}
