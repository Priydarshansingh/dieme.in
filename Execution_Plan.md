# Digicast — Execution Plan
### YouTube Creator Live Intelligence & Clip Delivery Platform

---

## What We're Building

A **local-first Android app + web dashboard** for YouTube livestreamers that:
- Captures live chat locally on the creator's device
- Detects `!clip` moments in real-time and creates clip markers
- Downloads and trims video clips using yt-dlp + FFmpeg on-device
- Delivers clips to a Telegram editing group automatically
- Gives editor team members access via a web dashboard
- Optionally analyzes chat with AI (only when creator explicitly authorizes)

**Core principle:** The creator's chat and video never touch the cloud without explicit permission.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Android App | Kotlin, Jetpack Compose, Room (SQLite), WorkManager, Foreground Service |
| Web Dashboard | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend API | Next.js API Routes on Vercel |
| Auth | Firebase Authentication (Google login) |
| Cloud DB | Cloud Firestore (metadata only, no chat) |
| Telegram Relay | Cloud Run (Mumbai/Delhi region) |
| Email | Resend |
| AI | OpenAI / Gemini API (optional, creator-triggered only) |
| Local Storage (Android) | Room/SQLite + Android shared media storage |

---

## Phase 1 — Foundation (Weeks 1–3)
**Goal: Project scaffolding, auth, and YouTube connection working end-to-end.**

### 1.1 Project Setup
- Initialize Android project (Kotlin + Jetpack Compose)
- Initialize Next.js web app (TypeScript + Tailwind + shadcn/ui)
- Set up Firebase project (Auth + Firestore)
- Set up Vercel project and connect repo
- Set up Cloud Run project for Telegram relay
- Configure Resend for transactional email

### 1.2 Authentication
- Firebase Google Sign-In on Android
- Firebase Google Sign-In on Web
- Separate YouTube OAuth (PKCE flow, Android installed-app flow)
- Store YouTube tokens securely (Android Keystore, server-side for backend)
- Never embed client secret or bot token in the APK

### 1.3 Firestore Data Model
Set up the following cloud collections:
```
users/{userId}
workspaces/{workspaceId}
workspaces/{workspaceId}/members/{memberId}
workspaces/{workspaceId}/youtube/{accountId}
workspaces/{workspaceId}/streams/{streamId}
workspaces/{workspaceId}/clips/{clipId}
workspaces/{workspaceId}/telegram/{connectionId}
workspaces/{workspaceId}/devices/{deviceId}
subscriptions/{subscriptionId}
```
- Write Firestore security rules: every request must verify `workspaceMembership` + `role`
- Never allow client to access arbitrary workspace documents

### 1.4 Android Local Database (Room)
Tables: `streams`, `chat_messages`, `clip_markers`, `download_jobs`, `files`, `telegram_uploads`, `ai_results`, `sync_queue`, `settings`

**Deliverable:** User can sign in on Android and Web, connect YouTube channel, and see their channel info. Basic workspace is created in Firestore.

---

## Phase 2 — Live Chat Capture (Weeks 4–5)
**Goal: App captures YouTube live chat locally in real-time.**

### 2.1 Live Stream Detection
- Query `liveBroadcasts.list` for active broadcasts on connected channel
- Show LIVE status with stream title and elapsed time on Home screen
- Show "No Live Stream / Next scheduled" when idle

### 2.2 Auto-Capture Mode Toggle
- `Auto Live Capture [ON/OFF]` setting
- Android Foreground Service with persistent notification:
  > `🔴 Digicast — Live chat capture active | September 21 Night Stream | 12,428 messages | 37 clip markers`
- Follow current Android foreground-service rules (do not rely on invisible background process)

### 2.3 Chat Capture Engine
- Connect to `liveChatMessages.streamList` (low-latency, continuation via `nextPageToken`)
- Capture per message: `messageId`, `timestamp`, `authorId`, `authorName`, `message`, `messageType`, badges, super chat, membership events
- Save to local Room `chat_messages` table immediately
- Maintain `lastNextPageToken`, `lastMessageId`, `lastTimestamp`, `connectionState`

### 2.4 Reconnect Logic
- Exponential backoff on disconnect
- Resume from last continuation point on reconnect
- Deduplicate messages using `youtubeMessageId`
- Handle: network loss, Wi-Fi → mobile data switch, API interruptions, app lifecycle changes

