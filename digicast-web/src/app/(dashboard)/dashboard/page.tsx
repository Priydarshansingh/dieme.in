'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, where, getDocs,
  doc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Radio, Scissors, Send, ArrowRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreamDoc {
  id: string;
  title: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  clipCount: number;
  status: 'live' | 'ended';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(start: Timestamp, end?: Timestamp) {
  const ms = ((end ?? Timestamp.now()).toMillis()) - start.toMillis();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

function formatDate(ts: Timestamp) {
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
function EmptyStreams() {
  return (
    <div
      className="rounded-2xl p-12 text-center space-y-3 border border-dashed"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: '#F4F6F9' }}
      >
        <Radio className="w-5 h-5" style={{ color: '#1B2237' }} />
      </div>
      <p className="font-bold text-sm" style={{ color: '#1B2237' }}>No streams yet</p>
      <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#9CA3AF' }}>
        Open the Digicast Android app and start monitoring a YouTube livestream to see data here.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [liveStream, setLiveStream] = useState<StreamDoc | null>(null);
  const [recentStreams, setRecentStreams] = useState<StreamDoc[]>([]);
  const [clipsThisMonth, setClipsThisMonth] = useState(0);
  const [telegramUploads, setTelegramUploads] = useState(0);
  const [streamsThisMonth, setStreamsThisMonth] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (!userSnap.exists()) return;
        const workspaceId: string = userSnap.data().defaultWorkspaceId;

        const now = new Date();
        const startOfMonth = new Timestamp(
          Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000), 0
        );

        const [liveSnap, recentSnap, monthSnap, clipsSnap, tgSnap] = await Promise.all([
          getDocs(query(collection(db, 'workspaces', workspaceId, 'streams'), where('status', '==', 'live'), limit(1))),
          getDocs(query(collection(db, 'workspaces', workspaceId, 'streams'), orderBy('startedAt', 'desc'), limit(8))),
          getDocs(query(collection(db, 'workspaces', workspaceId, 'streams'), where('startedAt', '>=', startOfMonth))),
          getDocs(query(collection(db, 'workspaces', workspaceId, 'clips'), where('createdAt', '>=', startOfMonth))),
          getDocs(query(collection(db, 'workspaces', workspaceId, 'clips'), where('createdAt', '>=', startOfMonth), where('telegramSent', '==', true))),
        ]);

        setLiveStream(liveSnap.empty ? null : { id: liveSnap.docs[0].id, ...liveSnap.docs[0].data() } as StreamDoc);
        setRecentStreams(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as StreamDoc)));
        setStreamsThisMonth(monthSnap.size);
        setClipsThisMonth(clipsSnap.size);
        setTelegramUploads(tgSnap.size);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [user]);

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
      </div>

      {/* Live banner */}
      {liveStream && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: '#1B2237' }}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Live now</p>
            <p className="text-sm font-semibold text-white truncate">{liveStream.title}</p>
          </div>
          <a
            href={`/streams/${liveStream.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition shrink-0"
          >
            View <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={`Streams — ${monthLabel}`} value={streamsThisMonth} icon={Radio} />
        <StatCard label={`Clips — ${monthLabel}`} value={clipsThisMonth} icon={Scissors} live={clipsThisMonth > 0} />
        <StatCard label="Telegram Uploads" value={telegramUploads} icon={Send} />
      </div>

      {/* Recent streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 style={{ color: '#1B2237' }}>Recent Streams</h2>
          {recentStreams.length > 0 && (
            <a href="/streams" className="text-xs font-medium hover:underline" style={{ color: '#6B7280' }}>
              View all
            </a>
          )}
        </div>

        {recentStreams.length === 0 ? (
          <EmptyStreams />
        ) : (
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            {recentStreams.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.status === 'live' && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1B2237' }}>
                      {s.title || (s.startedAt ? formatDate(s.startedAt) : 'Untitled stream')}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      {s.startedAt ? formatDuration(s.startedAt, s.endedAt) : '—'}
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
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: '#6B7280' }}
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
