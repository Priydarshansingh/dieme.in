package com.digicast.app.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance

/*
 * DIGICAST DESIGN SYSTEM — DEEP TEAL SILK PALETTE
 * Based on authentic Deep Teal Silk reference:
 *   #0B3037 (Dark Teal Silk base, shadow & deck)
 *   #134E5E (Deep Teal Silk surface, highlight & glow)
 *   #06181C (Midnight Deep Teal root canvas)
 * Paired with crisp pure White (#FFFFFF) typography & vector iconography.
 */

// ═══════════════════════════════════════════════════════════════
// DEEP TEAL SILK CANVASES & SURFACES
// ═══════════════════════════════════════════════════════════════

val TealSilkDark = Color(0xFF0B3037)         // #0B3037 Base & Shadow
val TealSilkSurface = Color(0xFF134E5E)      // #134E5E Surface & Highlight
val TealSilkCanvas = Color(0xFF06181C)       // Root Velvet Teal Canvas
val TealSilkDeck = Color(0xFF0B3037)         // Top & Bottom Navigation Decks
val TealSilkCard = Color(0xFF0D373F)         // Card & Container Base
val TealSilkElevated = Color(0xFF134E5E)     // Elevated Surfaces, Active Pills
val TealSilkFloating = Color(0xFF165464)     // Floating Dialogs & Menus

val CanvasDeep = TealSilkCanvas
val CanvasDeck = TealSilkDeck
val SurfaceCard = TealSilkCard
val SurfaceElevated = TealSilkElevated
val SurfaceFloating = TealSilkFloating

// Standard aliases used throughout screens
val DigicastDeepNavy = TealSilkCanvas
val DigicastNavy = TealSilkDeck
val DigicastSurface = TealSilkCard
val DigicastSurfaceElevated = TealSilkElevated
val DigicastSurfaceFloating = TealSilkFloating
val DigicastCardSurface = TealSilkCard
val DigicastSearchBackground = Color(0xFF08262C)
val DigicastChipBackground = Color(0xFF0B3037)

// ═══════════════════════════════════════════════════════════════
// SPECULAR GLASS BORDERS
// ═══════════════════════════════════════════════════════════════

val BorderHairline = Color(0x33FFFFFF)       // 1px Translucent White Glass Border
val BorderSpecular = Color(0xFF1C5360)       // Specular Teal Border
val BorderActive = Color(0x80FFFFFF)         // Active Highlight Border
val DigicastBorder = Color(0x33FFFFFF)       // Glass Hairline Border

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY & ICONS (Pure White & Teal-Tinted Slate)
// ═══════════════════════════════════════════════════════════════

val TextPrimary = Color(0xFFFFFFFF)          // Pure White
val TextSecondary = Color(0xFFA5C4CA)        // Soft Teal Slate
val TextMuted = Color(0xFF6B929A)            // Muted Subtitle

val DigicastWhite = Color(0xFFFFFFFF)        // Pure White
val DigicastOffWhite = Color(0xFFEAF5F7)
val DigicastGrayLight = Color(0xFFD2E7EB)
val DigicastSlate = Color(0xFFA5C4CA)
val DigicastMuted = Color(0xFF6B929A)
val DigicastDarkText = Color(0xFF06181C)

// ═══════════════════════════════════════════════════════════════
// DEEP TEAL SILK BRAND ACCENTS & BRUSHES
// ═══════════════════════════════════════════════════════════════

val BrandTealSilk = Color(0xFF134E5E)
val BrandTealDark = Color(0xFF0B3037)
val BrandTealGlow = Color(0xFF2DD4BF)        // Radiant Mint-Teal
val BrandWhite = Color(0xFFFFFFFF)

