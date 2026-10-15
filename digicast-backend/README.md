# Digicast Backend — Core API Engine & Relocated God Panel 🛡️⚡

A decoupled, zero-trust backend microservice and administrative control center for the **Digicast** creator ecosystem. Deployed independently on a dedicated Vercel account.

---

## 🌟 Architectural Role & Responsibilities

`digicast-backend` serves as the authoritative, tamper-proof backend hub powering the Digicast ecosystem across web and mobile clients:

1. **Relocated God Panel (Admin Portal):** Master superadmin control center moved completely out of the public web frontend to prevent client-side credential exposure.
2. **Double-Entry Virtual Currency Ledger:** Manages "D" Coins and "DP" balances. Balance cannot be directly mutated by clients; all changes are append-only verified ledger transactions.
3. **Ad-Supported 24-Hour Access Engine:** Issues cryptographically signed nonced session tokens and validates proof-of-view to grant 24h uninterrupted stream passes.
4. **Subscription & Monetization Engine:** Manages creator subscription tiers, trial credits, and revenue milestone tracking.
5. **Community Task Verification Queue:** Review submitted task proofs (e.g. client acquisitions, social promotion) and credit user wallets with one click.
6. **15% Lifetime Affiliate Commission System:** Automatically tracks referral codes and credits recurring commissions into affiliate wallets.
7. **Streamer AI Matchmaking API:** Evaluates streamer requirement prompts and semantically matches top 4–5 verified editor profiles with live sample reels.

---

## 💎 Virtual Currency System Mathematics

$$\mathbf{10\text{ D Coins} = 1\text{ DP} = ₹1\text{ INR}}$$

- **D-Coins:** Earned as micro-rewards (e.g. +5 D-Coins per sponsored ad view, social sharing).
- **DP (Digicast Points):** Main in-app purchasing currency. 1 DP = ₹1 INR.
- **Conversion:** Users can convert accumulated D-Coins into DP in multiples of 10.
- **Withdrawal Restriction:** Earned balances **cannot** be withdrawn to external bank accounts. Balances are strictly utility tokens spent inside the platform on subscriptions, watermark removal (29 DP), and premium live stream assets.

---

## 💳 Pricing & Monetization Structure

| Plan ID | Name | Price (INR) | DP Cost | Duration | Key Inclusions |
|---|---|---|---|---|---|
| `FREE_TRIAL_14` | **14-Day Free Trial** | ₹0 | 0 DP | 14 Days | Includes 10-day trial credits, live chat capture & clipping. |
| `INTRO_FIRST_MONTH_29` | **Introductory Offer** | ₹29 | 29 DP | 30 Days | Special launch rate for Month 1, watermark removal. |
| `STANDARD_MONTHLY_149` | **Standard Monthly** | ₹149 | 149 DP | 30 Days | Full Pro access, AI Matchmaking Bot, Telegram relay. |
| `QUARTERLY_449` | **Quarterly Pass** | ₹449 | 449 DP | 90 Days | Save ~10%, includes 50 bonus D-Coins. |
| `ANNUAL_999` | **Annual VIP** | ₹999 | 999 DP | 365 Days | Save ~45% (Only ~₹83/mo), includes 200 bonus D-Coins. |

### 🎯 Primary Revenue Milestone
- **Target:** 50 Active Paying Subscribers @ ~₹150/month.
- **Projected Revenue:** **₹7,500 / month**.
- Real-time progress bar tracked live inside the God Panel.

---

## 🔒 Security Perimeter & Threat Prevention

- **PBKDF2 Password Hashing:** 100,000 salt-hash iterations for root God Panel administrative authentication.
- **Cryptographic HMAC-SHA256:** Request signing with constant-time (`crypto.timingSafeEqual`) checks to protect against timing attacks.
- **Nonced Ad Sessions:** Single-use nonces with 15-minute TTL preventing replay attacks or counterfeit ad-watch reward claims.
- **Double-Entry Append-Only Ledger:** Balance = $\sum(\text{credits}) - \sum(\text{debits})$. Idempotency keys (`idempotencyKey`) prevent double-spending or duplicate reward payouts.

