package com.digicast.app.ui.screens.team

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun TeamScreen() {
    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Team", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text(
                "Workspace members and telegramUpload permissions are managed from the web dashboard. Editors never receive bot tokens on device.",
                color = DigicastSlate
            )
        }
    }
}
