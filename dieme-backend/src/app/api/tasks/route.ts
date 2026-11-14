import { NextRequest, NextResponse } from 'next/server';
import { TaskItem, TaskSubmission } from '@/types';
import { recordLedgerTransaction } from '@/lib/ledger';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const initialTasks: TaskItem[] = [
  {
    id: 'task_client_acquisition',
    title: 'Find 1 Client for Website Development',
    description: 'Connect our web development team with a streamer, creator, or small business needing a website or portfolio.',
    instructions: [
      'Find a prospective client who agrees to a website development quote.',
      'Submit the client email, website requirements, or contract agreement screenshot as proof.',
      'Earn 50 DP (₹50) upon verification.',
    ],
    rewardCurrency: 'DP',
    rewardAmount: 50,
    category: 'CLIENT_ACQUISITION',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'task_share_social',
    title: 'Post a Live Stream Clipping Showcase on Twitter / YouTube',
    description: 'Record and post a short video showcasing how Digicast clips YouTube live moments instantly.',
    instructions: [
      'Post video/tweet with #Digicast #StreamClips and tag our handle.',
      'Submit the public link to your tweet or YouTube short.',
      'Earn 150 D Coins (15 DP / ₹15).',
    ],
    rewardCurrency: 'D_COIN',
    rewardAmount: 150,
    category: 'SOCIAL_GROWTH',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'task_refer_streamer',
    title: 'Refer an Active Livestreamer',
    description: 'Get an active YouTube streamer to connect their channel to Digicast using your referral code.',
    instructions: [
      'Share your referral link with the streamer.',
      'Once they conduct their first stream capture, submit their channel URL.',
      'Earn 100 DP (₹100).',
    ],
    rewardCurrency: 'DP',
    rewardAmount: 100,
    category: 'CLIENT_ACQUISITION',
    active: true,
    createdAt: Date.now(),
  },
];

