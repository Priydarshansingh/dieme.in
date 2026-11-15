import { computeWorkspaceSubscription } from '../src/lib/subscription';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runSubscriptionPrecedenceTests() {
  console.log('\n--- SM-1: dieme-web Workspace Subscription Precedence Stack Tests ---');
  const now = Date.now();

  // Test 1: Suspended always takes precedence
  const suspendedWs = {
    plan: 'pro',
    isSuspended: true,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: now + 1000000,
    adPassExpiresAt: now + 1000000,
  };
  const resSuspended = computeWorkspaceSubscription(suspendedWs);
  assert(resSuspended.status === 'expired' && resSuspended.isSuspended === true, 'Suspended flag dominates paid pro subscription');

  // Test 2: Trial Bypass Lockout takes precedence over trial and ad pass
  const bypassWs = {
    plan: 'free_trial',
    trialBypassDetected: true,
    trialBypassReason: 'Channel already claimed',
    adPassExpiresAt: now + 100000,
  };
  const resBypass = computeWorkspaceSubscription(bypassWs);
  assert(resBypass.status === 'expired' && resBypass.trialBypassDetected === true, 'Trial bypass lockout halts access even with ad pass');

  // Test 3: Lifetime overrides any expiration
  const lifetimeWs = {
    plan: 'lifetime',
    subscriptionStatus: 'active',
  };
  const resLifetime = computeWorkspaceSubscription(lifetimeWs);
  assert(resLifetime.status === 'active' && resLifetime.plan === 'lifetime' && !resLifetime.isExpired, 'Lifetime subscription marked active and not expired');

  // Test 4: Paid active tier
  const paidWs = {
    plan: 'pro',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: now + 3600000,
    trialEndsAt: now - 100000, // trial expired
  };
  const resPaid = computeWorkspaceSubscription(paidWs);
  assert(resPaid.status === 'active' && resPaid.activeTier === 'pro' && !resPaid.isExpired, 'Paid Pro tier active regardless of expired trial');

  // Test 5: 24h Ad Pass activates when Paid Plan or Free Trial is expired
  const adPassWs = {
    plan: 'free_trial',
    trialEndsAt: now - 100000, // expired trial
    adPassExpiresAt: now + 1800000, // 30 mins remaining
  };
  const resAdPass = computeWorkspaceSubscription(adPassWs);
  assert(resAdPass.status === 'active' && resAdPass.adPassActive === true && !resAdPass.isExpired, 'Ad Pass grants active access on expired workspace');

  // Test 6: Free Trial active when unexpired
  const trialWs = {
    plan: 'free_trial',
    trialEndsAt: now + 500000,
  };
  const resTrial = computeWorkspaceSubscription(trialWs);
  assert(resTrial.status === 'trial' && !resTrial.isExpired, 'Active Free Trial grants active access');

  // Test 7: Fully Expired
  const expiredWs = {
    plan: 'pro',
    subscriptionStatus: 'expired',
    subscriptionExpiresAt: now - 100000,
    adPassExpiresAt: now - 50000,
    trialEndsAt: now - 200000,
  };
  const resExpired = computeWorkspaceSubscription(expiredWs);
  assert(resExpired.status === 'expired' && resExpired.isExpired === true && resExpired.activeTier === 'none', 'Expired workspace blocks feature access');
}

async function runClipBridgeMappingTests() {
  console.log('\n--- SM-2: Cross-Platform Clip Bridge Normalization Tests ---');
  
  function normalizeAndroidToWeb(androidStatus: string) {
    let downloadStatus: 'not_started' | 'processing' | 'completed' = 'not_started';
    let telegramStatus: 'not_uploaded' | 'uploaded' = 'not_uploaded';
    const s = (androidStatus || '').toUpperCase();
    if (s === 'GENERATING' || s === 'QUEUED') {
      downloadStatus = 'processing';
    } else if (s === 'UPLOADED' || s === 'SAVED_LOCAL' || s === 'RENDERED_LOCAL') {
      downloadStatus = 'completed';
      telegramStatus = 'uploaded';
    } else if (s === 'FAILED') {
      downloadStatus = 'not_started';
    }
    return { downloadStatus, telegramStatus };
  }

  const generating = normalizeAndroidToWeb('GENERATING');
  assert(generating.downloadStatus === 'processing', 'GENERATING maps to downloadStatus=processing');

  const uploaded = normalizeAndroidToWeb('UPLOADED');
  assert(uploaded.downloadStatus === 'completed' && uploaded.telegramStatus === 'uploaded', 'UPLOADED maps to downloadStatus=completed & telegramStatus=uploaded');

  const failed = normalizeAndroidToWeb('FAILED');
  assert(failed.downloadStatus === 'not_started', 'FAILED safely resets downloadStatus to not_started');
}

async function runPaymentWebhookTerminalGuardTests() {
  console.log('\n--- SM-3: Payment Terminal State Guard Tests ---');

  function shouldProcessWebhook(existingStatus: string): boolean {
    const terminalStates = ['approved', 'rejected', 'refunded'];
    return !terminalStates.includes(existingStatus);
  }

  assert(!shouldProcessWebhook('rejected'), 'Webhook IGNORES event if payment was already rejected by admin');
  assert(!shouldProcessWebhook('refunded'), 'Webhook IGNORES event if payment was already refunded');
  assert(!shouldProcessWebhook('approved'), 'Webhook IGNORES duplicate event if payment was already approved');
  assert(shouldProcessWebhook('pending_verification'), 'Webhook PROCESSES event if payment is pending_verification');
  assert(shouldProcessWebhook('pending_payment'), 'Webhook PROCESSES event if payment is pending_payment');
}

async function main() {
  console.log('========================================================');
  console.log('   DIEME-WEB STATE MACHINE UNIT HARNESS                 ');
  console.log('========================================================');
  await runSubscriptionPrecedenceTests();
  await runClipBridgeMappingTests();
  await runPaymentWebhookTerminalGuardTests();
  console.log('\n========================================================');
  console.log('   DIEME-WEB STATE MACHINE TESTS PASSED (100% OK)       ');
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