val DigicastAccentBlue = Color(0xFF134E5E)   // Deep Teal Silk Surface
val DigicastSunsetCoral = Color(0xFF134E5E)  // Deep Teal Action
val DigicastNeonLime = Color(0xFF2DD4BF)
val DigicastEmerald = Color(0xFF2DD4BF)
val DigicastElectricCyan = Color(0xFF134E5E)
val DigicastElectricViolet = Color(0xFF1A5868)
val DigicastSpringGreen = Color(0xFF2DD4BF)
val DigicastMintGlow = Color(0xFF134E5E)
val DigicastLiveRed = Color(0xFFE05260)       // Subtle Broadcast Red
val DigicastAmber = Color(0xFFFBBF24)

val BrandCyan = Color(0xFF134E5E)
val BrandCoral = Color(0xFF134E5E)
val BrandLime = Color(0xFF2DD4BF)
val BrandEmerald = Color(0xFF2DD4BF)
val BrandViolet = Color(0xFF1A5868)
val BrandAmber = Color(0xFFFBBF24)
val LiveRed = Color(0xFFE05260)

// Reusable Deep Teal Silk Gradients
val TealSilkBrush = Brush.horizontalGradient(
    listOf(Color(0xFF0B3037), Color(0xFF134E5E))
)
val TealSilkVerticalBrush = Brush.verticalGradient(
    listOf(Color(0xFF134E5E), Color(0xFF0B3037))
)
val TealSilkCardBrush = Brush.linearGradient(
    listOf(Color(0xFF0B3037), Color(0xFF134E5E))
)

// ═══════════════════════════════════════════════════════════════
// APPLE-TYPE DARK-EDGE VIGNETTE GRADIENTS ("from edges darker side")
// ═══════════════════════════════════════════════════════════════

val TealSilkEdgeDark = Color(0xFF041215)
val TealSilkEdgeMid = Color(0xFF08262C)

// Dark edge card brush: dark perimeter on both sides, silk sheen in center
val AppleDarkEdgeCardBrush = Brush.linearGradient(
    listOf(
        Color(0xFF041215), // Deep dark edge
        Color(0xFF0A2E35),
        Color(0xFF134E5E), // Lighter silk sheen in center
        Color(0xFF0A2E35),
        Color(0xFF041215)  // Deep dark edge
    )
)

// Dark edge pill / button brush: darker on left and right borders
val AppleDarkEdgePillBrush = Brush.horizontalGradient(
    listOf(
        Color(0xFF071F24), // Dark edge
        Color(0xFF134E5E), // Silk surface
        Color(0xFF165A6C), // Sheen highlight
        Color(0xFF134E5E), // Silk surface
        Color(0xFF071F24)  // Dark edge
    )
)

// Dark edge unselected chip / container brush
val AppleDarkEdgeSubtleBrush = Brush.horizontalGradient(
    listOf(
        Color(0xFF030E10),
        Color(0xFF08262C),
        Color(0xFF030E10)
    )
)

// Apple Specular Hairline Glass Border (rim highlight top, subtle bottom)
val AppleSpecularBorder = Brush.verticalGradient(
    listOf(
        Color(0x55FFFFFF),
        Color(0x18FFFFFF)
    )
)

// ═══════════════════════════════════════════════════════════════
// CLIP TYPES (Deep Teal Silk Harmonized)
// ═══════════════════════════════════════════════════════════════

val ClipHighlight = Color(0xFF2DD4BF)        // Mint-Teal
val ClipClutch = Color(0xFF166072)           // Silky Teal
val ClipFunny = Color(0xFF134E5E)            // Deep Teal
val ClipKillstreak = Color(0xFF0E3D48)       // Ocean Teal
val ClipChatSpike = Color(0xFF1A5868)        // Radiant Teal
val ClipCustom = Color(0xFFA5C4CA)           // White-Slate

val StatusError = Color(0xFFE05260)
val StatusWarning = Color(0xFFF59E0B)
val StatusSuccess = Color(0xFF2DD4BF)
val StatusInfo = Color(0xFF134E5E)

@Composable
fun isColorLight(color: Color): Boolean {
    return color.luminance() > 0.5f
}
