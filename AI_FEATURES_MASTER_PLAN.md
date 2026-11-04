# Digicast AI Features — Master Plan (v0.1 DRAFT)

**Status:** PROPOSED — for discussion. No code until SPEC is finalized.
**Scope:** Two new AI features — (A) Thumbnail Studio, (B) Voice Vault (voice cloning).
**Date:** 2026-11-03

---

## 0. TL;DR — the shape of this

You are describing **two new products**, not two screens:

1. **Digicast Companion APK** (`com.digicast.companion`) — a *separate, install-once* app that does the heavy local work: downloads video/audio from a link, extracts frames, runs local AI, and talks to the Digicast app **peer-to-peer over the local network**. Digicast itself stays a thin client.
2. **Voice Vault** — voice cloning that lives **inside Digicast as a first-class home-screen feature** (not a separate app), built on the **exact same `.dcast` extension mechanism** you already ship (DexClassLoader) so the heavy model runs as an installed module.

Both are gated by your existing **DP / D-Coins ledger** and **subscription plans**. Free users get a hard daily cap; paid users get a monthly quota.

The single most important architectural decision in this whole plan is **#2 — the Local Bridge**. Everything else is standard app work. Get that wrong and nothing connects. So read §3 carefully.

---

## 1. What I found in the repo (grounding)

I inspected the actual codebase before writing this. Key facts that shape the plan:

| Thing | Reality in repo | Consequence for this feature |
|---|---|---|
| **Extension system** | `ExtensionLoader.kt` uses `DexClassLoader` to load `.dcast` files (which are APKs renamed). Interface `DigicastExtension` has `type = COMPANION_TOOL` **already defined but unused**. | Voice cloning is *natively* a `.dcast` extension. The `COMPANION_TOOL` enum is literally waiting for this. |
| **`ClipProcessorExtension`** | `processClip(videoId, start, end, outputDir, onProgress)` — the download+trim contract already exists. | Thumbnail frame-extraction reuses this shape (download a segment → grab frame). |
| **Existing clip UI** | `ClipGenerateScreen.kt` already embeds a YouTube iframe player and does on-device trimming via yt-dlp + FFmpeg locally. | The "give it a link → get a frame" flow is 70% built already. |
| **Ledger** | `digicast-backend/src/lib/ledger.ts` — append-only, **idempotency keys already implemented**, `LedgerSource` union. | Quota/metering plugs straight in. Just add two new `LedgerSource` values. |
| **Currency** | `10 D-Coins = 1 DP = ₹1`. `INR_PER_DP = 1`. | Pricing math is trivial: 1 generation = N DP. |
| **Plans** | `plans.ts`: Free 14-day trial, ₹29 intro, ₹149/mo, ₹449/qtr, ₹999/yr. | "Premium users get limits" = attach quotas to these plan IDs. |
| **Backend auth** | Firebase Admin (`adminAuth`, `adminDb`), `PlatformUser.role` = streamer/editor/admin/owner. | Quota checks server-side, keyed on `uid`. |
| **Existing AI** | `groqClient.ts` calls Groq Cloud. `adStore`, `assetStore`, `telegram` all server-side. | You already have a "call a cloud AI provider" pattern to copy. |
| **Android app** | `com.digicast.app`, minSdk 26, targetSdk 35. Room DB, Hilt, WorkManager, foreground service. | Companion app will share the same stack + design system. |
| **App links** | Digicast registers `scheme="digicast"` + `.dcast` MIME handler in the manifest. | Deep-link mechanism for "open in Digicast" already exists. |

**Bottom line:** you've already built the plumbing for both features. This plan mostly wires existing parts together.

---

## 2. The two features, in one paragraph each

### A. Thumbnail Studio
User pastes a stream/VOD YouTube link + a prompt ("make a dramatic gaming thumbnail, shocked face, red arrows"). Digicast asks the **Companion APK** (over local network) to fetch the video, extract a set of candidate frames (the "image"), and hand them back. Digicast then sends those frames + the prompt to the user's chosen image model using **BYOK** (bring your own key — the user logs into their own provider account inside Digicast and their own quota is consumed). Result: a thumbnail. Quality tiers differ by "proper quality and work" — draft (fast/cheap) vs final (upscaled, high-res).

