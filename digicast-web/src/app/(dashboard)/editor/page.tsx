// Editor dashboard — shown when a workspace member with role 'editor' logs in.
// Editors can view streams and generate clips based on their EditorPermissions.
// An editor from Workspace A MUST NOT be able to access Workspace B.
// telegramUpload: false is the DEFAULT — must be explicitly enabled per editor by owner/admin.

import { Scissors, Download, Send, Eye } from 'lucide-react';

const mockAssignedClips = [
  {
    id: 'CLP-000037',
    streamTitle: 'September 21 Night Stream',
    timestamp: '01:42:17',
    topic: 'RTX 4070 Discussion',
    score: 87,
    downloadStatus: 'not_started' as const,
    canSendTelegram: true, // permission granted by owner
  },
  {
    id: 'CLP-000036',
    streamTitle: 'September 21 Night Stream',
    timestamp: '01:31:44',
    topic: 'Funny Reaction',
    score: 72,
    downloadStatus: 'completed' as const,
    canSendTelegram: false, // permission NOT granted
  },
];

export default function EditorPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Editor Workspace</h1>
        <p className="text-slate-400 text-sm mt-1">
          Clips assigned to you. Your access is limited to this workspace only.
        </p>
      </div>

      {/* Permissions summary */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white">Your Permissions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'View Streams', granted: true, icon: Eye },
            { label: 'Generate Clips', granted: true, icon: Download },
            { label: 'Send to Telegram', granted: true, icon: Send },
          ].map(({ label, granted, icon: Icon }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium border ${
                granted
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-slate-500 border-white/5 line-through'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Clip list */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Pending Clips</h2>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl">
          {mockAssignedClips.map((clip) => (
            <div key={clip.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-white">{clip.id}</span>
                  <span className="text-xs text-slate-400">{clip.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{clip.topic}</p>
                <p className="text-xs text-slate-400">{clip.streamTitle}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {clip.downloadStatus === 'completed' ? (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Downloaded
                  </span>
                ) : (
                  <button className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-white transition">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Generate
                  </button>
                )}

                {clip.canSendTelegram && clip.downloadStatus === 'completed' && (
                  <button className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition shadow-sm">
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
