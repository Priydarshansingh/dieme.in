package com.digicast.app.ui.screens.settings

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    onSignOut: () -> Unit,
    extensionViewModel: ExtensionViewModel = hiltViewModel(),
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    val authState by authRepository.authState.collectAsState()
    val extensions by extensionViewModel.extensions.collectAsState()
    val statusMsg by extensionViewModel.statusMessage.collectAsState()

    var isSyncing by remember { mutableStateOf(false) }

    LaunchedEffect(statusMsg) {
        statusMsg?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Settings & Account",
                color = DigicastWhite,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            // ── Account & Google Sign-In Card ────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = DigicastAccentBlue)
                        Text("Google & Workspace Account", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                    }

                    when (val state = authState) {
                        is AuthState.SignedIn -> {
                            val session = state.session
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(DigicastAccentBlue),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = session.displayName.take(1).uppercase(),
                                        color = DigicastWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 20.sp
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(session.displayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Text(session.email, color = DigicastSlate, fontSize = 13.sp)
                                    Row(modifier = Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Box(
                                            modifier = Modifier
                                                .background(DigicastNavy, RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text("ROLE: ${session.role.uppercase()}", color = DigicastAccentBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Box(
                                            modifier = Modifier
                                                .background(DigicastNavy, RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text(session.workspaceName, color = DigicastWhite, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            isSyncing = true
                                            val res = authRepository.syncWorkspaceData()
                                            isSyncing = false
                                            if (res.isSuccess) {
                                                Toast.makeText(context, "Workspace synchronized!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(context, "Sync: ${res.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastAccentBlue)
                                ) {
                                    if (isSyncing) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = DigicastAccentBlue, strokeWidth = 2.dp)
                                    } else {
                                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Sync Cloud")
                                    }
                                }

                                Button(
                                    onClick = {
                                        val authUrl = authRepository.getGoogleOAuthUrl()
                                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(authUrl))
                                        context.startActivity(browserIntent)
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastNavy)
                                ) {
                                    Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Switch Account")
                                }
                            }

                            OutlinedButton(
                                onClick = {
                                    authRepository.signOut()
                                    onSignOut()
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastLiveRed)
                            ) {
                                Text("Sign Out of Workspace")
                            }
                        }

                        else -> {
                            Text(
                                "Sign in with your Google Account to connect to your YouTube Channel and cloud workspace as Creator or Editor.",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                            var showSignInDialog by remember { mutableStateOf(false) }

                            if (showSignInDialog) {
                                com.digicast.app.ui.components.SignInDialog(
                                    onDismissRequest = { showSignInDialog = false },
                                    onSuccess = { showSignInDialog = false },
                                    authRepository = authRepository,
                                    initialEmail = "pskishnawat133@gmail.com"
                                )
                            }

                            Button(
                                onClick = { showSignInDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.AccountCircle, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Sign in with Google Account")
                            }

                            OutlinedButton(
                                onClick = {
                                    authRepository.resetToDefaultSignedIn()
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastSlate),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Continue with Default Studio Account")
                            }
                        }
                    }
                }
            }

            // ── Extensions & Plugins Card (.dcast) ───────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Extension, contentDescription = null, tint = DigicastAccentBlue)
                            Text("Extensions (.dcast)", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                        }
                        IconButton(onClick = { extensionViewModel.loadCatalog() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = DigicastSlate)
                        }
                    }

                    Text(
                        "Extensions allow high-performance video trimming (yt-dlp + FFmpeg) on your device without violating Play Store rules. Fetched from GitHub Releases.",
                        color = DigicastSlate,
                        fontSize = 12.sp
                    )

                    extensions.forEach { item ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = DigicastNavy),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.name, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("v${item.version} • ${item.id}", color = DigicastSlate, fontSize = 11.sp)
                                    }
                                    if (item.isInstalled) {
                                        Box(
                                            modifier = Modifier
                                                .background(Color(0xFF1E3A2F), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("INSTALLED", color = Color(0xFF4ADE80), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }

                                Text(item.description, color = DigicastSlate, fontSize = 12.sp)

                                if (item.isInstalling) {
                                    LinearProgressIndicator(
                                        progress = { item.downloadProgress / 100f },
                                        modifier = Modifier.fillMaxWidth().height(4.dp),
                                        color = DigicastAccentBlue
                                    )
                                    Text("Downloading ${item.downloadProgress}%", color = DigicastSlate, fontSize = 11.sp)
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (item.isInstalled) {
                                        OutlinedButton(
                                            onClick = { extensionViewModel.removeExtension(item) },
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastLiveRed)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Uninstall", fontSize = 12.sp)
                                        }
                                    } else {
                                        Button(
                                            onClick = { extensionViewModel.installExtension(item) },
                                            enabled = !item.isInstalling,
                                            colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue)
                                        ) {
                                            Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Install .dcast", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Privacy & Security Details ───────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = DigicastSlate)
                        Text("Security Architecture", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    }
                    Text("• Chat messages are processed in-memory and stored only locally in Room DB.", color = DigicastSlate, fontSize = 12.sp)
                    Text("• Zero cross-account data leakage: Workspaces and clip markers are cryptographically bounded by your verified Gmail UID.", color = DigicastSlate, fontSize = 12.sp)
                    Text("• Telegram bot tokens are executed serverless in Cloud Run and never stored in this APK.", color = DigicastSlate, fontSize = 12.sp)
                }
            }
        }
    }
}
