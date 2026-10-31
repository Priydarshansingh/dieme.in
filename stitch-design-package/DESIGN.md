# DESIGN.md — Digicast Design System & UI Specification

> **Version:** 2.0.0  
> **Brand:** Digicast — Creator Live Intelligence Platform  
> **Platforms:** Android Native (Jetpack Compose) & Web (Next.js 14, Tailwind CSS, React)  
> **Aesthetic Core:** Cyber-Editorial Stealth, Tactile Dark Mode, Broadcast Telemetry Precision  
> **Standard:** Open-Source `DESIGN.md` Standard for Stitch, Figma, & AI Design Engines  

---

## 1. Executive Vision & Brand Identity

**Digicast** is the high-velocity live intelligence platform built for gaming creators, esports broadcasters, and video editors. It transforms live YouTube and gaming broadcasts into viral short-form clips through real-time chat sentiment analysis, audio spikes, and automated moment detection.

### Core Experience Pillars
1. **Broadcast Cockpit Experience:** High-contrast, matte obsidian canvas with laser-focused telemetry. Zero visual noise or unnecessary decorations.
2. **Tactile Depth & Glassmorphism:** Micro-specular hairline borders, subtle ambient glow blooms, and dark frosted glass layers (`backdrop-filter: blur(16px)`).
3. **Cross-Platform Parity:** A single visual language shared seamlessly between the Android mobile app, desktop web dashboard, and backend services.
4. **Professional Vector Iconography:** Strict zero-emoji policy across all status chips, buttons, and telemetry HUDs. All icons must be clean Material 3 / Lucide vectors.

---

## 2. Color System & Design Tokens

A single, unified palette shared across **Tailwind CSS (`digicast-web`)** and **Jetpack Compose (`digicast-android`)**.

### 2.1 Canvas & Surface Tokens (Dark Canvas First)

| Token Name | Hex Code | HSL / Compose | Usage |
| :--- | :--- | :--- | :--- |
| `canvas-deep` | `#07080C` | `225, 30%, 4%` / `0xFF07080C` | Root app background, video viewport letterboxing, ultra-deep base. |
| `surface-deck` | `#0D111A` | `221, 33%, 8%` / `0xFF0D111A` | Secondary panels, bottom nav bar, top headers, search containers. |
| `surface-card` | `#111622` | `221, 33%, 10%` / `0xFF111622` | Base bento cards, broadcast cards, message rows, dialog bodies. |
| `surface-elevated` | `#161D2E` | `221, 35%, 14%` / `0xFF161D2E` | Elevated chips, active tabs, dropdown lists, interactive hover states. |
| `surface-glass` | `rgba(17, 22, 34, 0.75)` | Blur 16px | Frosted glass cards, overlay HUDs, modal sheets. |
| `border-hairline` | `rgba(255, 255, 255, 0.08)` | `#1E2638` / `0xFF1E2638` | Default 1px card and container specular borders. |
| `border-active` | `rgba(0, 240, 255, 0.4)` | `#00F0FF` / `0xFF00F0FF` | Active input focus rings, active tab indicators, selected cards. |

---

### 2.2 Brand Accents & Vibrancy

| Token Name | Hex Code | Tailwind / Role | Meaning / Function |
| :--- | :--- | :--- | :--- |
| `brand-cyan` | `#00F0FF` | `cyan-400` / Primary CTA | Primary brand accent, progress bars, active scrubbers, download triggers. |
| `brand-coral` | `#FF5C5C` | `rose-500` / Broadcast Live | Live stream indicator, "!clip" trigger moments, clutch highlights, bookmark action. |
| `brand-lime` | `#53FC18` | `lime-400` / Kick Neon | Real-time chat spike surge, online status, verified checkmarks. |
| `brand-violet` | `#A855F7` | `purple-500` / AI Intelligence | Automated AI clipping triggers, superchat telemetry, telegram sync. |
| `brand-amber` | `#FBBF24` | `amber-400` / Currency & Superchat | Monetization, revenue analytics, superchat highlight cards. |

---

### 2.3 Semantic Clip Type System

Every clip moment across Digicast is visually classified by a dedicated color and icon pair:

| Clip Type | Accent Color | Hex Code | Icon (Vector Only) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **HIGHLIGHT** | Emerald Green | `#10B981` | `Star` | Epic plays, victory royales, match milestones |
| **CLUTCH** | Sunset Coral | `#FF725C` | `Bolt` | 1v4 clutches, last-second survivals |
| **FUNNY** | Electric Cyan | `#06B6D4` | `SentimentSatisfied` | Chat memes, voice chat banter, stream fails |
| **KILLSTREAK** | Crimson Red | `#EF4444` | `Speed` | Rapid multi-kills, headshot sprees |
| **CHAT_SPIKE** | Electric Violet | `#8B5CF6` | `Forum` | Velocity surges, emote trains, !clip spam |
| **CUSTOM** | Slate Monochrome | `#94A3B8` | `ContentCut` | Manual timeline bookmarks created by creator |

