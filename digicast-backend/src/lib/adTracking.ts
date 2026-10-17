/**
 * Centralized Ad Provider Tracking & Daily Monetization Engine
 * Tracks daily impressions, estimated eCPM, and revenue across Google AdMob, Unity Ads, Start.io & Direct Sponsors.
 */

export type AdProviderName = 'ADMOB' | 'UNITY' | 'START_IO' | 'SPONSORED_PARTNER';

export interface AdProviderMeta {
  id: AdProviderName;
  name: string;
  adUnitId: string;
  appOrOrgId: string;
  color: string;
  avgEcpmUSD: number; // e.g. $14.50 USD
  avgEcpmINR: number; // e.g. ₹1,200 INR per 1,000 views (~₹1.20/view)
  status: 'ACTIVE' | 'FALLBACK' | 'STANDBY';
}

export const AD_PROVIDERS_CONFIG: Record<AdProviderName, AdProviderMeta> = {
  ADMOB: {
    id: 'ADMOB',
    name: 'Google AdMob',
    adUnitId: process.env.NEXT_PUBLIC_ADMOB_REWARDED_UNIT_ID || 'ca-app-pub-5470934256709090/8839247619',
    appOrOrgId: process.env.NEXT_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-5470934256709090~1068479518',
    color: '#4285F4',
    avgEcpmUSD: 15.0,
    avgEcpmINR: 1250, // ₹1.25 per view
    status: 'ACTIVE',
  },
  UNITY: {
    id: 'UNITY',
    name: 'Unity Ads',
    adUnitId: 'Rewarded_Android',
    appOrOrgId: process.env.UNITY_ORG_ID || '13469985384413',
    color: '#FFFFFF',
    avgEcpmUSD: 11.5,
    avgEcpmINR: 950, // ₹0.95 per view
    status: 'ACTIVE',
  },
  START_IO: {
    id: 'START_IO',
    name: 'Start.io (StartApp)',
    adUnitId: 'Rewarded_StartApp',
    appOrOrgId: process.env.START_IO_PUBLISHER_ID || '149124855',
    color: '#00D09C',
    avgEcpmUSD: 8.5,
    avgEcpmINR: 700, // ₹0.70 per view
    status: 'ACTIVE',
  },
  SPONSORED_PARTNER: {
    id: 'SPONSORED_PARTNER',
    name: 'Digicast Direct Sponsor',
    adUnitId: 'Direct_Partner_Video',
    appOrOrgId: 'sponsor_direct_v1',
    color: '#10B981',
    avgEcpmUSD: 30.0,
    avgEcpmINR: 2500, // ₹2.50 per view
    status: 'ACTIVE',
  },
};

export interface AdImpressionRecord {
  id: string;
  uid: string;
  userEmail?: string;
  provider: AdProviderName;
  providerName: string;
  adUnitId: string;
  format: 'REWARDED_VIDEO' | 'INTERSTITIAL' | 'BANNER';
  platform: 'ANDROID' | 'WEB';
  earnedINR: number;
  dCoinsAwarded: number;
  unlockedHours: number;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD
}

export interface AdDailyStats {
  date: string; // YYYY-MM-DD
  totalImpressions: number;
  totalEarnedINR: number;
  totalDCoinsAwarded: number;
  uniqueViewers: number;
  byProvider: Record<
    AdProviderName,
    {
      impressions: number;
      earnedINR: number;
      fillRate: number;
      avgEcpmINR: number;
    }
  >;
  updatedAt: string;
}

/**
 * Calculates earnings for a completed ad view based on provider and eCPM
 */
export function calculateAdEarnings(provider: AdProviderName): number {
  const config = AD_PROVIDERS_CONFIG[provider] || AD_PROVIDERS_CONFIG.ADMOB;
  // eCPM is earnings per 1,000 views. 1 view = ecpmINR / 1000
  const perViewEarnings = config.avgEcpmINR / 1000;
  // Round to 2 decimals (e.g. ₹1.25)
  return Math.round(perViewEarnings * 100) / 100;
}

/**
 * Records an ad impression and increments daily statistics in Firestore
 */
