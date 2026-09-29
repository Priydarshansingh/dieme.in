package com.digicast.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.ui.navigation.DigicastNavGraph
import com.digicast.app.ui.theme.DigicastTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Handle deep link if app launched from OAuth or .dcast file
        handleIncomingIntent(intent)

        setContent {
            DigicastTheme {
                DigicastNavGraph(navController = rememberNavController())
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val data: Uri? = intent?.data
        if (data != null) {
            if (data.scheme == "digicast") {
                val handled = authRepository.handleOAuthDeepLink(data)
                if (handled) {
                    Toast.makeText(this, "Signed in successfully!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
