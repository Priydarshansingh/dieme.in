'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { doc, getDoc, deleteDoc, collection, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import {
  Youtube, Send, Bell, CreditCard, Key, ChevronRight, Check,
  Loader2, AlertCircle, Bot, Copy, ExternalLink, QrCode, Sparkles, RefreshCw
} from 'lucide-react';
import AvatarStudioSection from '@/components/profile/AvatarStudioSection';

// ─── Reusable card wrapper ─────────────────────────────────────────────────────
function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  iconColor = '#FFFFFF',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div
      className="glass-card rounded-2xl p-6 sm:p-7 space-y-6"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">{title}</h2>
          <p className="text-sm mt-0.5 text-slate-400">{description}</p>
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
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none py-1">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs mt-0.5 text-slate-400">{sublabel}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0 border border-white/10"
        style={{ backgroundColor: checked ? '#06B6D4' : 'rgba(255, 255, 255, 0.1)' }}
      >
        <span
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
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

  const [subscription, setSubscription] = useState<{
    status: 'trial' | 'active' | 'expired';
    plan: string;
    trialEndsAt: string | null;
    subscriptionExpiresAt: string | null;
    daysRemaining: number;
    isExpired: boolean;
    trialBypassDetected?: boolean;
    trialBypassedChannelTitle?: string;
  } | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState<string | null>(null);
  const [renewError, setRenewError] = useState<string | null>(null);
  
  const [connectedChannel, setConnectedChannel] = useState<ConnectedChannel | null>(null);
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeSuccess, setYoutubeSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const [workspaceName, setWorkspaceName] = useState('Creator Studio');

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
    } else if (error === 'trial_already_claimed') {
      const channel = searchParams.get('channel') || 'This YouTube channel';
      setYoutubeError(`⚠️ Free Trial Expired: "${channel}" has already used its 14-day free trial on another account. Rotating Google accounts to bypass trials is prohibited. Please activate the ₹29 First Month Pass or another plan below to stream.`);
    } else if (error === 'connection_failed' || error === 'invalid_callback') {
      setYoutubeError('Failed to complete YouTube channel connection. Please verify your OAuth client credentials.');
    }
  }, [searchParams]);

  // Load user workspace and listen to connected YouTube channels & Telegram
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    const fallbackWid = user.uid;

    // Immediately initialize workspaceId so Nightbot command and buttons are NEVER null
    setWorkspaceId((prev) => prev || fallbackWid);

    // 1. Authoritative Server Status Check (uses adminDb on server, mirrors mobile app reliability)
    async function fetchServerStatus(widToQuery?: string) {
      try {
        const idToken = await user?.getIdToken().catch(() => '');
        const targetWid = widToQuery || fallbackWid;
        const headers: Record<string, string> = {
          'x-user-uid': user!.uid,
          'x-user-email': user!.email || '',
        };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const res = await fetch(`/api/youtube/status?workspaceId=${targetWid}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;
          if (data.workspaceId) {
            setWorkspaceId(data.workspaceId);
          }
          if (data.workspaceName) setWorkspaceName(data.workspaceName);
          if (data.plan) setPlan(data.plan);
          if (data.telegramConnected !== undefined) setTelegramConnected(data.telegramConnected);
          if (data.telegramChatId) setTelegramChatId(data.telegramChatId);
          if (data.channel) {
            setConnectedChannel(data.channel);
          }
          loadSubscription(data.workspaceId || targetWid);
        }
      } catch (err) {
        console.warn('[settings] fetchServerStatus note:', err);
      }
    }

    fetchServerStatus();

    // 2. Client Firestore fallback & realtime listener
    async function initClient() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid)).catch(() => null);
        const resolvedWid: string = (userSnap && userSnap.exists() && userSnap.data()?.defaultWorkspaceId)
          ? userSnap.data().defaultWorkspaceId
          : fallbackWid;

        if (!isCancelled) {
          setWorkspaceId(resolvedWid);
          loadSubscription(resolvedWid);
        }

        const wsSnap = await getDoc(doc(db, 'workspaces', resolvedWid)).catch(() => null);
        if (wsSnap && wsSnap.exists() && !isCancelled) {
          const wsData = wsSnap.data();
          if (wsData.name) setWorkspaceName(wsData.name);
          setPlan(wsData.plan ?? 'free_trial');
          setTelegramConnected(Boolean(wsData.telegramEnabled));
          if (wsData.telegramChatId) setTelegramChatId(wsData.telegramChatId);
        }

        // Realtime listener on connected YouTube channels
        const unsub = onSnapshot(
          collection(db, 'workspaces', resolvedWid, 'youtube'),
          (snap) => {
            if (isCancelled) return;
            if (!snap.empty) {
              const docData = snap.docs[0].data() as ConnectedChannel;
              setConnectedChannel(docData);
            } else {
              setConnectedChannel(null);
            }
          },
          (err) => {
            console.warn('[settings] Client realtime listener note:', err?.message);
          }
        );

        return () => unsub();
      } catch (e) {
        console.warn('[settings] Client init warning:', e);
      }
    }

    initClient();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  async function loadSubscription(wid: string) {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/workspaces/subscription?workspaceId=${wid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  }

  const handleRenewMonthly = async () => {
    if (!workspaceId) return;
    setIsRenewing(true);
    setRenewError(null);
    setRenewSuccess(null);

    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/workspaces/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'renew_monthly',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to renew subscription');
      }

      setSubscription(data.subscription);
      setPlan('pro');
      setRenewSuccess('🎉 Pro Monthly subscription activated successfully! 30 days added. All mobile app credentials are active.');
      setTimeout(() => setRenewSuccess(null), 6000);
    } catch (err: any) {
      setRenewError(err.message);
    } finally {
      setIsRenewing(false);
    }
  };

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

  const handleSyncStreams = async () => {
    const wid = workspaceId || user?.uid;
    if (!wid) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const idToken = await user?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/youtube/sync?workspaceId=${wid}`, {
        headers,
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (data.syncedCount !== undefined) {
        setSyncFeedback(`✅ Synced ${data.syncedCount} stream(s) from YouTube!`);
      } else {
        setSyncFeedback(`⚠️ ${data.error || 'Failed to sync with YouTube.'}`);
      }
    } catch {
      setSyncFeedback('⚠️ Failed to sync with YouTube. Please try again.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleDisconnectYoutube = async () => {
    const wid = workspaceId || user?.uid;
    if (!wid) return;
    setIsDisconnecting(true);
    setYoutubeError(null);
    setYoutubeSuccess(null);
    try {
      const idToken = await user?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/youtube/disconnect?workspaceId=${wid}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workspaceId: wid,
          channelId: connectedChannel?.channelId || connectedChannel?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to disconnect YouTube channel.');
      }

      setConnectedChannel(null);
      setYoutubeSuccess('✅ YouTube channel disconnected successfully.');
      setTimeout(() => setYoutubeSuccess(null), 6000);
    } catch (err: any) {
      console.error('[youtube-disconnect] Error:', err);
      // Fallback: try client deletion if permitted
      try {
        if (connectedChannel?.id) {
          await deleteDoc(doc(db, 'workspaces', wid, 'youtube', connectedChannel.id));
          setConnectedChannel(null);
          setYoutubeSuccess('✅ YouTube channel disconnected.');
          return;
        }
      } catch {}
      setYoutubeError(err.message || 'Failed to disconnect YouTube channel.');
    } finally {
      setIsDisconnecting(false);
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

  const nightbotMessage = workspaceId
    ? `$(urlfetch https://www.dieme.in/api/webhooks/nightbot?workspaceId=${workspaceId}&user=$(user)&query=$(querystring))`
    : '$(urlfetch https://www.dieme.in/api/webhooks/nightbot?workspaceId=YOUR_WORKSPACE_ID&user=$(user)&query=$(querystring))';

  const handleCopyNightbot = () => {
    navigator.clipboard.writeText(nightbotMessage);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-sm mt-1 text-slate-400">
          Manage connections, gamer avatars, and workspace preferences.
        </p>
      </div>

      {/* Duolingo Gamer Avatar Studio */}
      <AvatarStudioSection workspaceId={workspaceId} isAdminOrOwner={true} />

      {/* YouTube */}
      <SettingsCard
        icon={Youtube}
        iconColor="#EF4444"
        title="YouTube Channel"
        description="Connect your channel to enable live stream detection and metadata sync. This connects with channel permissions only."
      >
        {youtubeSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            {youtubeSuccess}
          </div>
        )}

        {youtubeError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {youtubeError}
          </div>
        )}

        {connectedChannel ? (
          <div className="space-y-3">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
            >
              <div className="flex items-center gap-3.5">
                {connectedChannel.channelThumbnail ? (
                  <img
                    src={connectedChannel.channelThumbnail}
                    alt={connectedChannel.channelName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white truncate">{connectedChannel.channelName}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Channel ID: {connectedChannel.channelId || connectedChannel.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncStreams}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition disabled:opacity-50"
                  title="Synchronize live broadcasts and recent streams from YouTube"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-300'}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Streams'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectYoutube}
                  disabled={isDisconnecting}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition disabled:opacity-50"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 flex items-center gap-2 shadow">
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10"
            >
              <p className="text-sm text-slate-400">No channel connected</p>
            </div>
            <button
              onClick={handleConnectYoutube}
              disabled={isConnectingYoutube || !workspaceId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90 disabled:opacity-50 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
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
            <p className="text-xs text-slate-400">
              Connects with YouTube-specific scopes only. Does not change your sign-in account.
            </p>
          </div>
        )}
      </SettingsCard>

      {/* Nightbot Live Chat Integration */}
      <SettingsCard
        icon={Bot}
        iconColor="#10B981"
        title="Nightbot YouTube Live Chat Integration"
        description="Enable !clip command in your YouTube live stream chat with zero quota cost."
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nightbot Custom Command (!clip)
              </label>
              <a
                href="https://nightbot.tv/commands/custom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
              >
                Open Nightbot Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={nightbotMessage}
                className="w-full p-3.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 outline-none select-all text-cyan-300 focus:border-cyan-400/40"
              />
              <button
                onClick={handleCopyNightbot}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-lg text-xs font-semibold text-white hover:bg-white/20 transition shadow-sm"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" /> Copy Command
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-white">Quick Setup in Nightbot:</p>
            <p>1. Go to <b className="text-slate-100">Nightbot Dashboard → Commands → Custom → Add Command</b>.</p>
            <p>2. Set <b className="text-slate-100">Command:</b> <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-cyan-300 border border-white/10">!clip</code></p>
            <p>3. Paste the copied message into <b className="text-slate-100">Message</b> and click <b className="text-slate-100">Submit</b>.</p>
          </div>
        </div>
      </SettingsCard>

      {/* Telegram */}
      <SettingsCard
        icon={Send}
        iconColor="#3B82F6"
        title="Telegram Delivery"
        description="Connect a Telegram group or channel to receive generated clips. Your bot token is stored securely on the server."
      >
        {telegramMsg && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            {telegramMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-300">
              Group Chat ID
            </label>
            <input
              type="text"
              placeholder="e.g. -100123456789 (Use /chatid with @YT_digicast)"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Add <b className="text-white">@YT_digicast</b> to your group and type <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono border border-white/10">/chatid</code> to get this ID.
            </p>
          </div>
          <button
            onClick={handleSaveTelegram}
            disabled={isSavingTelegram}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90 disabled:opacity-50 bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-sm"
          >
            {isSavingTelegram ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-cyan-400" />
                {telegramConnected ? 'Update Telegram Settings' : 'Connect Telegram'}
              </>
            )}
          </button>
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        icon={Bell}
        iconColor="#F59E0B"
        title="Notifications"
        description="Choose which events send you a notification."
      >
        <div className="space-y-4 divide-y divide-white/[0.06]">
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
        iconColor="#A855F7"
        title="Subscription & App Access"
        description="Manage your workspace monthly plan and mobile app access credentials."
      >
        <div className="space-y-4">
          {renewError && (
            <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-300 border border-red-500/20">
              {renewError}
            </div>
          )}

          {renewSuccess && (
            <div className="p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              {renewSuccess}
            </div>
          )}

          {/* Duplicate YouTube Channel Trial Abuse Alert */}
          {subscription?.trialBypassDetected && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-200 shadow-sm">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    ⚠️ 14-Day Free Trial Already Claimed on this YouTube Channel
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                    This YouTube channel has already used its 14-day free trial on another account. Rotating Google accounts to bypass trials is prohibited.
                  </p>
                  <p className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Special Intro Deal: Unlock 30 Days of full Pro &amp; VIP features right now for just ₹29!</span>
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shrink-0 shadow-md transition hover:scale-[1.02] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Get 30 Days for ₹29</span>
              </Link>
            </div>
          )}

          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              subscription?.isExpired ? 'bg-red-500/10 border-red-500/25' : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-bold text-white">
                  {subscription?.plan === 'intro_29'
                    ? '1st Month VIP Pass Active'
                    : subscription?.plan === 'studio'
                    ? '1 Year Annual Pass Active'
                    : subscription?.plan === 'pro'
                    ? '3 Month Quarter Pass Active'
                    : subscription?.plan === 'starter'
                    ? '1 Month Unlimited Pass Active'
                    : '14-Day Free Trial'}
                </p>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    subscription?.isExpired
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : subscription?.status === 'trial'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {subscription?.isExpired
                    ? 'Expired'
                    : subscription?.status === 'trial'
                    ? `${subscription?.daysRemaining} days left`
                    : 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {subscription?.isExpired
                  ? 'Your subscription expired. Choose a plan below and scan the pre-coded UPI QR to reactivate instantly.'
                  : subscription?.plan !== 'free_trial'
                  ? `Renews on: ${subscription?.subscriptionExpiresAt ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString() : 'Active'} (${subscription?.daysRemaining} days remaining)`
                  : `Trial ends on: ${subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'In 14 days'}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90 text-white shadow-sm shrink-0 bg-emerald-500 hover:bg-emerald-600"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{subscription?.isExpired ? 'Renew Pass' : 'Manage / Upgrade Passes →'}</span>
              </Link>
            </div>
          </div>
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
