import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { getAllLedgerEntries, recordLedgerTransaction, getUserWallet } from '@/lib/ledger';
import { updatePlatformUser, getPlatformUser } from '@/lib/userStore';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const token = req.cookies.get('godpanel_token')?.value;
  const adminKey = req.headers.get('x-admin-key');
  return (token && verifyGodSessionToken(token)) || (adminKey && verifyAdminKey(adminKey));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED_GODPANEL' }, { status: 401 });
  }

  const memoryEntries = getAllLedgerEntries();
  let firestoreEntries: any[] = [];

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('ledger')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      firestoreEntries = snap.docs.map((d) => d.data());
    } catch (e: any) {
      console.warn('[godpanel/ledger GET] Firestore fetch fallback to memory:', e.message);
    }
  }

  // Merge unique entries by ID
  const entryMap = new Map<string, any>();
  memoryEntries.forEach((e) => entryMap.set(e.id, e));
  firestoreEntries.forEach((e) => entryMap.set(e.id, e));

  const entries = Array.from(entryMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const totalCredits = entries
    .filter((e) => e.type === 'CREDIT')
    .reduce((acc, e) => acc + (e.currency === 'DP' ? e.amount : e.amount / 10), 0);
  const totalDebits = entries
    .filter((e) => e.type === 'DEBIT')
    .reduce((acc, e) => acc + (e.currency === 'DP' ? e.amount : e.amount / 10), 0);

  return NextResponse.json({
    entries,
    summary: {
      totalTransactions: entries.length,
      totalMoneyInflowINR: Math.round(totalCredits),
      totalMoneyOutflowINR: Math.round(totalDebits),
      netPlatformCirculationINR: Math.round(totalCredits - totalDebits),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED_GODPANEL' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { uid, type, currency, amount, description, source } = body;

    if (!uid || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'INVALID_PARAMETERS' }, { status: 400 });
    }

    const numAmount = Number(amount);
    const txType = type === 'DEBIT' ? 'DEBIT' : 'CREDIT';
    const txCurrency = currency === 'D_COIN' ? 'D_COIN' : 'DP';

    const result = recordLedgerTransaction({
      uid,
      type: txType,
      currency: txCurrency,
      amount: numAmount,
      source: source || 'ADMIN_ADJUSTMENT',
      description: description || 'SuperAdmin balance adjustment',
    });

    // Update in-memory userStore
    updatePlatformUser(uid, {
      dCoinsBalance: result.balance.dCoinsBalance,
      dpBalance: result.balance.dpBalance,
    });

    // Persist permanently to Firestore
    if (adminDb) {
      try {
        const nowIso = new Date().toISOString();
        const txDoc = {
          ...result.entry,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await Promise.all([
          adminDb.collection('ledger').doc(result.entry.id).set(txDoc),
          adminDb.collection('users').doc(uid).set(
            {
              dCoinsBalance: result.balance.dCoinsBalance,
              dpBalance: result.balance.dpBalance,
              updatedAt: nowIso,
            },
            { merge: true }
          ),
        ]);
      } catch (err: any) {
        console.warn('[godpanel/ledger POST] Firestore write warning:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: result.entry,
      newBalance: result.balance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'TRANSACTION_FAILED' }, { status: 400 });
  }
}
