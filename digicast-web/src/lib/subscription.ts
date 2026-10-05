// Central subscription calculation and enforcement helper for Digicast.

export type PlanType = 'free_trial' | 'intro_29' | 'starter' | 'pro' | 'studio' | 'lifetime' | string;

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
}

export function computeWorkspaceSubscription(wsData: any): WorkspaceSubscription {
  const now = Date.now();
  const rawPlan = (wsData?.plan || wsData?.subscription || 'free_trial').toLowerCase();
  const isSuspended = Boolean(wsData?.isSuspended);
  const trialBypassDetected = Boolean(wsData?.trialBypassDetected);

  // If this workspace attempted to bypass the 14-day trial by reusing a YouTube channel that already consumed trial,
  // and they haven't purchased a paid plan (still on free_trial), lock trial access immediately.
  if (trialBypassDetected && rawPlan === 'free_trial') {
    return {
      status: 'expired',
      plan: 'free_trial',
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: wsData?.subscriptionExpiresAt,
      isExpired: true,
      daysRemaining: 0,
      isSuspended,
      trialBypassDetected: true,
      trialBypassedChannelTitle: wsData?.trialBypassedChannelTitle,
    };
  }

  // Explicit suspension or override by admin
  if (isSuspended || wsData?.subscriptionStatus === 'expired') {
    return {
      status: 'expired',
      plan: rawPlan,
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: wsData?.subscriptionExpiresAt,
      isExpired: true,
      daysRemaining: 0,
      isSuspended,
    };
  }

  // Lifetime plan
  if (rawPlan === 'lifetime') {
    return {
      status: 'active',
      plan: 'lifetime',
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: new Date(now + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      daysRemaining: 3650,
      isSuspended: false,
    };
  }

  // Paid Plans: intro_29, starter, pro, studio
  const isPaidPlan = ['intro_29', 'starter', 'pro', 'studio'].includes(rawPlan) || rawPlan.startsWith('tier_');
  if (isPaidPlan) {
    let expiresMs = 0;
    if (wsData?.subscriptionExpiresAt) {
      expiresMs = typeof wsData.subscriptionExpiresAt === 'number'
        ? wsData.subscriptionExpiresAt
        : Date.parse(wsData.subscriptionExpiresAt);
    } else if (wsData?.updatedAt?._seconds) {
      expiresMs = (wsData.updatedAt._seconds * 1000) + (30 * 24 * 60 * 60 * 1000);
    } else {
      expiresMs = now + (30 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(expiresMs) || now > expiresMs) {
      return {
        status: 'expired',
        plan: rawPlan,
        trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
        subscriptionExpiresAt: new Date(expiresMs).toISOString(),
        isExpired: true,
        daysRemaining: 0,
        isSuspended: false,
      };
    }

    const daysRemaining = Math.max(1, Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000)));
    return {
      status: 'active',
      plan: rawPlan,
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: new Date(expiresMs).toISOString(),
      isExpired: false,
      daysRemaining,
      isSuspended: false,
    };
  }

  // Free Trial (14 days default from creation)
  let createdMs = now;
  if (wsData?.createdAt?._seconds) {
    createdMs = wsData.createdAt._seconds * 1000;
  } else if (typeof wsData?.createdAt === 'string') {
    const parsed = Date.parse(wsData.createdAt);
    if (!isNaN(parsed)) createdMs = parsed;
  }

  let trialEndMs = createdMs + (14 * 24 * 60 * 60 * 1000);
  if (wsData?.trialEndsAt) {
    const customTrial = typeof wsData.trialEndsAt === 'number' ? wsData.trialEndsAt : Date.parse(wsData.trialEndsAt);
    if (!isNaN(customTrial)) trialEndMs = customTrial;
  }

  if (now > trialEndMs) {
    return {
      status: 'expired',
      plan: 'free_trial',
      trialEndsAt: new Date(trialEndMs).toISOString(),
      isExpired: true,
      daysRemaining: 0,
      isSuspended: false,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)));
  return {
    status: 'trial',
    plan: 'free_trial',
    trialEndsAt: new Date(trialEndMs).toISOString(),
    isExpired: false,
    daysRemaining,
    isSuspended: false,
  };
}
