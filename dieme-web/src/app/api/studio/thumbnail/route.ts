import { NextRequest, NextResponse } from 'next/server';
import { AIProviderRouter } from '@/lib/ai-provider-router';
import { isImageGenerationIntent } from '@/lib/thumbnail-instructions';
import {
  saveChatSessionToDrive,
  saveThumbnailImageToDrive,
} from '@/lib/google-drive';

export const maxDuration = 60; // Allow sufficient time for high-res generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || '').trim();
    const baseImage = body.baseImageUrl || body.baseImage || '';
    const referenceImages = body.referenceImageUrls || body.referenceImages || [];
    const sessionId = body.sessionId || `session_${Date.now()}`;
    const userId = body.userId || body.deviceId || 'anonymous';
    const userTier = body.userTier || 'free';

    let pins: Array<{ id: number; xPercent: number; yPercent: number }> = [];
    if (Array.isArray(body.pins)) {
      pins = body.pins;
    } else if (typeof body.maskPointsJson === 'string') {
      try {
        const parsed = JSON.parse(body.maskPointsJson);
        pins = parsed.pins || [];
      } catch {
        // Fallback or unparsed mask points
      }
    }

    if (!prompt && !baseImage) {
      return NextResponse.json(
        { status: 'error', message: 'Either a prompt or base image is required.' },
        { status: 400 }
      );
    }

    const hasImagesOrPins = Boolean(baseImage || referenceImages.length > 0 || pins.length > 0);
    const wantsImage = isImageGenerationIntent(prompt, hasImagesOrPins);

    if (wantsImage) {
      // 1. Generate 16:9 Thumbnail Image
      const imageResult = await AIProviderRouter.generateThumbnail({
        prompt: prompt || 'High-CTR YouTube video thumbnail',
        baseImage,
        referenceImages,
        pins,
        userTier,
        sessionId,
        userId,
      });

      if (!imageResult.success) {
        return NextResponse.json(
          {
            status: 'error',
            message: imageResult.error || 'Failed to generate thumbnail image.',
            provider: imageResult.provider,
          },
          { status: 502 }
        );
      }

      // Asynchronously upload to Google Drive if configured
      if (imageResult.imageBase64) {
        saveThumbnailImageToDrive({
          imageBufferOrBase64: imageResult.imageBase64,
          prompt,
          sessionId,
          userId,
        }).catch((err) => {
          console.warn('[StudioApi] Google Drive thumbnail save error:', err);
        });
      }

      // Record chat log to Google Drive
      saveChatSessionToDrive({
        sessionId,
        userId,
        prompt,
        response: `[Generated 16:9 Thumbnail via ${imageResult.provider}]`,
        model: imageResult.provider,
        metadata: { pinsCount: pins.length, userTier, type: 'image_generation' },
      }).catch((err) => {
        console.warn('[StudioApi] Google Drive chat save error:', err);
      });

      return NextResponse.json({
        status: 'success',
        type: 'image',
        resultUrl: imageResult.imageUrl || imageResult.imageBase64,
        resultBase64: imageResult.imageBase64,
        provider: imageResult.provider,
        latencyMs: imageResult.latencyMs,
        usage: {
          tier: userTier,
          remaining: userTier === 'free' ? 4 : 9999,
        },
      });
    } else {
      // 2. Creator Chat & Strategic Advice
      const chatResult = await AIProviderRouter.generateChat(prompt, {
        baseImageUrl: baseImage,
        userTier,
      });

      // Record chat transcript to Google Drive
      saveChatSessionToDrive({
        sessionId,
        userId,
        prompt,
        response: chatResult.reply,
        model: chatResult.provider,
        metadata: { userTier, type: 'creator_advice' },
      }).catch((err) => {
        console.warn('[StudioApi] Google Drive chat save error:', err);
      });

      return NextResponse.json({
        status: 'success',
        type: 'chat',
        reply: chatResult.reply,
        provider: chatResult.provider,
        latencyMs: chatResult.latencyMs,
        usage: {
          tier: userTier,
          remaining: userTier === 'free' ? 4 : 9999,
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[StudioApi] Unexpected error:', err);
    return NextResponse.json(
      { status: 'error', message: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
