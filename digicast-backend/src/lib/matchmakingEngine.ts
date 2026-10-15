import { editorsStore } from '@/lib/editorStore';
import { AIMatchmakingRequest, AIMatchmakingResponse, MatchedEditorCard } from '@/types';

export function matchEditorsForStreamer(request: AIMatchmakingRequest): AIMatchmakingResponse {
  const promptLower = request.prompt.toLowerCase();

  // Extract preferences from prompt or explicit filters
  const wantsGaming = promptLower.includes('game') || promptLower.includes('valorant') || promptLower.includes('montage') || promptLower.includes('fps') || promptLower.includes('gta');
  const wantsShorts = promptLower.includes('short') || promptLower.includes('reel') || promptLower.includes('tiktok') || promptLower.includes('fast') || promptLower.includes('clip');
  const wantsStory = promptLower.includes('irl') || promptLower.includes('story') || promptLower.includes('vlog') || promptLower.includes('documentary') || promptLower.includes('podcast');
  const wantsSpeed = promptLower.includes('quick') || promptLower.includes('fast') || promptLower.includes('urgent') || promptLower.includes('12h') || promptLower.includes('same day');

  const scored = editorsStore.map((editor) => {
    let score = 70; // baseline match

    // Specialty matching
    if (wantsGaming && editor.specialties.some((s) => s.toLowerCase().includes('gaming') || s.toLowerCase().includes('montage'))) {
      score += 15;
    }
    if (wantsShorts && editor.specialties.some((s) => s.toLowerCase().includes('short') || s.toLowerCase().includes('clip'))) {
      score += 12;
    }
    if (wantsStory && editor.specialties.some((s) => s.toLowerCase().includes('irl') || s.toLowerCase().includes('story') || s.toLowerCase().includes('vlog'))) {
      score += 18;
    }
    if (wantsSpeed && editor.rateCard.minimumTurnaroundHours <= 24) {
      score += 10;
    }

    // Budget matching
    if (request.maxBudgetINR && editor.rateCard.shortFormPerVideoINR <= request.maxBudgetINR) {
      score += 8;
    }

    // Star rating factor
    score += Math.round(editor.ratingAverage * 2);

    const boundedScore = Math.min(99, Math.max(65, score));

    let reason = 'Solid match based on general editing versatility and verified delivery track record.';
    if (wantsGaming && editor.specialties.includes('Gaming Montages')) {
      reason = 'Top-tier specialist in beat-synced gaming clutches with high retention pacing.';
    } else if (wantsStory && editor.specialties.includes('IRL Streams')) {
      reason = 'Exceptional narrative flow and cinematic color grading tailored for long-form stream highlights.';
    } else if (wantsSpeed && editor.rateCard.minimumTurnaroundHours <= 12) {
      reason = 'Lightning turnaround: delivers finished clips in under 12 hours from your live stream end.';
    }

    const card: MatchedEditorCard = {
      editorUid: editor.uid,
      displayName: editor.displayName,
      rating: editor.ratingAverage,
      matchScore: boundedScore,
      matchReason: reason,
      sampleVideoUrl: editor.portfolio[0]?.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rateINR: editor.rateCard.shortFormPerVideoINR,
      turnaroundHours: editor.rateCard.minimumTurnaroundHours,
      isVerified: editor.isVerified,
    };

    return card;
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Take top 4 to 5 matches
  const topMatches = scored.slice(0, 5);

  return {
    query: request.prompt,
    matchedEditors: topMatches,
    recommendationSummary: `Found ${topMatches.length} highly matched editors with proven reels matching your style and turnaround criteria.`,
    totalCandidatesEvaluated: editorsStore.length,
  };
}
