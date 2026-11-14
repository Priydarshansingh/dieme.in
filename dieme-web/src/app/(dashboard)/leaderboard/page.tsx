'use client';

import React, { useState } from 'react';
import { ComingSoonGate } from '@/components/common/ComingSoonGate';
import {
  Trophy,
  Star,
  Award,
  Medal,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LeaderboardPage() {
  const [feedback, setFeedback] = useState('');

  const leaderboardData = [
    {
      rank: 1,
      uid: 'edt_arjun_cuts',
      displayName: 'Arjun Sharma (Pro Montage)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      ratingAverage: 4.9,
      reviewCount: 38,
      completedProjectsCount: 45,
      reputationCredits: 420,
      compositeScore: 594,
      shortRateINR: 350,
      turnaroundHours: 24,
      isVerified: true,
      badge: 'TOP RATED #1',
    },
    {
      rank: 2,
      uid: 'edt_priya_vlogs',
      displayName: 'Priya Verma (IRL & Storytelling)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
      ratingAverage: 4.8,
      reviewCount: 26,
      completedProjectsCount: 31,
      reputationCredits: 310,
      compositeScore: 458,
      shortRateINR: 400,
      turnaroundHours: 48,
      isVerified: true,
      badge: 'RUNNER UP #2',
    },
    {
      rank: 3,
      uid: 'edt_rohit_quick',
      displayName: 'Rohit K. (Rapid Shorts Engine)',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      ratingAverage: 4.7,
      reviewCount: 19,
      completedProjectsCount: 24,
      reputationCredits: 230,
      compositeScore: 362,
      shortRateINR: 200,
      turnaroundHours: 12,
      isVerified: true,
      badge: 'SPEED CHAMPION #3',
    },
  ];

  return (
    <ComingSoonGate
      title="Top Editors & Creator Leaderboard"
      subtitle="The official competitive ranking of verified short-form video editors, reel cutters, and motion designers ranked by performance, speed, and creator satisfaction."
      icon={<Trophy className="w-6 h-6" />}
      category="LEADERBOARD"
      highlights={[
        { title: "Transparent ELO Ranking", desc: "Calculated dynamically using real client ratings, verified on-time project completions, and revision rates.", tag: "RANKINGS" },
        { title: "Monthly Cash & DP Rewards", desc: "Top 3 editors every calendar month unlock featured portfolio placement and fee waivers.", tag: "PRIZES" },
        { title: "Verified Pro Badging", desc: "Stand out to top creators and multi-channel production studios with proof-of-work authenticity.", tag: "VERIFIED" }
      ]}
    >
      <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span>Editor Leaderboard & Ratings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Top video editors ranked by customer star ratings, verified jobs, and turnaround speed.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
          <span className="font-semibold text-white">Scoring Formula:</span> (Stars &times; 20) + (Reviews &times; 2) + Credits
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {leaderboardData.slice(0, 3).map((item) => {
          const isFirst = item.rank === 1;
          const isSecond = item.rank === 2;
          const isThird = item.rank === 3;

          const borderColor = isFirst
            ? 'border-amber-500/60 shadow-amber-500/10'
            : isSecond
            ? 'border-slate-400/50 shadow-slate-400/5'
            : 'border-amber-700/50 shadow-amber-700/5';

          const badgeBg = isFirst
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : isSecond
            ? 'bg-slate-400/20 text-slate-200 border-slate-400/40'
            : 'bg-amber-700/20 text-amber-400 border-amber-700/40';

          return (
            <div
              key={item.uid}
              className={`rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between space-y-4 shadow-xl ${borderColor}`}
            >
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold border ${badgeBg}`}>
                    {item.badge}
                  </span>
                </div>

                <div className="relative inline-block mx-auto">
                  <img
                    src={item.avatarUrl}
                    alt={item.displayName}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-700 mx-auto"
                  />
                  <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400 shadow">
                    #{item.rank}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                    <span>{item.displayName}</span>
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-bold mt-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{item.ratingAverage}</span>
                    <span className="text-slate-400 font-normal">({item.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 grid grid-cols-2 gap-2 text-xs text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                    <span className="font-extrabold text-white">{item.completedProjectsCount} Videos</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Rate</span>
                    <span className="font-extrabold text-cyan-400">₹{item.shortRateINR} / short</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setFeedback(`Booking requested with #${item.rank} ${item.displayName}!`)}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white transition shadow"
              >
                Hire Editor &rarr;
              </button>
            </div>
          );
        })}
      </div>

      {/* Complete Rankings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Full Editor Rankings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Editor</th>
                <th className="px-5 py-3.5">Star Rating</th>
                <th className="px-5 py-3.5">Completed Jobs</th>
                <th className="px-5 py-3.5">Reputation Score</th>
                <th className="px-5 py-3.5">Rate / Short</th>
                <th className="px-5 py-3.5">Turnaround</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {leaderboardData.map((editor) => (
                <tr key={editor.uid} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-black text-sm text-cyan-400">
                    #{editor.rank}
                  </td>
                  <td className="px-5 py-4 font-semibold text-white flex items-center gap-3">
                    <img
                      src={editor.avatarUrl}
                      alt={editor.displayName}
                      className="h-8 w-8 rounded-lg object-cover border border-slate-700"
                    />
                    <span>{editor.displayName}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{editor.ratingAverage}</span>
                      <span className="text-slate-500 font-normal">({editor.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-medium">
                    {editor.completedProjectsCount} projects
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-400">
                    {editor.reputationCredits} pts
                  </td>
                  <td className="px-5 py-4 font-bold text-white">
                    ₹{editor.shortRateINR}
                  </td>
                  <td className="px-5 py-4 text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{editor.turnaroundHours}h</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setFeedback(`Connecting with ${editor.displayName}...`)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                    >
                      Connect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ComingSoonGate>
  );
}