---

### 2.4 Typography & Text Tokens

- **Display & Headings:** `Inter`, `Nunito`, or `Plus Jakarta Sans` — Tight tracking (`-0.03em`), bold to extrabold weight, crisp geometric cutouts.
- **Body & Controls:** `Inter` or system sans-serif — High x-height, comfortable line-height (`1.5`).
- **Telemetry & Numbers:** Tabular figures (`font-variant-numeric: tabular-nums`) or `JetBrains Mono` / Monospace for timestamps, viewer counts, and audio decibel levels.

| Token | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | `28px` / `1.75rem` | `800` (ExtraBold) | `34px` | Hero greeting, screen titles, landing headlines |
| `text-h1` | `20px` / `1.25rem` | `700` (Bold) | `26px` | Card section titles, modal headers |
| `text-h2` | `16px` / `1.0rem` | `600` (SemiBold) | `22px` | Stream titles, clip labels, segment headers |
| `text-body` | `14px` / `0.875rem` | `400` / `500` | `20px` | Standard chat messages, explanations, button labels |
| `text-caption` | `12px` / `0.75rem` | `500` / `600` | `16px` | Timestamps, badge chips, input labels |
| `text-micro` | `10px` / `0.625rem` | `700` (Bold) | `14px` | Tag pills (HOST, BOT, LIVE), metadata tags |

---

## 3. Surface Architecture & Geometry

### 3.1 Radii System
- **Pills & Badges:** `9999px` (Full circular radius for filter chips, live dots, status tags).
- **Cards & Viewports:** `14px` to `16px` (Modern bento cards with smooth squircle clipping).
- **Action Buttons & Inputs:** `10px` to `12px` (Clean tactile thumb-friendly touch targets).
- **Sub-chips & Dialogs:** `8px` to `12px`.

### 3.2 Border & Glow Styling
```css
/* Master Hairline Card */
border: 1px solid rgba(255, 255, 255, 0.08);
background: #111622;

/* Ambient Active Cyan Glow */
box-shadow: 0 0 24px -4px rgba(0, 240, 255, 0.15);
border-color: rgba(0, 240, 255, 0.4);

/* Live Broadcast Glow */
box-shadow: 0 0 20px -2px rgba(255, 92, 92, 0.25);
```

---

## 4. Key Component Anatomy & Specifications

### 4.1 Broadcast Monitor & Livestream Player
- **Aspect Ratio:** Fixed `16:9` widescreen hero view pinned to the top.
- **Chrome Elimination:** Clean native viewport without fake player stamps or cluttered watermarks. Official controls are accessible through clean overlays.
- **Top Bar Controls:** Left back button with stream name; Right live viewer count with pulsing `brand-coral` dot.

### 4.2 Interactive Scrubber Timeline (The Core Studio Feature)
- **Real-Time Playback Sync:** Actively tracks YouTube playback down to the exact second (`00:00 / 55:29`).
- **Scrubber Bar:** 
  - Track background: `#1E2638` (2px height).
  - Active progress: `brand-cyan` (`#00F0FF`).
  - Draggable Thumb: `brand-coral` (`#FF5C5C`) circular handle with tactile border.
- **Moment Pins Along Track:**
  - Distinct 20px circular pins plotted along track proportional to `(clipSec / totalDuration)`.
  - Color-coded to the Clip Type (Emerald, Coral, Cyan, Crimson, Violet).
  - Inside: Vector icon (`Star`, `Bolt`, `Speed`, `Forum`, `ContentCut`).
  - Tapping a pin instantly seeks the video to that moment and displays a HUD toast.
- **Quick Jump & Capture Deck:**
  - `-10s` Quick Jump (Rewind).
  - `+10s` Quick Jump (Fast Forward).
  - Primary Action: `Clip at [XX:XX]` (Captures the current playback second into a new clip marker).

### 4.3 Metric Bento Cards (App Home & Web Dashboard)
- **Layout:** 2x2 responsive grid on mobile, 4-column row on web desktop.
- **Card Style:** Refined dark glass `#111622` surface with subtle colored ambient edge lighting rather than flat toy pastel colors:
  1. **Card 1 (Viewers / Broadcast):** Subtle cyan glow bloom, `TrendingUp` icon, live counter, stream title.
  2. **Card 2 (Active Chatters):** Subtle emerald glow bloom, `Group` icon, messages captured, chatter count.
  3. **Card 3 (Clips Created):** Subtle coral glow bloom, `ContentCut` icon, rendered clip status.
  4. **Card 4 (Likes & Monetization):** Subtle violet/gold glow bloom, `Paid` icon, superchats and likes.

