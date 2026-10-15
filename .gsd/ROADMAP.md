# Digicast Roadmap: Editors & Streamers Ecosystem

## Milestones & Phased Execution

### Phase 1: Modular Decoupling & Backend Service Scaffolding
- [ ] Scaffold `digicast-backend` as an independent Node/TypeScript service ready for separate Vercel repo deployment.
- [ ] Establish shared API schema & TypeScript contracts.
- [ ] Configure zero-trust HMAC & JWT security gateway.
- [ ] *Verification*: Backend build test & initial healthcheck ping.

### Phase 2: Shift God Panel (Admin Portal) to Backend
- [ ] Move `/godpanel` completely out of `digicast-web` and relocate into `digicast-backend`.
- [ ] Implement Admin Authentication, IP security, and superadmin RBAC.
- [ ] Setup unified Admin view for users, tasks, coins, and revenue.
- [ ] *Verification*: God panel authentication and admin route access tests.

### Phase 3: Dual Currency Engine ("D" & "DP") & Ads Verification
- [ ] Implement append-only wallet ledger (10 D Coins = 1 DP = ₹1 INR).
- [ ] Prevent external bank withdrawals; enable in-app balance utility.
- [ ] Build Ad-watch verification endpoint issuing signed 24-hour access passes.
- [ ] Build Task creation & submission flow (user submits proof, admin approves in God Panel).
- [ ] *Verification*: Ledger math validation, double-spending prevention tests, ad token grant tests.

### Phase 4: Subscriptions, Pricing Plans & Affiliate System
- [ ] Implement subscription tiers: ₹29 (Month 1), ₹149/mo, ₹449/quarter, ₹999/year.
- [ ] Support 14-day & 30-day free trials + 5-10 day trial credits.
- [ ] Add revenue projection counter (targeting 50 users = ₹7,500/mo).
- [ ] Implement affiliate tracking links with lifetime commission or coin rewards.
- [ ] *Verification*: Subscription checkout simulation and affiliate commission attribution tests.

### Phase 5: Editor Registration, Profiles & Public Leaderboard
- [ ] Build Editor onboarding & portfolio showcase with past work video embeds and rate cards.
- [ ] Implement 5-star ratings, reviews, and reputation credit scores.
- [ ] Create public Leaderboard with filtering by style, rating, and pricing using shadcn/ui.
- [ ] *Verification*: Editor profile creation, rating calculation, and leaderboard rendering.

### Phase 6: Streamer AI Matchmaking Bot
- [ ] Build AI chat interface for streamers requesting video editors.
- [ ] Integrate Gemini API to analyze requirements and match top 4-5 relevant editors.
- [ ] Provide interactive cards with editor samples and direct contact action.
- [ ] *Verification*: Test matchmaking with sample streamer prompt returning 4-5 matched profiles.

### Phase 7: Live Stream Assets Marketplace
- [ ] Implement catalog for facecam overlays, green screens, custom video frames, and live frame photos.
- [ ] Connect entitlement checks (Free, Ad-unlocked, or DP coin purchase).
- [ ] *Verification*: Asset preview and download entitlement verification.

### Phase 8: Mobile (Android) Sync & Multi-Client Verification
- [ ] Wire Android app Retrofit/Ktor clients to the backend APIs.
- [ ] Implement mobile wallet view, 24h ad pass unlock, and editor discovery.
- [ ] *Verification*: Full Android Gradle build (`assembleDebug`) and end-to-end API test.
