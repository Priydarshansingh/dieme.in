'use client';

import { useState, useEffect } from 'react';
import {
  Tv, DollarSign, Activity, TrendingUp, Layers, RefreshCw, CheckCircle2,
  Smartphone, Shield, Zap, Sparkles, BarChart3, Clock, AlertCircle
} from 'lucide-react';

interface AdProviderStats {
  impressions: number;
  earnedINR: number;
  fillRate: number;
  avgEcpmINR: number;
}

interface AdDailyData {
  date: string;
  totalImpressions: number;
  totalEarnedINR: number;
  totalDCoinsAwarded: number;
  uniqueViewers: number;
  byProvider: Record<string, AdProviderStats>;
  updatedAt: string;
}

interface AdImpression {
  id: string;
  uid: string;
  userEmail?: string;
  provider: string;
  providerName: string;
  adUnitId: string;
  format: string;
  platform: string;
  earnedINR: number;
  dCoinsAwarded: number;
  unlockedHours: number;
  timestamp: string;
  dateKey: string;
}

interface AnalyticsResponse {
  today: AdDailyData;
  summary: {
    todayEarningsINR: number;
    todayImpressions: number;
    totalRevenue30d: number;
    totalImpressions30d: number;
    avgEcpmINR: number;
    activeProvidersCount: number;
  };
  providersConfig: Record<string, any>;
  dailyHistory: AdDailyData[];
  recentImpressions: AdImpression[];
}

