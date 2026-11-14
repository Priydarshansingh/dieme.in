'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  doc, getDoc, collection, query, where, getDocs, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  ChevronLeft, Scissors, Smartphone, Play, Radio, Clock, Eye, Sparkles, ExternalLink, ArrowRight,
} from 'lucide-react';

interface StreamDoc {
  id: string;
  title: string;
  youtubeVideoId: string;
  thumbnailUrl?: string;
  status: 'live' | 'ended' | string;
  startedAt?: any;
  endedAt?: any;
  durationSeconds?: number;
  viewCount?: number;
  concurrentViewers?: number;
  channelName?: string;
  clipCount?: number;
}

interface ClipMarkerDoc {
  id: string;
  streamId?: string;
  youtubeVideoId?: string;
  markerTimestamp?: number;
  markerTimestampDisplay?: string;
  title?: string;
  note?: string;
  aiTopic?: string;
  authorName?: string;
  downloadStatus?: string;
  telegramSent?: boolean;
  telegramStatus?: string;
  createdAt?: any;
}

function parseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  if (typeof val === 'number') return new Date(val);
  return new Date(val);
}

function formatDate(ts: any) {
  if (!ts) return '—';
  return parseDate(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function StreamDetailPage({ params }: { params: { streamId: string } }) {
  const routeParams = useParams();
  const rawId = (params?.streamId || (routeParams?.streamId as string) || '');
  const streamId = decodeURIComponent(rawId);

  const { user } = useAuth();
  const [stream, setStream] = useState<StreamDoc | null>(null);
  const [markers, setMarkers] = useState<ClipMarkerDoc[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipMarkerDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !streamId) return;
    let isCancelled = false;

    async function load() {
      try {
        const idToken = await user?.getIdToken().catch(() => '');
        const headers: Record<string, string> = {
          'x-user-uid': user!.uid,
          'x-user-email': user!.email || '',
        };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        // 1. Resolve workspace id (user default workspace or user.uid)
        let wid = user!.uid;
        try {
          const userDoc = await getDoc(doc(db, 'users', user!.uid));
          if (userDoc.exists() && userDoc.data()?.defaultWorkspaceId) {
            wid = userDoc.data()!.defaultWorkspaceId;
          }
        } catch {
          // fallback
        }

        // 2. Fetch authoritative stream doc from server API
        let foundStream: StreamDoc | null = null;
        try {
          const streamRes = await fetch(`/api/streams?workspaceId=${wid}&streamId=${encodeURIComponent(streamId)}`, { headers });
          if (streamRes.ok) {
            const data = await streamRes.json();
            if (data.stream) {
              foundStream = data.stream;
            }
          }
        } catch (apiErr) {
          console.warn('[StreamDetail] API stream lookup error:', apiErr);
        }

        // 3. Fallback: query client-side Firestore directly if API didn't find it
        if (!foundStream) {
          try {
            const directSnap = await getDoc(doc(db, 'workspaces', wid, 'streams', streamId));
            if (directSnap.exists()) {
              const d = directSnap.data();
              foundStream = {
                id: directSnap.id,
                title: d.title || 'Untitled Stream',
                youtubeVideoId: d.youtubeVideoId || directSnap.id,
                thumbnailUrl: d.thumbnailUrl || (d.youtubeVideoId ? `https://i.ytimg.com/vi/${d.youtubeVideoId}/hqdefault.jpg` : ''),
                status: d.status || 'ended',
                startedAt: d.startedAt,
                endedAt: d.endedAt,
                channelName: d.channelName,
                viewCount: d.viewCount,
                concurrentViewers: d.concurrentViewers,
                clipCount: d.clipCount,
              };
            } else {
              // Try querying by youtubeVideoId in workspace
              const ytSnap = await getDocs(
                query(collection(db, 'workspaces', wid, 'streams'), where('youtubeVideoId', '==', streamId), limit(1))
              );
              if (!ytSnap.empty) {
                const sDoc = ytSnap.docs[0];
                const d = sDoc.data();
                foundStream = {
                  id: sDoc.id,
                  title: d.title || 'Untitled Stream',
                  youtubeVideoId: d.youtubeVideoId || sDoc.id,
                  thumbnailUrl: d.thumbnailUrl || `https://i.ytimg.com/vi/${d.youtubeVideoId || sDoc.id}/hqdefault.jpg`,
                  status: d.status || 'ended',
                  startedAt: d.startedAt,
                  endedAt: d.endedAt,
                  channelName: d.channelName,
                  viewCount: d.viewCount,
                  concurrentViewers: d.concurrentViewers,
                  clipCount: d.clipCount,
                };
              }
            }
          } catch (clientFsErr) {
            console.warn('[StreamDetail] Client firestore fallback note:', clientFsErr);
          }
        }

        if (foundStream && !isCancelled) {
          setStream(foundStream);
        }

        // 4. Fetch all clips for this stream from server API
        let foundClips: ClipMarkerDoc[] = [];
        try {
          const clipsRes = await fetch(`/api/clips?workspaceId=${wid}&streamId=${encodeURIComponent(streamId)}`, { headers });
          if (clipsRes.ok) {
            const clipsData = await clipsRes.json();
            if (Array.isArray(clipsData.clips)) {
              foundClips = clipsData.clips;
            }
          }
        } catch (clipsApiErr) {
          console.warn('[StreamDetail] API clips lookup error:', clipsApiErr);
        }

        // 5. Fallback clips: query client Firestore
        if (foundClips.length === 0) {
          try {
            const q1 = await getDocs(
              query(collection(db, 'workspaces', wid, 'clips'), where('streamId', '==', streamId))
            );
            if (!q1.empty) {
              foundClips = q1.docs.map(d => ({ id: d.id, ...d.data() } as ClipMarkerDoc));
            } else {
              const q2 = await getDocs(
                query(collection(db, 'workspaces', wid, 'clips'), where('youtubeVideoId', '==', streamId))
              );
              if (!q2.empty) {
                foundClips = q2.docs.map(d => ({ id: d.id, ...d.data() } as ClipMarkerDoc));
              }
            }
          } catch {
            // ignore
          }
        }

        if (!isCancelled) {
          setMarkers(foundClips);
          if (foundClips.length > 0) {
            setSelectedClip(foundClips[0]);
          }
        }
      } catch (err) {
        console.error('Stream detail load error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    load();
    return () => { isCancelled = true; };
  }, [user, streamId]);

  const handleSelectClip = (clip: ClipMarkerDoc) => {
    setSelectedClip(clip);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="w-full space-y-6">
        <Link href="/streams" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ChevronLeft className="w-4 h-4" /> Back to Streams
        </Link>
        <div className="glass-card rounded-2xl p-16 text-center border border-dashed border-white/10 space-y-3">
          <p className="text-sm font-semibold text-white">Stream not found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            This stream may have been archived or is not associated with your connected channel.
          </p>
          <div className="pt-2">
            <Link
              href="/streams"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
            >
              Browse All Streams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const videoId = stream.youtubeVideoId || stream.id;
  const appDeepLink = `digicast://stream/${videoId}`;

  // If a clip is selected, start preview at that timestamp
  const playerStartSeconds = selectedClip?.markerTimestamp || 0;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0${playerStartSeconds > 0 ? `&start=${playerStartSeconds}&autoplay=1` : ''}`;

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/streams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Streams
        </Link>

        {/* Action: Open in App */}
        <a
          href={appDeepLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition"
          title="Open in Dieme Mobile App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Open in App to Cut Clips</span>
        </a>
      </div>

      {/* Stream Header & Metadata Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {stream.title || 'Live Stream Broadcast'}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border shrink-0 ${
                  isLive
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-white/[0.04] text-slate-400 border-white/10'
                }`}
              >
                {isLive ? 'Live Now' : 'Ended'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              {stream.channelName && <span className="text-slate-300 font-medium">{stream.channelName}</span>}
              <span>· {formatDate(stream.startedAt)}</span>
              {stream.startedAt && <span>· {formatDuration(stream.startedAt, stream.endedAt)}</span>}
              {stream.viewCount != null && Number(stream.viewCount) > 0 && (
                <span>· {Number(stream.viewCount).toLocaleString()} views</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-right self-start">
            <div>
              <p className="text-base font-bold text-white">{markers.length}</p>
              <p className="text-[11px] text-slate-400">
                <Scissors className="inline w-3 h-3 mr-0.5" />clips
              </p>
            </div>
          </div>
        </div>

        {/* Video Player Preview (No editor on web, strictly preview) */}
        <div ref={playerRef} className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
          {videoId ? (
            <iframe
              key={`${videoId}-${playerStartSeconds}`}
              src={embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={stream.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              No video preview available
            </div>
          )}
        </div>

        {/* Active Selected Clip Preview Callout */}
        {selectedClip && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-900/60 border border-cyan-400/40 shrink-0">
                {selectedClip.markerTimestampDisplay || '00:00'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {selectedClip.title || selectedClip.aiTopic || selectedClip.note || 'Selected Highlight'}
                </p>
                <p className="text-xs text-slate-400">
                  Previewing at {selectedClip.markerTimestampDisplay || '00:00'} · Captured by {selectedClip.authorName || 'Viewer'}
                </p>
              </div>
            </div>

            <a
              href={`digicast://clip/${selectedClip.id}?streamId=${videoId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow shrink-0 self-start sm:self-auto"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Open & Cut in Phone App →</span>
            </a>
          </div>
        )}

        {/* Notice: Clip Editing is handled in the Mobile App */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-white">Mobile Studio Companion:</strong> High-speed video trimming, clutch moment clipping, and instant Telegram delivery are powered inside our Android app.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={appDeepLink}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold transition shadow"
            >
              Launch in App →
            </a>
            <a
              href="/api/download/apk"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition"
            >
              Get APK
            </a>
          </div>
        </div>
      </div>

      {/* Clip Highlights & Markers Section */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/10">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-cyan-400" />
              Clip Highlights &amp; Markers
              <span className="text-xs font-normal text-slate-400">({markers.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Recorded live during this broadcast. Tap any clip to preview above or cut in the Dieme Android Companion App.
            </p>
          </div>
        </div>

        {markers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Scissors className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No clip markers recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When viewers type <code className="text-cyan-300 font-mono font-bold">!clip</code> in chat or you tap the mobile companion clip button, highlights appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {markers.map((m) => {
              const clipDeepLink = `digicast://clip/${m.id}?streamId=${videoId}`;
              const isSelected = selectedClip?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectClip(m)}
                  className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-500/[0.08] border-l-2 border-l-cyan-400'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Left: Timestamp & Topic */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 shrink-0">
                      {m.markerTimestampDisplay || '00:00'}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {m.title || m.aiTopic || m.note || 'Clip Highlight'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Captured by <span className="text-slate-300 font-medium">{m.authorName || 'Viewer'}</span>
                        {m.createdAt && <span> · {formatDate(m.createdAt)}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Deep link to app to edit) */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    {m.telegramSent || m.telegramStatus === 'uploaded' ? (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        Sent to Telegram
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg">
                        Ready
                      </span>
                    )}

                    <a
                      href={clipDeepLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                      title="Open in Dieme App to trim and edit"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Cut in App</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