---

## 📡 Complete API Reference

### Health & Security
- `GET /api/health` — System status, uptime, and enabled security feature flags.
- `POST /api/security/verify` — Validates HMAC-SHA256 client signatures.

### Relocated God Panel (Admin Portal)
- `POST /api/godpanel/login` — SuperAdmin login; sets secure HTTP-only session cookie.
- `GET /api/godpanel/session` — Verifies admin session token or `X-Admin-Key`.
- `POST /api/godpanel/logout` — Destroys admin session cookie.
- `GET /api/godpanel/overview` — Real-time telemetry: users, active subscribers, ₹7,500 milestone progress, DP circulation, and pending tasks.

### Currency & Wallet
- `GET /api/wallet/balance?uid=...` — Returns D-Coins, DP balance, and equivalent INR.
- `POST /api/wallet/convert` — Converts D-Coins to DP (10 D = 1 DP).
- `POST /api/wallet/spend` — Deducts DP balance for watermark removal (29 DP) or subscriptions.

### Ad-Supported Free Tier (24h Pass)
- `POST /api/ads/session` — Issues signed nonced session token with 15-minute validity.
- `POST /api/ads/verify-view` — Validates ad completion proof, extends access by 24 hours, and credits 5 D-Coins.
- `GET /api/ads/status?uid=...` — Checks active 24h pass validity and remaining hours.

### Tasks & Community Earning
- `GET /api/tasks` — Lists open earning tasks (e.g. Finding web dev clients, social posts).
- `POST /api/tasks` — User submits proof URL and notes for God Panel review.
- `PATCH /api/tasks` — Admin reviews proof; on approval, automatically credits the user's ledger.

### Subscriptions & Affiliate
- `GET /api/subscriptions/plans` — Returns pricing tiers and milestone details.
- `POST /api/subscriptions/subscribe` — Activates plan via Free Trial, DP balance, or payment gateway, and credits 15% lifetime affiliate commission.
- `GET /api/affiliate?uid=...` — Returns user's referral code, link, and lifetime commission stats.

### Editors & AI Matchmaking
- `GET /api/editors` — List editors with category and rate filtering.
- `POST /api/editors` — Register new editor showcase profile.
- `GET /api/editors/leaderboard` — Returns ranked editors calculated via composite score formula:
  $$\text{Score} = (\text{Rating} \times 20) + (\text{Reviews} \times 2) + \text{Credits}$$
- `POST /api/matchmaking` — Evaluates streamer prompt and returns top 4–5 matched editors with sample reels.

### Live Stream Assets
- `GET /api/assets` — Lists overlays, green screens, custom video frames, and live photo frames.
- `POST /api/assets/download` — Verifies entitlement (Free, 24h Ad Pass, or DP coin purchase) and issues download.

---

## 🛠️ Environment Configuration

Create a `.env.local` file with the following variables:

```env
PORT=3001
NODE_ENV=development

# Security & Master Admin Keys
DIGICAST_HMAC_SECRET=your_super_secure_hmac_secret_key
ADMIN_MASTER_API_KEY=godpanel_master_secret_key_superadmin_auth_9988
ROOT_ADMIN_PASSWORD=DigicastGod2026!#
CLIENT_WEB_URL=http://localhost:3000

# AI Matchmaking
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 Local Development & Testing

```bash
# Install dependencies
npm install

# Run development server on port 3001
npm run dev

# Run automated verification tests
npm run test:health
node scripts/test-phase1.js
node scripts/test-phase2.js
node scripts/test-phase3.js

# Build production bundle
npm run build
```

---

## ☁️ Deployment on Vercel (Dedicated Account B)

1. Push this repository to GitHub: `https://github.com/Priydarshansingh/digicast-backend.git`
2. Connect the repository to your dedicated **Vercel Account B**.
3. Configure the environment variables (`DIGICAST_HMAC_SECRET`, `ADMIN_MASTER_API_KEY`).
4. Deploy! The God Panel will be immediately accessible at `https://your-backend.vercel.app/godpanel`.