export default function AdMonetizationDashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const res = await fetch('/api/godpanel/ads');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.analytics);
      } else {
        setError(json.error || 'Failed to fetch ad monetization analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching ad analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const today = data?.today;
  const summary = data?.summary;
  const providers = data?.providersConfig || {
    ADMOB: {
      id: 'ADMOB',
      name: 'Google AdMob',
      adUnitId: 'ca-app-pub-5470934256709090/8839247619',
      appOrOrgId: 'ca-app-pub-5470934256709090~1068479518',
      color: '#4285F4',
      avgEcpmINR: 1250,
      status: 'ACTIVE',
    },
    UNITY: {
      id: 'UNITY',
      name: 'Unity Ads',
      adUnitId: 'Rewarded_Android',
      appOrOrgId: '13469985384413',
      color: '#FFFFFF',
      avgEcpmINR: 950,
      status: 'ACTIVE',
    },
    START_IO: {
      id: 'START_IO',
      name: 'Start.io (StartApp)',
      adUnitId: 'Rewarded_StartApp',
      appOrOrgId: '149124855',
      color: '#00D09C',
      avgEcpmINR: 700,
      status: 'ACTIVE',
    },
    SPONSORED_PARTNER: {
      id: 'SPONSORED_PARTNER',
      name: 'Digicast Direct Sponsor',
      adUnitId: 'Direct_Partner_Video',
      appOrOrgId: 'sponsor_direct_v1',
      color: '#10B981',
      avgEcpmINR: 2500,
      status: 'ACTIVE',
    },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0E1118] via-[#121622] to-[#0E1118] border border-white/5 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE MONETIZATION ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Today: {new Date().toLocaleDateString('en-IN')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Ad Providers Daily Earning &amp; Cost Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of ad networks serving ads to Android &amp; Web creators, daily impressions, eCPM, and net earnings.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isRefreshing}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="p-5 rounded-3xl bg-[#0E1118] border border-white/5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Today&apos;s Ad Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ₹{(summary?.todayEarningsINR || today?.totalEarnedINR || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-bold">100% Net Profit</span> &bull; 0 server ad cost
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Today's Impressions */}
        <div className="p-5 rounded-3xl bg-[#0E1118] border border-white/5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Today&apos;s Completed Views</span>
            <Tv className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {summary?.todayImpressions || today?.totalImpressions || 0}
            </span>
            <span className="text-xs text-slate-400">impressions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Rewarded Videos across mobile &amp; web
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Blended eCPM */}
        <div className="p-5 rounded-3xl bg-[#0E1118] border border-white/5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Effective eCPM</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
              ₹{summary?.avgEcpmINR || 1250}
            </span>
            <span className="text-xs text-slate-400">/ 1,000 views</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            ~₹1.25 per completed creator ad view
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: 30-Day Revenue Total */}
        <div className="p-5 rounded-3xl bg-[#0E1118] border border-white/5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>30-Day Ad Earnings</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              ₹{(summary?.totalRevenue30d || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Across {summary?.totalImpressions30d || 0} total rewarded views
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Main Breakdown: Ad Providers Serving Daily Table */}
      <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Active Daily Ad Providers &amp; Monetization Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks which ad network is providing ads daily, fill rates, eCPM, and exact revenue earned for us.
            </p>
          </div>
          <span className="self-start sm:self-center text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
            4 PROVIDERS CONFIGURED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                <th className="py-3 px-3">Ad Provider</th>
                <th className="py-3 px-3">Ad Unit / Network ID</th>
                <th className="py-3 px-3">Today&apos;s Views</th>
                <th className="py-3 px-3">Fill Rate</th>
                <th className="py-3 px-3">eCPM (INR)</th>
                <th className="py-3 px-3">Cost to Us</th>
                <th className="py-3 px-3 text-right">Today&apos;s Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(providers).map(([key, prov]: [string, any]) => {
                const provStats = today?.byProvider?.[key] || {
                  impressions: 0,
                  earnedINR: 0,
                  fillRate: key === 'ADMOB' ? 98.5 : key === 'UNITY' ? 95.0 : key === 'START_IO' ? 92.0 : 100,
                  avgEcpmINR: prov.avgEcpmINR,
                };

                return (
                  <tr key={key} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: `${prov.color}20`, color: prov.color }}
                        >
                          {prov.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{prov.name}</p>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {prov.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-400">
                      <p className="truncate max-w-[220px]" title={prov.adUnitId}>
                        {prov.adUnitId}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[220px]">
                        App: {prov.appOrOrgId}
                      </p>
                    </td>
                    <td className="py-4 px-3 font-mono text-white font-bold text-sm">
                      {provStats.impressions}
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-bold">
                        {provStats.fillRate}%
                      </span>
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-300">
                      ₹{provStats.avgEcpmINR || prov.avgEcpmINR}
                    </td>
                    <td className="py-4 px-3 font-mono text-emerald-400 font-bold">
                      ₹0.00
                      <span className="text-[10px] text-slate-500 block font-normal">(Free Monetization)</span>
                    </td>
                    <td className="py-4 px-3 font-mono text-right font-black text-emerald-400 text-sm">
                      ₹{(provStats.earnedINR || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Daily History & Live Impression Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Earnings History (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/5 bg-[#0E1118] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Earnings History</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daily ad impressions and revenue breakdown by date
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full">
              {data?.dailyHistory?.length || 0} Days Recorded
            </span>
          </div>

          {(!data?.dailyHistory || data.dailyHistory.length === 0) ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No historical daily records yet. As users watch ads, daily totals appear here automatically.
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
              {data.dailyHistory.map((day) => (
                <div key={day.date} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-white">{day.date}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {day.totalImpressions} views &bull; {day.totalDCoinsAwarded || 0} D-Coins bonus credited
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{(day.totalEarnedINR || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      eCPM: ₹{day.totalImpressions > 0 ? Math.round((day.totalEarnedINR / day.totalImpressions) * 1000) : 1250}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Completed Impressions Feed (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/5 bg-[#0E1118] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Completed Ad Views</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time stream of verified creator views
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              LIVE
            </span>
          </div>

          {(!data?.recentImpressions || data.recentImpressions.length === 0) ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Waiting for first app ad completion event...
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto space-y-1">
              {data.recentImpressions.map((imp) => (
                <div key={imp.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-[11px]">
                        {imp.providerName || imp.provider}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                        {imp.platform || 'ANDROID'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px]">
                      User: {imp.uid?.slice(0, 10)}... &bull; {new Date(imp.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400">
                      +₹{(imp.earnedINR || 1.25).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      +10 D-Coins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
