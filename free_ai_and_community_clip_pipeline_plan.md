# Implementation Plan: Free-Tier AI & Community Highlight Pipeline for Digicast

## 1. Executive Summary & Objective
This plan outlines the architecture and execution steps to deliver real, automated live stream clip detection and community-driven highlight capture for **normal creators at 100% free cloud cost (₹0 / $0)**.

By leveraging:
1. **Google Gemini 1.5 Flash Free Tier** (1,500 free daily API calls via Google AI Studio) for viral scoring (0–100), topic tagging, and Short title generation.
2. **Chat Spike Velocity Algorithm** (running serverless on Vercel) to automatically trigger markers when chat explodes.
3. **Nightbot / StreamElements Webhooks (`!clip`)** to allow moderators and viewers to drop timestamped markers with zero YouTube API quota usage.
4. **45-Second Lookback Buffer Engine** to capture the full buildup of every moment.
5. **Google Colab & Hugging Face Spaces (Free T4 / CPU)** for 1-click video chunk trimming and OpenAI Whisper auto-subtitles without expensive cloud rendering servers.
6. **Telegram Bot Dispatch (`@digicast_bot`)** for instant mobile alerts and YouTube replay jump links.

---

## 2. System Architecture & Free-Tier Map

```mermaid
flowchart TD
    subgraph Live Ingest
        YT[🔴 YouTube Live Broadcast]
        Chat[💬 Live Chat Stream]
    end

    subgraph Trigger Layer (Zero Quota)
        T1[👥 Viewer/Mod types !clip in chat] --> NB[Nightbot $(urlfetch)]
        T2[⚡ Chat Spike Detector: >3x velocity] --> CS[Vercel Serverless Function]
        T3[📱 Streamer 1-Tap Mobile/HUD Macro] --> MB[Digicast Companion App]
    end

    subgraph Digicast Core (Free Tier)
        NB --> API["/api/webhooks/nightbot (Vercel Free)"]
        CS --> API
        MB --> API
        API --> FS["Firestore (Spark Free Tier)"]
        API --> GEM["Google Gemini 1.5 Flash API (1,500 req/day Free)"]
        GEM --> FS
    end

    subgraph Output & Dispatch
        API --> TG["Telegram Bot (@digicast_bot - Free Unlimited)"]
        FS --> WEB["Editor Web Dashboard (/editor, /clips)"]
        TG --> USER["Streamer Phone (Replay Jump Link)"]
        WEB --> COLAB["1-Click Google Colab / Hugging Face yt-dlp 45s Cut"]
    end
```

---

## 3. Detailed Component Implementation

### Component 1: Landing Page Architecture Enhancement
- **Goal:** Showcase the dual-power engine:
  - **Automated Intelligence:** AI Viral Scoring, Chat Spike Monitoring, Stream Health.
  - **Community & Mod Execution Pipeline:** `!clip` chat triggers, 45-second lookback engine, instant Telegram alerts, and 1-tap macro pad.
- **Location:** [`src/components/landing/LandingPageClient.tsx`](file:///Users/kizieemediateam/Code/Youtube%20Creators/digicast-web/src/components/landing/LandingPageClient.tsx)
- **Design:** Keep the premium dark obsidian & cyber glassmorphism styling (`#070910`, `#10131C`, `#22D3EE`, neon borders).

---

### Component 2: Gemini 1.5 Flash Free AI Scoring & Title Generation
- **Free Quota:** 15 RPM, 1,500 requests/day via Google AI Studio (`GEMINI_API_KEY`).
- **Endpoint:** `/api/ai/score-clip` (Next.js serverless route).
- **Functionality:**
  - When a marker is triggered (by `!clip` or chat spike), pass the context (stream title, recent chat messages, and trigger note).
  - Gemini generates:
    ```typescript
    interface ClipIntelligence {
      viralScore: number;       // 0 to 100
      suggestedTitle: string;   // High CTR Short title
      aiTopic: string;          // e.g. "1v4 Clutch Play"
      tags: string[];           // ["CLUTCH", "HYPE"]
      summary: string;          // 1-sentence breakdown
    }
    ```
  - Automatically updates the Firestore `clipMarkers` document in real time.

---

### Component 3: Chat Velocity Spike Auto-Detector (Zero-Quota)
- **Algorithm:**
  - Normal stream chat rate: ~20 msgs/min.
  - When excitement peaks: ~150 msgs/min.
  - Sliding 15-second window:
    $$\text{Velocity} = \frac{\text{Message Count in last 15s}}{15} \times 60$$
  - If $\text{Velocity} > 2.5 \times \text{Baseline}$, automatically creates an **Auto-Spike Clip Marker** labeled `⚡ Chat Hype Spike`.

---

### Component 4: 45-Second Lookback Engine
- Highlights are recognized *after* they occur.
- For trigger timestamp $T$:
  $$\text{Clip Start} = \max(0, T - 45\text{s}), \quad \text{Clip End} = T + 10\text{s}$$
- Dispatches Telegram alert with direct YouTube URL:
  `https://youtu.be/${videoId}?t=${clipStart}`

---

### Component 5: Google Colab & Hugging Face Video Trimmer (Free 1-Click)
- **Why it matters:** Creators don't want to pay $50/mo for cloud video servers like AWS EC2.
- **Solution:** Provide a free 1-click Google Colab notebook / Hugging Face Gradio tool:
  - Takes the YouTube VOD URL and timestamp list.
  - Runs:
    ```bash
    yt-dlp --download-sections "*01:23:15-01:24:00" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" "$URL" -o "clip_%(id)s.mp4"
    ```
  - Downloads only the 45-second segment in ~4 seconds.
  - Automatically creates a 9:16 vertical crop with OpenAI Whisper captions for TikTok/Shorts.

---

## 4. Execution Phases

| Phase | Task | Status | Free Platform |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Add Community & Mod Pipeline Section to Landing Page | In Progress | Vercel |
| **Phase 2** | Integrate Google Gemini 1.5 Flash Free API for Clip Scoring | Ready to Implement | Google AI Studio |
| **Phase 3** | Enhance Nightbot Webhook with 45s Lookback & Telegram Alert | Implemented & Working | Vercel / Telegram |
| **Phase 4** | Release Free Google Colab / Hugging Face 45s Trimmer Notebook | Planned | Google Colab |

---

## 5. Verification & Testing Criteria
1. **Landing Page Consistency:** Verify new section seamlessly integrates with the existing dark cyber theme without breaking any existing elements.
2. **Build Stability:** Confirm `npm run build` completes with 0 errors across all 41 routes.
3. **No Hidden Costs:** Ensure every proposed feature runs 100% within free limits for normal creators.
