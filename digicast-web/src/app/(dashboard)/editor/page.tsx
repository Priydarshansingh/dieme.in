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
        <h1 className="text-2xl font-bold">Editor Workspace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Clips assigned to you. Your access is limited to this workspace only.
        </p>
      </div>

      {/* Permissions summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Your Permissions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'View Streams', granted: true, icon: Eye },
            { label: 'Generate Clips', granted: true, icon: Download },
            { label: 'Send to Telegram', granted: true, icon: Send },
          ].map(({ label, granted, icon: Icon }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                granted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground line-through'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Clip list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Pending Clips</h2>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {mockAssignedClips.map((clip) => (
            <div key={clip.id} className="flex items-center gap-4 px-5 py-4 bg-card">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium">{clip.id}</span>
                  <span className="text-xs text-muted-foreground">{clip.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground">{clip.topic}</p>
                <p className="text-xs text-muted-foreground">{clip.streamTitle}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {clip.downloadStatus === 'completed' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    Downloaded
                  </span>
                ) : (
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition">
                    <Download className="w-3.5 h-3.5" />
                    Generate
                  </button>
                )}

                {clip.canSendTelegram && clip.downloadStatus === 'completed' && (
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
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
