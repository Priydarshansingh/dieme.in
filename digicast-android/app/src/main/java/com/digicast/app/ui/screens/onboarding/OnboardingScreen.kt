package com.digicast.app.ui.screens.onboarding

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.ui.components.DigicastLogo
import com.digicast.app.ui.screens.settings.SettingsAuthWrapperViewModel
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val context = LocalContext.current
    val authState by authRepository.authState.collectAsState()

    // If already signed in, navigate forward directly
    LaunchedEffect(authState) {
        if (authState is AuthState.SignedIn) {
            onComplete()
        }
    }

    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            DigicastLogo(size = 72)

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Welcome to Digicast",
                    color = DigicastWhite,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Live Stream Intelligence & Clip Automation",
                    color = DigicastAccentBlue,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // Feature Highlights
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    FeatureRow(
                        icon = Icons.Default.AutoAwesome,
                        title = "Real-time Live Chat Capture",
                        desc = "Monitors stream chat on-device and detects !clip triggers instantly."
                    )
                    FeatureRow(
                        icon = Icons.Default.Security,
                        title = "Zero Data Leakage Privacy",
                        desc = "Chat stays on your phone. Synchronizes only with your verified YouTube workspace."
                    )
                    FeatureRow(
                        icon = Icons.Default.CloudDownload,
                        title = "Modular .dcast Extensions",
                        desc = "Install high-performance yt-dlp & FFmpeg processing from GitHub Releases."
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            var showSignInDialog by remember { mutableStateOf(false) }

            if (showSignInDialog) {
                com.digicast.app.ui.components.SignInDialog(
                    onDismissRequest = { showSignInDialog = false },
                    onSuccess = { onComplete() },
                    authRepository = authRepository,
                    initialEmail = "pskishnawat133@gmail.com"
                )
            }

            // Google Sign-In Action Button (Opens Instant Sign-In)
            Button(
                onClick = { showSignInDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Icon(Icons.Default.AccountCircle, contentDescription = null, modifier = Modifier.size(22.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text("Sign in with Google", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            // Continue Offline / Local Mode
            OutlinedButton(
                onClick = {
                    authRepository.resetToDefaultSignedIn()
                    onComplete()
                },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastSlate),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Enter App (Default Studio Account)", fontSize = 14.sp)
            }

            Text(
                text = "By signing in, your role (Creator or Editor) and streams are securely linked from digicast-web.",
                color = DigicastSlate,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}

@Composable
private fun FeatureRow(
    icon: ImageVector,
    title: String,
    desc: String
) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(DigicastNavy, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = DigicastAccentBlue, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(desc, color = DigicastSlate, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}
