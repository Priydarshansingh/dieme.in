# Digicast: Editors & Streamers Ecosystem — Architecture & Phased Execution Plan

## Executive Summary
This document establishes the architectural blueprint, folder decoupling strategy, API contracts, security perimeter, and sequential milestone phases for expanding **Digicast** into a comprehensive ecosystem for **Streamers and Video Editors**.

---

## 1. System Topology & Decoupled Architecture

The project is structured into **independently deployable, decoupled modules** communicating exclusively via secure REST/WebSocket APIs with zero client-side credential leaking.

```
                           +----------------------------------------+
                           |           Vercel Account B             |
                           |       [digicast-backend repo]          |
                           |                                        |
                           |  * Fastify/Next.js API Engine          |
                           |  * Relocated God Panel (Admin Portal)  |
                           |  * Double-Entry Currency Ledger        |
                           |  * Ads & 24h Pass Verification         |
                           |  * Subscriptions (₹29/149/449/999)     |
                           |  * AI Matchmaking Engine (Gemini)      |
                           |  * Tasks, Rewards & Affiliate System   |
                           +-------------------+--------------------+
                                               ^
                                               | Secure HTTPS (HMAC / JWT)
                 +-----------------------------+-----------------------------+
                 |                                                           |
+----------------+-------------------+                     +-----------------+-------------------+
|          Vercel Account A          |                     |             Android App             |
|       [digicast-web repo]          |                     |         [digicast-android]          |
|                                    |                     |                                     |
|  * Streamer & Editor Portal        |                     |  * Stream Chat & Overlay Engine     |
|  * Editor Showcase & Portfolio     |                     |  * On-Device Clip Trimmer           |
|  * Public Leaderboard & Ratings    |                     |  * Mobile Wallet & Ad-Watch Access  |
|  * AI Matchmaking Chatbot UI       |                     |  * Editor Discovery Screen          |
|  * Asset Library (Overlays/Frames) |                     |  * Foreground Service Live Capture  |
|  * Wallet, Tasks & Affiliate Hub   |                     +-------------------------------------+
|  * Built with Node/Next.js+shadcn  |
+------------------------------------+
                 |
                 v
+------------------------------------+
|        Desktop & Extensions        |
|    [digicast-public-extensions]    |
|                                    |
|  * OBS Browser Source Overlays     |
|  * Video Trimmer & Clip Engine     |
+------------------------------------+
```

### Module Responsibilities:
1. **`digicast-backend` (Separate Vercel Account / Separate Repository):**
   - **Central API Hub**: Microservices for auth verification, coins/transactions, subscriptions, AI matching, and affiliate accounting.
   - **Relocated God Panel**: The administrative control center moved out of the public web frontend. Accessible only by verified master superadmins via multi-factor authentication (MFA/RBAC).
   - **Ledger Security**: Authoritative database (Firestore / Supabase PostgreSQL) managing user balances. Clients NEVER mutate balances directly.
2. **`digicast-web` (Web Frontend):**
   - Client portal for Streamers and Editors built with **Next.js, React, Tailwind CSS, and shadcn/ui**.
   - Interfaces for Editor Portfolio, Public Leaderboard, AI Matchmaker Chat, Asset Marketplace, User Wallet & Task submission.
3. **`digicast-android` (Android Native App):**
   - Streamer capture utility with live chat indexing, on-device clipping, mobile ad-watching (24h pass unlock), and mobile editor finder.
4. **`digicast-extensions` (Stream Tools & Clip Automations):**
   - Facecam frames, green screen overlays, OBS browser docks, and local FFmpeg clip renderers.

---

## 2. Security Architecture & Threat Prevention

To prevent unauthorized balance modifications, counterfeit ad rewards, or API abuse:
- **Zero-Trust Wallet Architecture**:
  - Wallets are strictly append-only double-entry ledgers (`wallets/{uid}/ledger_entries/{entryId}`).
  - Balance = `SUM(credit) - SUM(debit)`. No writable `balance` field on the client side.
  - Transactions use idempotent idempotency keys (`idempotency_key`) to prevent duplicate payouts or double-spending.
