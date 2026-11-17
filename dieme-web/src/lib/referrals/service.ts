import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { PRICING_PLANS } from "@/lib/pricingPlans";

export interface PlatformConfig {
  referralCommissionPercent: number; // e.g. 15%
  dpToInrRate: number;              // e.g. 1 DP = 1 INR
  dCoinsPerINR: number;             // e.g. 10 D-Coins = 1 INR
  dCoinsPerDP: number;              // e.g. 10 D-Coins = 1 DP
  minWithdrawalINR: number;          // e.g. 500 INR
  plans: Record<string, { priceINR: number; dpCost: number; name: string }>;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  referralCommissionPercent: 15,
  dpToInrRate: 1.0,
  dCoinsPerINR: 10,
  dCoinsPerDP: 10,
  minWithdrawalINR: 500,
  plans: {
    intro_29: { priceINR: 29, dpCost: 29, name: "1st Month VIP Pass" },
    starter: { priceINR: 149, dpCost: 149, name: "Monthly Pro Pass" },
    pro: { priceINR: 499, dpCost: 499, name: "Quarterly Studio Pass" },
    studio: { priceINR: 999, dpCost: 999, name: "Annual Studio Suite" },
  },
};

/**
 * Derives canonical referral code from UID
 */
export function getReferralCode(uid: string): string {
  if (!uid) return "REF_DIEME";
  return `REF_${uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * Loads dynamic platform configuration from Firestore with in-memory caching
 */
let cachedConfig: PlatformConfig | null = null;
let lastConfigFetch = 0;
const CACHE_TTL_MS = 60_000; // 1 minute cache

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastConfigFetch < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const docRef = adminDb.doc(col.platformConfig());
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as Partial<PlatformConfig>;
      cachedConfig = {
        ...DEFAULT_PLATFORM_CONFIG,
        ...data,
        plans: {
          ...DEFAULT_PLATFORM_CONFIG.plans,
          ...(data.plans || {}),
        },
      };
      lastConfigFetch = now;
      return cachedConfig;
    }
  } catch (err) {
    console.warn("[referrals/service] Warning reading platform_config:", err);
  }

  cachedConfig = DEFAULT_PLATFORM_CONFIG;
  lastConfigFetch = now;
  return cachedConfig;
}

/**
 * Updates platform config in Firestore (Admin Only)
 */
export async function updatePlatformConfig(
  updates: Partial<PlatformConfig>,
  adminUid: string
): Promise<PlatformConfig> {
  const current = await getPlatformConfig();
  const updated: PlatformConfig = {
    ...current,
    ...updates,
    plans: {
      ...current.plans,
      ...(updates.plans || {}),
    },
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };

  await adminDb.doc(col.platformConfig()).set(updated, { merge: true });
  cachedConfig = updated;
  lastConfigFetch = Date.now();
  return updated;
}

/**
 * Validates a referral code and looks up the referring user
 */
export async function validateReferralCode(
  rawCode: string,
  currentUid?: string
): Promise<{
  valid: boolean;
  referrerUid?: string;
  referrerEmail?: string;
  referrerName?: string;
  code: string;
  message: string;
}> {
  const cleanCode = (rawCode || "").trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, code: cleanCode, message: "No referral code provided" };
  }

  // 1. Check referral_codes index
  try {
    const codeDoc = await adminDb.doc(col.referralCode(cleanCode)).get();
    if (codeDoc.exists) {
      const data = codeDoc.data() || {};
      const referrerUid = data.uid || data.referrerUid;
      if (currentUid && referrerUid === currentUid) {
        return { valid: false, code: cleanCode, message: "You cannot refer your own account" };
      }
      return {
        valid: true,
        referrerUid,
        referrerEmail: data.email || "",
        referrerName: data.displayName || data.name || "Creator",
        code: cleanCode,
        message: "Referral code verified",
      };
    }
  } catch (e) {
    console.warn("[referrals/service] Error checking referral_codes doc:", e);
  }

  // 2. Fallback: Search users collection for referralCode or matching prefix
  try {
    const snap = await adminDb
      .collection(col.users())
      .where("referralCode", "==", cleanCode)
      .limit(1)
      .get();

    if (!snap.empty) {
      const userDoc = snap.docs[0];
      const referrerUid = userDoc.id;
      if (currentUid && referrerUid === currentUid) {
        return { valid: false, code: cleanCode, message: "You cannot refer your own account" };
      }
      const uData = userDoc.data();
      return {
        valid: true,
        referrerUid,
        referrerEmail: uData.email || "",
        referrerName: uData.displayName || "Creator",
        code: cleanCode,
        message: "Referral code verified",
      };
    }

    // 3. Match by UID prefix: REF_XXXXXX
    if (cleanCode.startsWith("REF_")) {
      const prefix = cleanCode.substring(4);
      const allUsersSnap = await adminDb.collection(col.users()).limit(150).get();
      for (const d of allUsersSnap.docs) {
        if (d.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() === prefix) {
          if (currentUid && d.id === currentUid) {
            return { valid: false, code: cleanCode, message: "You cannot refer your own account" };
          }
          const uData = d.data();
          // Backfill index for fast future lookup
          await adminDb.doc(col.referralCode(cleanCode)).set({
            uid: d.id,
            email: uData.email || "",
            displayName: uData.displayName || "",
            createdAt: new Date().toISOString(),
          }, { merge: true });

          return {
            valid: true,
            referrerUid: d.id,
            referrerEmail: uData.email || "",
            referrerName: uData.displayName || "Creator",
            code: cleanCode,
            message: "Referral code verified",
          };
        }
      }
    }
  } catch (err) {
    console.warn("[referrals/service] Error searching users by referral code:", err);
  }

  return { valid: false, code: cleanCode, message: "Invalid or expired referral code" };
}

/**
 * Registers a new user under a referrer
 */
export async function registerReferral(params: {
  referrerCode: string;
  referredUid: string;
  referredEmail: string;
}): Promise<{ success: boolean; message: string; referralId?: string }> {
  const { referrerCode, referredUid, referredEmail } = params;
  if (!referrerCode || !referredUid) {
    return { success: false, message: "Missing required referral parameters" };
  }

  const validation = await validateReferralCode(referrerCode, referredUid);
  if (!validation.valid || !validation.referrerUid) {
    return { success: false, message: validation.message };
  }

  const referrerUid = validation.referrerUid;
  const config = await getPlatformConfig();
  const now = new Date().toISOString();

  const refDocId = `ref_${referredUid}`;
  const refDocRef = adminDb.doc(col.referral(refDocId));

  const existing = await refDocRef.get();
  if (existing.exists) {
    return { success: true, message: "Referral already registered", referralId: refDocId };
  }

  const referralData = {
    id: refDocId,
    referralCode: validation.code,
    referrerUid,
    referrerEmail: validation.referrerEmail || "",
    referredUid,
    referredEmail: (referredEmail || "").toLowerCase(),
    status: "registered",
    commissionPercent: config.referralCommissionPercent,
    totalPaymentsINR: 0,
    totalCommissionINR: 0,
    totalCommissionDP: 0,
    createdAt: now,
    convertedAt: null,
  };

  await refDocRef.set(referralData);

  // Update referred user document
  await adminDb.doc(col.user(referredUid)).set(
    {
      referredBy: referrerUid,
      referredByCode: validation.code,
      referredAt: now,
    },
    { merge: true }
  );

  // Update referrer user stats
  const referrerRef = adminDb.doc(col.user(referrerUid));
  const referrerDoc = await referrerRef.get();
  const currentCount = referrerDoc.data()?.referralStats?.referredCount || 0;
  await referrerRef.set(
    {
      referralStats: {
        referredCount: currentCount + 1,
      },
    },
    { merge: true }
  );

  return {
    success: true,
    message: `Successfully linked referral to ${validation.referrerName || "Creator"}`,
    referralId: refDocId,
  };
}

/**
 * Automatically calculates and credits referral commission when a referred user makes a payment
 */
export async function creditReferralCommission(params: {
  workspaceId: string;
  paymentAmountINR: number;
  orderId?: string;
  paymentId?: string;
}): Promise<{ credited: boolean; commissionINR?: number; commissionDP?: number; referrerUid?: string }> {
  const { workspaceId, paymentAmountINR, orderId, paymentId } = params;
  if (!workspaceId || paymentAmountINR <= 0) return { credited: false };

  try {
    // 1. Locate referral entry: either by ref_${workspaceId} or by user doc
    let referralDoc = await adminDb.doc(col.referral(`ref_${workspaceId}`)).get();

    if (!referralDoc.exists) {
      // Check user document for referredBy
      const userDoc = await adminDb.doc(col.user(workspaceId)).get();
      const referredBy = userDoc.data()?.referredBy;
      if (referredBy) {
        // Query referrals collection
        const qSnap = await adminDb
          .collection(col.referrals())
          .where("referredUid", "==", workspaceId)
          .limit(1)
          .get();
        if (!qSnap.empty) {
          referralDoc = qSnap.docs[0];
        }
      }
    }

    if (!referralDoc.exists) {
      return { credited: false };
    }

    const refData = referralDoc.data() || {};
    const referrerUid = refData.referrerUid;
    if (!referrerUid) return { credited: false };

    const config = await getPlatformConfig();
    const commissionPercent = refData.commissionPercent || config.referralCommissionPercent || 15;
    const commissionINR = Math.round(paymentAmountINR * (commissionPercent / 100));
    const dpToInr = config.dpToInrRate || 1.0;
    const commissionDP = Math.round(commissionINR / dpToInr);

    if (commissionINR <= 0) return { credited: false };

    const now = new Date().toISOString();

    // 2. Update referral record in Firestore
    await referralDoc.ref.set(
      {
        status: "converted",
        totalPaymentsINR: (refData.totalPaymentsINR || 0) + paymentAmountINR,
        totalCommissionINR: (refData.totalCommissionINR || 0) + commissionINR,
        totalCommissionDP: (refData.totalCommissionDP || 0) + commissionDP,
        convertedAt: refData.convertedAt || now,
        lastPaymentAt: now,
      },
      { merge: true }
    );

    // 3. Credit Referrer Wallet in Firestore
    const walletRef = adminDb.doc(col.wallet(referrerUid));
    const walletSnap = await walletRef.get();
    const existingWallet = walletSnap.exists ? walletSnap.data() || {} : {};
    const currentDp = existingWallet.dp || existingWallet.dpBalance || 0;
    const currentEarnedDP = existingWallet.totalEarnedDP || 0;

    await walletRef.set(
      {
        uid: referrerUid,
        dp: currentDp + commissionDP,
        dpBalance: currentDp + commissionDP,
        totalEarnedDP: currentEarnedDP + commissionDP,
        updatedAt: now,
      },
      { merge: true }
    );

    // 4. Log transaction in referrer wallet
    const txId = `tx_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await adminDb.doc(`wallets/${referrerUid}/transactions/${txId}`).set({
      id: txId,
      type: "referral_commission",
      amountDP: commissionDP,
      equivalentINR: commissionINR,
      fromWorkspaceId: workspaceId,
      fromOrderId: orderId || paymentId || "",
      description: `${commissionPercent}% Lifetime Referral Commission`,
      createdAt: now,
    });

    // 5. Update referrer user record
    const referrerUserRef = adminDb.doc(col.user(referrerUid));
    const refUserSnap = await referrerUserRef.get();
    const existingStats = refUserSnap.data()?.referralStats || {};
    await referrerUserRef.set(
      {
        referralStats: {
          lifetimeEarnedINR: (existingStats.lifetimeEarnedINR || 0) + commissionINR,
          lifetimeEarnedDP: (existingStats.lifetimeEarnedDP || 0) + commissionDP,
          referredCount: existingStats.referredCount || 1,
        },
      },
      { merge: true }
    );

    console.log(
      `[referrals/service] 🎉 Credited ₹${commissionINR} (${commissionDP} DP) to referrer ${referrerUid} from payment of ₹${paymentAmountINR}`
    );

    return {
      credited: true,
      commissionINR,
      commissionDP,
      referrerUid,
    };
  } catch (err) {
    console.error("[referrals/service] Error crediting referral commission:", err);
    return { credited: false };
  }
}

