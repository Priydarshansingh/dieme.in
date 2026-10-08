'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc,
  Timestamp, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Scissors, Send, Clock } from 'lucide-react';

interface ClipDoc {
  id: string;
  streamId: string;
  markerTimestampDisplay: string;
  authorName?: string;
  aiTopic?: string;
  aiEngagementScore?: number;
  downloadStatus?: 'not_started' | 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';
  telegramSent?: boolean;
  createdAt: Timestamp;
}

type Filter = 'all' | 'completed' | 'telegram' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'completed', label: 'Downloaded' },
  { key: 'telegram',  label: 'Sent to Telegram' },
  { key: 'failed',    label: 'Failed' },
];

const DL_STATUS_CONFIG: Record<NonNullable<ClipDoc['downloadStatus']>, { label: string; color: string; bg: string; border: string }> = {
  not_started: { label: 'Pending',     color: '#94A3B8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  queued:      { label: 'Queued',      color: '#FBBF24', bg: 'rgba(217,119,6,0.15)',   border: 'rgba(217,119,6,0.3)' },
  downloading: { label: 'Downloading', color: '#60A5FA', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)' },
  processing:  { label: 'Processing',  color: '#C084FC', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)' },
  completed:   { label: 'Downloaded',  color: '#34D399', bg: 'rgba(5,150,105,0.15)',   border: 'rgba(5,150,105,0.3)' },
  failed:      { label: 'Failed',      color: '#F87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)' },
};

function EmptyState() {
  return (
    <div
      className="glass-card rounded-2xl p-16 text-center space-y-3 border border-dashed border-white/15"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto bg-white/10 border border-white/10"
      >
        <Scissors className="w-5 h-5 text-white" />
      </div>
      <p className="font-bold text-sm text-white">No clips yet</p>
      <p className="text-sm leading-relaxed max-w-xs mx-auto text-slate-400">
        When viewers type <span className="font-mono font-semibold text-cyan-300">!clip</span> during your livestream, markers appear here.
      </p>
    </div>
  );
}

export default function ClipsPage() {
  const { user } = useAuth();
  const [clips, setClips] = useState<ClipDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (!userSnap.exists()) return;
        const workspaceId: string = userSnap.data().defaultWorkspaceId;
        const snap = await getDocs(
          query(
            collection(db, 'workspaces', workspaceId, 'clips'),
            orderBy('createdAt', 'desc'),
            limit(100),
          )
        );
        setClips(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClipDoc)));
      } catch (err) {
        console.error('Clips load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const filtered = clips.filter((c) => {
    if (activeFilter === 'completed') return c.downloadStatus === 'completed';
    if (activeFilter === 'telegram')  return c.telegramSent === true;
    if (activeFilter === 'failed')    return c.downloadStatus === 'failed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Clips</h1>
        <p className="text-sm mt-1 text-slate-400">
          All clip markers across your streams.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                  : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl"
        >
          {filtered.map((clip) => {
            const dlCfg = DL_STATUS_CONFIG[clip.downloadStatus ?? 'not_started'];
            return (
              <div key={clip.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10"
                >
                  <Scissors className="w-4 h-4 text-cyan-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-white">
                      {clip.id}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {clip.markerTimestampDisplay}
                    </span>
                  </div>
                  {clip.aiTopic && (
                    <p className="text-xs mt-0.5 font-medium truncate text-slate-300">
                      {clip.aiTopic}
                      {clip.aiEngagementScore != null && (
                        <span className="ml-1.5 font-normal text-cyan-400">
                          · {clip.aiEngagementScore}% engagement
                        </span>
                      )}
                    </p>
                  )}
                  {clip.authorName && (
                    <p className="text-xs text-slate-400">
                      clipped by {clip.authorName}
                    </p>
                  )}
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border"
                    style={{ color: dlCfg.color, backgroundColor: dlCfg.bg, borderColor: dlCfg.border }}
                  >
                    {dlCfg.label}
                  </span>
                  {clip.telegramSent && (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-500/30 text-blue-300 bg-blue-500/15"
                    >
                      <Send className="w-3 h-3 text-cyan-400" /> Sent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
