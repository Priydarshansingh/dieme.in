'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Star,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  matchedEditors?: any[];
}

export default function AIMatchmakerPage() {
  const { user } = useAuth();
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: 'Hey Creator! I am your AI Matchmaking Assistant. Tell me what kind of editor you need for your stream — gaming montage, storytelling, quick YouTube shorts, budget limit, or turnaround requirements. I will analyze our editor database and return the 4 to 5 best matches with their sample reels.',
      timestamp: 'Just now',
    },
  ]);

  const presetPrompts = [
    'Need a fast-paced Valorant montage editor with 24h delivery under ₹400.',
    'Looking for a narrative storytelling editor for my 3-hour IRL stream VOD.',
    'Need quick YouTube shorts cutter with meme sound effects under 12 hours.',
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSearching(true);

    // Analyze prompt keywords
    const isGaming = prompt.toLowerCase().includes('valorant') || prompt.toLowerCase().includes('montage') || prompt.toLowerCase().includes('game');
    const isIRL = prompt.toLowerCase().includes('irl') || prompt.toLowerCase().includes('story');
    const isFast = prompt.toLowerCase().includes('fast') || prompt.toLowerCase().includes('12h') || prompt.toLowerCase().includes('quick');

    setTimeout(() => {
      const topMatches = [
        {
          uid: 'edt_arjun_cuts',
          name: 'Arjun Sharma (Pro Montage)',
          rating: 4.9,
          matchScore: isGaming ? 98 : 88,
          reason: 'Specializes in high-energy beat-synced gaming clutches with high retention pacing.',
          shortRateINR: 350,
          turnaroundHours: 24,
          sampleTitle: 'Valorant VCT Masters Clutches Reel',
          sampleUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        },
        {
          uid: 'edt_rohit_quick',
          name: 'Rohit K. (Rapid Shorts Engine)',
          rating: 4.7,
          matchScore: isFast ? 96 : 84,
          reason: 'Lightning-fast delivery: turns your livestream highlights into viral shorts in under 12 hours.',
          shortRateINR: 200,
          turnaroundHours: 12,
          sampleTitle: 'Minecraft Funny Fails Montage',
          sampleUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
        },
        {
          uid: 'edt_priya_vlogs',
          name: 'Priya Verma (IRL & Storytelling)',
          rating: 4.8,
          matchScore: isIRL ? 97 : 82,
          reason: 'Exceptional narrative flow, color grading, and audience retention for stream highlights.',
          shortRateINR: 400,
          turnaroundHours: 48,
          sampleTitle: 'Tokyo Midnight Stream Highlights',
          sampleUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
        },
        {
          uid: 'edt_sahil_motion',
          name: 'Sahil Visuals (VFX & 3D Hooks)',
          rating: 4.9,
          matchScore: 86,
          reason: 'Includes 3D camera tracking, sound design, and custom text animation hooks.',
          shortRateINR: 450,
          turnaroundHours: 36,
          sampleTitle: 'GTA RP Cinematics Showcase',
          sampleUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
        },
      ];

      // Sort by match score
      topMatches.sort((a, b) => b.matchScore - a.matchScore);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `Based on your request, I evaluated our editor network and selected the top ${topMatches.length} editors who best match your editing style, budget, and turnaround timeframe:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedEditors: topMatches,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsSearching(false);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <span>AI Editor Matchmaker Bot</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chat with our AI bot to instantly match with 4 to 5 relevant editors with proven past work.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">Gemini Match Engine Active</span>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-center gap-2 shadow">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Preset Prompts Pill Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presetPrompts.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset)}
            className="rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white whitespace-nowrap transition flex items-center gap-1.5 shrink-0"
          >
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>{preset}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shrink-0 shadow">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}

            <div className={`space-y-3 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <p>{msg.text}</p>
                <span className="block mt-1 text-[10px] opacity-60 text-right">{msg.timestamp}</span>
              </div>

              {/* Matched Editor Cards Grid */}
              {msg.matchedEditors && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full">
                  {msg.matchedEditors.map((ed) => (
                    <div
                      key={ed.uid}
                      className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-lg hover:border-cyan-500/40 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={ed.avatarUrl}
                            alt={ed.name}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{ed.name}</h4>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                              <Star className="h-3 w-3 fill-amber-400" />
                              <span>{ed.rating}</span>
                            </div>
                          </div>
                        </div>

                        <span className="rounded-md bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                          {ed.matchScore}% Match
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 italic">&quot;{ed.reason}&quot;</p>

                      <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Rate: <strong className="text-white">₹{ed.shortRateINR}</strong></span>
                        <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                          <Clock className="h-3 w-3" />
                          <span>{ed.turnaroundHours}h Turnaround</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setFeedback(`Booking requested with ${ed.name}! They will contact you on Telegram.`)}
                        className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-bold text-white transition shadow"
                      >
                        Hire / Connect Editor &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isSearching && (
          <div className="flex items-center gap-3 text-cyan-400 text-xs">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="italic">Scanning editor database and evaluating past work reels...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Describe your stream clip editing needs (e.g. Valorant montage under ₹400 in 24h)..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none shadow"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isSearching}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 px-5 py-3 text-xs font-bold text-white transition shadow-lg flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask Matchmaker</span>
        </button>
      </form>
    </div>
  );
}
