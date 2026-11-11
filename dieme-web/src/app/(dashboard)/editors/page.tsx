'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Video,
  Star,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Plus,
  Play,
  Award,
  DollarSign,
  Sparkles,
} from 'lucide-react';

export default function EditorsShowcasePage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest_user';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('Gaming Montages');
  const [regShortRate, setRegShortRate] = useState(300);
  const [regLongRate, setRegLongRate] = useState(100);
  const [regTurnaround, setRegTurnaround] = useState(24);
  const [regPortfolioUrl, setRegPortfolioUrl] = useState('');

  // Editors list
  const [editors, setEditors] = useState([
    {
      uid: 'edt_arjun_cuts',
      displayName: 'Arjun Sharma (Pro Montage)',
      bio: 'High-energy gaming montages, 3D beat-syncing, and YouTube Shorts pacing with 4+ years of creator experience.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: ['Gaming Montages', 'YouTube Shorts', 'Sound Design'],
      software: ['Premiere Pro', 'After Effects'],
      rating: 4.9,
      reviews: 38,
      completed: 45,
      shortRateINR: 350,
      longRatePerMinINR: 120,
      turnaroundHours: 24,
      isVerified: true,
      sampleTitle: 'Valorant VCT Masters High-Octane Edit',
      sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      uid: 'edt_priya_vlogs',
      displayName: 'Priya Verma (IRL & Storytelling)',
      bio: 'Narrative-driven long-form video editor for IRL streamers, travel vlogs, and podcasts. Expert color grading.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: ['IRL Streams', 'Long-Form Storytelling', 'Color Grading'],
      software: ['Final Cut Pro', 'DaVinci Resolve'],
      rating: 4.8,
      reviews: 26,
      completed: 31,
      shortRateINR: 400,
      longRatePerMinINR: 100,
      turnaroundHours: 48,
      isVerified: true,
      sampleTitle: 'Tokyo Midnight IRL Stream Highlights',
      sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      uid: 'edt_rohit_quick',
      displayName: 'Rohit K. (Rapid Shorts Engine)',
      bio: 'Ultra-fast turnaround: delivering 3 polished shorts in under 12 hours from your live stream VODs.',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: ['Fast Turnaround', 'Subtitles & Memes', 'Reaction Clips'],
      software: ['CapCut Pro', 'Premiere Pro'],
      rating: 4.7,
      reviews: 19,
      completed: 24,
      shortRateINR: 200,
      longRatePerMinINR: 80,
      turnaroundHours: 12,
      isVerified: true,
      sampleTitle: 'Minecraft Stream Fails Viral Short',
      sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ]);

  const handleRegisterEditor = (e: React.FormEvent) => {
    e.preventDefault();
    const newEd = {
      uid: `edt_${Date.now()}`,
      displayName: regName,
      bio: regBio,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: [regSpecialty, 'YouTube Shorts'],
      software: ['Premiere Pro'],
      rating: 5.0,
      reviews: 1,
      completed: 1,
      shortRateINR: regShortRate,
      longRatePerMinINR: regLongRate,
      turnaroundHours: regTurnaround,
      isVerified: false,
      sampleTitle: 'Featured Portfolio Showcase',
      sampleUrl: regPortfolioUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    setEditors([newEd, ...editors]);
    setShowRegisterModal(false);
    setFeedback(`🎉 Welcome ${regName}! Your editor showcase profile has been published.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const filtered = editors.filter((e) => {
    const matchesSearch =
      e.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      e.specialties.some((s) => s.toUpperCase().includes(selectedCategory.toUpperCase()));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Video className="h-6 w-6 text-cyan-400" />
            <span>Editor Profiles & Showcase</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover verified video editors, inspect past editing style reels, and book directly.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Register as Editor</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by editor name, gaming, shorts, DaVinci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'GAMING', 'SHORTS', 'IRL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Editors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((editor) => (
          <div
            key={editor.uid}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div className="space-y-4">
              {/* Header Profile */}
              <div className="flex items-start gap-3">
                <img
                  src={editor.avatarUrl}
                  alt={editor.displayName}
                  className="h-12 w-12 rounded-xl object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate">{editor.displayName}</h3>
                    {editor.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{editor.rating}</span>
                    </div>
                    <span>&bull;</span>
                    <span>{editor.reviews} reviews</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400">{editor.completed} jobs</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3">{editor.bio}</p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5">
                {editor.specialties.map((s, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Sample Work Reel */}
              <div
                onClick={() => setSelectedVideo(editor.sampleUrl)}
                className="group relative cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="h-6 w-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition">
                      <Play className="h-3 w-3 fill-current" />
                    </div>
                    <span className="font-medium truncate max-w-[190px]">{editor.sampleTitle}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold group-hover:underline">Preview</span>
                </div>
              </div>

              {/* Rate Card & Turnaround */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Short / Reel</span>
                  <span className="font-bold text-white">₹{editor.shortRateINR} / video</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Turnaround</span>
                  <span className="font-bold text-cyan-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{editor.turnaroundHours}h Delivery</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setFeedback(`Connecting with ${editor.displayName}...`)}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white transition shadow"
              >
                Book / Request Editor &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Portfolio Video Preview</h3>
              <button onClick={() => setSelectedVideo(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="aspect-video w-full rounded-xl bg-black flex items-center justify-center border border-slate-800">
              <p className="text-xs text-slate-400">
                Playing sample reel: <a href={selectedVideo} target="_blank" className="text-cyan-400 underline">{selectedVideo}</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editor Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">Register Editor Profile</h3>
                <p className="text-xs text-slate-400">Showcase your editing reel and set your rates.</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterEditor} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Sahil Visuals"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Editing Style</label>
                <textarea
                  rows={2}
                  placeholder="Describe your editing strengths, pacing, software..."
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rate per Short (₹)</label>
                  <input
                    type="number"
                    value={regShortRate}
                    onChange={(e) => setRegShortRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turnaround (Hours)</label>
                  <input
                    type="number"
                    value={regTurnaround}
                    onChange={(e) => setRegTurnaround(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio Video Link (YouTube / Drive)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={regPortfolioUrl}
                  onChange={(e) => setRegPortfolioUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow"
                >
                  Publish Editor Showcase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
