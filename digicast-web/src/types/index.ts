// ─────────────────────────────────────────────────────────────────────────────
// Core Firestore data types
// These mirror the cloud data model exactly. Local/Android-only data is NOT here.
// ─────────────────────────────────────────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string; // ISO timestamp
}

// ── Workspace ────────────────────────────────────────────────────────────────
export type WorkspaceRole = 'owner' | 'editor' | 'analyst';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  subscription: SubscriptionPlan;
}

export interface WorkspaceMember {
  id: string; // == uid
  workspaceId: string;
  role: WorkspaceRole;
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: string;
  permissions: EditorPermissions;
}

export interface EditorPermissions {
  viewStreams: boolean;
  viewSharedChat: boolean;
  generateClips: boolean;
  downloadClips: boolean;
  telegramUpload: boolean;    // must be explicitly granted by owner
  manageTeam: boolean;
  manageBilling: boolean;
}

export const DEFAULT_EDITOR_PERMISSIONS: EditorPermissions = {
  viewStreams: true,
  viewSharedChat: true,
  generateClips: true,
  downloadClips: true,
  telegramUpload: false,  // never default to true
  manageTeam: false,
  manageBilling: false,
};

// ── YouTube Account ───────────────────────────────────────────────────────────
export interface YouTubeAccount {
  id: string;
  workspaceId: string;
  channelId: string;
  channelName: string;
  channelThumbnail?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  connectedAt: string;
  connectedBy: string; // uid
}

// ── Stream ────────────────────────────────────────────────────────────────────
export type StreamStatus =
  | 'live'
  | 'ended'
  | 'vod_processing'
  | 'vod_ready'
  | 'archived';

export interface Stream {
  id: string;
  workspaceId: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  title: string;
  thumbnailUrl?: string;
  status: StreamStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  // Counters (updated as stream progresses)
  messageCount: number;
  clipMarkerCount: number;
}

// ── Clip Marker ───────────────────────────────────────────────────────────────
export type ClipSource = 'viewer' | 'creator' | 'editor' | 'ai_suggested';

export interface ClipMarker {
  id: string;         // e.g. CLP-000123
  workspaceId: string;
  streamId: string;
  youtubeVideoId: string;
  markerTimestamp: number;   // seconds from stream start
  markerTimestampDisplay: string; // e.g. "01:42:17"
  windowStartSeconds?: number;    // e.g. markerTimestamp - 45
  windowEndSeconds?: number;      // e.g. markerTimestamp + 15
  lookbackSeconds?: number;       // e.g. 45
  source: ClipSource;
  authorName?: string;
  chatMessageId?: string;
  aiTopic?: string;
  aiEngagementScore?: number;
  createdAt: string;
  // Download state (synced from device)
  downloadStatus?: ClipDownloadStatus;
  telegramStatus?: ClipTelegramStatus;
  telegramSent?: boolean;
  assignedTo?: string[]; // array of editor uids
}

export type ClipDownloadStatus =
  | 'not_started'
  | 'queued'
  | 'downloading'
  | 'processing'
  | 'completed'
  | 'failed';

export type ClipTelegramStatus =
  | 'not_uploaded'
  | 'uploading'
  | 'uploaded'
  | 'failed';

// ── Telegram Connection ───────────────────────────────────────────────────────
export interface TelegramConnection {
  id: string;
  workspaceId: string;
  telegramChatId: string;
  chatType: 'private' | 'group' | 'supergroup';
  chatTitle?: string;
  connectedBy: string; // uid
  connectedAt: string;
  status: 'active' | 'disconnected';
}

// ── Device ────────────────────────────────────────────────────────────────────
export type DeviceType = 'android' | 'windows' | 'macos' | 'web';

export interface Device {
  id: string;
  workspaceId: string;
  ownerId: string;
  deviceType: DeviceType;
  deviceName: string;
  appVersion: string;
  lastSeen: string;
  registeredAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────
export type SubscriptionPlan = 'free_trial' | 'creator' | 'pro' | 'team' | 'agency';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface Subscription {
  id: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// ── Telegram Audit Log ────────────────────────────────────────────────────────
export interface TelegramUploadLog {
  id: string;
  workspaceId: string;
  clipId: string;
  uploadedBy: string; // uid
  uploadedByName: string;
  uploadedAt: string;
  telegramMessageId?: string;
  destinationChatId: string;
  status: 'success' | 'failed';
}
