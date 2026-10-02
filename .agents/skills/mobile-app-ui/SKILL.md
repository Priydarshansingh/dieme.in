---
name: mobile-app-ui
description: Elite mobile app UI design system, Jetpack Compose micro-interactions, dark mode aesthetics, asymmetric folder card architectures, and fluid animations for next-generation mobile applications.
---

# Mobile App UI Mastery & Design System Guide

## Philosophy & Core Aesthetic Principles
Modern 2026 mobile app interfaces demand high emotional resonance, tactile feedback, and purposeful visual hierarchy. Generic, flat UI is obsolete. Every screen must feel alive, polished, and unmistakably premium.

### 1. Canvas & Surface Hierarchy (Dark Mode First)
- **Base Canvas:** Never use pure `#000000` across large surfaces. Use deep obsidian/midnight tones: `#0A0C10`, `#0E1116`, `#12151B`.
- **Tonal Elevation:** Layer surfaces using stepped luminance:
  - Background: `#0B0D11`
  - Base Card / Container: `#14171F`
  - Elevated Surface: `#1B202B`
  - Floating / Overlay: `#232938`
- **Subtle Borders & Specular Sheen:** 1.dp hairline borders with 10%–18% alpha white (`Color.White.copy(alpha = 0.08f)`) give dark cards physical presence and separation without garish drop shadows.

### 2. High-Impact Asymmetric & Organic Shapes
- **Folder Tab & Bento Geometry:** Cards with custom corner radii or organic tabs (e.g. folder tab ear holding badge icons) immediately elevate visual intrigue.
- **Sculpted Radii:** Break away from uniform 8dp corners. Use sculpted corner combinations (e.g., `RoundedCornerShape(topStart = 28.dp, topEnd = 14.dp, bottomStart = 14.dp, bottomEnd = 24.dp)`).
- **Tactile Squircle Ratios:** 18dp to 24dp corner radii for modern touch targets.

### 3. Electric Accent Palettes & Dynamic Contrast
- High-saturation, energetic accents on dark canvases provide instant hierarchy:
  - **Electric Neon Lime:** `Color(0xFFD6F830)` / `Color(0xFFC5EE23)`
  - **Vibrant Spring Mint:** `Color(0xFF56F16A)` / `Color(0xFF3EE254)`
  - **Warm Sunset Coral:** `Color(0xFFFF725C)` / `Color(0xFFF95B42)`
  - **Hyper Cyan Aqua:** `Color(0xFF35D6DA)` / `Color(0xFF22C4CA)`
  - **Electric Violet / Purple:** `Color(0xFF9D65FF)` / `Color(0xFF7E3FF2)`
- **Rule of Contrast:** Dark text (`#0D0F14` with `FontWeight.ExtraBold`) inside neon cards ensures 10:1+ contrast ratios and high readability.

### 4. Ambient Sparklines & Glowing Data Visualizations
- Smooth cubic bezier curves for metrics and stream analytics with translucent linear gradient fills below the curve (`Brush.verticalGradient(listOf(glowColor.copy(alpha = 0.35f), Color.Transparent))`).
- Glowing pinpoint indicators on current values.

### 5. Minimalist 3-Tab Floating Dock Navigation
- Height: 68.dp - 76.dp.
- Capsule or dock style with glassmorphic background (`Color(0xFF10131A).copy(alpha = 0.95f)`).
- Active state highlights: vibrant icon tint + subtle glow + 4dp glowing dot indicator centered directly beneath the active icon.

---

## Jetpack Compose Implementation Patterns

### Custom Folder Shape in Compose
```kotlin
class FolderTabShape(
    private val tabWidthRatio: Float = 0.44f,
    private val tabHeight: Float = 28f,
    private val cornerRadius: Float = 36f
) : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density
    ): Outline {
        val path = Path().apply {
            // Draw smooth folder tab silhouette
            // ...
        }
        return Outline.Generic(path)
    }
}
```

### Micro-Interactions & Animated Scale
```kotlin
val interactionSource = remember { MutableInteractionSource() }
val isPressed by interactionSource.collectIsPressedAsState()
val scale by animateFloatAsState(
    targetValue = if (isPressed) 0.96f else 1.0f,
    animationSpec = spring(stiffness = Spring.StiffnessMediumLow)
)
Modifier.graphicsLayer { scaleX = scale; scaleY = scale }
```
