---
name: web3-creative-web
description: Master craftsmanship for Web3, cyber-editorial, and high-end interactive animated web applications. Eliminates generic AI cliches in favor of tactile dark-mode depth, cursor-reactive canvas systems, telemetry HUDs, and crisp micro-interactions.
---

# Web3 & Creative Animated Web Craftsmanship Guide

## Core Aesthetic & Architectural Philosophy

High-end Web3 and creative engineering websites (inspired by Linear, Solana, Phantom, Stripe Press, Raydium, and Paradigm) reject generic "AI-generated" tropes:
- **NO Generic "AI" Clichés**: Avoid rainbow gradient text, floating glowing purple/pink blur blobs, generic sparkles (`✨`), and vague marketing buzzwords ("supercharge your workflow with next-gen AI").
- **Physicality & Tactile Depth**: Use crisp hairline borders, dark obsidian canvases (`#05070B`, `#090C15`), laser-focused monolithic accents (Electric Neon Lime `#D6F830`, Cyber Aqua `#00F5FF`, Emerald `#10B981`, Solar Blaze `#FF6B00`), and monospace telemetry tags.
- **Interactive Tracking & Motion Physics**: Interfaces must respond to user input dynamically—mouse-following raycast spotlights, reactive particle meshes, live audio/stream visualizers, and spring-physics interactions.

---

## 1. Canvas & Surface Elevation (Obsidian & Specular Hairlines)

```css
/* Deep Obsidian Hierarchy */
--bg-void: #040508;
--bg-canvas: #07090E;
--bg-card: #0D111A;
--bg-card-hover: #131824;
--bg-hud: rgba(13, 17, 26, 0.75);

/* Specular Hairline Borders */
--border-subtle: rgba(255, 255, 255, 0.07);
--border-highlight: rgba(255, 255, 255, 0.15);
--border-accent: rgba(214, 248, 48, 0.35); /* Electric Lime Glow */
```

- **Hairline Precision**: Always use `1px` borders with low-alpha whites (`rgba(255, 255, 255, 0.08)`) and backdrop filters (`backdrop-blur-md` or `backdrop-blur-xl`).
- **Surface Texture**: Subtle subtle grid patterns (`radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)` with `background-size: 24px 24px`).

---

## 2. Dynamic Typography & Monospace Telemetry

- **Display Typography**: Crisp, sans-serif display fonts (`Inter`, `Plus Jakarta Sans`, `Geist`) with tight tracking (`tracking-tight` / `tracking-tighter`) and high-contrast solid text (`#FFFFFF`, `#F1F5F9`).
- **Telemetry & Micro-labels**: `JetBrains Mono`, `Geist Mono`, or standard `font-mono` for live metrics, status badges, timestamps, and node addresses (`text-[10px]` or `text-[11px]`, uppercase, `tracking-widest`, `text-slate-400`).
- **Status Dots**: Pulsing animated green/lime/cyan dots (`animate-ping` + solid inner core) for real-time telemetry.

---

## 3. Interactive Tracking & Web3 Objects

### A. Canvas-Driven Particle / Mesh Grid
- Canvas elements that track cursor position with distance-based node connections and velocity dampening.
- Mouse velocity creates gentle wave propagation across the grid.

### B. Interactive Director / Telemetry HUD
- Simulated real-time streaming HUD:
  - Live bitrate & latency counters (`14.2 ms`, `48 kHz / 24-bit PCM`, `1080p60`).
  - Interactive Action Buttons: "Drop Marker", "Switch Node", "Buffer Flush" that update live state and logs.
  - Live Audio Waveform Canvas driven by procedural Perlin noise / trigonometric curves.

### C. Tactile Pass Duration Calculator & Bento Cards
- Interactive duration selectors (e.g. 1-Day Pass, 7-Day Marathon, 30-Day Pro, Season Pass).
- Bento grid with asymmetrical card proportions, interactive hover tilts, and live copy-to-clipboard wallet/bot handles.

---

## 4. Zero Proprietary Tech Leakage Rule

- **What to highlight**: Creator workflows, multi-channel live streaming stability, real-time marker logging for video editors, team co-director access, and instant duration passes.
- **What to NEVER disclose**: Internal low-level codec architecture, proprietary MediaCodec pipelines, backend private token formats, internal database structures, or internal API routes.

---

## 5. Standard Component Blueprint

1. **Header / Navigation**: Fixed floating capsule dock with subtle blur, logo badge with live stream pulse dot, navigation anchors, and Telegram Launch CTA.
2. **Hero Stage**:
   - Interactive mouse-reactive Canvas node mesh in background.
   - High-contrast typography with laser-sharp value proposition.
   - Live interactive Stream HUD Terminal demo widget.
3. **Live Interactive Feature Bento**:
   - Audio Synchronizer & Waveform generator.
   - Real-time Marker Tagging sandbox (interactive click to log timestamps).
   - Multi-Destination Broadcast Visualizer.
4. **Duration Passes & Access**:
   - Transparent tier cards with instant activation details via bot.
5. **SEO & Creator Knowledge FAQ (JSON-LD)**:
   - Rich Q&A for search engines and AI crawl engines without leaking technical secrets.
6. **Footer & Trust**:
   - Direct Telegram Bot link, status indicator, links to [Terms](/terms), [Privacy](/privacy), [Refund](/refund), [Contact](/contact).
