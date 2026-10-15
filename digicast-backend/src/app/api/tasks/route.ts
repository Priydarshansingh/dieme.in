import { NextRequest, NextResponse } from 'next/server';
import { TaskItem, TaskSubmission } from '@/types';
import { recordLedgerTransaction } from '@/lib/ledger';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
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

// In-memory submissions store
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

  if (uid) {
    const userSubmissions = submissionsStore.filter((s) => s.uid === uid);
    return NextResponse.json({
      tasks: initialTasks,
      userSubmissions,
    });
  }

  return NextResponse.json({
    tasks: initialTasks,
    totalAvailableTasks: initialTasks.length,
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

    const submission = submissionsStore.find((s) => s.id === submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'SUBMISSION_NOT_FOUND' }, { status: 404 });
    }

    if (decision === 'APPROVE') {
      submission.status = 'APPROVED';
      submission.reviewedAt = Date.now();
      submission.reviewedBy = reviewedBy || 'admin';

      // Automatically credit user's wallet
      const ledgerResult = recordLedgerTransaction({
        uid: submission.uid,
        type: 'CREDIT',
        currency: submission.rewardCurrency,
        amount: submission.rewardAmount,
        source: 'TASK_REWARD',
        description: `Earned reward for completing task: ${submission.taskTitle}`,
        referenceId: submission.id,
      });

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
