---
name: web3-creative-web
description: Master craftsmanship for Web3, cyber-editorial, and high-end interactive animated web applications based on Awwwards Site of the Day standards (IGLOO, Katana Network, ZooBC, ApeChain, Mad Dogs Web3, Boom & Bloom). Eliminates generic AI cliches in favor of tactile dark-mode depth, cursor-reactive canvas systems, telemetry HUDs, scroll-driven storytelling, and 60fps physics.
---

# Web3 & Creative Animated Web Craftsmanship Guide
*(Awwwards, CSSDA, Webby-Grade Interactive Design System)*

## 1. Award-Winning Reference Archetypes & Interaction Patterns

Study these seminal references for interaction and architectural patterns, not for superficial copying:

| Reference Project | Core Interaction Pattern | Key Technique to Apply |
| :--- | :--- | :--- |
| **IGLOO (Pudgy Penguins)** | Full-screen 3D world, scroll-driven WebGL, atmospheric lighting | Interactive depth, camera movement on scroll, smooth ambient particle lighting. |
| **Katana Network (Polygon)** | 3D visual storytelling over DeFi ecosystem, looping micro-mechanics | Scroll reveals functional modules sequentially rather than dumping content all at once. |
| **ZooBC** | Interactive 3D bio-dome with pointer hotspots & ecosystem role switcher | Interactive role selector (e.g. Streamer Cockpit vs Editor Terminal) with visual state feedback. |
| **ApeChain** | Cultural gamification & bold typography | Monochromatic display headers, micro-counters, and tactile interaction snaps. |
| **Mad Dogs Web3** | Storyboarded scene transitions & interactive audio sync | Procedural audio visualizers, reactive sound-wave canvases, and clip marking. |
| **History of Blockchain** | Continuous scroll journey, floating node mesh & subtle lighting | Zero-glitch node mesh physics, pointer-linked raycast beams, and deep obsidian depth. |
| **Boom & Bloom** | Futuristic Web3 telemetry & motion graphics | Monospace status telemetry (`48kHz PCM`, `0ms Buffer`, `60.0 FPS`), tactile buttons. |

---

## 2. Core Aesthetic Philosophy: Real Engineering vs "AI Clichés"

High-end Web3 and creative engineering websites reject generic AI tropes:
- **NO Generic "AI" Clichés**: Avoid rainbow gradient text (`linear-gradient(to right, #a855f7, #ec4899, #06b6d4)`), floating fuzzy purple/pink gradient blobs, random sparkles (`✨`), and vague fluff (*"unleash the power of AI"*).
- **Physicality & Tactile Depth**: Use crisp hairline borders (`1px solid rgba(255, 255, 255, 0.07)`), pitch obsidian canvases (`#040508`, `#07090E`, `#0D111A`), and laser-focused monolithic accents:
  - **Electric Neon Lime**: `#D6F830` / `#C5EA1F` (live telemetry, primary action triggers)
  - **Cyber Cyan**: `#00F5FF` / `#22D3EE` (timecodes, status nodes, audio carrier)
  - **Solar Coral / Blaze**: `#FF6B00` / `#FF4757` (live feed indicators, active record states)
  - **Emerald Pulse**: `#10B981` (synced workspace indicators)
- **Monospace Micro-Typography**: High-contrast display titles (`Inter`, `Plus Jakarta Sans`, `Geist`) paired with `JetBrains Mono` / `font-mono` micro-telemetry tags (`text-[10px]`, `tracking-widest`, `uppercase`).

---

## 3. Technical Architecture & Interaction Patterns

### A. Cursor-Reactive Raycast Spotlight & Node Canvas
- Smooth 60fps HTML5 `<canvas>` or Three.js particle node mesh in the background.
- Nodes calculate Euclidean distance to mouse pointer coordinates; close nodes render connected spring vectors and illuminate with accent glow.

### B. Procedural Live Audio Waveform Canvas
- Dual-frequency trigonometric sine/cosine wave generators running in requestAnimationFrame loops.
- Dynamically shifts amplitude on user interaction (e.g., clicking *"Drop Marker"* or selecting event tags).

### C. Tactile Sandbox Console & Real Creator Tools
- Functional interactive demo directly in the hero stage:
  - Selectable tags: `🎯 CLUTCH`, `💰 SUPERCHAT`, `⚡ HYPE`, `🗣️ TOPIC`.
  - Push-button physics with micro-scale dips (`scale-[0.97]`).
  - Real copy-to-clipboard actions (exporting markdown timecodes to clipboard).

### D. Symmetrical Role Matrix Switcher
- Instant toggle between creator modes (e.g., Mobile Phone Companion vs Desktop Editor Terminal) to visually communicate multi-user workflows.

### E. Scroll-Driven Section Reveal & Bento Grid
- Asymmetric card proportions, hairline specular sheens, subtle hover tilt, and live status pills.

---

## 4. Zero Proprietary Tech Leakage Rule

- **Highlight Creator Value**: Low mobile battery consumption, zero-latency stream sync, instant editor timestamp handover, flexible pass activations.
- **NEVER Disclose**: Internal low-level codec pipelines, MediaCodec internals, raw backend token encryption methods, or internal private database routes.

---

## 5. Implementation Stack Standard

- **Framework**: Next.js 14+ (App Router) / React 18+
- **Rendering & Animation**: HTML5 2D Canvas / WebGL / CSS GPU transitions (`transform: translate3d`)
- **Typography**: Inter (Body/Display) + JetBrains Mono / Monospace (Telemetry & HUD)
- **Performance Budget**: Target strict 60fps, zero layout shift (CLS < 0.02), responsive mobile touch fallbacks, fast static hydration.
