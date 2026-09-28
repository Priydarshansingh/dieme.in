'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  collection, query, orderBy, limit, where, getDocs,
  doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { Radio, Scissors, Send, ArrowRight, RefreshCw, CheckCircle, Youtube } from 'lucide-react';
import Image from 'next/image';

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
      className="rounded-2xl p-5 space-y-3"
      style={{
        backgroundColor: live ? '#1B2237' : '#FFFFFF',
        border: `1px solid ${live ? 'transparent' : '#E5E7EB'}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: live ? 'rgba(255,255,255,0.55)' : '#6B7280' }}>
          {label}
        </p>
        <Icon className="w-4 h-4" style={{ color: live ? 'rgba(255,255,255,0.4)' : '#D1D5DB' }} />
      </div>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: live ? '#FFFFFF' : '#1B2237' }}>
        {value}
      </p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyStreams({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div
      className="rounded-2xl p-10 text-center space-y-4 border border-dashed"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-red-50 text-red-600"
      >
        <Youtube className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: '#1B2237' }}>No streams detected yet</p>
        <p className="text-xs mt-1 leading-relaxed max-w-sm mx-auto" style={{ color: '#9CA3AF' }}>
          Sync with your connected YouTube channel to pull recent streams, or start a live stream in YouTube Studio.
        </p>
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-black transition disabled:opacity-50"
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
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'short' });
  const firstName = user?.displayName?.split(' ')[0] ?? '';

  return (
    <div className="max-w-4xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#1B2237' }}>
            {firstName ? `Hey, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleSyncStreams}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50 text-gray-800"
          style={{ borderColor: '#E5E7EB' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-500' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync YouTube'}
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-blue-500 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Live banner */}
      {liveStream && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-sm"
          style={{ backgroundColor: '#1B2237' }}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Live now on YouTube</p>
            <p className="text-sm font-semibold text-white truncate">{liveStream.title}</p>
          </div>
          <a
            href={`/streams/${liveStream.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition shrink-0"
          >
            Monitor Live <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={`Streams — ${monthLabel}`} value={streamsThisMonth} icon={Radio} />
        <StatCard label={`Clips Recorded`} value={clipsThisMonth} icon={Scissors} live={clipsThisMonth > 0} />
        <StatCard label="Telegram Uploads" value={telegramUploads} icon={Send} />
      </div>

      {/* Recent streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 style={{ color: '#1B2237' }}>Recent Streams & Broadcasts</h2>
          {recentStreams.length > 0 && (
            <a href="/streams" className="text-xs font-medium hover:underline" style={{ color: '#6B7280' }}>
              View all
            </a>
          )}
        </div>

        {recentStreams.length === 0 ? (
          <EmptyStreams onSync={handleSyncStreams} isSyncing={isSyncing} />
        ) : (
          <div
            className="rounded-2xl overflow-hidden divide-y shadow-sm"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            {recentStreams.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {s.thumbnailUrl ? (
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-14 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {s.status === 'live' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">
                          LIVE
                        </span>
                      )}
                      <p className="text-sm font-semibold truncate" style={{ color: '#1B2237' }}>
                        {s.title || (s.startedAt ? formatDate(s.startedAt) : 'Untitled stream')}
                      </p>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {s.startedAt ? formatDate(s.startedAt) : '—'}
                      {s.startedAt && ` · ${formatDuration(s.startedAt, s.endedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#1B2237' }}>{s.clipCount ?? 0}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>clips</p>
                  </div>
                  <a
                    href={`/streams/${s.id}`}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    style={{ color: '#1B2237' }}
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