**Deliverable:** During a live stream, the app silently captures all chat locally. Creator sees live message count. Chat never leaves the device.

---

## Phase 3 — !Clip System & Marker Timeline (Week 6)
**Goal: Detect !clip commands, create markers, sync to cloud for editors.**

### 3.1 !Clip Detection
- Scan incoming chat for `!clip` (case-insensitive)
- On detection, create a local clip marker:
  - `clipId` (e.g. `CLP-0001`), `streamId`, `youtubeVideoId`, `markerTimestamp`, `authorName`, `chatMessageId`, `createdAt`
- Do NOT download video or generate MP4 at this point — marker only
- MVP supports only `!clip`. Custom commands (`!clip 5`, `!mark`) come later.

### 3.2 Cloud Sync of Markers
- POST clip markers to `/api/clips/register-marker` after creation
- Store in `workspaces/{workspaceId}/clips/{clipId}` in Firestore
- If offline, queue in local `sync_queue` and retry on reconnect
- Markers must never be lost due to network failure

### 3.3 Marker Timeline UI (Android)
- Stream detail screen shows a horizontal timeline
- Each `!clip` marker shown as a dot on the timeline with its Clip ID
- Tap marker → see: Clip ID, timestamp, viewer name, original message, [Generate Clip] button

**Deliverable:** During a live stream, every `!clip` in chat creates a timestamped marker visible on the Android timeline and synced to the cloud (editors can see them too).

---

## Phase 4 — Stream Viewer Workspace (Week 7)
**Goal: A full synchronized stream workspace for creator and editor.**

### 4.1 Stream Workspace Screen
Split-panel layout:
- Left: YouTube video embed (no download needed for preview — use YouTube player)
- Right: Local chat playback panel (from Room DB, synced to video position)
- Bottom: Clip marker timeline

### 4.2 Chat Timeline Sync
- When creator seeks video to `01:42:17`, chat panel jumps to `01:41:30 → 01:43:00`
- This is a key UX differentiator: video + chat + clips feel like one synchronized timeline

### 4.3 Stream End Workflow
When YouTube live ends:
1. Stop live-chat capture
2. Flush local DB
3. Generate `chat.txt` and `chat.json` files
4. Finalize all clip markers
5. Sync stream metadata to cloud
6. Prompt creator: "Analyze with AI?" (optional)

Chat exports format:
- TXT: `[19:41:12] User123: What GPU are you using?`
- JSON: full structured export with `streamId`, `messages[]`

**Deliverable:** After a stream, creator has a full synchronized workspace: video + chat + clips on one screen.

---

## Phase 5 — Clip Generator (Weeks 8–9)
**Goal: Creator/editor can generate and download clips on-device using yt-dlp + FFmpeg.**

### 5.1 Clip Range Selection
On tapping a clip marker:
- Show BEFORE options: 30s, 1m, 5m, 10m, Custom
- Show AFTER options: 30s, 1m, 5m, 10m, Custom
- Show calculated START / END / DURATION
- Allow direct editing of Start and End timestamps
- Prevent negative start times (clamp to `00:00:00`)

### 5.2 Download Engine
Pipeline on device:
```
Clip request → YouTube video URL → yt-dlp → FFmpeg → MP4 → local storage
```
- Bundle or manage compatible yt-dlp + FFmpeg binaries (do not require creator to install CLI tools)
- **Fast mode:** stream-copy where practical (fastest)
- **Precise mode:** re-encode with FFmpeg for exact cut points

Quality options: Original/Best, 1080p, 720p, 480p (only show qualities actually available from source)

Output: `MP4 / H.264 / AAC` for MVP

### 5.3 File Naming & Local Folder Structure
File name: `LiveHellBoy_CLP-000123_01h42m17s.mp4`

Folder structure:
```
Digicast/
├── Streams/2026/09/21/Stream_001/
│   ├── stream.json
│   ├── chat.txt
│   └── chat.json
└── Clips/2026/09/21/Stream_001/
    ├── CLP-0001.mp4
    └── CLP-0002.mp4
```
- Use shared/media storage (not app-private storage) so files survive app uninstall
- Let creator choose default clip folder

### 5.4 Download Job State Machine
`QUEUED → SOURCE_CHECK → FETCHING → DOWNLOADING → FFMPEG → VERIFYING → SAVED → TELEGRAM_UPLOADING → TELEGRAM_COMPLETE`

