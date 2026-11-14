package com.digicast.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.ui.navigation.DigicastNavGraph
import com.digicast.app.ui.theme.DigicastTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleDeepLinkIntent(intent)
        setContent {
            DigicastTheme {
                DigicastNavGraph(navController = rememberNavController())
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLinkIntent(intent)
    }

    private fun handleDeepLinkIntent(intent: android.content.Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == "digicast" || data.scheme == "dieme") {
            val host = data.host ?: ""
            val path = data.path ?: ""
            if (host == "youtube-connected" || path.contains("youtube-connected")) {
                val channel = data.getQueryParameter("channel") ?: data.getQueryParameter("channelName") ?: ""
                val status = data.getQueryParameter("status") ?: "success"
                val error = data.getQueryParameter("error") ?: ""

                if (status == "success") {
                    val msg = if (channel.isNotBlank()) "YouTube Channel $channel Connected!" else "YouTube Connected Successfully!"
                    android.widget.Toast.makeText(this, msg, android.widget.Toast.LENGTH_LONG).show()
                } else if (error.isNotBlank()) {
                    android.widget.Toast.makeText(this, "Connection Error: $error", android.widget.Toast.LENGTH_LONG).show()
                }

                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                    authRepository.syncWorkspaceData()
                }
            }
        }
    }
}