- **Signed Ad Rewards (Proof-of-View)**:
  - Client initiates ad session: backend issues a cryptographically signed nonced token (`ad_session_id`, `expires_at`, `signature`).
  - Upon ad completion callback / SDK verification, backend validates provider signature and grants 24-hour pass flag on the user profile (`ad_pass_expires_at = NOW() + 24 HOURS`).
- **God Panel Hardening**:
  - God Panel routes (`/godpanel/*`) are removed entirely from the customer-facing web repo and hosted exclusively inside `digicast-backend`.
  - Protected by strict IP whitelisting + Admin Secret Header / Firebase custom claims (`role === 'god_admin'`).
- **HMAC Request Integrity**:
  - Critical endpoints (task verification, payment webhooks, subscription tier grants) require SHA-256 HMAC request signing.

---

## 3. Core Feature Specifications

### 3.1 Editor Registration & Showcase Profiles
- **Profile Fields**: Name, Bio, Speciality (Montage, Shorts, Long-form, Gaming, IRL), Portfolio links (YouTube, Google Drive, Vimeo), Turnaround time (e.g. 24h, 48h), Rate card (₹ per min / ₹ per project).
- **Showcase Gallery**: Interactive video embed modal, before/after grading sliders, and style tags.
- **Verification Badge**: Admin-granted "Verified Pro Editor" badge.

### 3.2 Ratings & Public Leaderboards
- **Rating Formula**: 5-star scoring with weighted categories (Punctuality, Editing Quality, Communication).
- **Credit Score (Reputation)**: Points awarded for completed jobs and 5-star reviews; deducted for missed deadlines.
- **Leaderboard Categories**:
  - Top Rated Editors.
  - Most Active Editors.
  - Budget Champions (Best rates).

### 3.3 AI Matchmaking Bot
- **Streamer Flow**: Streamer chats with AI: *"I need a fast-paced Valorant montage editor who can turn around a 60s short in 24 hours under ₹500"*.
- **Backend Matching**: Embeddings / semantic filters matching prompt parameters with editor database.
- **Response**: Chat bot outputs **4 to 5 tailored editor profile cards** with live clips, pricing, and direct "Hire / Message" call to action.

### 3.4 Live Stream Assets Marketplace
- **Asset Types**:
  1. Facecam Overlays (animated borders, neon cyberpunk, minimal clean).
  2. Green Screen Effects (stream transitions, subscribe badges, memes).
  3. Custom Video Frames (gameplay capture borders).
  4. Live Frame Photos (still background cards, intermission screens).
- **Access Control**: Free tier assets, Ad-unlocked assets, or DP-purchasable premium asset packs.

### 3.5 Pricing, Subscriptions & Monetization
- **Free Trial**: 14 days full access by default (with admin switchable 30-day extended trial option).
- **Introductory Offer**: Month 1 at **₹29**.
- **Standard Plans**:
  - Monthly: **₹149 / month**.
  - Quarterly: **₹449 / 3 months** (~10% saving).
  - Annual: **₹999 / year** (~45% saving).
- **Target Projection Tracking**: Built-in God Panel KPI tracker (Milestone 1: 50 active paying subscribers @ ₹150 = ₹7,500/mo).
- **Ad-Supported Free Tier**: Watching 1 verified ad grants **24-hour uninterrupted access** to premium clip tools.
- **Trial Credits**: New signups receive trial credits valid for 5 to 10 days.

### 3.6 In-App Currency ("D" & "DP"), Tasks & Affiliate Program
- **Exchange Rate**:
  $$\mathbf{10\ D\ Coins = 1\ DP = ₹1\ (INR)}$$
- **Task-Based Earning**:
  - Custom tasks catalog (e.g., finding website development clients, sharing clips on Twitter, referring active streamers).
  - Task submission flow: user uploads screenshot/link proof.
  - Review: Admin inspects proof in God Panel and clicks "Approve & Pay" -> automatically credits D or DP to user ledger.
- **Usage Restrictions**:
  - **No external bank withdrawals** (strictly internal utility).
  - Spendable on subscriptions, watermark removal, asset packs, and editor contact credits.
