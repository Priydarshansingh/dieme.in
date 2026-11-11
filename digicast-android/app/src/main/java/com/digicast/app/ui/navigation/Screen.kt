package com.digicast.app.ui.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Streams : Screen("streams")
    data object StreamDetail : Screen("streams/{streamId}") {
        fun createRoute(streamId: String) = "streams/$streamId"
    }
    data object Clips : Screen("clips")
    data object ClipGenerate : Screen("clips/{clipId}/generate") {
        fun createRoute(clipId: String) = "clips/$clipId/generate"
    }
    data object Team : Screen("team")
    data object Settings : Screen("settings")
    data object Onboarding : Screen("onboarding")
    data object ThumbnailStudio : Screen("thumbnail_studio")
}
