'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PRESET_ANIME_AVATARS, GamerAvatar } from '@/lib/avatars';
import {
  Sparkles, Check, Plus, Shield, Swords, RefreshCw, X, Loader2, ExternalLink
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';

interface AvatarStudioSectionProps {
  workspaceId?: string | null;
  isAdminOrOwner?: boolean;
}

export default function AvatarStudioSection({
  workspaceId,
  isAdminOrOwner = true,
}: AvatarStudioSectionProps) {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<GamerAvatar[]>(PRESET_ANIME_AVATARS);
  const [activeAvatarUrl, setActiveAvatarUrl] = useState<string>(user?.photoURL || '');
  const [isEquipping, setIsEquipping] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal for admin adding custom avatar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSeries, setNewSeries] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newColor, setNewColor] = useState('#8B5CF6');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch avatar roster from API
  const fetchAvatars = async () => {
    try {
      const res = await fetch('/api/avatars');
      if (res.ok) {
        const data = await res.json();
        if (data.avatars && Array.isArray(data.avatars)) {
          setAvatars(data.avatars);
        }
      }
    } catch (e) {
      console.warn('[AvatarStudio] fetchAvatars note:', e);
    }
  };

  useEffect(() => {
    fetchAvatars();
    if (user?.photoURL) {
      setActiveAvatarUrl(user.photoURL);
    }
  }, [user?.photoURL]);

  // Handle equipping an avatar
  const handleEquip = async (avatar: GamerAvatar) => {
    if (!user) return;
    setIsEquipping(true);
    setFeedback(null);

    try {
      // 1. Update Firebase Auth client-side immediately
      if (user) {
        await updateProfile(user, { photoURL: avatar.url }).catch(() => {});
      }

      // 2. Persist to API
      const idToken = await user.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user.uid,
        'x-user-email': user.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          photoURL: avatar.url,
          workspaceId: workspaceId || user.uid,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save avatar');
      }

      setActiveAvatarUrl(avatar.url);
      setFeedback({
        type: 'success',
        message: `✨ Equipped "${avatar.name}" as your active champion!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update avatar.',
      });
    } finally {
      setIsEquipping(false);
    }
  };

  // Handle creating custom avatar (Admin/Owner)
  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const idToken = await user?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newName,
          series: newSeries || 'Anime Series',
          badge: newBadge || 'Gamer Legend',
          color: newColor,
          url: newUrl,
          description: newDesc || 'Custom gamer avatar added by admin.',
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add custom avatar');
      }

      // Success
      setIsAddModalOpen(false);
      setNewName('');
      setNewSeries('');
      setNewBadge('');
      setNewUrl('');
      setNewDesc('');
      await fetchAvatars();

      setFeedback({
        type: 'success',
        message: `🔥 Custom avatar "${data.avatar.name}" published to Studio Roster!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error adding custom avatar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAvatarObj = avatars.find((a) => a.url === activeAvatarUrl);

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden border border-white/10">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Gamer &amp; Anime Avatar Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Duolingo Style
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Equip your favorite anime gamer avatar. Synchronizes live across Web Studio and Android app.
            </p>
          </div>
        </div>

        {isAdminOrOwner && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Avatar (Admin)</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Duolingo Hero Showcase: Active Character */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-cyan-950/30 border border-white/10 relative">
        {/* Chunky Duolingo Circular Avatar Frame */}
        <div className="relative group shrink-0">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${currentAvatarObj?.color || '#06B6D4'}, #1e1b4b)`,
              border: '3px solid rgba(255,255,255,0.25)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-2 border-white/40">
              {activeAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeAvatarUrl}
                  alt={currentAvatarObj?.name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl font-black text-white">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>

          {/* Duolingo XP level badge */}
          <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-emerald-500 border-2 border-slate-950 text-white font-black text-[10px] shadow-lg flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />
            <span>ACTIVE</span>
          </div>
        </div>

        {/* Info */}
        <div className="text-center md:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: currentAvatarObj?.color || '#06B6D4' }}
            >
              {currentAvatarObj?.badge || 'Studio Champion'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {currentAvatarObj?.series || 'Digicast Universe'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            {currentAvatarObj?.name || user?.displayName || 'Creator'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            {currentAvatarObj?.description ||
              'Select any of the popular gamer & anime avatars below to customize your live identity across your studio, team comments, and mobile app.'}
          </p>
        </div>
      </div>

      {/* Avatar Cards Roster (Duolingo Style Chunky Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Champions ({avatars.length})
          </p>
          <span className="text-[11px] text-slate-500">Tap to equip instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
          {avatars.map((avatar) => {
            const isEquipped = activeAvatarUrl === avatar.url;

            return (
              <div
                key={avatar.id}
                className={`group rounded-2xl p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-200 relative border-2 ${
                  isEquipped
                    ? 'border-emerald-500 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(16,185,129,0.25)] border-b-4'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] hover:-translate-y-1'
                }`}
              >
                {/* Equipped floating tag */}
                {isEquipped && (
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider shadow">
                    Equipped
                  </span>
                )}

                {/* Duolingo circular character avatar */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 mb-2.5 transition-transform group-hover:scale-105 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${avatar.color}, rgba(255,255,255,0.1))`,
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-white/20 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Character Name */}
                <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                  {avatar.name}
                </h4>

                {/* Anime Series & Badge */}
                <span
                  className="mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-full text-white"
                  style={{ backgroundColor: `${avatar.color}33`, color: avatar.color }}
                >
                  {avatar.badge}
                </span>

                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 truncate max-w-full">
                  {avatar.series}
                </p>

                {/* Equip Button (Duolingo 3D Button style) */}
                <button
                  type="button"
                  disabled={isEquipped || isEquipping}
                  onClick={() => handleEquip(avatar)}
                  className={`mt-3 w-full py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    isEquipped
                      ? 'bg-emerald-500 text-white cursor-default shadow-[0_2px_0_#047857]'
                      : 'bg-white/10 hover:bg-white/20 text-white active:scale-95 border border-white/10 shadow-[0_2px_0_rgba(255,255,255,0.15)]'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Equipped</span>
                    </>
                  ) : (
                    <span>Equip</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Add Avatar Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Add Custom Gamer Avatar</h3>
                  <p className="text-xs text-slate-400">Admin Studio Roster Publishing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAvatar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Character Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanjiro Kamado, Sukuna, Levi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Anime / Game</label>
                  <input
                    type="text"
                    placeholder="e.g. Demon Slayer"
                    value={newSeries}
                    onChange={(e) => setNewSeries(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Badge / Power Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Sun Breathing"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Avatar Image URL (SVG/PNG/JPG) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://... or /avatars/...svg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Aura Accent Color</label>
                <div className="flex items-center gap-2">
                  {['#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F97316', '#10B981', '#EF4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newColor === c ? 'scale-110 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0"
                    title="Custom color"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short tagline or lore..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Live Preview Box */}
              {newUrl && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full p-0.5 border"
                    style={{ background: newColor, borderColor: 'white' }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{newName || 'Preview Name'}</p>
                    <p className="text-[10px] text-slate-400">{newSeries || 'Anime'} &bull; {newBadge || 'Hero'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Avatar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
