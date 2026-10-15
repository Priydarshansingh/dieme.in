'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  collection, query, orderBy, limit, where, getDocs,
  doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { Radio, Scissors, Send, ArrowRight, RefreshCw, CheckCircle, Youtube, QrCode, Sparkles, Smartphone, Download } from 'lucide-react';
import Image from 'next/image';
import UpiPaymentModal from '@/components/subscription/UpiPaymentModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreamDoc {
  id: string;
  title: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  startedAt?: any;
  endedAt?: any;
  clipCount: number;
  status: 'live' | 'ended' | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function formatDuration(startVal: any, endVal?: any) {
  const start = parseDate(startVal);
  const end = endVal ? parseDate(endVal) : new Date();
  const ms = end.getTime() - start.getTime();
  const totalMins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

function formatDate(ts: any) {
  return parseDate(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, live,
}: {
  label: string; value: string | number; icon: React.ElementType; live?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 space-y-3 transition-all duration-200 ${
        live ? 'border-cyan-500/40 bg-cyan-500/[0.06] shadow-[0_0_25px_rgba(6,182,212,0.12)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${live ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyStreams({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div
      className="glass-card rounded-2xl p-10 text-center space-y-4 border border-dashed border-white/15"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-red-500/10 text-red-400 border border-red-500/20"
      >
        <Youtube className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold text-sm text-white">No streams detected yet</p>
        <p className="text-xs mt-1 leading-relaxed max-w-sm mx-auto text-slate-400">
          Sync with your connected YouTube channel to pull recent streams, or start a live stream in YouTube Studio.
        </p>
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition disabled:opacity-50 shadow-sm"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing YouTube...' : 'Sync YouTube Streams Now'}
      </button>
    </div>
  );
}

// ─── Dashboard Content ────────────────────────────────────────────────────────
function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<StreamDoc | null>(null);
  const [recentStreams, setRecentStreams] = useState<StreamDoc[]>([]);
  const [clipsThisMonth, setClipsThisMonth] = useState(0);
  const [telegramUploads, setTelegramUploads] = useState(0);
  const [streamsThisMonth, setStreamsThisMonth] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('Creator Studio');
  const [subscription, setSubscription] = useState<any>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const loadData = useCallback(async (wid: string) => {
    try {
      const streamsSnap = await getDocs(
        query(collection(db, 'workspaces', wid, 'streams'), limit(30))
      );

      const allStreams = streamsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as StreamDoc));

      // Sort by startedAt descending
      allStreams.sort((a, b) => parseDate(b.startedAt).getTime() - parseDate(a.startedAt).getTime());

      const activeLive = allStreams.find((s) => s.status === 'live') || null;
      setLiveStream(activeLive);
      setRecentStreams(allStreams.slice(0, 10));
      setStreamsThisMonth(allStreams.length);

      const clipsSnap = await getDocs(collection(db, 'workspaces', wid, 'clips'));
      setClipsThisMonth(clipsSnap.size);

      const tgUploaded = clipsSnap.docs.filter((d) => d.data().telegramSent || d.data().telegramStatus === 'uploaded').length;
      setTelegramUploads(tgUploaded);

      return allStreams.length;
    } catch (err) {
      console.error('Dashboard load error:', err);
      return 0;
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleSyncStreams = async () => {
    if (!workspaceId) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch(`/api/youtube/sync?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.syncedCount !== undefined) {
        setSyncFeedback(`✅ Synced ${data.syncedCount} stream(s) from YouTube!`);
        await loadData(workspaceId);
      } else if (data.error) {
        setSyncFeedback(`⚠️ ${data.error}`);
      }
    } catch (e: any) {
      setSyncFeedback('⚠️ Failed to sync with YouTube.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    async function init() {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (!userSnap.exists()) return;
      const wid: string = userSnap.data().defaultWorkspaceId || user!.uid;
      setWorkspaceId(wid);

      // Load workspace details & subscription
      try {
        const wsDoc = await getDoc(doc(db, 'workspaces', wid));
        if (wsDoc.exists() && wsDoc.data()?.name) {
          setWorkspaceName(wsDoc.data().name);
        }
        const subRes = await fetch(`/api/workspaces/subscription?workspaceId=${wid}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription);
        }
      } catch (e) {
        console.error('Subscription load error in dashboard:', e);
      }

      const count = await loadData(wid);
      // Auto-trigger sync on first load if empty
      if (count === 0) {
        try {
          await fetch(`/api/youtube/sync?workspaceId=${wid}`);
          await loadData(wid);
        } catch {
          // Ignore
        }
      }
    }
    init();
  }, [user, loadData]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'short' });
  const firstName = user?.displayName?.split(' ')[0] ?? '';

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {firstName ? `Hey, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-sm mt-1 text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://raw.githubusercontent.com/Priydarshansingh/Digicast/main/download/digicast-app-latest.apk"
            target="_blank"
            rel="noopener noreferrer"
            download="digicast-app-latest.apk"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-sm bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
            title="Download latest Digicast Studio Android APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Download Android App</span>
            <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </a>

          <button
            onClick={() => setIsUpiModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-sm bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
            title="Upgrade or Renew Plan with UPI QR"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{subscription?.plan === 'pro' && !subscription?.isExpired ? 'Pro Active' : 'Plans & UPI (₹149+)'}</span>
          </button>

          <button
            onClick={handleSyncStreams}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border bg-white/10 border-white/15 hover:bg-white/20 transition shadow-sm disabled:opacity-50 text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-400' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync YouTube'}
          </button>
        </div>
      </div>

      {/* Official Android Companion App Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Digicast Studio Companion App (v1.0.0)</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">LATEST APK</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stream intelligence, clutch moments capture, on-device trimmer, Creator Wallet &amp; 24h pass.
            </p>
          </div>
        </div>
        <a
          href="https://raw.githubusercontent.com/Priydarshansingh/Digicast/main/download/digicast-app-latest.apk"
          target="_blank"
          rel="noopener noreferrer"
          download="digicast-app-latest.apk"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download APK (~30MB)</span>
        </a>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-cyan-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Live banner */}
      {liveStream && (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-2xl shadow-lg bg-red-500/10 border border-red-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Live now on YouTube</p>
              <p className="text-sm font-semibold text-white truncate">{liveStream.title}</p>
            </div>
          </div>
          <a
            href={`/streams/${liveStream.id}`}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition shrink-0"
          >
            Monitor Live <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label={`Streams — ${monthLabel}`} value={streamsThisMonth} icon={Radio} />
        <StatCard label={`Clips Recorded`} value={clipsThisMonth} icon={Scissors} live={clipsThisMonth > 0} />
        <StatCard label="Telegram Uploads" value={telegramUploads} icon={Send} />
      </div>

      {/* Recent streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Recent Streams &amp; Broadcasts</h2>
          {recentStreams.length > 0 && (
            <a href="/streams" className="text-xs font-medium text-slate-400 hover:text-white transition">
              View all
            </a>
          )}
        </div>

        {recentStreams.length === 0 ? (
          <EmptyStreams onSync={handleSyncStreams} isSyncing={isSyncing} />
        ) : (
          <div
            className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl"
          >
            {recentStreams.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-white/[0.04] transition gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.thumbnailUrl ? (
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-12 h-8 sm:w-14 sm:h-9 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {s.status === 'live' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase shadow-sm">
                          LIVE
                        </span>
                      )}
                      <p className="text-xs sm:text-sm font-semibold truncate text-white">
                        {s.title || (s.startedAt ? formatDate(s.startedAt) : 'Untitled stream')}
                      </p>
                    </div>
                    <p className="text-[11px] sm:text-xs mt-0.5 text-slate-400 truncate">
                      {s.startedAt ? formatDate(s.startedAt) : '—'}
                      {s.startedAt && ` · ${formatDuration(s.startedAt, s.endedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white">{s.clipCount ?? 0}</p>
                    <p className="text-xs text-slate-400">clips</p>
                  </div>
                  <a
                    href={`/streams/${s.id}`}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPI QR Payment Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        workspaceId={workspaceId || ''}
        workspaceName={workspaceName}
        userEmail={user?.email || ''}
        initialPlanId="pro"
        onPaymentSubmitted={() => {
          if (workspaceId) {
            fetch(`/api/workspaces/subscription?workspaceId=${workspaceId}`)
              .then(r => r.json())
              .then(d => { if (d.subscription) setSubscription(d.subscription); });
          }
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
