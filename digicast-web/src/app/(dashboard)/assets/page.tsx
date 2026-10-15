'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Palette,
  Tv,
  Download,
  Sparkles,
  Layers,
  CheckCircle2,
  Lock,
  Coins,
  Video,
  Image as ImageIcon,
  Play,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function StreamAssetsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [previewAsset, setPreviewAsset] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const assets = [
    // 1. Facecam Overlays
    {
      id: 'ast_fc_neon_cyber',
      title: 'Neon Cyberpunk Animated Facecam',
      description: 'High-contrast glowing cyan & magenta animated pulse border for webcam feeds.',
      category: 'FACECAM_OVERLAYS',
      categoryLabel: 'Facecam Overlay',
      previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: false,
      downloads: 1420,
    },
    {
      id: 'ast_fc_clean_minimal',
      title: 'Minimal Titanium Facecam Border',
      description: 'Sleek dark-mode matte border with custom username badge and audio visualizer bar.',
      category: 'FACECAM_OVERLAYS',
      categoryLabel: 'Facecam Overlay',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '1:1',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: true,
      downloads: 890,
    },

    // 2. Green Screen Effects
    {
      id: 'ast_gs_subscribe_bell',
      title: '3D Subscribe & Bell Green Screen',
      description: 'Chroma-key ready 3D YouTube subscribe button with click sound and confetti pop.',
      category: 'GREEN_SCREEN_EFFECTS',
      categoryLabel: 'Green Screen Effect',
      previewUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: false,
      downloads: 3120,
    },
    {
      id: 'ast_gs_glitch_pause',
      title: 'Cyber Glitch Stream Intermission FX',
      description: 'Alpha channel digital glitch transition with sound effects for scene switching.',
      category: 'GREEN_SCREEN_EFFECTS',
      categoryLabel: 'Green Screen Effect',
      previewUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: true,
      dpCost: 15,
      requiresAdPass: false,
      downloads: 640,
    },

    // 3. Custom Video Frames
    {
      id: 'ast_vf_esports_tactical',
      title: 'VCT Masters Esports Stream HUD Frame',
      description: 'Complete overlay frame with kill-feed border, sponsor logo slots, and match timer.',
      category: 'CUSTOM_VIDEO_FRAMES',
      categoryLabel: 'Custom Video Frame',
      previewUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: true,
      dpCost: 20,
      requiresAdPass: false,
      downloads: 480,
    },
    {
      id: 'ast_vf_dual_podcast',
      title: 'Dual Creator Talk-Show Split Frame',
      description: 'Side-by-side 2-camera layout frame with live chat ticker and host label banners.',
      category: 'CUSTOM_VIDEO_FRAMES',
      categoryLabel: 'Custom Video Frame',
      previewUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: true,
      downloads: 930,
    },

    // 4. Live Frame Photos
    {
      id: 'ast_lf_neon_studio',
      title: 'Neon Tokyo Lo-Fi Studio Background',
      description: 'Still photo frame with ambient warm lamp lighting and rain window for chill streams.',
      category: 'LIVE_FRAME_PHOTOS',
      categoryLabel: 'Live Frame Photo',
      previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: false,
      downloads: 2200,
    },
    {
      id: 'ast_lf_cyber_lounge',
      title: 'Cyberpunk Intermission Screen Frame',
      description: '"Stream Starting Soon" and "Be Right Back" high-res photo frame card with clock dock.',
      category: 'LIVE_FRAME_PHOTOS',
      categoryLabel: 'Live Frame Photo',
      previewUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      aspectRatio: '16:9',
      isPremium: false,
      dpCost: 0,
      requiresAdPass: true,
      downloads: 1150,
    },
  ];

  const categories = [
    { id: 'ALL', label: 'All Stream Assets' },
    { id: 'FACECAM_OVERLAYS', label: 'Facecam Overlays' },
    { id: 'GREEN_SCREEN_EFFECTS', label: 'Green Screen FX' },
    { id: 'CUSTOM_VIDEO_FRAMES', label: 'Custom Video Frames' },
    { id: 'LIVE_FRAME_PHOTOS', label: 'Live Frame Photos' },
  ];

  const handleDownload = (asset: any) => {
    setDownloadingId(asset.id);
    setTimeout(() => {
      setDownloadingId(null);
      setFeedback(`🎉 Successfully generated download package for "${asset.title}". Add as a Media Source in OBS!`);
      setTimeout(() => setFeedback(''), 6000);
    }, 800);
  };

  const filtered = selectedCategory === 'ALL'
    ? assets
    : assets.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-purple-400" />
            <span>Live Stream Assets Library</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overlays, green screen effects, custom video frames, and live frame photos ready for OBS Studio & Streamlabs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Unlock with 24h Ad Pass or In-App DP Balance</span>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition group"
          >
            <div>
              {/* Image Preview with Hover Overlay */}
              <div
                onClick={() => setPreviewAsset(asset)}
                className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
              >
                <img
                  src={asset.previewUrl}
                  alt={asset.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow">
                    <Play className="h-3 w-3 fill-current" />
                    <span>Inspect Preview</span>
                  </span>
                </div>

                {/* Aspect Ratio Badge */}
                <span className="absolute top-2.5 left-2.5 rounded bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {asset.aspectRatio}
                </span>

                {/* Pricing / Access Badge */}
                <div className="absolute top-2.5 right-2.5">
                  {asset.isPremium ? (
                    <span className="rounded bg-amber-950/90 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      <span>{asset.dpCost} DP</span>
                    </span>
                  ) : asset.requiresAdPass ? (
                    <span className="rounded bg-purple-950/90 border border-purple-500/40 px-2 py-0.5 text-[10px] font-extrabold text-purple-300 flex items-center gap-1">
                      <Tv className="h-3 w-3" />
                      <span>24h Ad Pass</span>
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                      FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {asset.categoryLabel}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1">{asset.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{asset.description}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  {asset.downloads.toLocaleString()} active downloads
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => handleDownload(asset)}
                disabled={downloadingId === asset.id}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition shadow flex items-center justify-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloadingId === asset.id ? 'Unlocking...' : 'Download Asset'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* OBS Studio & Streamlabs Integration Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">How to add to OBS Studio or Streamlabs</h3>
            <p className="text-xs text-slate-400">Step-by-step setup for facecam borders and green screen effects.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-bold text-white">1. Facecam Overlays (.webm)</span>
            <p className="text-slate-400">In OBS, click &quot;+&quot; &rarr; &quot;Media Source&quot;, select the downloaded .webm file, and check &quot;Loop&quot;. Place it directly above your camera layer.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-bold text-white">2. Green Screen FX (.mp4)</span>
            <p className="text-slate-400">Add as &quot;Media Source&quot;, right click layer &rarr; &quot;Filters&quot; &rarr; add &quot;Chroma Key&quot;, set color to Green. The background disappears instantly!</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-bold text-white">3. Live Frame Photos (.jpg / .png)</span>
            <p className="text-slate-400">Add as &quot;Image&quot; source for your &quot;Stream Starting Soon&quot; or &quot;Be Right Back&quot; intermission scenes with clock widgets.</p>
          </div>
        </div>
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{previewAsset.categoryLabel}</span>
                <h3 className="text-lg font-bold text-white">{previewAsset.title}</h3>
              </div>
              <button onClick={() => setPreviewAsset(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
              <img src={previewAsset.previewUrl} alt={previewAsset.title} className="h-full w-full object-cover" />
            </div>

            <p className="text-xs text-slate-300">{previewAsset.description}</p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewAsset(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewAsset);
                  setPreviewAsset(null);
                }}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
