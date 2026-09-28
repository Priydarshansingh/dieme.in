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

const DL_STATUS_CONFIG: Record<NonNullable<ClipDoc['downloadStatus']>, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Pending',     color: '#9CA3AF', bg: '#F4F6F9' },
  queued:      { label: 'Queued',      color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  downloading: { label: 'Downloading', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  processing:  { label: 'Processing',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  completed:   { label: 'Downloaded',  color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  failed:      { label: 'Failed',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
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
        <Scissors className="w-5 h-5" style={{ color: '#1B2237' }} />
      </div>
      <p className="font-bold text-sm" style={{ color: '#1B2237' }}>No clips yet</p>
      <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#9CA3AF' }}>
        When viewers type <span className="font-mono font-semibold">!clip</span> during your livestream, markers appear here.
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
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 style={{ color: '#1B2237' }}>Clips</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          All clip markers across your streams.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
            style={
              activeFilter === f.key
                ? { backgroundColor: '#1B2237', color: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="rounded-2xl overflow-hidden divide-y"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          {filtered.map((clip) => {
            const dlCfg = DL_STATUS_CONFIG[clip.downloadStatus ?? 'not_started'];
            return (
              <div key={clip.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#F4F6F9' }}
                >
                  <Scissors className="w-4 h-4" style={{ color: '#1B2237' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono" style={{ color: '#1B2237' }}>
                      {clip.id}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                      <Clock className="w-3 h-3" />
                      {clip.markerTimestampDisplay}
                    </span>
                  </div>
                  {clip.aiTopic && (
                    <p className="text-xs mt-0.5 font-medium truncate" style={{ color: '#6B7280' }}>
                      {clip.aiTopic}
                      {clip.aiEngagementScore != null && (
                        <span className="ml-1.5 font-normal" style={{ color: '#9CA3AF' }}>
                          · {clip.aiEngagementScore}% engagement
                        </span>
                      )}
                    </p>
                  )}
                  {clip.authorName && (
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      clipped by {clip.authorName}
                    </p>
                  )}
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ color: dlCfg.color, backgroundColor: dlCfg.bg }}
                  >
                    {dlCfg.label}
                  </span>
                  {clip.telegramSent && (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ color: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)' }}
                    >
                      <Send className="w-3 h-3" /> Sent
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
