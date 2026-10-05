// Digicast Pricing Plans and UPI Configuration

export type PlanId = 'intro_29' | 'starter' | 'pro' | 'studio';

export interface PricingPlan {
  id: PlanId;
  name: string;
  badge?: string;
  priceINR: number;
  period: 'month';
  description: string;
  features: string[];
  recommended?: boolean;
  color: string;
  lightBg: string;
  darkBg: string;
}

export const UPI_HANDLES = [
  { id: 'axl', handle: '@axl', bank: 'Axis Bank', vpa: 'priydarshankishnawat@axl', recommended: true },
  { id: 'ibl', handle: '@ibl', bank: 'ICICI Bank', vpa: 'priydarshankishnawat@ibl' },
  { id: 'ybl', handle: '@ybl', bank: 'YES Bank', vpa: 'priydarshankishnawat@ybl' },
] as const;

export type UpiHandleId = 'axl' | 'ibl' | 'ybl';

export const UPI_CONFIG = {
  upiId: 'priydarshankishnawat@axl',
  allUpiIds: [
    'priydarshankishnawat@axl',
    'priydarshankishnawat@ibl',
    'priydarshankishnawat@ybl',
  ],
  payeeName: 'Digicast',
  telegramSupportUrl: 'https://t.me/digicast_support',
  telegramBotUsername: 'DIGICAST_BOT',
  discordSupportUrl: 'https://discord.gg/digicast',
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'intro_29',
    name: '1st Month VIP Pass',
    badge: 'EXCLUSIVE INTRO OFFER',
    priceINR: 29,
    period: 'month',
    description: 'First month special intro offer — get all Pro & VIP perks unlocked for 30 days for just ₹29!',
    features: [
      '⚡ All Pro & Studio VIP Features Unlocked',
      '30 Days Full Access for only ₹29',
      'Unlimited Live Clips & High-Speed Trimming',
      'Up to 5 Team Members (Editors & Admins)',
      '1080p 60fps & 4K Video Quality',
      'Instant Telegram Bot & Multi-Stream Sync',
      'Protects against multi-account trial bans',
    ],
    color: '#EC4899',
    lightBg: 'rgba(236, 72, 153, 0.08)',
    darkBg: '#EC4899',
  },
  {
    id: 'starter',
    name: 'Starter Creator',
    priceINR: 149,
    period: 'month',
    description: 'Ideal for solo creators looking for streamlined live clip creation & delivery.',
    features: [
      '1 Connected YouTube Channel',
      'Up to 150 Clip Markers per month',
      '1 Mobile Editor / Admin login',
      '720p & 1080p Standard Clip Trimming',
      'Instant Telegram Channel delivery',
      '14-Day Cloud Clip History',
      'Standard Discord & Chat Support',
    ],
    color: '#0284C7',
    lightBg: 'rgba(2, 132, 199, 0.08)',
    darkBg: '#0284C7',
  },
  {
    id: 'pro',
    name: 'Pro Streamer',
    badge: 'MOST POPULAR',
    recommended: true,
    priceINR: 499,
    period: 'month',
    description: 'Designed for active streamers with high viewer engagement and team collaboration.',
    features: [
      'Multi-Stream Live Detection & Auto-Sync',
      'Unlimited Live Clips (!clip Nightbot integration)',
      'Up to 5 Team Members (Editors & Admins)',
      'Full HD 1080p 60fps High-Speed Trimming',
      'Priority Telegram Group & Channel Delivery',
      '90-Day Cloud Storage & Clip Archive',
      'Priority Cloud Video Render Queue',
      'Dedicated Community Support',
    ],
    color: '#10B981',
    lightBg: 'rgba(16, 185, 129, 0.08)',
    darkBg: '#10B981',
  },
  {
    id: 'studio',
    name: 'Studio VIP Agency',
    badge: 'ULTIMATE PERKS',
    priceINR: 999,
    period: 'month',
    description: 'For creator houses, multi-channel networks, and professional video agencies.',
    features: [
      'Unlimited YouTube Channels & Workspaces',
      'Unlimited Team Members & Mobile Logins',
      '4K & 1080p Uncompressed Clip Generation',
      'AI Smart Highlight & Chat Velocity Spike Detection',
      'Custom Watermark & Outro Branding Overlay',
      'Dedicated VIP Telegram Bot Instance',
      'Permanent Lifetime Cloud Storage & Archive',
      '24/7 Priority Discord & Telegram Concierge Support',
    ],
    color: '#7C3AED',
    lightBg: 'rgba(124, 58, 237, 0.08)',
    darkBg: '#7C3AED',
  },
];

/**
 * Standard NPCI-compliant UPI deep link
 */
export function buildUpiDeepLink(params: {
  amount?: number;
  planName?: string;
  workspaceId?: string;
  email?: string;
  includeAmount?: boolean;
  upiId?: string;
}): string {
  const { amount, planName, includeAmount = true, upiId = UPI_CONFIG.upiId } = params;
  const payeeName = UPI_CONFIG.payeeName;
  
  // Base standard NPCI format
  let url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
  
  if (includeAmount && amount && amount > 0) {
    const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    const cleanNote = planName ? `Digicast ${planName.replace(/[^a-zA-Z0-9 ]/g, '')}`.slice(0, 20) : 'Digicast Plan';
    url += `&am=${formattedAmount}&tn=${encodeURIComponent(cleanNote)}`;
  }
  
  return url;
}

/**
 * Guaranteed 100% universal P2P QR string (Safe for PhonePe, GPay, Paytm, BHIM without "invalid dynamic QR" errors)
 */
export function buildUniversalUpiLink(upiId: string = UPI_CONFIG.upiId): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(UPI_CONFIG.payeeName)}&cu=INR`;
}

/**
 * App-specific deep links for direct 1-tap mobile payment triggers
 */
export function buildMobileAppUpiLinks(amount: number, planName: string, upiId: string = UPI_CONFIG.upiId) {
  const encUpiId = encodeURIComponent(upiId);
  const payeeName = encodeURIComponent(UPI_CONFIG.payeeName);
  const amtStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const note = encodeURIComponent(`Digicast ${planName.replace(/[^a-zA-Z0-9 ]/g, '')}`.slice(0, 20));

  return {
    standard: `upi://pay?pa=${encUpiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    phonepe: `phonepe://pay?pa=${encUpiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    gpay: `gpay://upi/pay?pa=${encUpiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
    paytm: `paytmmp://pay?pa=${encUpiId}&pn=${payeeName}&am=${amtStr}&cu=INR&tn=${note}`,
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
    `• *Plan:* ${params.planName} (₹${params.amount}/month)\n` +
    `• *UTR / Ref ID:* \`${params.utrNumber}\`\n` +
    `• *User Email:* ${params.userEmail}\n` +
    `• *Workspace:* ${params.workspaceName} (\`${params.workspaceId}\`)\n\n` +
    `Please verify and activate my subscription!`;

  return `https://t.me/share/url?url=${encodeURIComponent('https://digicast-web.vercel.app')}&text=${encodeURIComponent(message)}`;
}