/**
 * Returns dynamic live referral statistics for a creator
 */
export async function getUserReferralStats(uid: string): Promise<{
  referralCode: string;
  referralLink: string;
  referredCount: number;
  lifetimeCommissionINR: number;
  creditedToWalletDP: number;
  commissionPercent: number;
  streamers: Array<{
    id: string;
    email: string;
    status: string;
    createdAt: string;
    commissionINR: number;
  }>;
}> {
  const referralCode = getReferralCode(uid);
  const referralLink = `https://www.dieme.in/login?ref=${referralCode}`;
  const config = await getPlatformConfig();

  try {
    const snap = await adminDb
      .collection(col.referrals())
      .where("referrerUid", "==", uid)
      .limit(50)
      .get();

    let totalINR = 0;
    let totalDP = 0;
    const streamers: Array<{
      id: string;
      email: string;
      status: string;
      createdAt: string;
      commissionINR: number;
    }> = [];

    for (const d of snap.docs) {
      const data = d.data();
      const inr = data.totalCommissionINR || 0;
      const dp = data.totalCommissionDP || 0;
      totalINR += inr;
      totalDP += dp;

      const rawEmail = data.referredEmail || "";
      const maskedEmail = rawEmail.includes("@")
        ? `${rawEmail[0]}***@${rawEmail.split("@")[1]}`
        : "Streamer";

      streamers.push({
        id: d.id,
        email: maskedEmail,
        status: data.status || "registered",
        createdAt: data.createdAt || "",
        commissionINR: inr,
      });
    }

    // Sort newest first
    streamers.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return {
      referralCode,
      referralLink,
      referredCount: snap.size,
      lifetimeCommissionINR: totalINR,
      creditedToWalletDP: totalDP,
      commissionPercent: config.referralCommissionPercent,
      streamers,
    };
  } catch (err) {
    console.warn("[referrals/service] Error fetching user referral stats:", err);
    return {
      referralCode,
      referralLink,
      referredCount: 0,
      lifetimeCommissionINR: 0,
      creditedToWalletDP: 0,
      commissionPercent: config.referralCommissionPercent,
      streamers: [],
    };
  }
}
