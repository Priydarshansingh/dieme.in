// Central subscription calculation and enforcement helper for Digicast.

export interface WorkspaceSubscription {
  status: 'trial' | 'active' | 'expired';
  plan: 'free_trial' | 'pro';
  trialEndsAt: string; // ISO string
  subscriptionExpiresAt?: string; // ISO string
  isExpired: boolean;
  daysRemaining: number;
}

export function computeWorkspaceSubscription(wsData: any): WorkspaceSubscription {
  const now = Date.now();
  const plan: 'free_trial' | 'pro' = wsData?.plan === 'pro' || wsData?.subscription === 'pro' ? 'pro' : 'free_trial';

  // Explicit override by admin
  if (wsData?.subscriptionStatus === 'expired') {
    return {
      status: 'expired',
      plan,
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: wsData?.subscriptionExpiresAt,
      isExpired: true,
      daysRemaining: 0,
    };
  }

  // 1. Pro Subscription (Monthly)
  if (plan === 'pro') {
    let expiresMs = 0;
    if (wsData?.subscriptionExpiresAt) {
      expiresMs = typeof wsData.subscriptionExpiresAt === 'number'
        ? wsData.subscriptionExpiresAt
        : Date.parse(wsData.subscriptionExpiresAt);
    } else if (wsData?.updatedAt?._seconds) {
      // Default 30 days from update if not explicitly set
      expiresMs = (wsData.updatedAt._seconds * 1000) + (30 * 24 * 60 * 60 * 1000);
    } else {
      expiresMs = now + (30 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(expiresMs) || now > expiresMs) {
      return {
        status: 'expired',
        plan: 'pro',
        trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
        subscriptionExpiresAt: new Date(expiresMs).toISOString(),
        isExpired: true,
        daysRemaining: 0,
      };
    }

    const daysRemaining = Math.max(1, Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000)));
    return {
      status: 'active',
      plan: 'pro',
      trialEndsAt: wsData?.trialEndsAt || new Date(now).toISOString(),
      subscriptionExpiresAt: new Date(expiresMs).toISOString(),
      isExpired: false,
      daysRemaining,
    };
  }

  // 2. Free Trial (14 days default from creation)
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
    };
  }

  const daysRemaining = Math.max(1, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)));
  return {
    status: 'trial',
    plan: 'free_trial',
    trialEndsAt: new Date(trialEndMs).toISOString(),
    isExpired: false,
    daysRemaining,
  };
}
