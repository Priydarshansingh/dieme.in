// Central subscription calculation and enforcement helper for Digicast.

export type PlanType = 'free_trial' | 'ad_pass_24h' | 'intro_29' | 'starter' | 'pro' | 'studio' | 'lifetime' | string;

export interface WorkspaceSubscription {
  status: 'trial' | 'active' | 'expired';
  plan: PlanType;
  trialEndsAt: string; // ISO string
  subscriptionExpiresAt?: string; // ISO string
  isExpired: boolean;
  daysRemaining: number;
  isSuspended?: boolean;
  trialBypassDetected?: boolean;
  trialBypassedChannelTitle?: string;
  adPassActive?: boolean;
  activeTier?: string;
}

export function computeWorkspaceSubscription(wsData: any): WorkspaceSubscription {
  const now = Date.now();
  const rawPlan = (wsData?.plan || wsData?.subscription || 'free_trial').toLowerCase();
  const isSuspended = Boolean(wsData?.isSuspended);
  const trialBypassDetected = Boolean(wsData?.trialBypassDetected);

  // Parse trial end timestamp
  let createdMs = now;
  if (wsData?.createdAt?._seconds) {
    createdMs = wsData.createdAt._seconds * 1000;
  } else if (typeof wsData?.createdAt === 'string') {
    const parsed = Date.parse(wsData.createdAt);
    if (!isNaN(parsed)) createdMs = parsed;
  }

  let trialEndMs = createdMs + 14 * 24 * 60 * 60 * 1000;
  if (wsData?.trialEndsAt) {
    const customTrial = typeof wsData.trialEndsAt === 'number' ? wsData.trialEndsAt : Date.parse(wsData.trialEndsAt);
    if (!isNaN(customTrial)) trialEndMs = customTrial;
  }

  // Parse subscription expiration timestamp
  let subExpiresMs = 0;
  if (wsData?.subscriptionExpiresAt) {
    subExpiresMs =
      typeof wsData.subscriptionExpiresAt === 'number'
        ? wsData.subscriptionExpiresAt
        : Date.parse(wsData.subscriptionExpiresAt);
  }

  // Parse Ad Pass expiration (e.g. 24h pass from rewarded ad)
  let adPassExpiresMs = 0;
  if (wsData?.adPassExpiresAt) {
    adPassExpiresMs =
      typeof wsData.adPassExpiresAt === 'number'
        ? wsData.adPassExpiresAt
        : Date.parse(wsData.adPassExpiresAt);
  }
  const hasActiveAdPass = adPassExpiresMs > now || Boolean(wsData?.hasActiveAdPass);

  // SM-1: Ordered Priority Precedence Stack (First matching rule determines access)

  // Rule 1: Explicit Admin Suspension or Overwrite
  if (isSuspended || wsData?.subscriptionStatus === 'suspended' || wsData?.subscriptionStatus === 'expired') {
    return {
      status: 'expired',
      plan: rawPlan,
      trialEndsAt: new Date(trialEndMs).toISOString(),
      subscriptionExpiresAt: subExpiresMs ? new Date(subExpiresMs).toISOString() : undefined,
      isExpired: true,
      daysRemaining: 0,
      isSuspended: true,
      activeTier: 'none',
    };
  }

  // Rule 2: Trial Bypass Lockout (only applies if user has NOT purchased a paid plan)
  const isPaidPlanName =
    ['intro_29', 'starter', 'pro', 'studio', 'lifetime'].includes(rawPlan) || rawPlan.startsWith('tier_');
  if (trialBypassDetected && !isPaidPlanName) {
    return {
      status: 'expired',
      plan: 'free_trial',
      trialEndsAt: new Date(trialEndMs).toISOString(),
      subscriptionExpiresAt: subExpiresMs ? new Date(subExpiresMs).toISOString() : undefined,
      isExpired: true,
      daysRemaining: 0,
      isSuspended: false,
      trialBypassDetected: true,
      trialBypassedChannelTitle: wsData?.trialBypassedChannelTitle,
      activeTier: 'none',
    };
  }

  // Rule 3: Lifetime Access
  if (rawPlan === 'lifetime') {
    return {
      status: 'active',
      plan: 'lifetime',
      trialEndsAt: new Date(trialEndMs).toISOString(),
      subscriptionExpiresAt: new Date(now + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      daysRemaining: 3650,
      isSuspended: false,
      activeTier: 'studio',
    };
  }

  // Rule 4: Active Paid Subscription (pro / studio / starter / intro_29)
  if (isPaidPlanName) {
    let effectiveExpiresMs = subExpiresMs;
    if (!effectiveExpiresMs || isNaN(effectiveExpiresMs)) {
      let defaultDays = 30;
      if (rawPlan === 'pro') defaultDays = 90;
      if (rawPlan === 'studio') defaultDays = 365;
      const baseMs = wsData?.updatedAt?._seconds ? wsData.updatedAt._seconds * 1000 : now;
      effectiveExpiresMs = baseMs + defaultDays * 24 * 60 * 60 * 1000;
    }

    if (effectiveExpiresMs > now) {
      const daysRemaining = Math.max(1, Math.ceil((effectiveExpiresMs - now) / (24 * 60 * 60 * 1000)));
      return {
        status: 'active',
        plan: rawPlan,
        trialEndsAt: new Date(trialEndMs).toISOString(),
        subscriptionExpiresAt: new Date(effectiveExpiresMs).toISOString(),
        isExpired: false,
        daysRemaining,
        isSuspended: false,
        activeTier: rawPlan,
      };
    }
  }

  // Rule 5: Active 24-Hour Ad Pass (Watched Ad tier)
  if (hasActiveAdPass) {
    const daysRemaining = Math.max(1, Math.ceil((adPassExpiresMs - now) / (24 * 60 * 60 * 1000)));
    return {
      status: 'active',
      plan: 'ad_pass_24h',
      trialEndsAt: new Date(trialEndMs).toISOString(),
      subscriptionExpiresAt: new Date(adPassExpiresMs).toISOString(),
      isExpired: false,
      daysRemaining,
      isSuspended: false,
      adPassActive: true,
      activeTier: 'intro',
    };
  }

  // Rule 6: Active 14-Day Free Trial
  if (now <= trialEndMs) {
    const daysRemaining = Math.max(1, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)));
    return {
      status: 'trial',
      plan: 'free_trial',
      trialEndsAt: new Date(trialEndMs).toISOString(),
      isExpired: false,
      daysRemaining,
      isSuspended: false,
      activeTier: 'pro',
    };
  }

  // Rule 7: Exhausted / Expired
  return {
    status: 'expired',
    plan: rawPlan,
    trialEndsAt: new Date(trialEndMs).toISOString(),
    subscriptionExpiresAt: subExpiresMs ? new Date(subExpiresMs).toISOString() : undefined,
    isExpired: true,
    daysRemaining: 0,
    isSuspended: false,
    activeTier: 'none',
  };
}
