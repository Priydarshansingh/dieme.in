'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ChevronLeft, Scissors, Send, MessageSquare, Clock } from 'lucide-react';

// IMPORTANT: Full chat history is NEVER stored in Firestore — it lives on the creator's device only.
// This view shows clip markers (stored in Firestore) and stream metadata (stored), not raw chat.

interface StreamDoc {
  id: string;
  title: string;
  youtubeVideoId: string;
  status: 'live' | 'ended' | 'vod_processing' | 'vod_ready' | 'archived';
  startedAt: Timestamp;
  endedAt?: Timestamp;
  durationSeconds?: number;
  messageCount?: number;
  clipCount?: number;
}

interface ClipMarkerDoc {
  id: string;
  markerTimestamp: number;
  markerTimestampDisplay: string;
  aiTopic?: string;
  aiEngagementScore?: number;
  downloadStatus?: string;
  telegramSent?: boolean;
  authorName?: string;
}

const STATUS_CONFIG: Record<StreamDoc['status'], { label: string; color: string; bg: string; border: string }> = {
  live:           { label: 'Live',       color: '#F87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  ended:          { label: 'Ended',      color: '#94A3B8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  vod_processing: { label: 'Processing', color: '#FBBF24', bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.3)' },
  vod_ready:      { label: 'VOD Ready',  color: '#34D399', bg: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.3)' },
  archived:       { label: 'Archived',   color: '#64748B', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
};

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StreamDetailPage({ params }: { params: { streamId: string } }) {
  const { streamId } = params;
  const { user } = useAuth();
  const [stream, setStream] = useState<StreamDoc | null>(null);
  const [markers, setMarkers] = useState<ClipMarkerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (!userSnap.exists()) return;
        const wid: string = userSnap.data().defaultWorkspaceId;
        setWorkspaceId(wid);

        const streamSnap = await getDoc(doc(db, 'workspaces', wid, 'streams', streamId));
        if (streamSnap.exists()) {
          setStream({ id: streamSnap.id, ...streamSnap.data() } as StreamDoc);
        }

        const markersSnap = await getDocs(
          query(
            collection(db, 'workspaces', wid, 'streams', streamId, 'clipMarkers'),
            orderBy('markerTimestamp', 'desc'),
          )
        );
        setMarkers(markersSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClipMarkerDoc)));
      } catch (err) {
        console.error('Stream detail load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, streamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="max-w-4xl space-y-6">
        <Link href="/streams" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ChevronLeft className="w-4 h-4" /> Back to Streams
        </Link>
        <div
          className="glass-card rounded-2xl p-16 text-center border border-dashed border-white/15"
        >
          <p className="text-sm text-slate-400">Stream not found.</p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[stream.status] ?? STATUS_CONFIG.ended;
  const durationPct = (ts: number) =>
    stream.durationSeconds
      ? `${Math.min(100, (ts / stream.durationSeconds) * 100).toFixed(2)}%`
      : '0%';

  return (
    <div className="max-w-7xl space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/streams"
          className="mt-1 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              {stream.title || 'Untitled stream'}
            </h1>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 border"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm mt-1 text-slate-400">
            {stream.startedAt?.toDate().toLocaleDateString('en-US', { dateStyle: 'long' })}
            {stream.durationSeconds && ` · ${formatDuration(stream.durationSeconds)}`}
          </p>
        </div>
        <div className="flex gap-5 shrink-0 text-right">
          {stream.messageCount != null && (
            <div>
              <p className="text-sm font-bold text-white">{stream.messageCount.toLocaleString()}</p>
              <p className="text-xs text-slate-400"><MessageSquare className="inline w-3 h-3 mr-0.5" />msgs</p>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white">{markers.length}</p>
            <p className="text-xs text-slate-400"><Scissors className="inline w-3 h-3 mr-0.5" />clips</p>
          </div>
        </div>
      </div>

      {/* Main workspace: video + chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video embed */}
        <div className="lg:col-span-2">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            {stream.youtubeVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${stream.youtubeVideoId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-slate-500">No video ID</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className="glass-card rounded-2xl overflow-hidden flex flex-col"
          style={{ minHeight: '280px' }}
        >
          <div className="px-5 py-3.5 border-b border-white/[0.08]">
            <p className="text-sm font-semibold text-white">Chat Replay</p>
            <p className="text-xs mt-0.5 text-slate-400">Local only — not stored in the cloud.</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">Connect the Android app to view local chat.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clip marker section */}
      <div
        className="glass-card rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <p className="text-sm font-semibold text-white">Clip Markers</p>
          <p className="text-xs mt-0.5 text-slate-400">
            Created when viewers type !clip in live chat.
          </p>
        </div>

        {/* Visual timeline */}
        {stream.durationSeconds && markers.length > 0 && (
          <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="relative w-full h-2 rounded-full bg-white/10">
              {markers.map((m) => (
                <div
                  key={m.id}
                  title={`${m.markerTimestampDisplay} — ${m.aiTopic ?? ''}`}
                  style={{ left: durationPct(m.markerTimestamp) }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition"
                >
                  <div className="w-full h-full rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500 font-mono">0:00</span>
              <span className="text-xs text-slate-500 font-mono">{formatDuration(stream.durationSeconds)}</span>
            </div>
          </div>
        )}

        {/* Marker list */}
        {markers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Scissors className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-400">No clip markers for this stream yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {markers.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition">
                <span
                  className="font-mono text-xs w-16 shrink-0 font-semibold text-cyan-300"
                >
                  {m.markerTimestampDisplay}
                </span>
                <div className="flex-1 min-w-0">
                  {m.aiTopic ? (
                    <p className="text-sm font-medium truncate text-white">{m.aiTopic}</p>
                  ) : (
                    <p className="text-sm text-slate-400">No topic</p>
                  )}
                  <p className="text-xs font-mono text-slate-500">{m.id}</p>
                </div>
                {m.aiEngagementScore != null && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-white">{m.aiEngagementScore}</p>
                    <p className="text-xs text-slate-400">score</p>
                  </div>
                )}
                {m.telegramSent ? (
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 border border-blue-500/30 text-blue-300 bg-blue-500/15"
                  >
                    <Send className="w-3 h-3 text-cyan-400" /> Sent
                  </span>
                ) : (
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl transition hover:opacity-90 shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/15"
                  >
                    Generate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
