# Digicast AI Features — Master Plan (v1.0 FINAL)

**Status:** PROPOSED — implementation-ready. Per `PROJECT_RULES.md`, still requires `.gsd/SPEC.md` to be marked `FINALIZED` before code.
**Supersedes:** v0.1 and the user's v0.4 two-app architecture draft.
**Date:** 2026-11-03

---

## PART 0 — Verdict on your v0.4 plan

Your plan is a **big improvement** over v0.1. Three things you got genuinely right and I've kept:

1. **The two-app split is correct.** Main app stays light, companion carries the heavy models, streaming is never interrupted. That's the right architecture and my v0.1 was wrong to imply the companion should only be a download worker.
2. **The `maxresdefault.jpg` CDN grab is the best idea in the whole document.** You do *not* need to download a video to get a thumbnail — YouTube serves the existing thumbnail at a predictable URL. That turns "download a VOD" (expensive, slow, legally grey) into "fetch one JPEG" (instant, trivial). This single change is worth more than everything else combined.
3. **Phase ordering** is sensible and dependency-correct.

Now the problems. I'm not going to soften these, because they're the difference between a plan that ships and one that stalls.

### 🔴 Blocker 1 — "ChatGPT image engine" is not a thing you can just call
You cannot POST an image to "ChatGPT" and get an edited image back with a prompt. What actually exists:

| Provider | Endpoint | Edits an input image? | Masks/inpainting? | Text rendering |
|---|---|---|---|---|
| **OpenAI** | `gpt-image-1` (Images API) | ✅ `POST /v1/images/edits` | ✅ mask param | Good |
| **Google** | Imagen / Gemini image | ✅ (Gemini) | Partial | Good |
| **Replicate / fal.ai** | Flux family | ✅ (Flux Fill / Kontext) | ✅ Flux Fill | Fair |

For an **injection / replace-a-region** workflow, the correct primitive is an **image-edit call with a mask**, on **`gpt-image-1`** (or **Flux Kontext** on Replicate/fal if you want cheaper/faster). The plan must name a concrete provider and model, and build a **provider adapter** so it isn't welded to one. "Dispatch to Vision/ChatGPT model" is a placeholder, not a design.

### 🔴 Blocker 2 — the Android foreground service type will crash
Your plan has the companion running "background foreground service" with a local HTTP daemon. Two concrete problems:

- **`FOREGROUND_SERVICE_TYPE` is mandatory and must match the work.** A localhost server while a user waits is **not** `dataSync` in the eyes of future Android. Model inference while the user is *watching the screen* is best served by a **bound service** or a **short-lived FGS**, not a permanently-always-on daemon.
- **Always-on localhost port = battery + security liability.** Binding `127.0.0.1:5477` unconditionally means (a) it's on when it doesn't need to be, (b) *any* app on the device can probe it. A fixed port is guessable.

**Fix:** the daemon starts **on demand** (when Digicast commissions a job) and stops after an idle timeout. Port is **dynamic**; Digicast discovers it via the health probe range or a shared preference written by the companion. Keep the pairing token regardless.

### 🟠 Blocker 3 — `debpalash/VoiceStudio` is unverified, and I could not check it
This environment blocks GitHub, so **I could not confirm this repository exists, or that its license permits commercial use, or that it contains OmniVoice/Sherpa-ONNX pipelines, or that any of it compiles for Android.** You've named it as the entire foundation of Phase 3. Before you write a line of Phase 3 code, verify:

- Does the repo exist and is it actively maintained?
- **What is its license?** (MIT/Apache = fine. GPL/AGPL = viral, and a *closed-source commercial app shipping it* is a legal problem. "No license" = legally unusable.)
- Does it actually ship Android/ONNX mobile artifacts, or is it Python desktop code you'd have to port?
- What's the real model size and inference time on a mid-range phone?

**Fallback if it doesn't pan out:** **Piper** (fast, per-voice models, ONNX, Android-friendly) or **sherpa-onnx** directly for TTS. Neither does true zero-shot cloning, so cloning may need a **cloud worker** (Coqui XTTS / OpenVoice / ElevenLabs / PlayHT) as Phase 3A with on-device as 3B. Don't put a single unverified repo on the critical path.

### 🟠 Blocker 4 — the plan dropped the safety layer I flagged
v0.4 says nothing about **consent, watermarking, or public-figure limits** for voice cloning. That's not optional garnish; shipping voice cloning without it is the kind of thing that gets an app pulled and, in India, invites legal exposure. It also dropped the **quota model**, which was your actual stated requirement ("premium gets limits, free gets 1–2/day"). Both are reinstated below as first-class phases.

