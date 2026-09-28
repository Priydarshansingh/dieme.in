'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc, getDocs, deleteDoc, collection, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { Youtube, Send, Bell, CreditCard, Key, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
      <button
        type="button"
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

interface ConnectedChannel {
  id: string;
  channelId: string;
  channelName: string;
  channelThumbnail?: string;
  connectionStatus: string;
}

function SettingsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free_trial' | 'pro'>('free_trial');
  
  const [connectedChannel, setConnectedChannel] = useState<ConnectedChannel | null>(null);
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeSuccess, setYoutubeSuccess] = useState<string | null>(null);

  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState<string | null>(null);

  const [notifs, setNotifs] = useState({
    clipCreated: true,
    clipGenerated: true,
    telegramUploaded: true,
    editorJoined: false,
  });

  // Handle URL query feedback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'youtube_connected') {
      setYoutubeSuccess('🎉 YouTube channel connected successfully!');
    } else if (error === 'youtube_auth_failed') {
      setYoutubeError('YouTube authorization was denied or cancelled.');
    } else if (error === 'connection_failed' || error === 'invalid_callback') {
      setYoutubeError('Failed to complete YouTube channel connection. Please verify your OAuth client credentials.');
    }
  }, [searchParams]);

  // Load user workspace and listen to connected YouTube channels & Telegram
  useEffect(() => {
    if (!user) return;
    async function load() {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (!userSnap.exists()) return;
      const wid: string = userSnap.data().defaultWorkspaceId || user!.uid;
      setWorkspaceId(wid);

      const wsSnap = await getDoc(doc(db, 'workspaces', wid));
      if (wsSnap.exists()) {
        const wsData = wsSnap.data();
        setPlan(wsData.plan ?? 'free_trial');
        setTelegramConnected(Boolean(wsData.telegramEnabled));
        if (wsData.telegramChatId) setTelegramChatId(wsData.telegramChatId);
      }

      // Realtime listener on connected YouTube channels
      const unsub = onSnapshot(collection(db, 'workspaces', wid, 'youtube'), (snap) => {
        if (!snap.empty) {
          const docData = snap.docs[0].data() as ConnectedChannel;
          setConnectedChannel(docData);
        } else {
          setConnectedChannel(null);
        }
      });

      return () => unsub();
    }
    load();
  }, [user]);

  const handleConnectYoutube = async () => {
    if (!user || !workspaceId) return;
    setIsConnectingYoutube(true);
    setYoutubeError(null);
    setYoutubeSuccess(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/youtube/auth?workspaceId=${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start YouTube authentication.');
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      console.error('[youtube-auth] Error:', err);
      setYoutubeError(err.message || 'Could not connect to YouTube.');
      setIsConnectingYoutube(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    if (!workspaceId || !connectedChannel) return;
    try {
      await deleteDoc(doc(db, 'workspaces', workspaceId, 'youtube', connectedChannel.id));
      setConnectedChannel(null);
      setYoutubeSuccess('YouTube channel disconnected.');
    } catch (err: any) {
      console.error('[youtube-disconnect] Error:', err);
      setYoutubeError('Failed to disconnect YouTube channel.');
    }
  };

  const handleSaveTelegram = async () => {
    if (!workspaceId) return;
    setIsSavingTelegram(true);
    setTelegramMsg(null);
    try {
      await setDoc(doc(db, 'workspaces', workspaceId), {
        telegramEnabled: true,
        telegramChatId,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setTelegramConnected(true);
      setTelegramMsg('✅ Telegram connection updated.');
    } catch (err: any) {
      setTelegramMsg('❌ Failed to save Telegram settings.');
    } finally {
      setIsSavingTelegram(false);
    }
  };

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
        description="Connect your channel to enable live stream detection and metadata sync. This connects with channel permissions only."
      >
        {youtubeSuccess && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 leading-relaxed flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            {youtubeSuccess}
          </div>
        )}

        {youtubeError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {youtubeError}
          </div>
        )}

        {connectedChannel ? (
          <div
            className="flex items-center justify-between px-4 py-3.5 rounded-xl"
            style={{ backgroundColor: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}
          >
            <div className="flex items-center gap-3">
              {connectedChannel.channelThumbnail ? (
                <Image
                  src={connectedChannel.channelThumbnail}
                  alt={connectedChannel.channelName}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-red-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{connectedChannel.channelName}</p>
                <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3 text-green-600" /> Channel connected
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnectYoutube}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#EF4444' }}
            >
              Disconnect
            </button>
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
              onClick={handleConnectYoutube}
              disabled={isConnectingYoutube || !workspaceId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
            >
              {isConnectingYoutube ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to YouTube...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4" />
                  Connect YouTube Channel
                </>
              )}
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
        description="Connect a Telegram group or channel to receive generated clips. Your bot token is stored securely on the server."
      >
        {telegramMsg && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
            {telegramMsg}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
              Group Chat ID
            </label>
            <input
              type="text"
              placeholder="e.g. -100123456789"
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
            onClick={handleSaveTelegram}
            disabled={isSavingTelegram}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1B2237', color: '#FFFFFF' }}
          >
            {isSavingTelegram ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {telegramConnected ? 'Update Telegram Settings' : 'Connect Telegram'}
              </>
            )}
          </button>
        </div>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
