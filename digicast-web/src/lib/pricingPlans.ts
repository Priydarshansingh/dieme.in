// Digicast Pricing Plans and UPI Configuration

export interface PricingPlan {
  id: 'starter' | 'pro' | 'studio';
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

export const UPI_CONFIG = {
  upiId: 'priyadarshankishnawat@ybl',
  payeeName: 'Digicast',
  telegramSupportUrl: 'https://t.me/digicast_support',
  telegramBotUsername: 'DIGICAST_BOT',
  discordSupportUrl: 'https://discord.gg/digicast',
};

export const PRICING_PLANS: PricingPlan[] = [
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

export function buildUpiDeepLink(params: {
  amount: number;
  planName: string;
  workspaceId: string;
  email?: string;
}): string {
  const { amount, planName, workspaceId } = params;
  const upiId = UPI_CONFIG.upiId;
  const payeeName = UPI_CONFIG.payeeName;
  const cleanPlan = planName.replace(/\s+/g, '_');
  const shortWs = workspaceId ? workspaceId.slice(0, 8) : 'ws';
  const note = `Digicast_${cleanPlan}_${shortWs}`;

  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
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
