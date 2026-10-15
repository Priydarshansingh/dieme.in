import { NextResponse } from 'next/server';
import { editorsStore } from '@/lib/editorStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Score formula: (Rating * 20) + (ReviewCount * 2) + ReputationCredits
  const rankedEditors = [...editorsStore].map((editor) => {
    const compositeScore = Math.round(
      editor.ratingAverage * 20 + editor.reviewCount * 2 + editor.reputationCredits
    );
    return {
      ...editor,
      compositeScore,
    };
  });

  // Sort descending by composite score
  rankedEditors.sort((a, b) => b.compositeScore - a.compositeScore);

  // Add rank numbers (#1, #2, etc.)
  const leaderboard = rankedEditors.map((editor, index) => ({
    rank: index + 1,
    ...editor,
  }));

  return NextResponse.json({
    success: true,
    totalRanked: leaderboard.length,
    leaderboard,
    scoringFormula: 'Score = (StarRating * 20) + (Reviews * 2) + ReputationCredits',
  });
}
