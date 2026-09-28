package com.digicast.app.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun SettingsScreen(onSignOut: () -> Unit) {
    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Settings", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("Chat is stored only on this device unless you explicitly authorize a sync.", color = DigicastSlate)
            Text("YouTube OAuth is separate from Google Sign-In and uses PKCE.", color = DigicastSlate)
            Text("Telegram uploads go through Cloud Run. The bot token is never in this app.", color = DigicastSlate)
            Button(
                onClick = onSignOut,
                colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                modifier = Modifier.fillMaxWidth()
            ) { Text("Sign out") }
        }
    }
}
