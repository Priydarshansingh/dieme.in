'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Radio, Scissors, ArrowRight } from 'lucide-react';

interface StreamDoc {
  id: string;
  title: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  clipCount: number;
  status: 'live' | 'ended' | 'vod_processing' | 'vod_ready' | 'archived';
}

function formatDuration(start: Timestamp, end?: Timestamp) {
  const ms = ((end ?? Timestamp.now()).toMillis()) - start.toMillis();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

function formatDate(ts: Timestamp) {
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG: Record<StreamDoc['status'], { label: string; color: string; bg: string }> = {
  live:           { label: 'Live',           color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  ended:          { label: 'Ended',          color: '#6B7280', bg: '#F4F6F9' },
  vod_processing: { label: 'Processing',     color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  vod_ready:      { label: 'VOD Ready',      color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  archived:       { label: 'Archived',       color: '#9CA3AF', bg: '#F9FAFB' },
};

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-16 text-center space-y-3 border border-dashed"
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
        Open the Digicast Android app and start monitoring a YouTube livestream to see streams here.
      </p>
    </div>
  );
}

export default function StreamsPage() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<StreamDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (!userSnap.exists()) return;
        const workspaceId: string = userSnap.data().defaultWorkspaceId;
        const snap = await getDocs(
          query(
            collection(db, 'workspaces', workspaceId, 'streams'),
            orderBy('startedAt', 'desc'),
            limit(50),
          )
        );
        setStreams(snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamDoc)));
      } catch (err) {
        console.error('Streams load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 style={{ color: '#1B2237' }}>Streams</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          All your YouTube livestreams and their clip markers.
        </p>
      </div>

      {streams.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="rounded-2xl overflow-hidden divide-y"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          {streams.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.ended;
            const isLive = s.status === 'live';
            return (
              <a
                key={s.id}
                href={`/streams/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isLive ? '#1B2237' : '#F4F6F9' }}
                >
                  {isLive ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                  ) : (
                    <Radio className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1B2237' }}>
                    {s.title || (s.startedAt ? formatDate(s.startedAt) : 'Untitled stream')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {s.startedAt ? formatDate(s.startedAt) : '—'}
                    {s.startedAt && ` · ${formatDuration(s.startedAt, s.endedAt)}`}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>

                {/* Clips count */}
                <div className="text-right shrink-0 w-12">
                  <p className="text-sm font-bold" style={{ color: '#1B2237' }}>{s.clipCount ?? 0}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    <Scissors className="inline w-3 h-3 mr-0.5" />clips
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition" style={{ color: '#6B7280' }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
