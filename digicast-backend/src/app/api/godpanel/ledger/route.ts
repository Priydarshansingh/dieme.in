import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { getAllLedgerEntries, recordLedgerTransaction, getUserWallet } from '@/lib/ledger';
import { updatePlatformUser, getPlatformUser } from '@/lib/userStore';

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

  const entries = getAllLedgerEntries();
  const totalCredits = entries.filter((e) => e.type === 'CREDIT').reduce((acc, e) => acc + (e.currency === 'DP' ? e.amount : e.amount / 10), 0);
  const totalDebits = entries.filter((e) => e.type === 'DEBIT').reduce((acc, e) => acc + (e.currency === 'DP' ? e.amount : e.amount / 10), 0);

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

    if (!uid || !amount || amount <= 0) {
      return NextResponse.json({ error: 'INVALID_PARAMETERS' }, { status: 400 });
    }

    const result = recordLedgerTransaction({
      uid,
      type: type || 'CREDIT',
      currency: currency || 'DP',
      amount: Number(amount),
      source: source || 'ADMIN_ADJUSTMENT',
      description: description || 'SuperAdmin balance adjustment',
    });

    // Update userStore if user exists
    const user = getPlatformUser(uid);
    if (user) {
      updatePlatformUser(uid, {
        dCoinsBalance: result.balance.dCoinsBalance,
        dpBalance: result.balance.dpBalance,
      });
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