// In-memory submissions store (acts as local cache and fallback)
const submissionsStore: TaskSubmission[] = [
  {
    id: 'sub_sample_1',
    taskId: 'task_client_acquisition',
    taskTitle: 'Find 1 Client for Website Development',
    uid: 'usr_creator_88',
    userEmail: 'vikram.streamer@gmail.com',
    rewardCurrency: 'DP',
    rewardAmount: 50,
    proofUrl: 'https://drive.google.com/file/d/sample-agreement',
    proofNotes: 'Client agreed to ₹15,000 portfolio site design.',
    status: 'IN_REVIEW',
    submittedAt: Date.now() - 3600000,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  let allSubmissions = [...submissionsStore];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('task_submissions').get();
      if (!snap.empty) {
        const subMap = new Map<string, TaskSubmission>();
        for (const s of submissionsStore) subMap.set(s.id, s);
        snap.forEach((doc) => {
          subMap.set(doc.id, doc.data() as TaskSubmission);
        });
        allSubmissions = Array.from(subMap.values());
      }
    } catch (dbErr) {
      console.warn('[tasks/GET] Failed to fetch submissions from Firestore, using memory fallback:', dbErr);
    }
  }

  if (uid) {
    const userSubmissions = allSubmissions.filter((s) => s.uid === uid);
    return NextResponse.json({
      tasks: initialTasks,
      userSubmissions,
    });
  }

  return NextResponse.json({
    tasks: initialTasks,
    totalAvailableTasks: initialTasks.length,
    submissions: allSubmissions,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, uid, userEmail, proofUrl, proofNotes } = body;

    if (!taskId || !uid || !proofUrl) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'taskId, uid, and proofUrl are required' }, { status: 400 });
    }

    const task = initialTasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 });
    }

    const submission: TaskSubmission = {
      id: `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      taskId,
      taskTitle: task.title,
      uid,
      userEmail: userEmail || 'user@digicast.app',
      rewardCurrency: task.rewardCurrency,
      rewardAmount: task.rewardAmount,
      proofUrl,
      proofNotes: proofNotes || '',
      status: 'IN_REVIEW',
      submittedAt: Date.now(),
    };

    submissionsStore.push(submission);

    if (adminDb) {
      try {
        await adminDb.collection('task_submissions').doc(submission.id).set(submission);
      } catch (dbErr) {
        console.warn('[tasks/POST] Failed to persist submission to Firestore:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      submission,
      message: 'Task proof submitted! Our admin team will inspect your proof in the God Panel and credit your wallet.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'SUBMISSION_FAILED', details: error.message }, { status: 500 });
  }
}

// Review route for God Panel
export async function PATCH(req: NextRequest) {
  try {
    // Check admin auth
    const token = req.cookies.get('godpanel_token')?.value;
    const adminKey = req.headers.get('x-admin-key');
    const isAuth = (token && verifyGodSessionToken(token)) || (adminKey && verifyAdminKey(adminKey));

    if (!isAuth) {
      return NextResponse.json({ error: 'UNAUTHORIZED_ADMIN' }, { status: 401 });
    }

    const { submissionId, decision, rejectionReason, reviewedBy } = await req.json();

    let submission = submissionsStore.find((s) => s.id === submissionId);
    let firestoreDocRef: any = null;

    if (adminDb) {
      try {
        const docRef = adminDb.collection('task_submissions').doc(submissionId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          firestoreDocRef = docRef;
          submission = { ...(submission || {}), ...(docSnap.data() as TaskSubmission) };
        }
      } catch (dbErr) {
        console.warn('[tasks/PATCH] Could not query Firestore for submission:', dbErr);
      }
    }

    if (!submission) {
      return NextResponse.json({ error: 'SUBMISSION_NOT_FOUND' }, { status: 404 });
    }

    if (decision === 'APPROVE') {
      // Guard against duplicate approvals
      if (submission.status === 'APPROVED') {
        return NextResponse.json({
          success: true,
          submission,
          message: 'Task submission is already approved.',
        });
      }

      // SM-7: Atomic ledger credit with idempotency guarantee
      const idempotencyKey = `task_${submission.id}_approve`;
      let ledgerResult: ReturnType<typeof recordLedgerTransaction>;

      try {
        ledgerResult = recordLedgerTransaction({
          uid: submission.uid,
          type: 'CREDIT',
          currency: submission.rewardCurrency,
          amount: submission.rewardAmount,
          source: 'TASK_REWARD',
          description: `Earned reward for completing task: ${submission.taskTitle}`,
          referenceId: submission.id,
          idempotencyKey,
        });
      } catch (ledgerErr: any) {
        console.error('[tasks/PATCH] Atomic ledger credit failed:', ledgerErr);
        return NextResponse.json(
          {
            error: 'LEDGER_CREDIT_FAILED',
            message: `Failed to credit wallet: ${ledgerErr.message}. Submission remains in review.`,
          },
          { status: 500 }
        );
      }

      // State is safely transitioned only after credit succeeds
      submission.status = 'APPROVED';
      submission.reviewedAt = Date.now();
      submission.reviewedBy = reviewedBy || 'admin';

      // Keep in-memory cache in sync
      const memIndex = submissionsStore.findIndex((s) => s.id === submissionId);
      if (memIndex >= 0) {
        submissionsStore[memIndex] = submission;
      } else {
        submissionsStore.push(submission);
      }

      // Atomically persist to Firestore if available
      if (adminDb) {
        try {
          const batch = adminDb.batch();
          const subRef = firestoreDocRef || adminDb.collection('task_submissions').doc(submission.id);
          batch.set(subRef, submission, { merge: true });

          const ledgerRef = adminDb.collection('ledger').doc(ledgerResult.entry.id);
          batch.set(
            ledgerRef,
            {
              ...ledgerResult.entry,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );

          await batch.commit();
        } catch (batchErr) {
          console.error('[tasks/PATCH] Firestore batch commit error (in-memory ledger succeeded):', batchErr);
        }
      }

      return NextResponse.json({
        success: true,
        submission,
        wallet: ledgerResult.balance,
        message: `Task approved and ${submission.rewardAmount} ${submission.rewardCurrency} credited to ${submission.uid}.`,
      });
    } else {
      submission.status = 'REJECTED';
      submission.reviewedAt = Date.now();
      submission.reviewedBy = reviewedBy || 'admin';
      submission.rejectionReason = rejectionReason || 'Proof does not satisfy instructions';

      const memIndex = submissionsStore.findIndex((s) => s.id === submissionId);
      if (memIndex >= 0) {
        submissionsStore[memIndex] = submission;
      } else {
        submissionsStore.push(submission);
      }

      if (adminDb) {
        try {
          const subRef = firestoreDocRef || adminDb.collection('task_submissions').doc(submission.id);
          await subRef.set(submission, { merge: true });
        } catch (dbErr) {
          console.error('[tasks/PATCH] Firestore reject update error:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        submission,
        message: 'Task submission rejected.',
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'REVIEW_FAILED', details: error.message }, { status: 500 });
  }
}
