---
name: awesome-design-md
description: >-
  Curated library of 84 production DESIGN.md specifications extracted from elite developer and product websites
  (Linear, Stripe, Apple, Vercel, Raycast, Figma, Cursor, Supabase, OpenAI/xAI, etc.). Use this skill whenever
  designing, architecting, styling, or scaffolding a new web app, website, mobile UI, component library, or landing
  page to adopt battle-tested color palettes, typography scales, card architectures, and visual rules.
license: MIT
metadata:
  version: "1.0.0"
  source: "https://github.com/VoltAgent/awesome-design-md"
  count: 84
---

# Awesome DESIGN.md Library

A curated collection of 84 production-grade `DESIGN.md` design system specifications from industry-leading tech brands, creative agencies, and developer products.

## How to Use This Skill

1. **Pick a Design Language / System:**
   Before writing any CSS, Tailwind classes, or Jetpack Compose styles, choose a visual archetype or reference brand from the catalog below:
   - **Developer Tools & Dark Mode Craft:** `linear.app`, `cursor`, `raycast`, `vercel`, `warp`, `supabase`, `posthog`, `resend`, `mintlify`
   - **Fintech & Infrastructure:** `stripe`, `mercury`, `revolut`, `coinbase`, `wise`, `brex`
   - **SaaS & Enterprise Product:** `figma`, `notion`, `intercom`, `airtable`, `slack`, `webflow`
   - **Luxury & Automotive:** `ferrari`, `lamborghini`, `bmw`, `bmw-m`, `bugatti`, `tesla`
   - **Creative & AI Media:** `runwayml`, `midjourney`, `elevenlabs`, `replicate`, `together.ai`, `mistral.ai`
   - **Consumer & Hardware:** `apple`, `dji`, `nike`, `playstation`, `spotify`, `oura`

2. **Adopt the Design Tokens:**
   Inspect `design-md/<brand>/DESIGN.md` in this skill's folder:
   - **Colors:** Primary, secondary, canvas (`#010102`, `#0B3037`, `#FFFFFF`), surface levels (`surface-1`, `surface-2`), hairlines, and contrast rules.
   - **Typography:** Exact font family, weights, line heights, letter-spacing (e.g. negative tracking for titles), and font feature settings.
   - **Elevation & Borders:** Specular hairline glass borders, corner radii, shadow scales, and backdrop blur levels.
   - **Rhythm & Spacing:** Grid layouts, padding multiples, and component compositions.

3. **Drop DESIGN.md into the Project Root:**
   When starting a project or major UI revamp, copy the chosen file into the project root as `DESIGN.md`:
   ```bash
   cp <skill_dir>/design-md/<brand>/DESIGN.md ./DESIGN.md
   ```
   All agents and pair programmers will immediately align to this design standard.

---

## 84 Curated Brand Design Systems Index

| Category | Brand Specs |
|:---|:---|
| **Elite Dev Tools** | `linear.app`, `cursor`, `raycast`, `vercel`, `warp`, `supabase`, `posthog`, `resend`, `mintlify`, `sentry`, `clickhouse`, `mongodb`, `opencode.ai`, `hashicorp` |
| **Fintech & Crypto** | `stripe`, `mercury`, `revolut`, `coinbase`, `binance`, `kraken`, `wise`, `mastercard`, `nerdwallet` |
| **Productivity & Workspace** | `figma`, `notion`, `intercom`, `airtable`, `slack`, `webflow`, `miro`, `cal`, `superhuman`, `zapier` |
| **AI Frontier & Media** | `claude`, `x.ai`, `ollama`, `cohere`, `mistral.ai`, `elevenlabs`, `minimax`, `replicate`, `runwayml`, `together.ai`, `lovable`, `voltagent` |
| **Consumer, Sport & Lifestyle** | `apple`, `nike`, `spotify`, `starbucks`, `oura`, `pinterest`, `playstation`, `aljazeera`, `theverge`, `wired` |
| **Hardware & Automotive** | `tesla`, `spacex`, `dji`, `ferrari`, `lamborghini`, `bmw`, `bmw-m`, `bugatti`, `renault`, `hp`, `ibm`, `oracle`, `sap`, `dell-1996`, `nintendo-2001` |