- **Affiliate / Referral System**:
  - Unique referral link per user (`/ref/username`).
  - Referring streamers awards lifetime commission percentage (e.g., 10%–20%) on all subscription spending or awards 50 DP per active subscriber.

---

## 4. Step-by-Step Implementation Roadmap

Execution follows the strict rule: **Each phase must be verified with concrete proof before starting the next.**

| Phase | Title | Primary Deliverable | Verification Checkpoint |
|---|---|---|---|
| **Phase 1** | **Repository & Decoupled Folder Setup** | Setup `digicast-backend` structure and API contracts | Route baseline tests & package compilation |
| **Phase 2** | **Shift God Panel & Admin Control Center** | Relocate God Panel from `digicast-web` to `digicast-backend` with secure RBAC | God Panel login, admin authorization & API tests |
| **Phase 3** | **Dual Currency Ledger (D & DP) & Ads Engine** | Tamper-proof wallet, 10 D = 1 DP math, 24h Ad-watch pass | Ledger unit tests & ad grant verification |
| **Phase 4** | **Pricing, Subscriptions & Affiliate Engine** | ₹29 / ₹149 / ₹449 / ₹999 plans, 14d trial, referral engine | Plan simulation tests & commission calculation |
| **Phase 5** | **Editor Showcase, Profiles & Leaderboard** | Full editor profiles, rating system, public leaderboard UI | Profile creation, review submission & rank sorting |
| **Phase 6** | **AI Matchmaking Chatbot** | Streamer AI chat assistant returning 4-5 relevant editors | AI chat endpoint test with sample query |
| **Phase 7** | **Live Stream Asset Catalog** | Facecam, green screen, custom frame download & preview | Asset entitlement check & download verification |
| **Phase 8** | **Android App & Client Synchronization** | Connect mobile app with backend wallet, ads, & editors | Android Gradle build + End-to-end integration |

---

## 5. Directory Structure Plan

```
Youtube Creators/
|-- digicast-backend/            <-- [SEPARATE SERVICE / VERCEL REPO B]
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |   |-- wallet.controller.ts
|   |   |   |-- ads.controller.ts
|   |   |   |-- subscriptions.controller.ts
|   |   |   |-- tasks.controller.ts
|   |   |   |-- matchmaking.controller.ts
|   |   |   |-- affiliate.controller.ts
|   |   |-- middleware/
|   |   |   |-- auth.middleware.ts
|   |   |   |-- hmac.middleware.ts
|   |   |   |-- rate-limiter.middleware.ts
|   |   |-- godpanel/             <-- [RELOCATED GOD PANEL ADMIN DASHBOARD]
|   |   |   |-- components/
|   |   |   |-- pages/
|   |   |-- routes/
|   |   `-- services/
|   `-- package.json
|
|-- digicast-web/                <-- [FRONTEND REPO A: Next.js + shadcn/ui]
|   |-- src/
|   |   |-- app/
|   |   |   |-- (dashboard)/
|   |   |   |   |-- editors/      <-- Showcase & Registration
|   |   |   |   |-- leaderboard/  <-- Public rankings
|   |   |   |   |-- matchmaker/   <-- AI Matchmaker Bot
|   |   |   |   |-- assets/       <-- Overlays & Live Frames
|   |   |   |   |-- wallet/       <-- D & DP Coins, Tasks & Ads
|   |   |   |   |-- affiliate/    <-- Referral Hub
|   |   |   |   `-- pricing/      <-- ₹29, ₹149, ₹449, ₹999 Tiers
|   |   |   `-- (auth)/
|   |   |-- components/ui/        <-- shadcn components
|   |   `-- lib/api-client.ts     <-- Secure client to digicast-backend
|   `-- package.json
|
|-- digicast-android/            <-- [ANDROID MOBILE APP]
|   |-- app/src/main/java/com/digicast/app/
|   |   |-- data/remote/BackendApiService.kt
|   |   |-- ui/screens/
|   |   |   |-- wallet/
|   |   |   |-- ads/
|   |   |   `-- editors/
|   `-- build.gradle.kts
|
`-- digicast-extensions/         <-- [DESKTOP & CLIP PLUGINS]
```
