'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc, deleteDoc, collection, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Youtube, Send, Bell, CreditCard, Key, ChevronRight, Check,
  Loader2, AlertCircle, Bot, Copy, ExternalLink, Users, Eye, EyeOff,
  ShieldCheck, UserCheck
} from 'lucide-react';
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

  const [subscription, setSubscription] = useState<{
    status: 'trial' | 'active' | 'expired';
    plan: 'free_trial' | 'pro';
    trialEndsAt: string | null;
    subscriptionExpiresAt: string | null;
    daysRemaining: number;
    isExpired: boolean;
  } | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState<string | null>(null);
  const [renewError, setRenewError] = useState<string | null>(null);
  
  const [connectedChannel, setConnectedChannel] = useState<ConnectedChannel | null>(null);
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeSuccess, setYoutubeSuccess] = useState<string | null>(null);

  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const [notifs, setNotifs] = useState({
    clipCreated: true,
    clipGenerated: true,
    telegramUploaded: true,
    editorJoined: false,
  });

  // Team Member Creation in Settings (Editor & Admin)
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState<'editor' | 'admin'>('editor');
  const [showTeamPassword, setShowTeamPassword] = useState(false);
  const [isCreatingTeamUser, setIsCreatingTeamUser] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);

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

      loadSubscription(wid);

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

  const nightbotMessage = workspaceId
    ? `$(urlfetch https://digicast-web.vercel.app/api/webhooks/nightbot?workspaceId=${workspaceId}&user=$(user)&query=$(querystring))`
    : '$(urlfetch https://digicast-web.vercel.app/api/webhooks/nightbot?workspaceId=YOUR_WORKSPACE_ID&user=$(user)&query=$(querystring))';

  const handleCopyNightbot = () => {
    navigator.clipboard.writeText(nightbotMessage);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  const handleCreateTeamUserFromSettings = async () => {
    if (!teamEmail || !teamPassword || !workspaceId) {
      setTeamError('Email and Password are required');
      return;
    }
    if (teamPassword.length < 6) {
      setTeamError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingTeamUser(true);
    setTeamError(null);
    setTeamSuccess(null);

    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/team/create-app-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          workspaceId,
          email: teamEmail.trim().toLowerCase(),
          password: teamPassword,
          displayName: teamName.trim() || teamEmail.split('@')[0],
          role: teamRole,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team member');

      setTeamSuccess(`${teamRole.toUpperCase()} credentials saved! Credentials stored and available in Team & App Access.`);
      setTeamEmail('');
      setTeamPassword('');
      setTeamName('');
      setTimeout(() => setTeamSuccess(null), 5000);
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setIsCreatingTeamUser(false);
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
                <img
                  src={connectedChannel.channelThumbnail}
                  alt={connectedChannel.channelName}
                  className="w-9 h-9 rounded-full object-cover"
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
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                Nightbot Custom Command (!clip)
              </label>
              <a
                href="https://nightbot.tv/commands/custom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                Open Nightbot Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={nightbotMessage}
                className="w-full p-3 rounded-xl text-xs font-mono bg-gray-50 border outline-none select-all text-gray-800"
                style={{ borderColor: '#E5E7EB' }}
              />
              <button
                onClick={handleCopyNightbot}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-100 shadow-sm"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-600" /> Copy Command
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">Quick Setup in Nightbot:</p>
            <p>1. Go to <b>Nightbot Dashboard → Commands → Custom → Add Command</b>.</p>
            <p>2. Set <b>Command:</b> <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">!clip</code></p>
            <p>3. Paste the copied message into <b>Message</b> and click <b>Submit</b>.</p>
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
              placeholder="e.g. -100123456789 (Use /chatid with @digicast_bot)"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: '1px solid #E5E7EB',
                backgroundColor: '#F4F6F9',
                color: '#1B2237',
              }}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Add <b>@digicast_bot</b> to your group and type <code className="bg-gray-100 px-1 rounded">/chatid</code> to get this ID.
            </p>
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

      {/* Team Creation & Access (Editor & Admin) */}
      <SettingsCard
        icon={Users}
        title="Team Creation & Access"
        description="Create Editor or Admin accounts for your production team. All credentials are stored and accessible with the eye toggle button."
      >
        <div className="space-y-4">
          {teamError && (
            <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200">
              {teamError}
            </div>
          )}

          {teamSuccess && (
            <div className="p-3 text-xs rounded-xl bg-green-50 text-green-700 border border-green-200 font-medium">
              {teamSuccess}
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
              Assign Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTeamRole('editor')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                  teamRole === 'editor'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Editor</p>
                  <p className="text-[11px] text-gray-500">Live clips & markers</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTeamRole('admin')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                  teamRole === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Admin</p>
                  <p className="text-[11px] text-gray-500">Studio & team access</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Video Editor"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F4F6F9', color: '#1B2237' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
                User Email (Login ID)
              </label>
              <input
                type="email"
                placeholder="editor@example.com"
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F4F6F9', color: '#1B2237' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
                App Password
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F4F6F9' }}
              >
                <button
                  type="button"
                  onClick={() => setShowTeamPassword(!showTeamPassword)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showTeamPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <input
                  type={showTeamPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={teamPassword}
                  onChange={(e) => setTeamPassword(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none w-full"
                  style={{ color: '#1B2237' }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <Link
              href="/team"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
            >
              View All Members & Credentials &rarr;
            </Link>

            <button
              onClick={handleCreateTeamUserFromSettings}
              disabled={isCreatingTeamUser || !teamEmail || !teamPassword}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1B2237' }}
            >
              {isCreatingTeamUser ? 'Saving...' : `Create ${teamRole === 'admin' ? 'Admin' : 'Editor'}`}
            </button>
          </div>
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
        title="Subscription & App Access"
        description="Manage your workspace monthly plan and mobile app access credentials."
      >
        <div className="space-y-4">
          {renewError && (
            <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200">
              {renewError}
            </div>
          )}

          {renewSuccess && (
            <div className="p-3 text-xs rounded-xl bg-green-50 text-green-700 border border-green-200 font-medium">
              {renewSuccess}
            </div>
          )}

          <div
            className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              subscription?.isExpired ? 'bg-red-50 border-red-200' : 'bg-[#F4F6F9] border-[#E5E7EB]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-bold" style={{ color: subscription?.isExpired ? '#991B1B' : '#1B2237' }}>
                  {subscription?.plan === 'pro' ? 'Pro Studio Monthly' : '14-Day Free Trial'}
                </p>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    subscription?.isExpired
                      ? 'bg-red-200 text-red-800'
                      : subscription?.status === 'trial'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {subscription?.isExpired
                    ? 'Expired'
                    : subscription?.status === 'trial'
                    ? `${subscription?.daysRemaining} days left`
                    : 'Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {subscription?.isExpired
                  ? 'Your subscription expired. All mobile app credentials have been disabled.'
                  : subscription?.plan === 'pro'
                  ? `Renews on: ${subscription?.subscriptionExpiresAt ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString() : 'Active'} (${subscription?.daysRemaining} days remaining)`
                  : `Trial ends on: ${subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'In 14 days'}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRenewMonthly}
                disabled={isRenewing || !workspaceId}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90 disabled:opacity-50 text-white shadow-sm"
                style={{ backgroundColor: subscription?.isExpired ? '#DC2626' : '#1B2237' }}
              >
                {isRenewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {subscription?.isExpired
                      ? 'Reactivate Pro Monthly ($29/mo)'
                      : subscription?.plan === 'pro'
                      ? 'Renew Monthly ($29/mo)'
                      : 'Upgrade to Pro Monthly ($29/mo)'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <p className="font-semibold text-gray-800 mb-1">📱 Mobile App Sync</p>
              <p className="text-gray-500">Full access for Creator & Editor app passwords to clip live streams.</p>
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <p className="font-semibold text-gray-800 mb-1">⚡ Cloud Processing</p>
              <p className="text-gray-500">Fast 1080p clip renders with cloud storage and auto-captioning.</p>
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <p className="font-semibold text-gray-800 mb-1">✈️ Telegram Delivery</p>
              <p className="text-gray-500">Instant automatic bot forwarding straight to editor chat groups.</p>
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
