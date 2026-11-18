package com.digicast.dgimages

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.digicast.dgimages.ui.DgImagesDashboard

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DgImagesDashboard()
        }
    }

    override fun onPause() {
        super.onPause()
        // Prevent Chromium from freezing timers/WebSockets when backgrounded
        val wv = com.digicast.dgimages.browser.ChatGptSessionManager.activeAdapter?.webView
        wv?.resumeTimers()
        wv?.onResume()
    }

    override fun onStop() {
        super.onStop()
        // Keep headless/background WebView alive while user is interacting in Dieme
        val wv = com.digicast.dgimages.browser.ChatGptSessionManager.activeAdapter?.webView
        wv?.resumeTimers()
        wv?.onResume()
    }
}

