/**
 * YouTube Thumbnail AI Master Directives and Optimization Guidelines.
 */

export const THUMBNAIL_SYSTEM_INSTRUCTIONS = `You are Dieme Thumbnail AI, the dedicated YouTube visual strategist and thumbnail generation intelligence.
Your role is to optimize, advise on, or generate high-clickthrough-rate (CTR) 16:9 YouTube video thumbnails.

Core Directives for YouTube Thumbnails:
1. Aspect Ratio: Strict 16:9 (1280x720 or 1920x1080).
2. Focal Hierarchy: One dominant visual focal point (human subject with expressive reaction, bold hero item, or compelling juxtaposition).
3. Foreground Subject: Crisp outlines, high dynamic range lighting, natural skin tones, depth of field blurring the background.
4. Background & Environment: Rich color contrast, atmospheric lighting, avoiding visual noise or cluttered elements.
5. Typography & Text: High-contrast, bold, readable at mobile preview sizes (minimum 36pt visual equivalent). Never generate illegible or garbled text.
6. Preservation Directives: When modifying an existing thumbnail, keep branding, logos, and unchanged characters identical unless explicitly instructed to revise.
7. Clickability over Generic Art: Optimize for real YouTube viewer psychology (curiosity gap, emotional punch, clarity at 0.5-second glance).`;

export interface ThumbnailGenerationRequest {
  prompt: string;
  baseImage?: string;
  referenceImages?: string[];
  pins?: Array<{ id: number; xPercent: number; yPercent: number; label?: string }>;
  userTier?: 'free' | 'pro' | 'studio';
  sessionId?: string;
  userId?: string;
}

/**
 * Synthesizes an optimized prompt for image generation engines (Pollinations, FLUX, SDXL, Imagen).
 */
export function buildEnhancedImagePrompt(req: ThumbnailGenerationRequest): string {
  const parts: string[] = [];

  // Core subject and task
  parts.push(`A masterclass 16:9 YouTube thumbnail: ${req.prompt.trim()}`);

  // Canvas pin targeted locations
  if (req.pins && req.pins.length > 0) {
    const pinDescriptions = req.pins.map(p => `pin at (${p.xPercent.toFixed(1)}%, ${p.yPercent.toFixed(1)}%)`).join(', ');
    parts.push(`targeted visual focus placed precisely at ${pinDescriptions}`);
  }

  // Visual styling enhancers
  parts.push(
    'photorealistic, 8k resolution, cinematic studio rim lighting, vibrant rich saturation, high dynamic range, tack sharp focus, clean background separation, depth of field, professional YouTube thumbnail composition'
  );

  return parts.join(', ');
}

/**
 * Determines whether a user query is asking for an image generation or conversational advice.
 */
export function isImageGenerationIntent(prompt: string, hasPinsOrImages: boolean): boolean {
  if (hasPinsOrImages) return true;

  const p = prompt.toLowerCase();
  const generationKeywords = [
    'generate', 'create', 'make', 'draw', 'inpaint', 'change', 'replace',
    'add', 'remove', 'thumbnail', 'picture', 'image', 'background', 'character',
    'face', 'swap', 'edit', 'revise', 'design', 'put', 'render'
  ];

  return generationKeywords.some(keyword => p.includes(keyword));
}
