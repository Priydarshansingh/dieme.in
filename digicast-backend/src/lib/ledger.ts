import {
  CurrencyType,
  D_COINS_PER_DP,
  INR_PER_DP,
  LedgerEntry,
  LedgerSource,
  LedgerTransactionType,
  UserWalletBalance,
} from '@/types';
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
 * Appends a new transaction entry into the double-entry ledger with idempotency check
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
  return { entry: newEntry, balance: updatedBalance };
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
 * External withdrawal block rule - enforced at code and policy level
 */
export function assertWithdrawalAllowed(): never {
  throw new Error('EXTERNAL_WITHDRAWALS_DISABLED: Platform policy restricts earned balances for internal app subscriptions, watermark removal, and asset unlocks only.');
}

/**
 * Retrieves all ledger entries for a user
 */
export function getLedgerEntries(uid: string): LedgerEntry[] {
  return memoryLedgerStore.get(uid) || [];
}

/**
 * Retrieves current wallet balance for a user
 */
export function getUserWallet(uid: string): UserWalletBalance {
  const entries = memoryLedgerStore.get(uid) || [];
  return calculateWalletBalance(entries, uid);
}
