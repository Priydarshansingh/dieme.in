# Digicast — YouTube Creators Platform & Stream Intelligence 🎬⚡

Official repository for the **Digicast Web Portal** (`digicast-web`) and **Digicast Native Android App** (`digicast-android`).

🔗 **Decoupled Backend & God Panel Repo:** [https://github.com/Priydarshansingh/digicast-backend](https://github.com/Priydarshansingh/digicast-backend)  
📦 **Official Extensions & Assets Repo:** [https://github.com/Priydarshansingh/Digicast](https://github.com/Priydarshansingh/Digicast)

---

## 🌟 What is Digicast?

**Digicast** is an all-in-one highlight capture, stream intelligence, and creator monetization ecosystem designed for YouTube livestreamers, video creators, and professional editors.

It combines a local-first **Android App** (for on-device live chat analysis and lossless video trimming) with a high-performance **Web Dashboard** (for editor matchmaking, asset downloads, public leaderboards, in-app currency, and subscription management).

---

## ✨ Full Working Features & Modules

### 1. 🎬 Editor Showcase & Portfolio Profiles (`/editors`)
- Dedicated showcase gallery for video editors.
- Filter by category: **Gaming Montages**, **YouTube Shorts / Reels**, and **Long-Form IRL Vlogs**.
- Video portfolio embed modals with direct YouTube / Drive playback.
- Turnaround time indicators and transparent rate cards (₹ per short / ₹ per long-form min).
- **"+ Register as Editor"** self-onboarding modal for creators to publish their editing reels.

### 2. 🏆 Public Ratings & Leaderboards (`/leaderboard`)
- Top 3 Podium Cards (#1 Gold, #2 Silver, #3 Bronze) showcasing top-rated video editors.
- Complete rankings table with average star ratings (1.0 to 5.0), verified job counts, and reputation credits.
- Mathematical composite scoring formula:
  $$\text{Composite Score} = (\text{Star Rating} \times 20) + (\text{Review Count} \times 2) + \text{Reputation Credits}$$

### 3. 🤖 Streamer AI Matchmaker Bot (`/matchmaker`)
- Interactive AI chat assistant for streamers seeking tailored video editors.
- Preset prompts:
  - *"Need a fast-paced Valorant montage editor with 24h delivery under ₹400"*
  - *"Looking for a narrative storytelling editor for my 3-hour IRL stream VOD"*
  - *"Need quick YouTube shorts cutter with meme sound effects under 12 hours"*
- Evaluates editor database and dynamically returns **4 to 5 tailored Editor Match Cards** with match percentages (e.g., 98% Match), key strengths, sample reels, rates, and direct hire actions.

### 4. 🎨 Live Stream Assets Marketplace (`/assets`)
- Ready-to-use stream graphics for OBS Studio and Streamlabs across 4 curated categories:
  1. **Facecam Overlays:** Neon Cyberpunk animated webcam borders, Minimal Titanium audio visualizer borders (`.webm`).
  2. **Green Screen FX:** Chroma-key ready 3D YouTube subscribe buttons, Glitch intermission scene transitions (`.mp4`).
  3. **Custom Video Frames:** Esports tactical stream HUDs, Dual-camera talk-show split layouts (`.png`).
  4. **Live Frame Photos:** Lo-Fi studio backgrounds, Cyberpunk intermission "Stream Starting Soon" cards (`.jpg`).
- Built-in preview modal and step-by-step OBS Studio setup guide.

### 5. 💎 Dual Virtual Currency System ("D" & "DP") (`/wallet`)
- **Conversion Formula:**
  $$\mathbf{10\text{ D Coins} = 1\text{ DP} = ₹1\text{ INR}}$$
- **D-Coins:** Micro-currency earned by watching sponsored ads (+5 D-Coins) or completing social growth tasks.
- **DP (Digicast Points):** Main purchasing currency. 1 DP = ₹1 INR.
- **In-App Feature Unlocks:** Users can spend DP balance directly to unlock **Permanent Watermark Removal** (29 DP) or subscribe to plans without credit cards.
- **Withdrawal Restriction:** Enforced by code and policy — balances cannot be withdrawn to external bank accounts.

### 6. 📋 Task-Based Earning Hub (`/wallet` & Backend Queue)
- Users without cash can earn app balance by completing custom tasks:
  - *Find 1 Client for Website Development* &rarr; **Earn 50 DP (₹50)**
  - *Post Live Stream Clipping Showcase on Twitter / YouTube* &rarr; **Earn 150 D-Coins (15 DP)**
  - *Refer 3 Livestream Editors* &rarr; **Earn 100 DP (₹100)**
- Task proof submission modal (URL and applicant notes) reviewed directly by admins in the God Panel.

### 7. 📺 Ad-Supported Free Tier (24h Pass) (`/wallet`)
- Free users can access premium live intelligence and on-device clipping by watching sponsored video ads.
- Watching 1 verified ad grants **24 hours of uninterrupted Pro access** + 5 bonus D-Coins.
- Cryptographically verified on the backend via nonced session tokens.

### 8. 💳 Transparent Subscription Plans & Monetization (`/pricing`)
- **14-Day Free Trial:** Full feature access with zero payment details + **10-day trial credits**.
- **Introductory Offer (Month 1):** Only **₹29** for the first 30 days.
- **Standard Monthly Plan:** **₹149 / month**.
- **Quarterly Plan (Save ~10%):** **₹449 / 3 months** + 50 bonus D-Coins.
- **Annual VIP Plan (Save ~45%):** **₹999 / year** (~₹83/month) + 200 bonus D-Coins.
- **Primary Revenue Milestone Tracker:** 50 Paying Users @ ~₹150/mo = **₹7,500 monthly run-rate**.
- **Dual Payment Option:** Subscribe via real INR (Razorpay) OR with in-app DP balance earned from tasks!

### 9. 🎁 15% Lifetime Affiliate Program (`/pricing`)
- Custom shareable referral links (`/login?ref=REF_...`).
- Earn a **15% Lifetime Recurring Commission** on all subscription spending from referred streamers, automatically credited as DP into your wallet.

---

## 📱 Digicast Android App (`digicast-android`)

Native Android mobile application built with **Kotlin, Jetpack Compose, Room (SQLite), and WorkManager**:
- **Foreground Service Live Chat Capture:** Continuous local YouTube chat capture with persistent notification.
- **On-Device Trimming:** yt-dlp + FFmpeg video extraction running locally on the device for privacy.
- **Mobile Wallet & Ad Rewards:** Native integration with backend API for balance checking and claiming 24h ad-watch passes.
- **Editor Discovery:** Discover top video editors directly on mobile.
- **Build Output:** Compiled debug APK generated at [`build output/app-debug.apk`](build output/app-debug.apk).

---

## 🚀 Running the Frontend Locally

```bash
# Install frontend dependencies
npm install

# Run Next.js creator portal on http://localhost:3000
npm run dev

# Run full multi-phase verification test suite
node scripts/test-all-phases.js
```

---

## 🛠️ Building the Android App

```bash
cd digicast-android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleDebug copyDebugApkToBuildOutput
```

---

## 📄 License
Open Creator License &copy; 2026 Digicast Ecosystem. All rights reserved.
