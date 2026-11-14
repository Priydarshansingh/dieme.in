import {
  CurrencyType,
  D_COINS_PER_DP,
  INR_PER_DP,
  LedgerEntry,
  LedgerSource,
  LedgerTransactionType,
  UserWalletBalance,
} from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

// In-memory ledger store for atomic fast operations / fallback when DB is initializing
const memoryLedgerStore = new Map<string, LedgerEntry[]>();
const idempotencyKeySet = new Set<string>();

/**
 * Calculates current wallet balance by aggregating append-only ledger entries
 */
export function calculateWalletBalance(entries: LedgerEntry[], uid: string): UserWalletBalance {
  let dCoinsCredit = 0;
  let dCoinsDebit = 0;
  let dpCredit = 0;
  let dpDebit = 0;

  for (const entry of entries) {
    if (entry.currency === 'D_COIN') {
      if (entry.type === 'CREDIT') dCoinsCredit += entry.amount;
      if (entry.type === 'DEBIT') dCoinsDebit += entry.amount;
    } else if (entry.currency === 'DP') {
      if (entry.type === 'CREDIT') dpCredit += entry.amount;
      if (entry.type === 'DEBIT') dpDebit += entry.amount;
    }
  }

  const dCoinsBalance = Math.max(0, dCoinsCredit - dCoinsDebit);
  const dpBalance = Math.max(0, dpCredit - dpDebit);

  // Conversion: 10 D Coins = 1 DP, 1 DP = ₹1 INR
  const totalEquivalentINR = dpBalance * INR_PER_DP + (dCoinsBalance / D_COINS_PER_DP) * INR_PER_DP;

  return {
    uid,
    dCoinsBalance,
    dpBalance,
    equivalentINR: Math.round(totalEquivalentINR * 100) / 100,
    totalEarnedDP: dpCredit + Math.floor(dCoinsCredit / D_COINS_PER_DP),
    totalSpentDP: dpDebit + Math.floor(dCoinsDebit / D_COINS_PER_DP),
    updatedAt: Date.now(),
  };
}

/**
 * Loads a user's transactions from Firestore to hydrate memory during serverless cold starts
 */
export async function loadUserLedgerFromFirestore(uid: string): Promise<LedgerEntry[]> {
  if (!adminDb) return memoryLedgerStore.get(uid) || [];

  try {
    const snap = await adminDb.collection('ledger').where('uid', '==', uid).get();
    if (!snap.empty) {
      const firestoreEntries: LedgerEntry[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as LedgerEntry;
        firestoreEntries.push(data);
      });

      // Sort chronologically
      firestoreEntries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Merge with memory store, deduplicating by ID
      const existing = memoryLedgerStore.get(uid) || [];
      const idSet = new Set(existing.map((e) => e.id));

      for (const fe of firestoreEntries) {
        if (!idSet.has(fe.id)) {
          existing.push(fe);
          idSet.add(fe.id);
          if (fe.idempotencyKey) idempotencyKeySet.add(fe.idempotencyKey);
        }
      }

      existing.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      memoryLedgerStore.set(uid, existing);
      return existing;
    }
  } catch (err: any) {
    console.warn('[ledger] Firestore loadUserLedger error, using memory fallback:', err.message);
  }

  return memoryLedgerStore.get(uid) || [];
}

/**
 * Appends a new transaction entry into the double-entry ledger with idempotency check
 * Persists to Firestore and updates aggregated user document balances
 */
