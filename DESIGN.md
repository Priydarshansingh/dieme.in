# DESIGN.md v3.0 — Digicast Unified Design System

> Version: 3.0.0 | Trusted since 27-09-2003 at 01:00 AM, Sojat Road, Pali
> Platforms: Android (Jetpack Compose) · Web (Next.js/Tailwind CSS) · Backend Admin
> Aesthetic Core: Cyber-Editorial Stealth, Tactile Dark Mode, Broadcast Telemetry

All colors below map identically across web CSS variables, Android Color.kt, backend globals.css, and tokens.json.

---

## 1. Trusted Color Philosophy

The Digicast color system is anchored in a **numerology-derived trusted palette** tied to the creator's birth data. Life Path 5 brings transformation energy, Expression 9 brings completion and wisdom, and the Sojat Road desert origin adds grounded warmth. These colors are immutable across all three surfaces.

### Numerology to Trusted Colors

| Numerology | Trait | Trusted Color | Hex | Role | CSS Variable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Life Path 5** | Transformation, change, energy | Digital Cyan | `#00F0FF` | Primary CTA / Progress | `--digicast-cyan` |
| **Expression 9** | Wisdom, completion, spirituality | Wisdom Violet | `#A855F7` | AI Intelligence | `--digicast-violet` |
| **Desert (Sojat)** | Grounding, creativity | Desert Amber | `#FBBF24` | Monetization / Currency | `--digicast-amber` |
| **Midnight (7)** | Depth, introspection | Midnight Charcoal | `#07080C` | Root Canvas | `--digicast-deep` |
| **1 AM Birth** | New beginnings, fresh start | Stellar Midnight | `#0D111A` | Panel Deck | `--digicast-deck` |

---

## 2. Complete Color System

### 2.1 Canvas and Surface Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `canvas.deep` | `#07080C` | Root app background, video viewport letterboxing |
| `canvas.deck` | `#0D111A` | Navigation, headers, search containers |
| `canvas.card` | `#111622` | Bento cards, broadcast cards, message rows, dialogs |
| `canvas.elevated` | `#161D2E` | Elevated chips, active tabs, hover states |
| `canvas.floating` | `#1C2333` | Dialog and floating surfaces |
| `canvas.glass` | `rgba(17, 22, 34, 0.75)` | Frosted glass overlay (75% opacity) |

### 2.2 Border Tokens

| Token | Value | Usage |
| :--- | :--- | :--- |
| `border.hairline` | `rgba(255, 255, 255, 0.08)` | Default 1px card borders |
| `border.specular` | `#1E2638` | Specular fallback |
| `border.active` | `rgba(0, 240, 255, 0.4)` | Focus rings, active states |

### 2.3 Text Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `text.primary` | `#F8FAFC` | High-emphasis text |
| `text.secondary` | `#94A3B8` | Medium-emphasis content |
| `text.muted` | `#64748B` | Disabled and subtle text |

### 2.4 Brand Accent Tokens

| Token | Hex | Numerology | Trusted? | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `brand.cyan` | `#00F0FF` | Life Path 5 | YES | Primary CTA, progress bars, scrubbers |
| `brand.coral` | `#FF5C5C` | - | No | Live broadcast, clutch moments, bookmarks |
| `brand.lime` | `#53FC18` | - | No | Chat surge, online status |
| `brand.emerald` | `#10B981` | - | No | Highlights, success states |
| `brand.violet` | `#A855F7` | Expression 9 | YES | AI intelligence, telegram sync |
| `brand.amber` | `#FBBF24` | Desert Sojat | YES | Monetization, revenue, superchat |

### 2.5 Semantic Clip Type System

| Clip Type | Color | Hex | Icon |
| :--- | :--- | :--- | :--- |
| `highlight` | Emerald | `#10B981` | Star |
| `clutch` | Sunset Coral | `#FF725C` | Bolt |
| `funny` | Electric Cyan | `#06B6D4` | SentimentSatisfied |
| `killstreak` | Crimson Red | `#EF4444` | Speed |
| `chatSpike` | Electric Violet | `#8B5CF6` | Forum |
| `custom` | Slate Monochrome | `#94A3B8` | ContentCut |

### 2.6 Status Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `status.error` | `#EF4444` | Errors, destructive actions |
| `status.warning` | `#F59E0B` | Warning states |
| `status.success` | `#10B981` | Success states |
| `status.info` | `#00F0FF` | Info states |

---

## 3. Typography and Font System

### 3.1 Font Families (All Platforms)

| Token | Font Stack | Usage |
| :--- | :--- | :--- |
| `font.display` | Inter, system-ui, sans-serif | Headings and hero text |
| `font.body` | Inter, system-ui, sans-serif | Body text and controls |
| `font.mono` | JetBrains Mono, Fira Code, monospace | Telemetry, timestamps, numbers |

### 3.2 Typography Scale

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 28px | 34px | 800 | Hero titles, screen titles, landing headlines |
| `text-h1` | 20px | 26px | 700 | Card section titles, modal headers |
| `text-h2` | 16px | 22px | 600 | Stream titles, clip labels, segment headers |
| `text-body` | 14px | 20px | 400 | Standard text, chat messages, button labels |
| `text-caption` | 12px | 16px | 500 | Timestamps, badge chips, input labels |
| `text-micro` | 10px | 14px | 700 | Tag pills (HOST, BOT, LIVE), metadata tags |

### 3.3 Typography Guidelines

