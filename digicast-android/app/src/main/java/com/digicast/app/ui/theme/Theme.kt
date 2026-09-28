package com.digicast.app.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DigicastDarkColorScheme = darkColorScheme(
    primary = DigicastWhite,
    onPrimary = DigicastNavy,
    primaryContainer = DigicastNavy,
    onPrimaryContainer = DigicastWhite,
    secondary = DigicastEmerald,
    onSecondary = DigicastNavy,
    background = DigicastDeepNavy,
    onBackground = DigicastWhite,
    surface = DigicastSurface,
    onSurface = DigicastWhite,
    surfaceVariant = DigicastSurfaceElevated,
    onSurfaceVariant = DigicastSlate,
    outline = DigicastBorder,
    error = DigicastLiveRed,
    onError = DigicastWhite
)

@Composable
fun DigicastTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = DigicastDeepNavy.toArgb()
            window.navigationBarColor = DigicastDeepNavy.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }
    MaterialTheme(
        colorScheme = DigicastDarkColorScheme,
        typography = Typography,
        content = content
    )
}
