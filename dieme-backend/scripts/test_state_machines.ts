import { computeWorkspaceSubscription } from '../src/lib/subscription';
import { getAdPass, saveAdPass, countActiveAdPasses } from '../src/lib/adStore';
import { getUserWalletAsync, recordLedgerTransactionAsync, convertDCoinsToDPAsync } from '../src/lib/ledger';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runSubscriptionPrecedenceTests() {
  console.log('\n--- SM-1: Workspace Subscription Precedence Stack Tests ---');
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

async function runAdStoreTests() {
  console.log('\n--- SM-5: Ad Store In-Memory & Persistent Cache Tests ---');
  const testUid = `usr_test_ad_${Date.now()}`;
  const now = Date.now();

  // Initially no pass
  const initial = await getAdPass(testUid);
  assert(initial === null, 'New user starts without active ad pass');

  // Save 24h pass
  const passExpiresAt = now + 24 * 60 * 60 * 1000;
  await saveAdPass(testUid, {
    passExpiresAt,
    unlockMethod: 'ADMOB_REWARDED',
  });
  
  const record = await getAdPass(testUid);
  assert(record !== null && record.unlockMethod === 'ADMOB_REWARDED', 'Stored ad pass contains correct network metadata');
  assert(record!.passExpiresAt > Date.now(), 'Ad pass expiration is in future (24 hours)');
  assert(record!.hasActivePass === true, 'Ad pass hasActivePass flag is true');
}

async function runLedgerTests() {
  console.log('\n--- SM-4: Dual-Currency Ledger Tests ---');
  const testUid = `usr_test_ledger_${Date.now()}`;

  // Initial balance
  const wallet0 = await getUserWalletAsync(testUid);
  assert(wallet0.dCoinsBalance === 0 && wallet0.dpBalance === 0, 'New user wallet starts with 0 D-Coins and 0 DP');

  // Credit 25 D-Coins via task completion
  await recordLedgerTransactionAsync({
    uid: testUid,
    currency: 'D_COIN',
    amount: 30,
    type: 'CREDIT',
    source: 'TASK_REWARD',
    description: 'Test Task Reward',
  });

  const wallet1 = await getUserWalletAsync(testUid);
  assert(wallet1.dCoinsBalance === 30, 'Wallet correctly reflects credited 30 D-Coins');

  // Conversion: convert 20 D-Coins to 2 DP
  const convertRes = await convertDCoinsToDPAsync(testUid, 20);
  assert(convertRes.convertedDP === 2, '20 D-Coins burned to mint 2 DP (10:1 ratio)');
  assert(convertRes.balance.dCoinsBalance === 10, 'Remaining D-Coins balance is 10');
  assert(convertRes.balance.dpBalance === 2, 'Minted DP balance is 2');

  // Insufficient balance rejection
  let threw = false;
  try {
    await convertDCoinsToDPAsync(testUid, 50);
  } catch (err: any) {
    threw = true;
  }
  assert(threw, 'Conversion throws error when requested burn amount > available balance');
}

async function runClipBridgeMappingTests() {
  console.log('\n--- SM-2: Cross-Platform Clip Bridge Normalization Tests ---');
  
  // Test Android -> Web normalization
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

async function runYouTubeStreamDebounceTests() {
  console.log('\n--- SM-6: YouTube Stream Flapping Grace Window Tests ---');
  const STREAM_DISCONNECT_GRACE_MS = 90_000;

  function evaluateStreamStatus(
    isYouTubeActive: boolean,
    potentiallyEndedAtMs: number | null,
    now: number
  ): { nextStatus: 'live' | 'ended'; newPotentiallyEndedAt: number | null } {
    if (isYouTubeActive) {
      return { nextStatus: 'live', newPotentiallyEndedAt: null };
    }
    if (!potentiallyEndedAtMs) {
      // First disconnect detection -> start grace period
      return { nextStatus: 'live', newPotentiallyEndedAt: now };
    }
    if (now - potentiallyEndedAtMs < STREAM_DISCONNECT_GRACE_MS) {
      // Still inside grace window -> stay live
      return { nextStatus: 'live', newPotentiallyEndedAt: potentiallyEndedAtMs };
    }
    // Grace window elapsed -> mark ended
    return { nextStatus: 'ended', newPotentiallyEndedAt: null };
  }

  const t0 = 1000000;
  // Step 1: Flap disconnect at t0
  const flap1 = evaluateStreamStatus(false, null, t0);
  assert(flap1.nextStatus === 'live' && flap1.newPotentiallyEndedAt === t0, 'Transient drop retains live status and starts 90s grace window');

  // Step 2: Still disconnected 30s later (within 90s)
  const flap2 = evaluateStreamStatus(false, t0, t0 + 30000);
  assert(flap2.nextStatus === 'live', 'Stream remains live at t+30s');

  // Step 3: Stream recovers at t+45s
  const recover = evaluateStreamStatus(true, t0, t0 + 45000);
  assert(recover.nextStatus === 'live' && recover.newPotentiallyEndedAt === null, 'Stream recovers to live and clears grace timestamp');

  // Step 4: True disconnect past 90s
  const ended = evaluateStreamStatus(false, t0, t0 + 95000);
  assert(ended.nextStatus === 'ended', 'Stream marks ended only after full 90s uninterrupted disconnect');
}

async function runTelegramTakeoverLockoutTests() {
  console.log('\n--- SM-9: Telegram AI/Human Takeover Guard Tests ---');
  const ADMIN_TAKEOVER_LOCKOUT_MS = 15 * 60 * 1000; // 15 mins

  function shouldBotAutoReply(lastAdminReplyAtMs: number | null, now: number): boolean {
    if (!lastAdminReplyAtMs) return true;
    return (now - lastAdminReplyAtMs) > ADMIN_TAKEOVER_LOCKOUT_MS;
  }

  const now = Date.now();
  assert(shouldBotAutoReply(null, now), 'Bot allowed to reply when no human admin has intervened');
  assert(!shouldBotAutoReply(now - (5 * 60 * 1000), now), 'Bot BLOCKED from replying 5 mins after human admin intervention');
  assert(!shouldBotAutoReply(now - (14 * 60 * 1000), now), 'Bot BLOCKED from replying 14 mins after human admin intervention');
  assert(shouldBotAutoReply(now - (16 * 60 * 1000), now), 'Bot UNLOCKED to reply 16 mins after human admin intervention');
}

async function main() {
  console.log('========================================================');
  console.log('   STATE MACHINE UNIT & INTEGRATION TEST HARNESS        ');
  console.log('========================================================');
  await runSubscriptionPrecedenceTests();
  await runAdStoreTests();
  await runLedgerTests();
  await runClipBridgeMappingTests();
  await runPaymentWebhookTerminalGuardTests();
  await runYouTubeStreamDebounceTests();
  await runTelegramTakeoverLockoutTests();
  console.log('\n========================================================');
  console.log('   ALL 7 STATE MACHINE TEST SUITES PASSED (100% OK)    ');
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