- All text uses **Inter** as the primary font — identical across web and Android
- Telemetry and numbers use **JetBrains Mono** with tabular figures
- Zero emoji policy — all icons are Material 3 / Lucide vector icons
- Tracking: -0.03em on display headings

---

## 4. Geometry and Spacing

### 4.1 Border Radius

| Token | Value | Usage |
| :--- | :--- | :--- |
| `radius.pill` | 9999px | Pills, badges, live dots, status tags |
| `radius.card` | 16px | Bento cards, modals, viewports |
| `radius.button` | 12px | Action buttons, inputs |
| `radius.chip` | 8px | Sub-chips, tags, small elements |
| `radius.input` | 10px | Search bars, text inputs |

### 4.2 Spacing Scale

| Token | Value | Usage |
| :--- | :--- | :--- |
| `space-xs` | 4px | Tight elements |
| `space-sm` | 8px | Small gaps |
| `space-md` | 12px | Medium gaps |
| `space-lg` | 16px | Standard spacing |
| `space-xl` | 24px | Section gaps |
| `space-xl2` | 32px | Large section gaps |
| `space-xl3` | 48px | Page sections |
| `space-xl4` | 64px | Hero spacing |

---

## 5. Surface Architecture and Effects

### 5.1 Glassmorphism (All Surfaces)

All cards and elevated surfaces use frosted glass with consistent opacity layers:

- Glass base: `rgba(17, 22, 34, 0.6-0.75)` over `#111622`
- Border: `rgba(255, 255, 255, 0.08-0.09)`
- Blur: 16px (mobile) / 20px (desktop cards)
- Hover elevation: opacity increases to `0.85`
- Active state border: `rgba(0, 240, 255, 0.3)`

### 5.2 Ambient Glow System

| Token | Value | Element |
| :--- | :--- | :--- |
| `glow.cyan` | `0 0 24px -4px rgba(0, 240, 255, 0.15)` | Cyan-focused cards, active states |
| `glow.live` | `0 0 20px -2px rgba(255, 92, 92, 0.25)` | Live broadcast pulse |
| `glow.violet` | `0 0 24px -4px rgba(168, 85, 247, 0.15)` | Violet AI cards |
| `glow.amber` | `0 0 24px -4px rgba(251, 191, 36, 0.15)` | Amber monetization cards |
| `glow.emerald` | `0 0 24px -4px rgba(16, 185, 129, 0.15)` | Emerald highlight cards |

---

## 6. Cross-Platform Implementation Guide

### 6.1 Single Source of Truth

```
Digicast Project Root
  + stitch-design-package/
  |   |- DESIGN.md      (this master spec)
  |   + tokens.json    (machine-readable tokens - source of truth)
  + digicast-web/
  |   |- src/app/globals.css   (CSS vars mirror tokens.json)
  |   + tailwind.config.ts    (digicast:{} token scale)
  + digicast-backend/
  |   |- src/app/globals.css   (IDENTICAL to web)
  |   + tailwind.config.ts    (IDENTICAL token scale to web)
  + digicast-android/
      + ui/theme/Color.kt     (IDENTICAL hex values to tokens.json)
          ui/theme/Theme.kt   (uses Color.kt semantic names)
```

### 6.2 Color Usage Rules

- Web: use `bg-digicast-deep`, `text-digicast-cyan`, `border-digicast-border` Tailwind classes
- Web custom CSS: use `--digicast-*` variables
- Android: use `CanvasDeep`, `BrandCyan`, `BorderHairline` semantic names from Color.kt
- Backend: identical to web globals.css and tailwind.config.ts
- Never hardcode hex outside of globals.css, Color.kt, or tailwind.config.ts
- Glass backgrounds: `rgba(17, 22, 34, 0.6-0.75)` with `backdrop-filter: blur(16px)`

### 6.3 Typography Rules

- Web: `font-family: Inter, system-ui, sans-serif` via Tailwind `font-sans`
- Android: `FontFamily.Default` maps to Inter in Theme.kt
- Mono: `font-mono` on web, `JetBrains Mono` on Android for telemetry
- All numbers use `font-variant-numeric: tabular-nums` for consistent width

---

## 7. Prohibited Anti-Patterns

- No Cheap Emojis: never use raw Unicode emojis in headers, buttons, or badges
- No Flat Pastel Solid Blocks: all surfaces use dark glass with ambient glows
- No Hardcoded Timestamps: all timelines query active player state
- No High-Contrast White Backgrounds: strict dark stealth palette only
- No Hex Outside Tokens: all colors must come from the design token system

---

## 8. Verified Harmonization (v3.0)

| Surface | Before | After | Status |
| :--- | :--- | :--- | :--- |
| digicast-web globals.css | Mixed HSL + hardcoded hex (20+ unique values) | Unified `--digicast-*` variables matching tokens.json | Fixed |
| digicast-backend globals.css | Old navy palette (#1B2237, #111827, #070910) | Identical to web globals.css | Fixed |
| digicast-backend tailwind | No digicast scale, old shadcn defaults | Added full `digicast:{}` token scale | Fixed |
| digicast-android Color.kt | Duplicated aliases, inconsistent naming | Semantic names with @Deprecated legacy aliases | Fixed |
| digicast-android Theme.kt | Hardcoded Color(0x...) values | References Color.kt semantic names | Fixed |
| tokens.json | v2.0 incomplete | v3.0 with full color, typography, spacing, shadows | Fixed |

DesignEOD