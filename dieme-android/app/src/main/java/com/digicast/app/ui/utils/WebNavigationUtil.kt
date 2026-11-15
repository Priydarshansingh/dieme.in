package com.digicast.app.ui.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast

object WebNavigationUtil {
    const val YOUTUBE_CONNECT_WEB_URL = "https://www.dieme.in/settings#youtube"
    const val SIGNUP_WEB_URL = "https://www.dieme.in/signup"
    const val LOGIN_WEB_URL = "https://www.dieme.in/login"
    const val DASHBOARD_WEB_URL = "https://www.dieme.in/dashboard"

    /**
     * Opens Chrome or default browser directly to the website's YouTube connect button.
     * If session credentials exist, passes them to api/youtube/auth so it can initiate Google OAuth seamlessly,
     * with automatic fallback directly to /settings#youtube.
     */
    fun openWebConnectYouTube(context: Context, workspaceId: String = "", token: String = "") {
        val targetUrl = if (workspaceId.isNotBlank() && token.isNotBlank()) {
            "https://www.dieme.in/api/youtube/auth?workspaceId=$workspaceId&token=$token&source=mobile_connect_youtube&redirect=true"
        } else {
            YOUTUBE_CONNECT_WEB_URL
        }

        launchBrowser(context, targetUrl, fallbackUrl = YOUTUBE_CONNECT_WEB_URL)
    }

    /**
     * Opens Google Chrome or the device browser with Chrome preference and graceful fallback.
     */
    fun launchBrowser(context: Context, url: String, fallbackUrl: String = url) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        try {
            // Priority: Launch directly in Google Chrome if installed
            intent.setPackage("com.android.chrome")
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback: Launch in device default browser
            try {
                intent.setPackage(null)
                if (url != fallbackUrl) {
                    intent.data = Uri.parse(fallbackUrl)
                }
                context.startActivity(intent)
            } catch (e2: Exception) {
                Toast.makeText(context, "Cannot open browser: ${e2.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
