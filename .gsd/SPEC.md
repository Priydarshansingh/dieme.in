# Digicast Specification: Editors & Streamers Ecosystem
Status: FINALIZED
Date: 2026-10-15

## 1. Scope & Goals
Build an end-to-end platform for YouTube Streamers and Video Editors featuring:
- Dedicated Editor Registration, Portfolios & Showcase galleries
- Star Ratings & Public Leaderboards
- AI Matchmaking Bot (Gemini-powered matching top 4-5 editors per streamer request)
- Live Stream Assets Library (facecams, green screens, frames)
- Subscriptions & Monetization: 14/30-day trials, ₹29 intro, ₹149/mo, ₹449/3-mo, ₹999/yr, ₹7,500/mo initial milestone tracking
- Ad-Supported Free Tier: 1 verified ad impression = 24h feature pass
- Dual-Currency System: 10 D Coins = 1 DP = ₹1 INR (internal only, non-withdrawable)
- Task-Based Balance Earning & Affiliate/Referral System
- Architectural Decoupling:
  - Separate `digicast-backend` repository & Vercel deployment
  - Shift God Panel (Admin Panel) completely to the backend service with high security
  - All clients (`digicast-web`, `digicast-android`, `digicast-extensions`) communicate through secure APIs with zero client-side privilege leaks.

## 2. Decoupled Architecture & Security
- `digicast-backend`: Node/TypeScript microservice + Relocated God Panel. Double-entry wallet ledger, ad-watch tokens, task approval queue, AI matchmaker endpoint.
- `digicast-web`: Next.js + Tailwind + shadcn/ui. Public portal for streamers and editors.
- `digicast-android`: Jetpack Compose app connecting to backend APIs.
- `digicast-extensions`: OBS tools & stream assets.
