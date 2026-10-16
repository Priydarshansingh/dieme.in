// Digicast Pricing Plans and UPI Configuration

export type PlanId = 'intro_29' | 'starter' | 'pro' | 'studio';

export interface PricingPlan {
  id: PlanId;
  name: string;
  badge?: string;
  priceINR: number;
  period: 'month';
  periodLabel: string;
  durationDays: number;
  description: string;
  features: string[];
  recommended?: boolean;
  color: string;
  lightBg: string;
  darkBg: string;
}

export const UPI_CONFIG = {
  upiId: 'priydarshankishnawat@axl',
  payeeName: 'Digicast',
  telegramSupportUrl: 'https://t.me/YT_digicast?start=help',
  telegramBotUsername: 'YT_digicast',
  discordSupportUrl: 'https://discord.gg/digicast',
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'intro_29',
    name: '1st Month VIP Pass',
    badge: 'EXCLUSIVE INTRO OFFER',
    priceINR: 29,
    period: 'month',
    periodLabel: '/ 30 days',
    durationDays: 30,
    description: 'Special first month intro offer — get full access to all live clipping & trimming features for 30 days for just ₹29!',
    features: [
      '⚡ 30 Days Full Access for only ₹29',
      'Unlimited Live Clips & Stream Markers',
      'High-Speed On-Device Hardware Trimming',
      'Full YouTube Live Stream Auto-Sync',
      'Instant Direct Telegram Video Delivery',
      'Mobile Editor & Admin Access',
      'Protects against multi-account trial bans',
    ],
    color: '#EC4899',
    lightBg: 'rgba(236, 72, 153, 0.08)',
    darkBg: '#EC4899',
  },
  {
    id: 'starter',
    name: '1 Month Unlimited Pass',
    badge: 'STANDARD PACK',
    priceINR: 149,
    period: 'month',
    periodLabel: '/ 1 month',
    durationDays: 30,
    description: 'Full live clipping access for 30 days. No clip limits, no restrictions, high-speed on-device processing.',
    features: [
      '⚡ 30 Days Full Access (1 Month Pack)',
      'Zero Limits — Unlimited Live Clips',
      'Unlimited Nightbot !clip Chat Commands',
      'High-Speed On-Device Hardware Trimming',
      'Instant Direct Telegram Channel Delivery',
      'Mobile App Editor & Admin Access',
      'Standard Discord & Chat Support',
    ],
    color: '#0284C7',
    lightBg: 'rgba(2, 132, 199, 0.08)',
    darkBg: '#0284C7',
  },
  {
    id: 'pro',
    name: '3 Month Quarter Pass',
    badge: 'MOST POPULAR',
    recommended: true,
    priceINR: 499,
    period: 'month',
    periodLabel: '/ 3 months',
    durationDays: 90,
    description: 'Designed for active seasonal streamers — 90 days of complete uninterrupted on-device clipping power.',
    features: [
      '⚡ 90 Days Full Access (Quarterly Pack)',
      'Zero Limits — Unlimited Live Clips',
      'Unlimited Nightbot !clip Chat Commands',
      'Multi-Stream Live Detection & Auto-Sync',
      'Full HD 1080p 60fps Device Video Export',
      'Priority Telegram Channel Delivery',
      'Multiple Mobile Editors & Team Logins',
      'Priority Community & Discord Support',
    ],
    color: '#10B981',
    lightBg: 'rgba(16, 185, 129, 0.08)',
    darkBg: '#10B981',
  },
  {
    id: 'studio',
    name: '1 Year Annual Pass',
    badge: 'BEST VALUE • SAVE BIG',
    priceINR: 999,
    period: 'month',
    periodLabel: '/ 1 year',
    durationDays: 365,
    description: 'Ultimate value for serious creators & studios — 365 days of full unlimited access for less than ₹84/month!',
    features: [
      '⚡ 365 Days Complete Access (Full 1 Year)',
      'Zero Limits — Unlimited Live Clips & Streams',
      'Zero Expiration Worries for 365 Days',
      'Unlimited Nightbot !clip Chat Commands',
      'Highest Bitrate On-Device Hardware Export',
      '1080p 60fps & 4K Quality App Trimming',
      'Unlimited Mobile Editors & Team Logins',
      '24/7 Priority Discord & Concierge Support',
    ],
    color: '#7C3AED',
    lightBg: 'rgba(124, 58, 237, 0.08)',
    darkBg: '#7C3AED',
  },
];

/**
 * Standard NPCI-compliant UPI deep link with pre-filled amount
 */
export function buildUpiDeepLink(params: {
  amount: number;
  planName?: string;
  workspaceId?: string;
  email?: string;
}): string {
  const { amount, planName } = params;
  const upiId = UPI_CONFIG.upiId;
  const payeeName = UPI_CONFIG.payeeName;
  const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const cleanNote = planName ? `Digicast ${planName.replace(/[^a-zA-Z0-9 ]/g, '')}`.slice(0, 20) : 'Digicast';

  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
}

/**
 * App-specific deep links for direct 1-tap mobile payment triggers
 */
export function buildMobileAppUpiLinks(amount: number, planName: string) {
  const upiId = encodeURIComponent(UPI_CONFIG.upiId);
  const payeeName = encodeURIComponent(UPI_CONFIG.payeeName);
  const amtStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const note = encodeURIComponent(`Digicast ${planName.replace(/[^a-zA-Z0-9 ]/g, '')}`.slice(0, 20));

  return {
    standard: `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    phonepe: `phonepe://pay?pa=${upiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    gpay: `gpay://upi/pay?pa=${upiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    paytm: `paytmmp://pay?pa=${upiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
  };
}

export function buildVerificationTelegramUrl(params: {
  workspaceId: string;
  workspaceName: string;
  userEmail: string;
  planName: string;
  amount: number;
  utrNumber: string;
}): string {
  const message = `🎉 *Digicast Payment Confirmation Request*\n\n` +
    `• *Plan:* ${params.planName} (₹${params.amount})\n` +
    `• *UTR / Ref ID:* \`${params.utrNumber}\`\n` +
    `• *User Email:* ${params.userEmail}\n` +
    `• *Workspace:* ${params.workspaceName} (\`${params.workspaceId}\`)\n\n` +
    `Please verify and activate my subscription!`;

  return `https://t.me/share/url?url=${encodeURIComponent('https://digicast-web.vercel.app')}&text=${encodeURIComponent(message)}`;
}
