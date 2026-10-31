package com.digicast.app.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat

/*
 * DIGICAST UNIFIED DESIGN SYSTEM — Theme.kt (v3.0.0)
 * Unified dark color scheme shared with web backend and digicast-web.
 * Primary: BrandCyan (#00F0FF)  | Secondary: BrandViolet (#A855F7)
 */

private val DigicastDarkColorScheme = darkColorScheme(
    // Primary: Electric Cyan (Life Path 5)
    primary = BrandCyan,
    onPrimary = CanvasDeep,
    primaryContainer = CanvasDeck,
    onPrimaryContainer = TextPrimary,

    // Secondary: Wisdom Violet (Expression 9)
    secondary = BrandViolet,
    onSecondary = CanvasDeep,
    secondaryContainer = Color(0xFF2E1A4E),
    onSecondaryContainer = TextPrimary,

    // Tertiary: Desert Amber (Sojat Road)
    tertiary = BrandAmber,
    onTertiary = CanvasDeep,
    tertiaryContainer = Color(0xFF452A0E),
    onTertiaryContainer = TextPrimary,

    // Canvas & surfaces (unified)
    background = CanvasDeep,
    onBackground = TextPrimary,
    surface = SurfaceCard,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = BorderSpecular,
    outlineVariant = BorderHairline,
    inverseOnSurface = CanvasDeep,
    inverseSurface = TextPrimary,
    inversePrimary = BrandCyan,

    // Status
    error = StatusError,
    onError = TextPrimary,
    onErrorContainer = TextPrimary,
    errorContainer = Color(0xFF7F1D1D),

    // UI state
    surfaceTint = Color(0x33134E5E),
    surfaceDim = CanvasDeep,
)

@Composable
fun DigicastTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = CanvasDeep.toArgb()
            window.navigationBarColor = CanvasDeck.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = DigicastDarkColorScheme,
        typography = Typography,
        content = content
    )
}
