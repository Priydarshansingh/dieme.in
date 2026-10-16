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
  CheckCircle,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { DigicastBrandLogo } from '@/components/brand/DigicastLogo';
import { SiteHeader } from '@/components/common/SiteHeader';
import { SiteFooter } from '@/components/common/SiteFooter';
import {
  ALL_INDIAN_STATES_AND_UTS,
  ALL_INTERNATIONAL_COUNTRIES,
  CREATOR_KEYWORD_CATEGORIES,
} from '@/lib/coverageData';

export default function CoveragePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'india' | 'international'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIndia = useMemo(() => {
    if (!searchQuery.trim()) return ALL_INDIAN_STATES_AND_UTS;
    const q = searchQuery.toLowerCase();
    return ALL_INDIAN_STATES_AND_UTS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.capital.toLowerCase().includes(q) ||
        item.majorCities.some((c) => c.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        item.creatorNiche.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredInternational = useMemo(() => {
    if (!searchQuery.trim()) return ALL_INTERNATIONAL_COUNTRIES;
    const q = searchQuery.toLowerCase();
    return ALL_INTERNATIONAL_COUNTRIES.filter(
      (item) =>
        item.country.toLowerCase().includes(q) ||
        item.continent.toLowerCase().includes(q) ||
        item.majorCities.some((c) => c.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        item.creatorNiche.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalLocationsCount = ALL_INDIAN_STATES_AND_UTS.length + ALL_INTERNATIONAL_COUNTRIES.length;

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between">
      {/* Universal Site Header */}
      <SiteHeader />

      {/* ── Hero & Search Banner ──────────────────────────────────────── */}
      <section className="relative pt-16 pb-14 px-4 sm:px-6 lg:px-8 border-b border-white/5 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Global Coverage &bull; 28 Indian States &bull; 40+ Countries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Where We Serve &bull; YouTube Auto Clipping &amp; Stream Highlight Directory
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Digicast delivers sub-second livestream clip buffers, automated Nightbot chat commands, and Telegram bot highlight alerts across every state, city, and international broadcast capital.
          </p>

          {/* Quick Dedicated Country/Region Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/coverage/india"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-400/50 hover:border-emerald-400 text-white font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-lg shadow-emerald-500/15"
            >
              <span className="text-lg">🇮🇳</span>
              <span>Open India Regional Page (All 28 States &amp; Cities)</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>

            <Link
              href="/coverage/international"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-400/50 hover:border-cyan-400 text-white font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-lg shadow-cyan-500/15"
            >
              <span className="text-lg">🌐</span>
              <span>Open International Page (40+ Countries &amp; Hubs)</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="pt-6 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city, state, country, or keyword (e.g. Mumbai, Texas, BGMI, shorts, London)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition shadow-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[
              { id: 'all', label: `All Coverage (${totalLocationsCount})` },
              { id: 'india', label: `🇮🇳 India (${ALL_INDIAN_STATES_AND_UTS.length})` },
              { id: 'international', label: `🌐 International (${ALL_INTERNATIONAL_COUNTRIES.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white border border-white/20 shadow-md'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Keyword Category Clusters */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                YouTuber &amp; Streamer Search Directory &bull; High-Ranking Keywords
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Frequently searched topics for real-time livestream capture, clip bot triggers, and viral shorts automation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CREATOR_KEYWORD_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">{cat.category}</h3>
                </div>
                <p className="text-[11px] text-slate-400">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.keywords.map((kw, kIdx) => (
                    <span
                      key={kIdx}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/5 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 transition cursor-default"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section: India Coverage ────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'india') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  <span>🇮🇳 India Creator Network</span>
                  <span>&bull;</span>
                  <span>All 28 States &amp; 8 UTs</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  India Regional Livestream Clipping &amp; Shorts Automation
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Edge CDN nodes optimized for ultra-low latency Telegram dispatch and Nightbot chat triggers across all Indian metropolitan and tier-2 creator hubs.
                </p>
              </div>

              <Link
                href="/coverage/india"
                className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5 transition"
              >
                <span>View Full India Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIndia.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition">
                        {item.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">
                        {item.type} &bull; Capital: {item.capital}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Active Node
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Major Cities Covered:
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.majorCities.join(', ')}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Creator Ecosystem:</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.creatorNiche}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
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
              ))}
            </div>
          </section>
        )}

        {/* ── Section: International Coverage ───────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'international') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  <span>🌐 Global Broadcast Network</span>
                  <span>&bull;</span>
                  <span>40+ Countries</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  International Creator Hubs &bull; Worldwide Streamer Services
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-speed 1080p and 4K stream buffering with cross-platform editor handoff for international YouTube &amp; Twitch broadcasters.
                </p>
              </div>

              <Link
                href="/coverage/international"
                className="shrink-0 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold font-mono flex items-center gap-1.5 transition"
              >
                <span>View Full International Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInternational.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] transition space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.flag}</span>
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                          {item.country}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">{item.continent}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                      Global Edge
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Major Broadcast Cities:
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.majorCities.join(', ')}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Creator Ecosystem:</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.creatorNiche}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
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
              ))}
            </div>
          </section>
        )}

        {/* ── Ready to Start CTA Bar ──────────────────────────────────── */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to automate clips in your city or region?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Activate your Digicast pass today. Instant lookback buffering, zero YouTube API quota impact, and automated Telegram bot dispatch.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 px-8 py-3.5 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 transition shadow-xl shadow-emerald-400/20 flex items-center gap-2"
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