### 4.4 Clip Console & Trimmer Pipeline
- **Dual Tab Architecture:**
  - Tab 1: **Live Chat Replay** with synchronized timestamp highlighting, host/moderator badges (`HOST`, `BOT`, `SUPERCHAT`), and `!clip` trigger badges.
  - Tab 2: **Trim & Timing** with Pre-Roll selectors (`-15s`, `-30s`, `-45s`, `-60s`) and Post-Roll selectors (`+10s`, `+15s`, `+30s`, `+45s`).
- **Action Deck:**
  - Thumb-reachable bottom bar pinned above navigation.
  - States:
    - *Pending:* `Download & Render Clip (XXs)` with cloud pipeline status.
    - *Generated:* `Save MP4` (Phone storage) + `Telegram` (Direct Telegram dispatch) + `Share` (System intent).

---

## 5. Screen-by-Screen Structure

### Screen 1: Home Dashboard (`HomeScreen.kt` & `/dashboard`)
1. **Header:** Creator avatar, greeting ("Hello Creator"), online telemetry indicator.
2. **Search Bar:** Dark recessed search pill with slate placeholder.
3. **Bento Metric Rail:** 4 interactive glow cards with live counters.
4. **Broadcast Activity Wave:** Interactive sparkline chart with viewer wave and duration badge.
5. **Recent Streams / Quick Launch:** Horizontal stream cards with high-res thumbnails and status chips.

### Screen 2: Stream Console & Timeline (`StreamDetailScreen.kt` & `/streams/[id]`)
1. **16:9 Video Player Viewport**
2. **Stream Metadata & Quick Action Strip:** Viewer count, like count, hashtag, and "+ Add Moment" trigger.
3. **Interactive Stream Timeline:** Real-time scrubber with marker pins, `-10s`/`+10s` seek buttons, and "Clip at [XX:XX]" button.
4. **Moments Rail:** Horizontal scrolling cards of all marked moments with clip types.
5. **Segmented Tabs:** Live Chat stream vs Clip Markers.

### Screen 3: Clip Studio & Exporter (`ClipGenerateScreen.kt` & `/clips/[id]`)
1. **Clip Player:** Switches between remote YouTube stream preview and native local rendered MP4.
2. **Moment Overview:** Clip type badge, moment timestamp, title.
3. **Segmented Navigation:** Live Chat Replay vs Trim & Timing.
4. **Bottom Export Deck:** Live percentage progress bar when rendering; Save MP4 + Telegram Dispatch when complete.

---

## 6. Prohibited Anti-Patterns (Strict Rules)

- ❌ **No Cheap Emojis:** Never use raw Unicode emojis (`✂️`, `👑`, `🔴`, `🇮🇳`, `🎮`) in headers, buttons, or badges. Always use official vector icons (`Icons.Default.Verified`, `Icons.Default.Bolt`, etc.).
- ❌ **No Flat Pastel Solid Blocks:** Avoid solid pastel fills that clash with dark mode. Use rich dark slate/navy cards with luminous ambient borders and glow badges.
- ❌ **No Hardcoded Timestamps:** Never hardcode playback offsets (`33:36` / `2016s`). All timelines must query active player state.
- ❌ **No High-Contrast White Backgrounds:** All surfaces, inputs, and popups must strictly adhere to the dark stealth palette.

---

## 7. Shared Token Implementations

### 7.1 Tailwind CSS Config (`digicast-web`)
```typescript
// tailwind.config.ts
export const digicastTheme = {
  colors: {
    canvas: {
      deep: '#07080C',
      deck: '#0D111A',
      card: '#111622',
      elevated: '#161D2E',
    },
    brand: {
      cyan: '#00F0FF',
      coral: '#FF5C5C',
      lime: '#53FC18',
      violet: '#A855F7',
      amber: '#FBBF24',
    },
    border: {
      hairline: '#1E2638',
      active: '#00F0FF',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
    }
  }
};
```

### 7.2 Jetpack Compose Theme (`digicast-android`)
```kotlin
// Color.kt
package com.digicast.app.ui.theme

import androidx.compose.ui.graphics.Color

val DigicastDeepNavy = Color(0xFF07080C)
val DigicastNavy = Color(0xFF0D111A)
val DigicastSurface = Color(0xFF111622)
val DigicastSurfaceElevated = Color(0xFF161D2E)
val DigicastSurfaceFloating = Color(0xFF1C2333)
val DigicastBorder = Color(0xFF1E2638)

val DigicastWhite = Color(0xFFF8FAFC)
val DigicastSlate = Color(0xFF94A3B8)
val DigicastMuted = Color(0xFF64748B)

val DigicastAccentBlue = Color(0xFF00F0FF) // Electric Cyan
val DigicastSunsetCoral = Color(0xFFFF5C5C) // Broadcast Alert Coral
val DigicastNeonLime = Color(0xFF53FC18)   // Kick Green
val DigicastEmerald = Color(0xFF10B981)
val DigicastElectricViolet = Color(0xFFA855F7)
```
