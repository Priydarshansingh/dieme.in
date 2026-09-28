package com.digicast.app.ui.screens.onboarding

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.components.DigicastLogo
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun OnboardingScreen(onComplete: () -> Unit) {
    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.Start
        ) {
            DigicastLogo(size = 48)
            Text("Capture live chat. Mark clips. Keep chat local.", color = DigicastWhite, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                "Phase 1 watches YouTube live chat on-device, detects !clip, and stores markers in Room. Nothing is uploaded unless you ask.",
                color = DigicastSlate
            )
            Button(
                onClick = onComplete,
                colors = ButtonDefaults.buttonColors(containerColor = DigicastNavy),
                modifier = Modifier.fillMaxWidth()
            ) { Text("Continue") }
        }
    }
}
