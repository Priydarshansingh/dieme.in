import {
  buildEnhancedImagePrompt,
  THUMBNAIL_SYSTEM_INSTRUCTIONS,
  ThumbnailGenerationRequest,
} from './thumbnail-instructions';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  provider: string;
  latencyMs: number;
  error?: string;
}

export interface ChatGenerationResult {
  success: boolean;
  reply: string;
  provider: string;
  latencyMs: number;
  error?: string;
}

/**
 * AI Provider Router:
 * Rotates, shuffles, and provides automated fallback across free and configured AI engines.
 */
export class AIProviderRouter {
  /**
   * Generates a 16:9 YouTube thumbnail image using available providers.
   * Shuffles seeds and models with automatic fallback.
   */
  static async generateThumbnail(req: ThumbnailGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const enhancedPrompt = buildEnhancedImagePrompt(req);
    console.log(`[AIProviderRouter] Dispatching thumbnail generation. Prompt: "${req.prompt.slice(0, 60)}..."`);

    // Provider 1: Pollinations AI (FLUX / SDXL free inference)
    try {
      const result = await this.generateViaPollinations(enhancedPrompt);
      if (result.success) {
        return {
          ...result,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.warn('[AIProviderRouter] Pollinations attempt failed, trying fallback provider:', e);
    }

    // Provider 2: Google Gemini / Imagen (if GEMINI_API_KEY configured)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (geminiKey) {
      try {
        const result = await this.generateViaGeminiImagen(enhancedPrompt, geminiKey);
        if (result.success) {
          return {
            ...result,
            latencyMs: Date.now() - startTime,
          };
        }
      } catch (e) {
        console.warn('[AIProviderRouter] Gemini Imagen attempt failed:', e);
      }
    }

    // Provider 3: Fallback secondary Pollinations model with alternative seed & turbo model
    try {
      const fallbackResult = await this.generateViaPollinations(enhancedPrompt, 'turbo');
      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.error('[AIProviderRouter] Secondary Pollinations attempt failed:', e);
    }

    return {
      success: false,
      provider: 'none',
      latencyMs: Date.now() - startTime,
      error: 'All thumbnail generation providers were unavailable. Please retry in a few moments.',
    };
  }

  /**
   * Pollinations.ai free high-resolution 16:9 generator.
   */
  private static async generateViaPollinations(
    prompt: string,
    model: 'flux' | 'flux-realism' | 'turbo' = 'flux'
  ): Promise<ImageGenerationResult> {
    const seed = Math.floor(Math.random() * 10000000);
    const encodedPrompt = encodeURIComponent(prompt);
    // Explicit 16:9 aspect ratio for YouTube thumbnails
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=${model}&seed=${seed}&nologo=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DiemeStudio/1.2 (Android; High-CTR Thumbnail Engine)',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Pollinations returned HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 5000) {
        throw new Error('Returned image payload too small to be valid');
      }

      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      return {
        success: true,
        imageUrl: url,
        imageBase64: base64Data,
        provider: `Pollinations (${model})`,
        latencyMs: 0,
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        provider: 'Pollinations',
        latencyMs: 0,
        error: message,
      };
    }
  }

  /**
   * Google Gemini Imagen 3 generation (optional configured key).
   */
  private static async generateViaGeminiImagen(prompt: string, apiKey: string): Promise<ImageGenerationResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/jpeg',
          personGeneration: 'ALLOW_ADULT',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Imagen API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      throw new Error('Gemini did not return image bytes');
    }

    return {
      success: true,
      imageBase64: `data:image/jpeg;base64,${b64}`,
      provider: 'Google Gemini Imagen 3',
      latencyMs: 0,
    };
  }

  /**
   * Answers thumbnail questions or chats with the creator.
   */
  static async generateChat(prompt: string, context?: { baseImageUrl?: string; userTier?: string }): Promise<ChatGenerationResult> {
    const startTime = Date.now();

    // 1. Try Gemini API for chat if available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${THUMBNAIL_SYSTEM_INSTRUCTIONS}\n\nUser Question: ${prompt}` }
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              success: true,
              reply: text.trim(),
              provider: 'Google Gemini 1.5 Flash',
              latencyMs: Date.now() - startTime,
            };
          }
        }
      } catch (e) {
        console.warn('[AIProviderRouter] Gemini chat attempt failed:', e);
      }
    }

    // 2. Try OpenAI API if available
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: THUMBNAIL_SYSTEM_INSTRUCTIONS },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return {
              success: true,
              reply: text.trim(),
              provider: 'OpenAI GPT-4o-mini',
              latencyMs: Date.now() - startTime,
            };
          }
        }
      } catch (e) {
        console.warn('[AIProviderRouter] OpenAI chat attempt failed:', e);
      }
    }

    // 3. Fallback Built-In Strategic Thumbnail Assistant
    return {
      success: true,
      reply: this.generateStrategicAdvice(prompt),
      provider: 'Dieme Thumbnail Engine (Built-in)',
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Generates actionable YouTube thumbnail advice when no external LLM key is configured.
   */
  private static generateStrategicAdvice(prompt: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('color') || p.includes('background')) {
      return 'For high YouTube CTR, boost background contrast by 20% and use rim lighting (warm amber or cyan) to pop the foreground subject. Avoid muddy grays or overly busy patterns.';
    }

    if (p.includes('text') || p.includes('title')) {
      return 'Keep thumbnail text under 4 words. Use heavy sans-serif fonts (Impact, Montserrat ExtraBold, Obvi) with high-contrast outlines or drop shadows. Test legibility at 10% zoom size.';
    }

    if (p.includes('face') || p.includes('character') || p.includes('expression')) {
      return 'Faces with intense curiosity, shock, or determination drive the highest clickthrough rates. Ensure eye contact is either directed right at the viewer or pointing directly at the secondary visual hook.';
    }

    return 'Thumbnails that win YouTube feeds focus on one core tension or curiosity gap. Use vibrant 16:9 framing, clean subject isolation, and saturated highlights to stand out against dark and light YouTube themes.';
  }
}
