'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Youtube, Send, Bell, CreditCard, Key, ChevronRight, Check } from 'lucide-react';

// ─── Reusable card wrapper ─────────────────────────────────────────────────────
function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  iconColor = '#1B2237',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#F4F6F9' }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <h2 style={{ color: '#1B2237' }}>{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <div>
        <p className="text-sm font-medium" style={{ color: '#1B2237' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sublabel}</p>
      </div>
      {/* Custom toggle */}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-6 rounded-full transition-colors shrink-0"
        style={{ backgroundColor: checked ? '#1B2237' : '#E5E7EB' }}
      >
        <span
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free_trial' | 'pro'>('free_trial');
  const [youtubeConnected] = useState(false);
  const [telegramConnected] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const [notifs, setNotifs] = useState({
    clipCreated: true,
    clipGenerated: true,
    telegramUploaded: true,
    editorJoined: false,
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (!userSnap.exists()) return;
      const wid: string = userSnap.data().defaultWorkspaceId;
      setWorkspaceId(wid);
      const wsSnap = await getDoc(doc(db, 'workspaces', wid));
      if (wsSnap.exists()) setPlan(wsSnap.data().plan ?? 'free_trial');
    }
    load();
  }, [user]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 style={{ color: '#1B2237' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          Manage connections and workspace preferences.
        </p>
      </div>

      {/* YouTube */}
      <SettingsCard
        icon={Youtube}
        iconColor="#EF4444"
        title="YouTube Channel"
        description="Connect your channel to enable live chat capture and stream metadata sync. This requires separate YouTube OAuth — different from your sign-in."
      >
        {youtubeConnected ? (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: '#059669' }} />
              <p className="text-sm font-semibold" style={{ color: '#059669' }}>Channel connected</p>
            </div>
            <button className="text-xs hover:underline" style={{ color: '#EF4444' }}>Disconnect</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: '#F4F6F9', border: '1px solid #E5E7EB' }}
            >
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No channel connected</p>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
            >
              <Youtube className="w-4 h-4" />
              Connect YouTube Channel
            </button>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Connects with YouTube-specific scopes only. Does not change your sign-in account.
            </p>
          </div>
        )}
      </SettingsCard>

      {/* Telegram */}
      <SettingsCard
        icon={Send}
        iconColor="#3B82F6"
        title="Telegram Delivery"
        description="Connect a Telegram group or channel to receive generated clips. Your bot token is stored securely on the server — never on your device or in the app."
      >
        {telegramConnected ? (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>Telegram connected</p>
            </div>
            <button className="text-xs hover:underline" style={{ color: '#EF4444' }}>Disconnect</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
                Bot Token
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F4F6F9' }}
              >
                <Key className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                <input
                  type="password"
                  placeholder="123456789:ABCdef…"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: '#1B2237' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Sent directly to our server — never stored on your device.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
                Chat ID
              </label>
              <input
                type="text"
                placeholder="-100123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F4F6F9',
                  color: '#1B2237',
                }}
              />
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: '#1B2237', color: '#FFFFFF' }}
            >
              <Send className="w-4 h-4" />
              Connect Telegram
            </button>
          </div>
        )}
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        icon={Bell}
        title="Notifications"
        description="Choose which events send you a notification."
      >
        <div className="space-y-4 divide-y divide-gray-100">
          <ToggleRow
            label="Clip marker created"
            sublabel="When a viewer types !clip during your stream"
            checked={notifs.clipCreated}
            onChange={(v) => setNotifs(n => ({ ...n, clipCreated: v }))}
          />
          <div className="pt-4">
            <ToggleRow
              label="Clip generated"
              sublabel="When a clip finishes downloading and is ready"
              checked={notifs.clipGenerated}
              onChange={(v) => setNotifs(n => ({ ...n, clipGenerated: v }))}
            />
          </div>
          <div className="pt-4">
            <ToggleRow
              label="Telegram sent"
              sublabel="When a clip is successfully delivered to Telegram"
              checked={notifs.telegramUploaded}
              onChange={(v) => setNotifs(n => ({ ...n, telegramUploaded: v }))}
            />
          </div>
          <div className="pt-4">
            <ToggleRow
              label="Editor joined"
              sublabel="When someone accepts a team invite"
              checked={notifs.editorJoined}
              onChange={(v) => setNotifs(n => ({ ...n, editorJoined: v }))}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Subscription */}
      <SettingsCard
        icon={CreditCard}
        title="Subscription"
        description="Your current plan and billing."
      >
        <div
          className="flex items-center justify-between px-4 py-4 rounded-xl"
          style={{ backgroundColor: '#F4F6F9', border: '1px solid #E5E7EB' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: '#1B2237' }}>
              {plan === 'free_trial' ? 'Free Trial' : 'Pro'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {plan === 'free_trial'
                ? '14-day free trial — no credit card required'
                : 'Full access. Billed monthly.'}
            </p>
          </div>
          {plan === 'free_trial' && (
            <button
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: '#1B2237', color: '#FFFFFF' }}
            >
              Upgrade <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}
