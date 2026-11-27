import { NextResponse } from 'next/server';
import { isGoogleDriveConfigured } from '@/lib/google-drive';

export async function GET() {
  const driveReady = isGoogleDriveConfigured();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY);
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json({
    status: 'ok',
    engine: 'Dieme Cloud AI Studio',
    version: '1.2.26',
    providers: [
      'Pollinations FLUX/SDXL (Free Cloud Tier)',
      ...(hasGemini ? ['Google Gemini 1.5 & Imagen 3'] : []),
      ...(hasOpenAi ? ['OpenAI GPT-4o-mini'] : []),
    ],
    googleDriveSync: driveReady ? 'connected' : 'ready_for_credentials',
    timestamp: Date.now(),
  });
}