export function recordLedgerTransaction(params: {
  uid: string;
  type: LedgerTransactionType;
  currency: CurrencyType;
  amount: number;
  source: LedgerSource;
  description: string;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}): { entry: LedgerEntry; balance: UserWalletBalance } {
  const { uid, type, currency, amount, source, description, referenceId, metadata } = params;

  if (amount <= 0) {
    throw new Error('Transaction amount must be strictly greater than 0');
  }

  const key = params.idempotencyKey || `${uid}_${source}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  
  // Idempotency guarantee: prevent double charge / double credit
  if (idempotencyKeySet.has(key)) {
    const existingEntries = memoryLedgerStore.get(uid) || [];
    const found = existingEntries.find((e) => e.idempotencyKey === key);
    if (found) {
      return { entry: found, balance: calculateWalletBalance(existingEntries, uid) };
    }
  }

  const userEntries = memoryLedgerStore.get(uid) || [];
  const currentBalance = calculateWalletBalance(userEntries, uid);

  // If DEBIT, verify sufficient balance
  if (type === 'DEBIT') {
    if (currency === 'D_COIN' && currentBalance.dCoinsBalance < amount) {
      throw new Error(`Insufficient D Coins. Required: ${amount}, Available: ${currentBalance.dCoinsBalance}`);
    }
    if (currency === 'DP' && currentBalance.dpBalance < amount) {
      throw new Error(`Insufficient DP balance. Required: ${amount}, Available: ${currentBalance.dpBalance}`);
    }
  }

  const newEntry: LedgerEntry = {
    id: `tx_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    uid,
    type,
    currency,
    amount,
    source,
    description,
    referenceId,
    idempotencyKey: key,
    timestamp: Date.now(),
    metadata,
  };

  userEntries.push(newEntry);
  memoryLedgerStore.set(uid, userEntries);
  idempotencyKeySet.add(key);

  const updatedBalance = calculateWalletBalance(userEntries, uid);

  // Asynchronously persist transaction to Firestore ledger and update user document
  if (adminDb) {
    try {
      adminDb
        .collection('ledger')
        .doc(newEntry.id)
        .set({
          ...newEntry,
          createdAt: new Date().toISOString(),
        })
        .catch((err) => {
          console.warn('[ledger] Async Firestore set error:', err.message);
        });

      adminDb
        .collection('users')
        .doc(uid)
        .set(
          {
            dpBalance: updatedBalance.dpBalance,
            dCoinsBalance: updatedBalance.dCoinsBalance,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
        .catch((err) => {
          console.warn('[ledger] Async user balance update error:', err.message);
        });
    } catch (e: any) {
      console.warn('[ledger] Firestore write warning:', e.message);
    }
  }

  return { entry: newEntry, balance: updatedBalance };
}

/**
 * Async version of recordLedgerTransaction that hydrates user state before checking balances
 */
export async function recordLedgerTransactionAsync(
  params: Parameters<typeof recordLedgerTransaction>[0]
): Promise<{ entry: LedgerEntry; balance: UserWalletBalance }> {
  if (params.type === 'DEBIT') {
    await loadUserLedgerFromFirestore(params.uid);
  }
  return recordLedgerTransaction(params);
}

/**
 * Converts accumulated D-Coins into DP (10 D Coins = 1 DP)
 */
export function convertDCoinsToDP(uid: string, dCoinsToConvert: number): { convertedDP: number; balance: UserWalletBalance } {
  if (dCoinsToConvert < D_COINS_PER_DP) {
    throw new Error(`Minimum conversion is ${D_COINS_PER_DP} D Coins (= 1 DP)`);
  }
  if (dCoinsToConvert % D_COINS_PER_DP !== 0) {
    throw new Error(`Conversion amount must be a multiple of ${D_COINS_PER_DP}`);
  }

  const dpToReceive = dCoinsToConvert / D_COINS_PER_DP;

  // Debit D Coins
  recordLedgerTransaction({
    uid,
    type: 'DEBIT',
    currency: 'D_COIN',
    amount: dCoinsToConvert,
    source: 'ADMIN_ADJUSTMENT',
    description: `Converted ${dCoinsToConvert} D Coins to ${dpToReceive} DP`,
  });

  // Credit DP
  const creditResult = recordLedgerTransaction({
    uid,
    type: 'CREDIT',
    currency: 'DP',
    amount: dpToReceive,
    source: 'ADMIN_ADJUSTMENT',
    description: `Credited ${dpToReceive} DP from ${dCoinsToConvert} D Coins conversion`,
  });

  return { convertedDP: dpToReceive, balance: creditResult.balance };
}

/**
 * Async version of convertDCoinsToDP ensuring user state is loaded from Firestore first
 */
export async function convertDCoinsToDPAsync(
  uid: string,
  dCoinsToConvert: number
): Promise<{ convertedDP: number; balance: UserWalletBalance }> {
  await loadUserLedgerFromFirestore(uid);
  return convertDCoinsToDP(uid, dCoinsToConvert);
}

/**
 * External withdrawal block rule - enforced at code and policy level
 */
export function assertWithdrawalAllowed(): never {
  throw new Error('EXTERNAL_WITHDRAWALS_DISABLED: Platform policy restricts earned balances for internal app subscriptions, watermark removal, and asset unlocks only.');
}

/**
 * Retrieves all ledger entries for a user (sync memory cache)
 */
export function getLedgerEntries(uid: string): LedgerEntry[] {
  return memoryLedgerStore.get(uid) || [];
}

/**
 * Retrieves all platform ledger entries across all users sorted by most recent
 */
export function getAllLedgerEntries(): LedgerEntry[] {
  const all: LedgerEntry[] = [];
  memoryLedgerStore.forEach((entries) => {
    all.push(...entries);
  });
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Retrieves current wallet balance for a user (sync memory cache)
 */
export function getUserWallet(uid: string): UserWalletBalance {
  const entries = memoryLedgerStore.get(uid) || [];
  return calculateWalletBalance(entries, uid);
}

/**
 * Retrieves current wallet balance for a user, hydrating from Firestore on serverless cold starts
 */
export async function getUserWalletAsync(uid: string): Promise<UserWalletBalance> {
  const entries = await loadUserLedgerFromFirestore(uid);
  return calculateWalletBalance(entries, uid);
}

// Seed realistic initial transactions for demo/dev accounts
function seedTransactions() {
  const seeds: Array<Parameters<typeof recordLedgerTransaction>[0] & { timestampDelta: number }> = [
    {
      uid: 'usr_vikram_streamer',
      type: 'CREDIT',
      currency: 'DP',
      amount: 149,
      source: 'SUBSCRIPTION_PURCHASE',
      description: 'Standard Monthly Plan purchase via UPI (₹149 credited)',
      timestampDelta: 1000 * 60 * 60 * 2, // 2h ago
    },
    {
      uid: 'usr_vikram_streamer',
      type: 'DEBIT',
      currency: 'DP',
      amount: 29,
      source: 'WATERMARK_REMOVAL',
      description: 'Watermark Removal 1080p Clip Export (Debit 29 DP)',
      timestampDelta: 1000 * 60 * 45, // 45m ago
    },
    {
      uid: 'usr_vikram_streamer',
      type: 'CREDIT',
      currency: 'D_COIN',
      amount: 200,
      source: 'TASK_REWARD',
      description: 'Twitter / X Thread engagement bounty verified (+200 D)',
      timestampDelta: 1000 * 60 * 15, // 15m ago
    },
    {
      uid: 'usr_aryan_streamer',
      type: 'CREDIT',
      currency: 'DP',
      amount: 449,
      source: 'SUBSCRIPTION_PURCHASE',
      description: 'Quarterly Streamer Plan purchase via Razorpay (₹449)',
      timestampDelta: 1000 * 60 * 60 * 5, // 5h ago
    },
    {
      uid: 'usr_aryan_streamer',
      type: 'DEBIT',
      currency: 'DP',
      amount: 15,
      source: 'ASSET_PURCHASE',
      description: 'Cyber Glitch Stream Intermission FX Asset Unlock',
      timestampDelta: 1000 * 60 * 60 * 1, // 1h ago
    },
    {
      uid: 'usr_priya_creator',
      type: 'CREDIT',
      currency: 'DP',
      amount: 999,
      source: 'SUBSCRIPTION_PURCHASE',
      description: 'Annual Pro Creator Plan purchase (₹999 credited)',
      timestampDelta: 1000 * 60 * 60 * 24, // 1 day ago
    },
    {
      uid: 'usr_arjun_editor',
      type: 'CREDIT',
      currency: 'DP',
      amount: 350,
      source: 'ADMIN_ADJUSTMENT',
      description: 'Podium Leaderboard Gold Bonus (Top #1 Editor of the Week)',
      timestampDelta: 1000 * 60 * 60 * 8, // 8h ago
    },
    {
      uid: 'usr_rohit_editor',
      type: 'CREDIT',
      currency: 'D_COIN',
      amount: 100,
      source: 'AD_REWARD',
      description: '24h Stream Pass Activated & Sponsored Partner Ad Viewed (+100 D)',
      timestampDelta: 1000 * 60 * 30, // 30m ago
    },
  ];

  seeds.forEach((s) => {
    const list = memoryLedgerStore.get(s.uid) || [];
    const entry: LedgerEntry = {
      id: `tx_${Date.now() - s.timestampDelta}_${crypto.randomBytes(4).toString('hex')}`,
      uid: s.uid,
      type: s.type,
      currency: s.currency,
      amount: s.amount,
      source: s.source,
      description: s.description,
      idempotencyKey: `seed_${s.uid}_${s.source}_${s.timestampDelta}`,
      timestamp: Date.now() - s.timestampDelta,
    };
    list.push(entry);
    memoryLedgerStore.set(s.uid, list);
  });
}

seedTransactions();