### B. Voice Vault
Anyone can clone a voice by uploading a **5–10 minute audio sample**. The clone is saved to their Vault. **Premium users get a monthly generation quota; free users get 1–2 generations per day on their phone.** Cloning runs **locally as a `.dcast` extension** (the "extension method" you described), but its entry point and gallery are **surfaced on the main Home screen**, not buried in Settings.

---

## 3. ⭐ The Local Bridge — how the Companion APK connects to Digicast

This is the part you kept circling back to ("goes through a local connection to the app"). Here is the honest engineering picture.

### 3.1 The problem with the literal reading
Android does **not** let two separate apps talk over `127.0.0.1` reliably out of the box, and a companion APK cannot just "be an internal service" of Digicast. There is no OS-level channel where one APK's code runs inside another APK. So "connect through a local connection" has to be built as **one of these four options**.

### 3.2 Option matrix

| # | Mechanism | How it works | Pros | Cons | Verdict |
|---|---|---|---|---|---|
| **1** | **Embedded local HTTP server** (NanoHTTPD/Ktor) in the Companion APK; Digicast is the client | Companion runs a tiny server on `127.0.0.1:<port>`. Digicast POSTs the link, polls for frames. | True "local connection". Language-agnostic. Easy to debug with curl. | A localhost port is reachable by *any* app on device → needs a **shared secret** (token) handshake. Server must stay alive. | ✅ **Recommended** |
| **2** | **Android Bound + AIDL Service** | Companion exposes a bound Service; Digicast binds by explicit component. | Proper Android IPC. No open port. | Both apps must share the exact AIDL interface; fragile across versions; can't be tested from desktop. | Backup option |
| **3** | **ContentProvider + FileProvider** | Companion writes frames to a shared provider; Digicast reads. | Simple for data passing. | Not a "connection" — no live control/streaming. | For result handoff only |
| **4** | **Broadcast / Intent chain** | Companion launched via intent, returns via `startActivityForResult`. | Trivial. | Clunky UX (app switching), no progress feedback. | Last resort |

### 3.3 Recommended design (Option 1)

```
┌──────────────────────────┐        localhost:5477         ┌───────────────────────────┐
│   DIGICAST (main app)    │  ── POST /v1/frames ───────►  │  COMPANION APK            │
│   com.digicast.app       │                                │  com.digicast.companion   │
│                          │  ◄── {jobId, frames[]} ─────  │  • yt-dlp download        │
│  • URL input             │                                │  • FFmpeg frame extract   │
│  • prompt box            │  ── GET /v1/health ─────────► │  • (opt) local AI models  │
│  • BYOK provider UI      │                                │  • files written to       │
│  • renders final image   │  ◄── shared FileProvider ───  │    shared external dir    │
└──────────────────────────┘                                └───────────────────────────┘
          │                                                              │
          └──────────── pairing token (HMAC, from backend) ─────────────┘
```

**Handshake & security (this matters — an open localhost port is a real risk):**

1. User installs the Companion APK once. Both apps register the same `ANDROID_ID` with the Digicast backend (mechanism already exists: `DeviceSecureStorage.kt` → `/api/mobile/device`).
2. Backend issues a **pairing token** = HMAC(deviceId + appPairId) signed with `DIGICAST_HMAC_SECRET` (you already have `security.ts` with HMAC-SHA256 + timing-safe compare — reuse it verbatim).
3. Digicast sends that token in an `X-Digicast-Pair` header on every localhost call. Companion rejects anything without it.
4. Port is chosen dynamically and advertised to Digicast via a **paired intent** on first connect (so it isn't hardcoded and can't be guessed).
5. All traffic is `127.0.0.1` only — never bind to `0.0.0.0`.

