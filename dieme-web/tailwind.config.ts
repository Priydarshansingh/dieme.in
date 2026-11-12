import type { Config } from "tailwindcss";

/**
 * DIGICAST UNIFIED DESIGN SYSTEM — v3.0.0
 * Single source of truth shared with digicast-backend (identical file) and
 * digicast-android (Color.kt). Do NOT introduce new hex values in components —
 * always add a token here first.
 *
 * Trusted palette (numerology): Life Path 5 (cyan), Expression 9 (violet),
 * Desert Amber (Sojat Road origin), Midnight Charcoal (root canvas).
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui bridge (driven by CSS variables in globals.css) ──
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // ── Digicast canonical scale ──
        digicast: {
          // Canvas & surfaces
          deep: "#07080C", // Root obsidian canvas
          deck: "#0D111A", // Navigation & panel deck
          card: "#111622", // Bento container & dialog base
          elevated: "#161D2E", // Elevated surface & chips
          floating: "#1C2333", // Dialog & floating surface
          border: "#1E2638", // Specular hairline border

          // Text
          white: "#F8FAFC", // High-emphasis text
          slate: "#94A3B8", // Medium-emphasis text
          muted: "#64748B", // Disabled & subtle text

          // Brand accents
          cyan: "#00F0FF", // Primary CTA (trusted — Life Path 5)
          coral: "#FF5C5C", // Live broadcast & moment trigger
          lime: "#53FC18", // Kick neon & online surge
          emerald: "#10B981", // Highlight & success
          violet: "#A855F7", // AI intelligence (trusted — Expression 9)
          amber: "#FBBF24", // Monetization & superchat (trusted — Sojat)

          // Semantic status
          error: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981",
          info: "#00F0FF",
        },

        // ── Clip type system ──
        clip: {
          highlight: "#10B981",
          clutch: "#FF725C",
          funny: "#06B6D4",
          killstreak: "#EF4444",
          chatspike: "#8B5CF6",
          custom: "#94A3B8",
        },
      },
      borderRadius: {
        lg: "var(--radius)", // 12px — buttons & inputs
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "16px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        display: ["28px", { lineHeight: "34px", fontWeight: "800" }],
        h1: ["20px", { lineHeight: "26px", fontWeight: "700" }],
        h2: ["16px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        micro: ["10px", { lineHeight: "14px", fontWeight: "700" }],
      },
      boxShadow: {
        "glow-cyan": "0 0 24px -4px rgba(0, 240, 255, 0.15)",
        "glow-live": "0 0 20px -2px rgba(255, 92, 92, 0.25)",
        "glow-violet": "0 0 24px -4px rgba(168, 85, 247, 0.15)",
        "glow-amber": "0 0 24px -4px rgba(251, 191, 36, 0.15)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.15)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