Failure states: `source_unavailable`, `video_not_ready`, `download_failed`, `ffmpeg_failed`, `storage_failed`, `telegram_failed`, `cancelled`

### 5.5 Resilience
- Clip cache: if the same clip (same CLP ID, start, end, quality) already exists locally → skip download
- VOD readiness check: YouTube VOD may take time to process after stream ends — poll periodically, show "VOD Processing" state
- Clip retry: reuse same Clip ID, create new job attempt (do not create duplicate CLP IDs)

**Deliverable:** Creator taps a clip marker, selects range, generates and downloads the clip on their device. Progress shown in real-time.

---

## Phase 6 — Telegram Delivery (Week 10)
**Goal: Clips automatically delivered to creator's Telegram editing group after download.**

### 6.1 Telegram Bot Setup
- Create one central `@YourProductBot`
- Bot serves all workspaces — do NOT create a bot per creator

### 6.2 Creator Connection Flow
1. Creator opens Settings → Telegram → Connect
2. App generates a 6-character connection code (e.g. `A7X91K`)
3. Creator sends `/start A7X91K` to the bot
4. Backend verifies code, links workspace to Telegram account

### 6.3 Group Connection
1. Creator adds bot to their private editing Telegram group
2. Settings → Telegram → Connect Group
3. Bot detects the group, creator confirms
4. Never auto-attach without explicit confirmation

### 6.4 Clip Upload Flow (Security-First)
Do NOT put bot token in the APK. Use a relay:
```
Android → authenticated upload session → Cloud Run relay → Telegram Bot API → Creator Group
```
The Cloud Run relay:
- Authenticates the creator/device
- Verifies workspace + Telegram permission
- Streams clip to Telegram
- Does NOT store clip permanently
- Deletes temp data immediately after upload

### 6.5 File Size Strategy
- Local master clip: highest available quality
- Telegram copy: H.264, lower bitrate, ≤50 MB (auto-compress with FFmpeg before upload)

### 6.6 Creator Workflow (No Extra Button)
```
Download → yt-dlp → FFmpeg → Save locally → Auto-upload to Telegram group
```
Show progress:
```
Downloading... 82%
✓ Clip generated
✓ Saved to device
↗ Sending to Telegram...
✓ Telegram uploaded
```

**Deliverable:** After generating a clip, it automatically appears in the creator's Telegram editing group with no extra steps.

---

## Phase 7 — Editor Workflow & Web Dashboard (Weeks 11–12)
**Goal: Editor can join workspace, view marker timeline, and download clips on web.**

### 7.1 Editor Invitation
- Creator: Team → Invite Editor → enter email
- Editor receives email (via Resend): "You've been invited to LiveHellBoy Workspace"
- Editor accepts, signs in with Google, joins workspace

### 7.2 Editor Permissions (Default)
- ✅ View streams, ✅ View clip markers, ✅ Generate clips, ✅ Download clips
- ❌ Connect YouTube, ❌ Manage billing, ❌ Manage Telegram, ❌ Use creator Telegram upload
- Creator can optionally grant: "Allow this editor to upload through Telegram"

### 7.3 Web Dashboard — Creator View
- Dashboard: recent streams, live status, message count, clip marker count
- Stream workspace: video embed + chat preview + timeline
- Clips screen: list all markers with generate/download status filters
- Team screen: list editors with per-editor permission toggles
- Settings: YouTube connection, Telegram connection, billing

### 7.4 Web Dashboard — Editor View
- My Assigned Clips: list of clips assigned by creator
- Per clip: generate / download button
- No Telegram controls unless explicitly granted
- Telegram Audit Log (creator-only): who uploaded what and when

### 7.5 Native Clip Engine for Editors (Later)
- Web browser cannot run yt-dlp + FFmpeg — architecture is intentional
- Initial: Editor downloads clip on Android app or via web-triggered job to creator's device
- Later: Windows/macOS Desktop Companion app receives clip jobs from web dashboard

**Deliverable:** Editor can log in to the web dashboard, see assigned clips, and download them. Creator manages the full team from web.

---

## Phase 8 — AI Chat Analysis (Week 13)
**Goal: Optional, creator-triggered AI analysis of stream chat.**

