/**
 * Digicast Core Shared Types & Contracts
 * Single source of truth for Backend, Frontend, and Mobile
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'moderator' | 'streamer' | 'god_admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isEditor: boolean;
  isStreamer: boolean;
  createdAt: number;
  referralCode?: string;
  referredBy?: string;
}

// -------------------------------------------------------------
// VIRTUAL CURRENCY & DOUBLE-ENTRY LEDGER
// -------------------------------------------------------------
export type CurrencyType = 'D_COIN' | 'DP';

// Core conversion constants:
// 10 D Coins = 1 DP
// 1 DP = 1 INR (₹1)
export const D_COINS_PER_DP = 10;
export const INR_PER_DP = 1;

export type LedgerTransactionType = 'CREDIT' | 'DEBIT';

export type LedgerSource =
  | 'AD_REWARD'             // Watching an ad reward
  | 'TASK_REWARD'           // Completing a custom task
  | 'REFERRAL_COMMISSION'   // Affiliate commission
  | 'SUBSCRIPTION_PURCHASE' // Buying plan with DP
  | 'WATERMARK_REMOVAL'     // Unlocking feature with DP
  | 'ASSET_PURCHASE'        // Buying stream asset with DP
  | 'ADMIN_ADJUSTMENT'      // God panel adjustment
  | 'TRIAL_BONUS';          // Welcome bonus credits

export interface LedgerEntry {
  id: string;
  uid: string;
  type: LedgerTransactionType;
  currency: CurrencyType;
  amount: number;
  source: LedgerSource;
  description: string;
  referenceId?: string;
  idempotencyKey: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserWalletBalance {
  uid: string;
  dCoinsBalance: number;
  dpBalance: number;
  equivalentINR: number;
  totalEarnedDP: number;
  totalSpentDP: number;
  updatedAt: number;
}

// -------------------------------------------------------------
// AD-SUPPORTED 24-HOUR ACCESS PASS
// -------------------------------------------------------------
export interface AdSessionToken {
  sessionId: string;
  uid: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

export interface AdWatchPass {
  uid: string;
  hasActivePass: boolean;
  passExpiresAt: number;
  lastAdWatchedAt: number;
  totalAdsWatched: number;
}

// -------------------------------------------------------------
// SUBSCRIPTIONS & MONETIZATION
// -------------------------------------------------------------
export type SubscriptionPlanId =
  | 'FREE_TRIAL_14'
  | 'EXTENDED_TRIAL_30'
  | 'INTRO_FIRST_MONTH_29'
  | 'STANDARD_MONTHLY_149'
  | 'QUARTERLY_449'
  | 'ANNUAL_999';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceINR: number;
  dpCost: number; // Can be purchased via in-app DP balance
  durationDays: number;
  isTrial: boolean;
  trialCreditDays?: number;
  features: string[];
}

export interface UserSubscription {
  uid: string;
  planId: SubscriptionPlanId;
  status: 'active' | 'trialing' | 'expired' | 'cancelled';
  startedAt: number;
  expiresAt: number;
  isAutoRenew: boolean;
  trialExpiresAt?: number;
  paymentMethod: 'IN_APP_DP' | 'RAZORPAY_INR' | 'FREE_TRIAL';
}

// -------------------------------------------------------------
// TASK-BASED EARNING & REWARDS
// -------------------------------------------------------------
export type TaskStatus = 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  rewardCurrency: CurrencyType;
  rewardAmount: number;
  category: 'CLIENT_ACQUISITION' | 'SOCIAL_GROWTH' | 'TESTING' | 'CONTENT_CREATION';
  maxCompletions?: number;
  active: boolean;
  createdAt: number;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  uid: string;
  userEmail: string;
  rewardCurrency: CurrencyType;
  rewardAmount: number;
  proofUrl: string;
  proofNotes: string;
  status: TaskStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  submittedAt: number;
}

// -------------------------------------------------------------
// AFFILIATE / REFERRAL PROGRAM
// -------------------------------------------------------------
export interface AffiliateProfile {
  uid: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activePayingReferrals: number;
  lifetimeCommissionINR: number;
  lifetimeEarnedDP: number;
  commissionPercentage: number; // e.g. 15%
}

// -------------------------------------------------------------
// EDITORS, SHOWCASE & REPUTATION LEADERBOARD
// -------------------------------------------------------------
export interface EditorPortfolioItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: 'GAMING_MONTAGE' | 'SHORTS_REELS' | 'LONG_FORM_VLOG' | 'DOCUMENTARY' | 'PODCAST';
  durationSeconds?: number;
}

export interface EditorRateCard {
  shortFormPerVideoINR: number;
  longFormPerMinuteINR: number;
  hourlyRateINR?: number;
  minimumTurnaroundHours: number;
}

export interface EditorProfile {
  uid: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  specialties: string[];
  editingSoftware: string[];
  portfolio: EditorPortfolioItem[];
  rateCard: EditorRateCard;
  ratingAverage: number; // 1.0 to 5.0
  reviewCount: number;
  reputationCredits: number;
  completedProjectsCount: number;
  isVerified: boolean;
  isAvailableForHire: boolean;
  createdAt: number;
}

export interface EditorReview {
  id: string;
  editorUid: string;
  reviewerUid: string;
  reviewerName: string;
  ratingScore: number; // 1 to 5
  qualityScore: number;
  communicationScore: number;
  punctualityScore: number;
  feedbackText: string;
  projectCategory: string;
  createdAt: number;
}

// -------------------------------------------------------------
// AI MATCHMAKING BOT
// -------------------------------------------------------------
export interface AIMatchmakingRequest {
  streamerUid: string;
  prompt: string;
  preferredStyle?: string;
  maxBudgetINR?: number;
  turnaroundMaxHours?: number;
}

export interface MatchedEditorCard {
  editorUid: string;
  displayName: string;
  rating: number;
  matchScore: number; // 0 to 100%
  matchReason: string;
  sampleVideoUrl: string;
  rateINR: number;
  turnaroundHours: number;
  isVerified: boolean;
}

export interface AIMatchmakingResponse {
  query: string;
  matchedEditors: MatchedEditorCard[];
  recommendationSummary: string;
  totalCandidatesEvaluated: number;
}

// -------------------------------------------------------------
// LIVE STREAM ASSET STORE
// -------------------------------------------------------------
export type AssetCategory =
  | 'FACECAM_OVERLAYS'
  | 'GREEN_SCREEN_EFFECTS'
  | 'CUSTOM_VIDEO_FRAMES'
  | 'LIVE_FRAME_PHOTOS';

export interface LiveStreamAsset {
  id: string;
  title: string;
  description: string;
  category: AssetCategory;
  previewUrl: string;
  downloadUrl: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  isPremium: boolean;
  dpCost: number; // 0 if free/ad-unlocked
  requiresAdPass: boolean;
  downloadsCount: number;
  tags: string[];
}

// -------------------------------------------------------------
// GOD PANEL (ADMIN PORTAL) METRICS & TELEMETRY
// -------------------------------------------------------------
export interface GodPanelOverviewMetrics {
  totalUsers: number;
  totalEditors: number;
  totalStreamers: number;
  activeSubscribers: number;
  targetSubscribers: number; // Target = 50
  monthlyProjectedRevenueINR: number; // e.g. 50 * 150 = ₹7,500
  totalDPInCirculation: number;
  totalDCoinsInCirculation: number;
  pendingTasksForReview: number;
  active24hAdPasses: number;
}
