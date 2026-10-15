import { NextRequest, NextResponse } from 'next/server';
import { editorsStore } from '@/lib/editorStore';
import { EditorProfile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const software = searchParams.get('software');
    const maxRate = searchParams.get('maxRate');

    let results = [...editorsStore];

    if (category) {
      results = results.filter((e) =>
        e.specialties.some((s) => s.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (software) {
      results = results.filter((e) =>
        e.editingSoftware.some((s) => s.toLowerCase().includes(software.toLowerCase()))
      );
    }

    if (maxRate) {
      const max = Number(maxRate);
      results = results.filter((e) => e.rateCard.shortFormPerVideoINR <= max);
    }

    return NextResponse.json({
      success: true,
      totalEditors: results.length,
      editors: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'FETCH_EDITORS_FAILED', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, displayName, bio, specialties, editingSoftware, portfolio, rateCard } = body;

    if (!uid || !displayName) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'uid and displayName are required' }, { status: 400 });
    }

    const existingIndex = editorsStore.findIndex((e) => e.uid === uid);

    const newProfile: EditorProfile = {
      uid,
      displayName,
      bio: bio || '',
      avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      specialties: specialties || ['YouTube Shorts', 'Montages'],
      editingSoftware: editingSoftware || ['Premiere Pro'],
      portfolio: portfolio || [],
      rateCard: rateCard || {
        shortFormPerVideoINR: 250,
        longFormPerMinuteINR: 100,
        hourlyRateINR: 400,
        minimumTurnaroundHours: 24,
      },
      ratingAverage: existingIndex >= 0 ? editorsStore[existingIndex].ratingAverage : 5.0,
      reviewCount: existingIndex >= 0 ? editorsStore[existingIndex].reviewCount : 0,
      reputationCredits: existingIndex >= 0 ? editorsStore[existingIndex].reputationCredits : 100,
      completedProjectsCount: existingIndex >= 0 ? editorsStore[existingIndex].completedProjectsCount : 0,
      isVerified: existingIndex >= 0 ? editorsStore[existingIndex].isVerified : false,
      isAvailableForHire: true,
      createdAt: existingIndex >= 0 ? editorsStore[existingIndex].createdAt : Date.now(),
    };

    if (existingIndex >= 0) {
      editorsStore[existingIndex] = newProfile;
    } else {
      editorsStore.push(newProfile);
    }

    return NextResponse.json({
      success: true,
      editor: newProfile,
      message: 'Editor profile published successfully! You are now visible to streamers on the showcase and AI Matchmaking bot.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'REGISTRATION_FAILED', details: error.message }, { status: 500 });
  }
}