### 🟡 Smaller corrections
- **BYOK broke silently.** v0.4 keeps "BYOK" but then routes generation *through the companion*, which implies Digicast-side or companion-side keys. Decide: does the user bring a key (and where does it live), or does Digicast hold the key? The hybrid ticket model from v0.1 still stands.
- **"Zero-config" is contradicted by the pairing token.** You can have *zero-config discovery* or you can have *a shared secret*, but the secret has to come from somewhere. Resolve it via the backend (both apps paired to the same `ANDROID_ID` — mechanism you already have).
- **Main APK "~35MB"** — verify against your real build. It's plausible but don't put a number in the SPEC you haven't measured.
- **`Downloads/Digicast/`** — on Android 10+ (you're `targetSdk 35`) you cannot write arbitrary paths. Use **MediaStore** + `RELATIVE_PATH=Download/Digicast/...`. You already do this in `ClipGenerateScreen.kt`, so copy that pattern.

**Verdict: the architecture is right, the specifics need fixing. Proceed — with this version.**

---

## PART 1 — Architecture (locked)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIGICAST MAIN APP (Client)                      │
│   • Home Screen Bento UI — Thumbnail Studio (cyan), Voice Studio (violet)
│   • 16:9 Thumbnail Canvas + Object Injection / Mask Selector           │
│   • Script & Dialogue Box (multi-speaker)                              │
│   • MediaStore save → Download/Digicast/{Thumbnails,Voice}/            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Local Bridge — 127.0.0.1 (dynamic port)
                                   │ + HMAC pairing token (backend-issued)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│              DIGICAST SUPPORT APP (install once)                       │
│                       com.digicast.companion                           │
│   ├── 🎨 Thumbnail Engine                                              │
│   │   • CDN grabber (maxresdefault → hq → mq fallback)                 │
│   │   • Composite: base + user mask + prompt                           │
│   │   • Provider adapter → image-edit call (gpt-image-1 / Flux Kontext)│
│   │                                                                    │
│   └── 🎙️ Voice Studio Engine                                          │
│       • Phase 3A: cloud worker (XTTS / OpenVoice / hosted)             │
│       • Phase 3B: on-device ONNX (sherpa-onnx / Piper) behind same API │
│       • Consent gate + AI watermark + public-figure block              │
└────────────────────────────────────────────────────────────────────────┘
```

**Why this wins (your three points, kept verbatim in spirit):** main app stays light and policy-clean; heavy models live in the companion; heavy jobs never touch Digicast's stream viewer, chat overlay, or clip trimmer.

---

## PART 2 — Workflows

### A. Thumbnail Studio

```
[1] Home tile → Thumbnail Studio
[2] Paste livestream / video link (or video ID)
[3] CDN grab: maxresdefault.jpg → fallback hqdefault → mqdefault
    (NO video download. ~1s, ~100KB.)
[4] 16:9 canvas opens with the base image
[5] Object Injection:
      • draw a mask over the region to replace, OR add an overlay asset
      • prompt: "anime gamer face, red glowing arrows, text 'CLUTCH!'"
[6] Dispatch → Support App:
      POST /v1/thumbnail/generate { baseImage, mask, prompt, quality }
[7] Support App → provider adapter → image-edit with mask
[8] Live preview returned to Digicast
[9] Download → MediaStore → Download/Digicast/Thumbnails/
```

### B. Voice Studio

```
[1] Home tile → Voice Studio
[2] Choose operation:
      (A) Clone Voice   — record / upload 3–15s clean sample  [+ CONSENT GATE]
      (B) Design Voice  — prompt: "energetic 20s Hindi esports caster"
      (C) Script / Dialogue — multi-speaker dialogue box
[3] Dispatch → Support App:
      POST /v1/voice/synthesize { mode, voiceProfileId, script, lang }
[4] Engine runs (cloud worker in 3A, on-device ONNX in 3B)
[5] Audio preview in Digicast
[6] Download → MediaStore → Download/Digicast/Voice/
```

---

## PART 3 — The Local Bridge (corrected)

1. **Discovery.** Companion serves `GET /v1/health` on `127.0.0.1` at a **dynamically chosen port**; it publishes the port + a readiness flag via a shared preference both apps can read (same signing identity) or by scanning a small port range. Digicast probes on app start.
2. **Lifecycle.** Daemon starts when the companion is commissioned and **stops after an idle timeout** (no always-on port). Foreground service type chosen to match actual work; prefer a bound service or short FGS over a permanent daemon.
3. **First-time UX.** If no companion detected, Digicast shows a 1-tap dialog: *"Install Digicast Studio Companion (install once) to activate Thumbnail AI and Voice Studio"* → direct APK install.
4. **Pairing (the security that makes a localhost port safe).**
   - Both apps register the same `ANDROID_ID` with the backend. *You already have this*: `DeviceSecureStorage.kt` → `/api/mobile/device`.
   - Backend issues a pairing token = `HMAC(deviceId + pairId)` using `DIGICAST_HMAC_SECRET`. *Reuse `security.ts` verbatim* — it already does timing-safe HMAC.
   - Every localhost request carries `X-Digicast-Pair`. The daemon rejects anything else. Bind `127.0.0.1` only, never `0.0.0.0`.
5. **Payloads.** Files (frames, audio) move as **FileProvider URIs**, never base64. Progress streams back so the UI can show a bar. `POST /v1/cancel/{jobId}` cancels.

---

## PART 4 — Metering, quota & keys

**New `LedgerSource` values** (append to the union in `types/index.ts`):
`THUMBNAIL_GEN`, `VOICE_CLONE_CREATE`, `VOICE_GEN`.

**Quota (your numbers, made concrete):**

| Tier | Thumbnail | Voice |
|---|---|---|
| Free | 2/day | 2 generations/day; max 1 saved clone |
| Trial 14d | 3/day | 20 total |
| Standard ₹149 | 30/day | 100/month |
| Quarterly ₹449 | 30/day | 350/quarter |
| Annual ₹999 | 30/day | 1500/year |

**Quality tiers (thumbnail):** Draft (1 DP, free) · Standard (3 DP, trial+) · HD (8 DP, paid) · Studio (15 DP, paid). Daily counters live in Firestore (`users/{uid}/aiQuota`) with a day-key; no cron needed.

**BYOK — hybrid ticket (kept from v0.1):**
- Server issues a **signed single-use generation ticket** → you keep quota control without holding the user's key.
- User's provider key (if BYOK) is stored with **Android Keystore / EncryptedSharedPreferences** — ⚠️ **not** the XOR vault in `DeviceSecureStorage.kt`, which is obfuscation, not encryption.
- Provider adapter interface so you can swap OpenAI ↔ Replicate ↔ fal without touching UI.
- **Decide explicitly:** BYOK (user's key + ticket) vs Digicast-held key (you pay, meter hard). v0.4 left this ambiguous.

---

## PART 5 — Safety & legal (REINSTATED — do not cut)

Voice cloning, non-negotiable before Phase 3 ships:
1. **Consent gate** — blocking screen: user affirms they have the speaker's permission; record `{acceptedAt, speakerName}` with the clone.
2. **AI watermark** — audible tone + visible tag on every export.
3. **Public-figure block** — refuse known public figures.
4. **TOS clause** + abuse-report path.
5. Raw sample **deleted after training**; only the embedding/artifact is retained.

---

## PART 6 — Roadmap

| Phase | Deliverable | Notes |
|---|---|---|
| **P0** | SPEC finalized — quota numbers, BYOK model, provider shortlist, **legal sign-off** | gate |
| **P1** | Companion shell + Local Bridge (dynamic port, on-demand daemon, pairing token, health) | keystone |
| **P2** | Thumbnail Studio — CDN grab, canvas + mask, provider adapter, image-edit, MediaStore save | after P1 |
| **P3A** | Voice Studio — **cloud** engine (consent gate, watermark, quota) | after P1 |
| **P3B** | Voice Studio — **on-device** ONNX behind the same interface | optional/deferred |
| **P4** | Home bento tiles + ledger quota wiring + God Panel usage view | cross-cutting |
| **P5** | Polish — errors, offline, analytics, watermark QA | |

P2 and P3 can run in parallel once P1 lands.

**Before P3 starts, verify the `debpalash/VoiceStudio` dependency** (existence, **license**, Android artifacts, model size/speed). If it fails: Piper/sherpa-onnx for TTS + a cloud worker for cloning.

---

## PART 7 — Open decisions (answer these to finalize the SPEC)

1. **Image provider + model** — `gpt-image-1` (edits+mask, best text) or Flux Kontext via Replicate/fal (cheaper/faster)? Pick a primary.
2. **BYOK vs Digicast-held key** — which? (Recommend: BYOK + ticket.)
3. **Voice engine P3A** — hosted (ElevenLabs/PlayHT) or self-run GPU worker (XTTS/OpenVoice)? And is `debpalash/VoiceStudio` licensed for commercial closed-source use?
4. **Free tier** — confirm 2/day for both, or 1?
5. **Legal** — approve the P5 safety list? (Strongly advise yes.)
6. **Companion distribution** — GitHub releases only, or also in-app? (Play Store won't accept a sideloaded-AI companion pattern easily.)
7. **God Panel** — show per-user AI usage? (Recommend yes; cheap.)

---

## PART 8 — Next step

Answer Part 7, then I'll write `.gsd/SPEC.md` for **P1 (Local Bridge) only** and mark it FINALIZED. Per `PROJECT_RULES.md`: **no implementation code until SPEC.md says `Status: FINALIZED`.**

**Sources:** I was unable to verify `debpalash/VoiceStudio` or the current `maxresdefault.jpg` behaviour — GitHub and general web search were blocked/unavailable in this environment. Verify both manually before building. Everything in Parts 1–4 is grounded in code I read in your repo.