export async function recordAdImpression(
  adminDb: any,
  params: {
    uid: string;
    userEmail?: string;
    provider?: string;
    adUnitId?: string;
    platform?: string;
    format?: string;
  }
): Promise<{
  impression: AdImpressionRecord;
  dailyStats: AdDailyStats;
}> {
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // e.g. 2026-10-18
  const timestamp = now.toISOString();

  // Normalize provider
  const rawProv = (params.provider || 'ADMOB').toUpperCase();
  const providerKey: AdProviderName =
    rawProv === 'UNITY'
      ? 'UNITY'
      : rawProv === 'START_IO' || rawProv === 'STARTIO'
      ? 'START_IO'
      : rawProv === 'SPONSORED_PARTNER' || rawProv === 'DIRECT'
      ? 'SPONSORED_PARTNER'
      : 'ADMOB';

  const provConfig = AD_PROVIDERS_CONFIG[providerKey];
  const earnedINR = calculateAdEarnings(providerKey);
  const impressionId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const impression: AdImpressionRecord = {
    id: impressionId,
    uid: params.uid,
    userEmail: params.userEmail || '',
    provider: providerKey,
    providerName: provConfig.name,
    adUnitId: params.adUnitId || provConfig.adUnitId,
    format: (params.format as any) || 'REWARDED_VIDEO',
    platform: (params.platform as any) || 'ANDROID',
    earnedINR,
    dCoinsAwarded: 10,
    unlockedHours: 24,
    timestamp,
    dateKey,
  };

  // 1. Save detailed impression record in Firestore
  await adminDb.collection('ad_impressions').doc(impressionId).set(impression);

  // 2. Fetch or initialize today's daily aggregate document
  const dailyRef = adminDb.collection('ad_daily_stats').doc(dateKey);
  const dailyDoc = await dailyRef.get();

  let stats: AdDailyStats;

  if (dailyDoc.exists) {
    const existing = dailyDoc.data() as AdDailyStats;
    const existingByProv = existing.byProvider?.[providerKey] || {
      impressions: 0,
      earnedINR: 0,
      fillRate: 98.0,
      avgEcpmINR: provConfig.avgEcpmINR,
    };

    const newProvImpressions = existingByProv.impressions + 1;
    const newProvEarned = Math.round((existingByProv.earnedINR + earnedINR) * 100) / 100;

    stats = {
      ...existing,
      totalImpressions: existing.totalImpressions + 1,
      totalEarnedINR: Math.round((existing.totalEarnedINR + earnedINR) * 100) / 100,
      totalDCoinsAwarded: (existing.totalDCoinsAwarded || 0) + 10,
      byProvider: {
        ...existing.byProvider,
        [providerKey]: {
          ...existingByProv,
          impressions: newProvImpressions,
          earnedINR: newProvEarned,
          avgEcpmINR: provConfig.avgEcpmINR,
        },
      },
      updatedAt: timestamp,
    };
  } else {
    // Initial record for today
    stats = {
      date: dateKey,
      totalImpressions: 1,
      totalEarnedINR: earnedINR,
      totalDCoinsAwarded: 10,
      uniqueViewers: 1,
      byProvider: {
        ADMOB: {
          impressions: providerKey === 'ADMOB' ? 1 : 0,
          earnedINR: providerKey === 'ADMOB' ? earnedINR : 0,
          fillRate: 98.5,
          avgEcpmINR: AD_PROVIDERS_CONFIG.ADMOB.avgEcpmINR,
        },
        UNITY: {
          impressions: providerKey === 'UNITY' ? 1 : 0,
          earnedINR: providerKey === 'UNITY' ? earnedINR : 0,
          fillRate: 95.0,
          avgEcpmINR: AD_PROVIDERS_CONFIG.UNITY.avgEcpmINR,
        },
        START_IO: {
          impressions: providerKey === 'START_IO' ? 1 : 0,
          earnedINR: providerKey === 'START_IO' ? earnedINR : 0,
          fillRate: 92.0,
          avgEcpmINR: AD_PROVIDERS_CONFIG.START_IO.avgEcpmINR,
        },
        SPONSORED_PARTNER: {
          impressions: providerKey === 'SPONSORED_PARTNER' ? 1 : 0,
          earnedINR: providerKey === 'SPONSORED_PARTNER' ? earnedINR : 0,
          fillRate: 100.0,
          avgEcpmINR: AD_PROVIDERS_CONFIG.SPONSORED_PARTNER.avgEcpmINR,
        },
      },
      updatedAt: timestamp,
    };
  }

  await dailyRef.set(stats, { merge: true });

  return { impression, dailyStats: stats };
}

/**
 * Retrieves multi-day ad analytics and breakdown for the GodPanel dashboard
 */
export async function getAdEarningsAnalytics(adminDb: any, daysCount: number = 30) {
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];

  // Fetch last N daily stats
  const snap = await adminDb
    .collection('ad_daily_stats')
    .orderBy('date', 'desc')
    .limit(daysCount)
    .get();

  const history: AdDailyStats[] = snap.docs.map((d: any) => d.data());

  // Recent 20 live impressions
  const recentSnap = await adminDb
    .collection('ad_impressions')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  const recentImpressions: AdImpressionRecord[] = recentSnap.docs.map((d: any) => d.data());

  // Aggregate summary
  let todayStats: AdDailyStats = history.find((h) => h.date === todayKey) || {
    date: todayKey,
    totalImpressions: 0,
    totalEarnedINR: 0,
    totalDCoinsAwarded: 0,
    uniqueViewers: 0,
    byProvider: {
      ADMOB: { impressions: 0, earnedINR: 0, fillRate: 98.5, avgEcpmINR: AD_PROVIDERS_CONFIG.ADMOB.avgEcpmINR },
      UNITY: { impressions: 0, earnedINR: 0, fillRate: 95.0, avgEcpmINR: AD_PROVIDERS_CONFIG.UNITY.avgEcpmINR },
      START_IO: { impressions: 0, earnedINR: 0, fillRate: 92.0, avgEcpmINR: AD_PROVIDERS_CONFIG.START_IO.avgEcpmINR },
      SPONSORED_PARTNER: { impressions: 0, earnedINR: 0, fillRate: 100, avgEcpmINR: AD_PROVIDERS_CONFIG.SPONSORED_PARTNER.avgEcpmINR },
    },
    updatedAt: now.toISOString(),
  };

  let totalRevenue30d = 0;
  let totalImpressions30d = 0;

  for (const day of history) {
    totalRevenue30d += day.totalEarnedINR || 0;
    totalImpressions30d += day.totalImpressions || 0;
  }

  const avgEcpm30d = totalImpressions30d > 0 ? (totalRevenue30d / totalImpressions30d) * 1000 : 1250;

  return {
    today: todayStats,
    summary: {
      todayEarningsINR: todayStats.totalEarnedINR,
      todayImpressions: todayStats.totalImpressions,
      totalRevenue30d: Math.round(totalRevenue30d * 100) / 100,
      totalImpressions30d,
      avgEcpmINR: Math.round(avgEcpm30d),
      activeProvidersCount: 4,
    },
    providersConfig: AD_PROVIDERS_CONFIG,
    dailyHistory: history.reverse(),
    recentImpressions,
  };
}
