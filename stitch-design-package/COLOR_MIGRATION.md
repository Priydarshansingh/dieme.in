# Digicast Color Migration Guide (v3.0)

This document maps every legacy color value found across `digicast-web`, `digicast-backend`, and `digicast-android` to the new unified trusted palette.

## 1. Legacy → Unified Color Mapping

### Canvas Colors

| Legacy Value | Legacy Name | New Token | New Hex | Surface | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `#07080C` | canvas-deep, midnight, root | `canvas.deep` | `#07080C` | All | No change — already trusted |
| `#070910` | body background (old web) | `canvas.deep` | `#07080C` | Web, Backend | Fix: `#070910` → `#07080C` |
| `#0D111A` | surface-deck, nav deck | `canvas.deck` | `#0D111A` | All | No change — already trusted |
| `#111622` | surface-card, bento cards | `canvas.card` | `#111622` | All | No change — already trusted |
| `#161D2E` | surface-elevated | `canvas.elevated` | `#161D2E` | All | No change — already trusted |
| `#1C2333` | surface-floating | `canvas.floating` | `#1C2333` | All | No change — already trusted |
| `#090C13` | header bg (old web) | `canvas.deck` | `#0D111A` | Web | Fix |
| `#0A0D15` | card bg (old web) | `canvas.card` | `#111622` | Web | Fix |
| `#0B0F19` | modal bg (old web) | `canvas.floating` | `#1C2333` | Web | Fix |
| `#0E1118` | backend base (old) | `canvas.deep` | `#07080C` | Backend | Fix |
| `#07080B` | backend deep (old) | `canvas.deep` | `#07080C` | Backend | Fix |
| `#06080D` | old base variants | `canvas.deep` | `#07080C` | All | Fix — 37 instances |
| `#080B12` | old variants | `canvas.card` | `#111622` | All | Fix |
| `#0D121D` | old variants | `canvas.elevated` | `#161D2E` | All | Fix |
| `#0A0E17` | old variants | `canvas.deck` | `#0D111A` | All | Fix |
| `#11141E` | old variants | `canvas.card` | `#111622` | All | Fix |
| `#0C0A1E` | old variants | `canvas.deck` | `#0D111A` | All | Fix |
| `#0B0F19` | old variants | `canvas.floating` | `#1C2333` | All | Fix |

### Border Colors

| Legacy Value | New Token | New Hex | Surface | Action |
| :--- | :--- | :--- | :--- | :--- |
| `#1E2638` | `border.hairline` | `#1E2638` | All | No change |
| `rgba(255,255,255,0.08)` | `border.hairline` | `rgba(255,255,255,0.08)` | All | No change |
| `rgba(255,255,255,0.06)` | `border.hairline` | `rgba(255,255,255,0.08)` | All | Fix opacity |
| `rgba(255,255,255,0.07)` | `border.hairline` | `rgba(255,255,255,0.08)` | All | Fix opacity |
| `#D1D5DB` | `border.specular` | `#1E2638` | Backend | Fix — old shadcn default |
| `#E5E7EB` | `border.specular` | `#1E2638` | Backend | Fix — old shadcn default |

### Text Colors

| Legacy Value | New Token | New Hex | Surface | Action |
| :--- | :--- | :--- | :--- | :--- |
| `#F8FAFC` | `text.primary` | `#F8FAFC` | All | No change — already correct |
| `#F1F5F9` | `text.primary` | `#F8FAFC` | Web | Fix — close but not exact |
| `#E2E8F0` | `text.secondary` | `#94A3B8` | Web | Fix |
| `#94A3B8` | `text.secondary` | `#94A3B8` | All | No change |
| `#64748B` | `text.muted` | `#64748B` | All | No change |
| `#6B7280` | `text.muted` | `#64748B` | Web | Fix — old Tailwind slate |
| `#FFFFFF` | `text.primary` | `#F8FAFC` | All | Should use TextPrimary not pure white |
| `#F4F6F9` | `text.primary` | `#F8FAFC` | Backend | Fix — off-white |