### 8.1 Consent & Data Minimization
Before any upload, show clear consent screen:
- What will be uploaded: chat messages, timestamps, author names (optional)
- What will NOT be uploaded: local video, unrelated streams
- Scope options: Entire stream / Last 30 min / Last 60 min / Custom range

Creator explicitly presses [Upload & Analyze] — never automatic.

### 8.2 AI Output
- Stream summary
- Viewer questions (ranked)
- Viewer requests / content ideas
- Feedback highlights
- High-interest moments with timestamps — linked directly to clip markers
- Most engaged topics per clip marker (e.g. CLP-002 = 87 messages, RTX discussion, 14 questions)

### 8.3 Cost Controls
- MVP: one analysis per stream, triggered manually at stream end
- AI caching: hash `streamId + chatVersion + analysisType` — do not re-run if chat unchanged
- Offer three privacy modes: Local Only / One-Time AI (delete after analysis) / Cloud Archive

**Deliverable:** Creator can trigger AI analysis at end of stream, get a structured summary, and see which clip markers were highest engagement — linked to one-click clip generation.

---

## Phase 9 — Subscription & Billing (Week 14)
**Goal: Stripe-powered subscription with free trial.**

### Plans

| Plan | Channels | Editors | AI Analyses | Telegram Groups |
|---|---|---|---|---|
| Creator (free trial) | 1 | 1 | Limited | 1 |
| Pro | 1–2 | Multiple | More | Multiple |
| Team | Multiple | Many | Advanced | Multiple |
| Agency | Many | Many | Max | Many |

- 7–14 day free trial: full clip system, limited AI, 1 channel, 1 editor
- Do not offer unlimited AI at launch
- Price dimensions: connected channels, editor seats, monthly AI analyses, Telegram destinations

---

## Phase 10 — Polish, Notifications & Launch (Week 15–16)
**Goal: Production-ready, stable, secure.**

### 10.1 Notifications
- Android: `🔴 Stream detected`, `🎬 New clip marker`, `✓ Clip generated`, `⚠ VOD not ready`, `⚠ Telegram upload failed`
- Email (Resend): editor invitations, billing confirmations, device login alerts, Telegram connection notices

### 10.2 Error Handling
- Every operation shows user-friendly error with possible causes and [Retry]
- No raw stack traces shown to users
- Telegram and download retried independently (don't re-download clip if only Telegram failed)

### 10.3 Storage Management UI
- Show Digicast storage used vs available
- Allow: delete clip, delete all clips from stream, clear generated clips (with confirmation)

### 10.4 Security Hardening
- Android Keystore for sensitive tokens
- HTTPS everywhere
- Short-lived session tokens
- Role-based access control + workspace-level authorization enforced server-side
- Logs never contain: OAuth tokens, refresh tokens, bot tokens, private chat contents
- Telegram webhook validates: secret token, expected bot identity, known chat ID

### 10.5 Analytics (Internal)
Track: streams, messages, clip markers, generated clips, downloaded clips, Telegram uploads, editor activity

---

## What We're NOT Building in MVP
- Vertical/square clip exports (comes after MVP)
- Face/subject tracking, captions, watermarks, auto-crop
- Windows/macOS desktop companion app
- Multiple Telegram destinations per workspace
- Live AI analysis during stream
- Custom !clip commands (`!clip 5`, `!mark`)
- H.265/VP9/AV1 output formats

---

## Suggested Build Order (Summary)

| Week | Focus |
|---|---|
| 1–3 | Foundation: Auth, Firebase, Firestore schema, Android Room setup |
| 4–5 | Live chat capture: Foreground Service, !clip detection, local DB |
| 6 | Clip markers: timeline UI, cloud sync |
| 7 | Stream workspace: synchronized video + chat + timeline |
| 8–9 | Clip generator: yt-dlp + FFmpeg on-device, file naming, job state machine |
| 10 | Telegram delivery: bot setup, Cloud Run relay, auto-upload |
| 11–12 | Editor workflow + Web dashboard |
| 13 | AI chat analysis (optional, consent-first) |
| 14 | Subscription & billing (Stripe) |
| 15–16 | Polish: notifications, error handling, storage management, security hardening |

---

*Document generated from product brief: "Creator Live Intelligence, Local Chat Capture, Clip Workspace & Editor Delivery Platform"*
