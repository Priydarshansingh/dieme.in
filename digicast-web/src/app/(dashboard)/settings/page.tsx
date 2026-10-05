'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc, deleteDoc, collection, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import {
  Youtube, Send, Bell, CreditCard, Key, ChevronRight, Check,
  Loader2, AlertCircle, Bot, Copy, ExternalLink, QrCode, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { PRICING_PLANS, PricingPlan } from '@/lib/pricingPlans';
import UpiPaymentModal from '@/components/subscription/UpiPaymentModal';

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

  const [workspaceName, setWorkspaceName] = useState('Creator Studio');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [selectedUpiPlan, setSelectedUpiPlan] = useState<'starter' | 'pro' | 'studio'>('pro');

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
        if (wsData.name) setWorkspaceName(wsData.name);
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
            className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              subscription?.isExpired ? 'bg-red-50 border-red-200' : 'bg-[#F4F6F9] border-[#E5E7EB]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-bold" style={{ color: subscription?.isExpired ? '#991B1B' : '#1B2237' }}>
                  {subscription?.plan === 'pro' ? 'Pro Studio Active' : '14-Day Free Trial'}
                </p>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    subscription?.isExpired
                      ? 'bg-red-200 text-red-800'
                      : subscription?.status === 'trial'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
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
                  ? 'Your subscription expired. Choose a plan below and scan the pre-coded UPI QR to reactivate instantly.'
                  : subscription?.plan === 'pro'
                  ? `Renews on: ${subscription?.subscriptionExpiresAt ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString() : 'Active'} (${subscription?.daysRemaining} days remaining)`
                  : `Trial ends on: ${subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'In 14 days'}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiPlan('pro');
                  setIsUpiModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90 text-white shadow-sm"
                style={{ backgroundColor: '#1B2237' }}
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Scan UPI QR Code</span>
              </button>
            </div>
          </div>

          {/* 3-Combo Pricing Plans Grid */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Available Subscription Plans</h3>
                <p className="text-xs text-gray-500">Pick any plan — the exact amount is pre-filled into the UPI QR scanner.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 relative ${
                    plan.recommended
                      ? 'border-emerald-500 bg-white shadow-md ring-1 ring-emerald-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className="absolute -top-2.5 right-4 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white shadow-sm"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-black text-gray-900">₹{plan.priceINR}</span>
                      <span className="text-xs text-gray-500">/ month</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{plan.description}</p>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiPlan(plan.id);
                      setIsUpiModalOpen(true);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition hover:opacity-95 shadow-sm"
                    style={{ backgroundColor: plan.color }}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Pay ₹{plan.priceINR} via UPI QR</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* UPI Scanner & Payment Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        workspaceId={workspaceId || ''}
        workspaceName={workspaceName}
        userEmail={user?.email || ''}
        initialPlanId={selectedUpiPlan}
        onPaymentSubmitted={() => {
          if (workspaceId) loadSubscription(workspaceId);
        }}
      />
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
