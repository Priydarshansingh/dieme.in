import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';
import { recordLedgerTransaction, recordLedgerTransactionAsync } from '@/lib/ledger';
import { activeSubscriptions, affiliateLedger } from '@/lib/subscriptionStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, planId, paymentMethod, referralCode } = await req.json();

    if (!uid || !planId) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'uid and planId are required' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'INVALID_PLAN_ID' }, { status: 404 });
    }

    const now = Date.now();
    const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = now + durationMs;

    // If paying via In-App DP balance
    if (paymentMethod === 'IN_APP_DP') {
      if (plan.dpCost > 0) {
        await recordLedgerTransactionAsync({
          uid,
          type: 'DEBIT',
          currency: 'DP',
          amount: plan.dpCost,
          source: 'SUBSCRIPTION_PURCHASE',
          description: `Subscribed to ${plan.name} using ${plan.dpCost} DP`,
          referenceId: plan.id,
        });
      }
    } else if (plan.isTrial) {
      // Free trial welcome trial credits (e.g. 10 days of trial credits)
      recordLedgerTransaction({
        uid,
        type: 'CREDIT',
        currency: 'D_COIN',
        amount: 20, // Welcome trial bonus D-coins
        source: 'TRIAL_BONUS',
        description: '14-Day Free Trial welcome bonus credits',
        referenceId: 'trial_welcome',
      });
    }

    // Process Affiliate Commission if user used a referral code
    if (referralCode && plan.priceINR > 0) {
      const referrerUid = `usr_${referralCode.replace('REF_', '')}`;
      const commissionPercentage = 0.15; // 15% lifetime commission
      const commissionINR = Math.round(plan.priceINR * commissionPercentage * 100) / 100;
      const commissionDP = Math.floor(commissionINR);

      const existingAffiliate = affiliateLedger.get(referrerUid) || {
        totalReferrals: 0,
        lifetimeCommissionINR: 0,
        lifetimeDP: 0,
      };

      existingAffiliate.totalReferrals += 1;
      existingAffiliate.lifetimeCommissionINR += commissionINR;
      existingAffiliate.lifetimeDP += commissionDP;
      affiliateLedger.set(referrerUid, existingAffiliate);

      // Credit DP directly to affiliate's double-entry wallet
      if (commissionDP > 0) {
        recordLedgerTransaction({
          uid: referrerUid,
          type: 'CREDIT',
          currency: 'DP',
          amount: commissionDP,
          source: 'REFERRAL_COMMISSION',
          description: `Lifetime affiliate commission (15%) from referred subscription: ${plan.name}`,
          referenceId: uid,
        });
      }
    }

    const subscription = {
      uid,
      planId: plan.id,
      planName: plan.name,
      status: plan.isTrial ? 'trialing' : 'active',
      startedAt: now,
      expiresAt,
      paymentMethod: paymentMethod || (plan.isTrial ? 'FREE_TRIAL' : 'RAZORPAY_INR'),
      trialCreditDays: plan.trialCreditDays || 0,
    };

    activeSubscriptions.set(uid, subscription);

    return NextResponse.json({
      success: true,
      subscription,
      message: `Successfully activated ${plan.name}! Access valid until ${new Date(expiresAt).toLocaleDateString()}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'SUBSCRIPTION_ERROR', message: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'UID_REQUIRED' }, { status: 400 });
  }

  const sub = activeSubscriptions.get(uid);
  return NextResponse.json({
    hasSubscription: !!sub,
    subscription: sub || null,
  });
}
