# Digicast Web Portal — Creator, Streamer & Editor Dashboard 🚀

Frontend web application for the **Digicast** live stream intelligence and clip delivery platform.

🔗 **Backend & God Panel Service:** [https://github.com/Priydarshansingh/digicast-backend](https://github.com/Priydarshansingh/digicast-backend)  
📦 **Extensions & Assets Repo:** [https://github.com/Priydarshansingh/Digicast](https://github.com/Priydarshansingh/Digicast)

---

## 🌟 Tech Stack
- **Framework:** Next.js 14 (App Router, Node.js runtime)
- **Styling:** Vanilla CSS + Tailwind CSS + shadcn/ui components (`@radix-ui/*`, `lucide-react`)
- **State & Data Fetching:** React Hooks, SWR, Zustand
- **Auth & Database Client:** Firebase Auth & Firestore client

---

## 🎯 Key Application Routes

| Route | Title | Description |
|---|---|---|
| `/dashboard` | **Creator Dashboard** | Live stream status, recent clips, channel statistics. |
| `/editors` | **Editors Showcase** | Portfolio gallery with video embed previews, rate cards, and editor registration modal. |
| `/leaderboard` | **Editor Leaderboard** | Public rankings table and #1 Gold, #2 Silver, #3 Bronze podium cards. |
| `/matchmaker` | **AI Matchmaker Bot** | Streamer chatbot matching top 4–5 relevant editors per requirement prompt. |
| `/assets` | **Stream Assets Store** | Facecam borders, green screen effects, custom video frames, and live photo frames. |
| `/wallet` | **Coins, Tasks & Ads** | D & DP balances, 10:1 converter, watermark removal unlock, and task submission modal. |
| `/pricing` | **Subscriptions & Affiliate** | Plans (₹29 intro, ₹149/mo, ₹449, ₹999), 14d trial, DP checkout, and 15% affiliate link. |
| `/godpanel` | **God Panel Redirection** | Security portal redirecting to the isolated backend control center (`http://localhost:3001/godpanel`). |

---

## 🚀 Running the Web App

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Production build
npm run build
```