**Why this is the right call:** it's the only option that gives you a true "local connection", is debuggable from a laptop, and matches how the *rest* of your ecosystem already authenticates (HMAC + device vault). Option 2 (AIDL) is "more correct" Android but locks you to one app version pairing and is much harder to iterate on.

### 3.4 What goes over the bridge

| Direction | Payload | Notes |
|---|---|---|
| Digicast → Companion | `{ url, mode: "videos"\|"audio", count, timestamps? }` | `mode:"audio"` is reused by Voice Vault to grab a clip's audio |
| Companion → Digicast | `{ jobId, status, progress }` | Streaming progress so UI can show a bar |
| Companion → Digicast | File URIs of frames/audio | Passed via FileProvider, **not** base64 (a 1080p frame base64'd is wasteful) |
| Companion ↔ Digicast | `POST /v1/cancel/{jobId}` | User cancels mid-job |

---

## 4. Thumbnail Studio — full flow

### 4.1 Happy path

```
[1] User pastes YouTube link + prompt in Digicast
        │
[2] Digicast → Companion:  POST /v1/frames {url, count: 12}
        │
[3] Companion: yt-dlp download (cached if already downloaded) → FFmpeg extract
     12 candidate frames (face-aware crop if a face detector is bundled)
        │
[4] Frames returned as FileProvider URIs  → shown as a thumbnail picker
        │
[5] User picks a frame (or auto-pick the best face)
        │
[6] Digicast → User's BYOK provider (their account, their quota):
     POST image-edit  { prompt, sourceImage: frame, size, quality }
        │
[7] Result rendered in Digicast.  Save to gallery / DP charge if server-side quality pass
```

### 4.2 BYOK — "bring your own key" done safely (IMPORTANT)

You said: *"they login in that app and they get their limit by generating image with proper quality."* Two sub-decisions here:

**Where does the key live?** Three choices:

| Model | Key stored | Who pays provider | Notes |
|---|---|---|---|
| **Pure BYOK** | Encrypted on-device, server never sees it | User's own account | Best for cost; matches "bring your own key" literally. Server can't meter usage. |
| **Server-side key** | Backend env var | You pay | You must meter hard or you lose money. Easier UX. |
| **Hybrid** (recommended) | User key on-device; **server issues a signed "generation ticket"** before the call | User pays the model, you meter tickets | You keep quota control (ticket per generation) without holding the key. |

**Recommended = Hybrid.** The backend issues one signed, single-use ticket per generation (reusing your nonce/security util). The app makes the actual inference call with the user's key, then reports completion. This means:
- You never store the user's provider secret (privacy win, big trust win).
- You can still enforce "premium gets N/month, free gets 2/day" because a ticket is required.
- If a user abuses it, tickets stop.

Key storage on-device: **Android Keystore (AES-GCM)**, not your current XOR vault. Current `DeviceSecureStorage` uses XOR `0x5A` — that is *obfuscation, not encryption*. For API keys, use Keystore-backed `EncryptedSharedPreferences`. (Flagging as a security note, not fixing now.)

### 4.3 Quality tiers ("proper quality")

| Tier | What happens | Cost | Availability |
|---|---|---|---|
| **Draft** | Cheapest provider model, 512–768px, no upscale | 1 DP | Free |
| **Standard** | Balanced model, 1024px | 3 DP | Trial+ |
| **HD** | Best model + face-aware source frame + 2× upscale | 8 DP | Paid |
| **Studio** | HD + retina-restore + 1280×720 export (YT spec) | 15 DP | Paid |

### 4.4 Frame extraction specifics
- Reuse yt-dlp already bundled in `clip-engine`. Cache the downloaded VOD so 3 thumbnails from the same stream don't re-download.
- Face detection: start with **ML Kit Face Detection** (free, on-device, no model download headache) to auto-pick the best frame. Upgrade later to a local CLIP/BLIP captioner to auto-score frames against the prompt (that's the real "ChatGPT-like" feel).
- Aspect: YouTube thumbnails are **16:9, 1280×720**. Frame extraction should respect that.

---

## 5. Voice Vault — full flow

### 5.1 Why "extension method" is exactly right

You said: *"voice cloning feature will also work like the extension method but shows on main home page."* The repo already has the transport: `ExtensionLoader` + `DigicastExtension` with a `COMPANION_TOOL` type that is **currently unused**. Voice cloning becomes the first `COMPANION_TOOL` extension.

But there's a nuance worth deciding: an Android `.dcast` extension is a DexClassLoader — it can run **Kotlin/Java**, and can call into native `.so` libs. Running a **voice-clone neural model** (e.g. an ONNX/PyTorch Mobile model) inside that is possible but heavy. Two realistic shapes:

| Shape | Where model runs | Pros | Cons |
|---|---|---|---|
| **A. On-device `.dcast`** | Phone GPU/NPU via ONNX Runtime Mobile / TFLite | Zero cloud cost, max privacy, works offline | Model size (~100–500MB), slow on mid-range phones, thermal, hard to update |
| **B. Thin extension + cloud inference** | Extension handles UI/capture; inference on a GPU worker you run | Fast, best quality, easy to update | You pay; needs a GPU box (or Replicate/Modal); *is this still "extension method"?* — yes, the extension is the client |
| **C. Hybrid** | Sample prep + caching on device, inference on a **self-hosted GPU node the user brings** (own server) | Aligns with BYOK philosophy | Only power users have this |

**My recommendation: start with B, design the interface so A can drop in later.** Same interface, swap the backend. This gets you shipping in weeks not months, and if cost becomes an issue you introduce A for free-tier users.

> ⚠️ **Legal / consent — non-negotiable.** Voice cloning is a high-risk feature. Before any code: (1) required explicit consent checkbox from the *speaker* being cloned, (2) an audible+visible "AI-generated" watermark on exports, (3) a TOS clause, (4) a refusal list for public figures. I'd put a hard block on cloning named public figures' voices. This isn't optional garnish — it's what keeps the feature alive. Worth a dedicated SPEC section.

### 5.2 Flow

```
[1] Home screen tile: "Voice Vault"  → tap
        │
[2] Choose source:  (a) upload 5–10 min audio, or (b) paste link
        └ (b) routes through the SAME Local Bridge → Companion pulls audio
        │
[3] Consent screen (speaker consent + purpose) — blocking
        │
[4] Preview: validate sample (length, SNR, single speaker).  Warn if noisy.
        │
[5] "Clone" → ticket issued → inference (cloud worker OR on-device extension)
        │
[6] Clone saved to Vault (encrypted at rest).  Reusable by name.
        │
[7] Generate speech: text + clone + language → audio out.  Metered.
```

### 5.3 Quota model (your stated numbers)

| User tier | Daily | Monthly | Notes |
|---|---|---|---|
| **Free** | 1–2 generations/day | — | On their phone. Hard cap, resets midnight IST. |
| **Trial (₹0, 14d)** | 2/day | ~20 | Give a taste |
| **Standard ₹149** | — | 100 | |
| **Quarterly ₹449** | — | 350 | |
| **Annual ₹999** | — | 1500 | |
| **Clone creation** | Separate cap: **3 clones max** on free, unlimited-ish on paid | | Clones are expensive to store |

All metered through the **existing ledger** with two new `LedgerSource` values: `VOICE_CLONE_CREATE` and `VOICE_GEN`. Daily caps: keep a per-uid daily counter in Firestore with a TTL field (cheap, no cron needed).

### 5.4 Home screen surfacing ("shows on main home page")
Add a **bento tile** on `HomeScreen.kt` — the design system already has `surface-card` + `card` radius 16px for exactly this. Two tiles actually:
- **Thumbnail Studio** (cyan accent — primary CTA)
- **Voice Vault** (violet accent — "AI intelligence", semantically perfect given your token comment *"AI intelligence (trusted — Expression 9)"*)

This is a nice alignment: your brand system already reserves violet for AI. Use it.

---

## 6. Data model additions (backend + Room)

```ts
// New LedgerSource values
| 'THUMBNAIL_GEN'       // Thumbnail generation
| 'VOICE_CLONE_CREATE'  // Creating a voice clone
| 'VOICE_GEN'           // Generating speech from a clone

// Firestore: users/{uid}/aiQuota  (daily counters, TTL-reset)
{
  thumbnail: { day: "2026-11-03", draftUsed: 1, stdUsed: 0, hdUsed: 0 },
  voice:     { day: "2026-11-03", freeUsed: 1, monthUsed: 12 }
}

// Firestore: users/{uid}/voiceClones/{cloneId}
{
  cloneId, name, createdAt, sampleSeconds, consent: { acceptedAt, speakerName },
  engine: "cloud-v1" | "ondev-v1", status: "training"|"ready"|"failed",
  artifactRef  // pointer to storage, never the raw sample after training
}

// Firestore: users/{uid}/aiKeys  (BYOK — encrypted, or just a "connected" flag if hybrid)
{ provider: "openai"|"replicate"|"fal", label, connectedAt }  // NO plaintext keys server-side

// Room (Android): CachedFrameEntity, VoiceCloneEntity, AiJobEntity (mirror of SyncQueueEntity pattern)
```

---

## 7. Phased roadmap (proposed)

| Phase | Deliverable | Weeks (rough) |
|---|---|---|
| **P0** | SPEC finalized: quota numbers, BYOK model, consent/legal, provider shortlist | 0.5 |
| **P1** | **Local Bridge MVP** — Companion APK skeleton + health/pair endpoint + Digicast client + pairing token | 2 |
| **P2** | **Frame extraction** — `POST /v1/frames`, yt-dlp cache, FFmpeg, face auto-pick, thumbnail picker UI | 2 |
| **P3** | **Thumbnail generation** — BYOK key UI (Keystore), ticket issuance, provider call, quality tiers | 2 |
| **P4** | **Voice Vault capture** — Home tile, upload/link, consent gate, sample validation | 1.5 |
| **P5** | **Voice cloning engine** — cloud worker + `/clone` + `/generate`, Vault gallery | 3 |
| **P6** | **Metering + quota** — ledger sources, daily counters, plan gating, God Panel view | 1.5 |
| **P7** | **Polish** — watermarks, error states, offline behavior, analytics | 1.5 |

Roughly **14–15 focused weeks** for a solo builder. The two features are independent after P1, so P2–P3 and P4–P5 can run in parallel if you have help.

---

## 8. Open decisions (I need your calls before SPEC)

1. **Local Bridge**: Option 1 (localhost + token) ✅ recommended — or do you want AIDL?
2. **BYOK**: Pure-BYOK, server-key, or **hybrid ticket** ✅ recommended?
3. **Voice engine**: Cloud worker first ✅ — or insist on fully on-device from day one?
4. **Companion APK**: is it *required* for both features, or does Voice Vault work without it (upload-only)?
5. **Free tier numbers**: confirm "1–2/day" — pick 1 or 2?
6. **Provider shortlist**: for images — OpenAI `gpt-image-1`, Google Imagen, Replicate, fal.ai, Flux? For voice — ElevenLabs, PlayHT, or self-hosted (XTTS/OpenVoice)?
7. **Legal**: are you OK shipping consent-gate + watermark + public-figure block? (Strongly advise yes.)
8. **God Panel**: should admins see per-user AI usage? (I assume yes — it's cheap to add.)

---

## 9. What I'd do first (concrete next step)

Write `.gsd/SPEC.md` for **just the Local Bridge (P1)** and mark it FINALIZED. It's the keystone — every other phase depends on it. Once the bridge works, the Thumbnail feature is a few days of wiring, and Voice Vault becomes an independent track.

> Per `PROJECT_RULES.md`: no implementation code until SPEC.md says `Status: FINALIZED`. This document is the discussion input, not the SPEC.
