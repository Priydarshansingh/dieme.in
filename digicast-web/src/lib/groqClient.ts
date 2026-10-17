// src/lib/groqClient.ts
// Direct Groq Cloud API integration for Telegram AI Support Agent

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UserContext {
  email?: string;
  userId?: string;
  workspaceName?: string;
  planName?: string;
  isTrialActive?: boolean;
  daysRemaining?: number;
  dCoinsBalance?: number;
  dpBalance?: number;
  youtubeChannel?: string;
}

interface TrainingItem {
  id?: string;
  questionOrTopic: string;
  answerOrDirective: string;
  category?: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function askGroqAI(params: {
  userPrompt: string;
  conversationHistory?: Array<{ sender: 'user' | 'bot' | 'admin'; text: string }>;
  userContext?: UserContext | null;
  knowledgeBase?: TrainingItem[];
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  let model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

  if (!apiKey) {
    console.warn('[groqClient] GROQ_API_KEY not configured.');
    return "I am currently undergoing scheduled maintenance. Please visit https://digicast-web.vercel.app or reach out to our team at @livehellboy for assistance!";
  }

  // 1. Build knowledge base string
  let kbSection = '';
  if (params.knowledgeBase && params.knowledgeBase.length > 0) {
    kbSection = `
=== OFFICIAL DIGICAST KNOWLEDGE BASE & TRAINED Q&A ===
${params.knowledgeBase
  .map((item, idx) => `[Rule ${idx + 1}] Topic: ${item.questionOrTopic}\nDirective / Answer: ${item.answerOrDirective}`)
  .join('\n\n')}
`;
  }

  // 2. Build user status context string
  let userSection = 'User is currently a Guest / Not logged into Digicast.';
  if (params.userContext?.email) {
    userSection = `
=== LOGGED IN CREATOR ACCOUNT DETAILS ===
• Email: ${params.userContext.email}
• User ID: ${params.userContext.userId || 'N/A'}
• Workspace: ${params.userContext.workspaceName || 'Personal'}
• Active Plan: ${params.userContext.planName || 'Free Trial'}
• Trial Status: ${params.userContext.isTrialActive ? 'Active (14-Day Free Period)' : 'Expired / Standard'}
• Days Remaining: ${params.userContext.daysRemaining ?? 'N/A'}
• Creator Wallet: ${params.userContext.dCoinsBalance ?? 0} D-Coins (${params.userContext.dpBalance ?? 0} DP Diamonds)
• Connected YouTube: ${params.userContext.youtubeChannel || 'None connected'}
`;
  }

  // 3. Compose Master System Directive
  const systemPrompt = `
You are the Official AI Support Assistant for **Digicast** (https://digicast-web.vercel.app), the real-time YouTube live stream automation and AI clip production suite for creators and video editors.

KEY PLATFORM FACTS:
1. **Free Usage & 24h Unlock Gate**:
   - Every creator gets 14 days of free usage upon signing up.
   - After 14 days, non-premium users unlock 24-hour access by:
     (a) Watching 1 AdMob rewarded video ad in the Android app (also earns 50 D-Coins).
     (b) Paying 50 D-Coins from their Creator Wallet.
     (c) Purchasing a VIP or Studio pass via UPI QR code.
2. **Currency System**:
   - 1 DP Diamond = ₹1.00 INR.
   - 10 D-Coins = 1 DP Diamond (50 D-Coins = ₹5.00 INR = 24-hour studio pass).
   - Intro 7-Day Pass: ₹29 (29 DP / 290 D-Coins).
   - Monthly Pass: ₹149 (149 DP / 1,490 D-Coins).
   - Quarter Pass: ₹499 (499 DP / 4,990 D-Coins).
   - Annual Pass: ₹999 (999 DP / 9,990 D-Coins).
3. **UPI Payment**:
   - UPI ID: \`priydarshankishnawat@axl\`
   - Users can send their 12-digit UTR or payment screenshot directly in this Telegram chat or inside the Android app to unlock their pass.
4. **Live Chat & Clipping**:
   - Viewers type \`!clip\` or \`!highlight\` in the YouTube stream chat to automatically bookmark video clips for editors.
5. **Account Linking**:
   - If the user has not shared their email yet and asks an account-specific question (subscription, wallet, streams), politely ask them to send their registered Digicast email address.

${userSection}
${kbSection}

RESPONSE GUIDELINES:
- Be friendly, concise, and helpful.
- Support English, Hindi, and Hinglish naturally depending on how the user talks.
- Use Telegram HTML formatting (<b>bold</b>, <code>code</code>, <i>italic</i>). Do NOT use Markdown asterisks like **bold** because this bot outputs in HTML mode.
- Keep answers under 150-200 words so they read quickly on mobile Telegram.
- If the user reports an issue that requires human intervention, reassure them and let them know the admin has been notified.
`.trim();

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // 4. Append conversation history if available
  if (params.conversationHistory && params.conversationHistory.length > 0) {
    for (const h of params.conversationHistory.slice(-6)) {
      messages.push({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      });
    }
  }

  // 5. Append current user prompt
  messages.push({
    role: 'user',
    content: params.userPrompt,
  });

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      if (res.status === 404 && model !== 'qwen/qwen3.8-27b') {
        console.warn(`[groqClient] Model ${model} not available on this tier, falling back to qwen/qwen3.8-27b`);
        const fallbackRes = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages,
            temperature: 0.5,
            max_tokens: 600,
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return fallbackData.choices?.[0]?.message?.content?.trim() || "How else can I assist you with Digicast?";
        }
      }

      const errText = await res.text();
      console.error('[groqClient] API Error:', res.status, errText);
      return "I'm having a brief issue retrieving that information right now. Please type <code>/help</code> or check your dashboard at https://digicast-web.vercel.app";
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    return reply || "How else can I assist you with your Digicast account?";
  } catch (err: any) {
    console.error('[groqClient] Network or inference failure:', err);
    return "I had trouble connecting to the support server. Please visit https://digicast-web.vercel.app or type <code>/help</code> for available commands!";
  }
}