### Brand Accents (Already aligned with trusted palette)

| Legacy Value | New Token | Trusted? | Action |
| :--- | :--- | :--- | :--- |
| `#00F0FF` | `brand.cyan` | YES (Life Path 5) | No change |
| `#A855F7` | `brand.violet` | YES (Expression 9) | No change |
| `#FBBF24` | `brand.amber` | YES (Desert Sojat) | No change |
| `#FF5C5C` | `brand.coral` | No | No change |
| `#53FC18` | `brand.lime` | No | No change |
| `#10B981` | `brand.emerald` | No | No change |

### Old/Extraneous Colors (Must Be Removed)

These hex values must be replaced with token references:

| Hex | Context Where Found | Replace With |
| :--- | :--- | :--- |
| `#4285F4` | Google blue ad tags | `brand.cyan` |
| `#00D09C` | Teal green | `brand.lime` |
| `#EC4899` | Pink pricing | `brand.coral` |
| `#0284C7` | Blue pricing | `brand.cyan` |
| `#7C3AED` | Purple pricing | `brand.violet` |
| `#EF4444` | Red error | `status.error` |
| `#06B6D4` | Funny clip | `clip.funny` |
| `#10B981` | Green/success | `brand.emerald` |
| `#06D6A4` | Mint green | `brand.emerald` |
| `#FFD93D` | Yellow | `brand.amber` |
| `#FF3B30` | Red | `status.error` |
| `#E02E24` | Dark red | `status.error` |
| `#4285F4` | Google blue | `brand.cyan` |
| `#34A853` | Google green | `brand.emerald` |
| `#EA4335` | Google red | `status.error` |
| `#FBBC05` | Google yellow | `brand.amber` |
| `#2DD4BF` | Teal | `brand.lime` |
| `#67E8F9` | Light cyan | `brand.cyan` |
| `#C084FC` | Light purple | `brand.violet` |
| `#3B82F6` | Blue | `brand.cyan` |
| `#F59E0B` | Amber | `brand.amber` |

## 2. Migration Steps

### Step 1: Replace globals.css

All three `globals.css` files now use the same set of `--digicast-*` CSS variables. No more `#070910`, `#0A0D15`, or `#0E1118`.

### Step 2: Replace Tailwind hardcoded classes

**Before:** `className="bg-[#06080d] text-slate-100"`
**After:** `className="bg-digicast-deep text-digicast-slate"`

**Before:** `className="hover:text-emerald-400"`
**After:** `className="hover:text-digicast-emerald"`

### Step 3: Replace Android Color values

Update all `Color(0xFF...)` calls in Android to use the semantic names from `Color.kt`:
- `Color(0xFF07080C)` → `CanvasDeep`
- `Color(0xFF00F0FF)` → `BrandCyan`
- `Color(0xFFF8FAFC)` → `TextPrimary`

### Step 4: Remove hardcoded rgba glass values

**Before:**
```css
background: rgba(14, 18, 27, 0.7);
```
**After:**
```css
.glass-panel { background: rgba(17, 22, 34, 0.6); }
```

## 3. Verification Checklist

After migration, verify these exact hex values appear consistently:

- `#07080C` — Root canvas (deep)
- `#0D111A` — Deck (navigation)
- `#111622` — Card surface
- `#161D2E` — Elevated
- `#1E2638` — Border hairline (hex fallback)
- `#00F0FF` — Brand cyan (trusted)
- `#FF5C5C` — Brand coral
- `#53FC18` — Brand lime
- `#10B981` — Emerald
- `#A855F7` — Brand violet (trusted)
- `#FBBF24` — Brand amber (trusted)
- `#F8FAFC` — Text primary
- `#94A3B8` — Text secondary
- `#64748B` — Text muted

If any of these hex values do NOT appear (or are not present when they should be), the surface has been migrated.

MigrationEOD