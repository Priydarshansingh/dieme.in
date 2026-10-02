package com.digicast.app.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
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

            // ── Account Card ──────────────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("WORKSPACE ACCOUNT", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    when (val state = authState) {
                        is AuthState.SignedIn -> {
                            val session = state.session

                            // Avatar + profile info
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(DigicastNavy),
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
                                    Row(
                                        modifier = Modifier.padding(top = 4.dp),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .background(DigicastNavy, RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                "ROLE: ${session.role.uppercase()}",
                                                color = DigicastAccentBlue,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }

                            // Sync Cloud button
                            OutlinedButton(
                                onClick = {
                                    coroutineScope.launch {
                                        isSyncing = true
                                        val res = authRepository.syncWorkspaceData()
                                        isSyncing = false
                                        val msg = if (res.isSuccess) "Workspace synchronized!"
                                                  else "Sync failed: ${res.exceptionOrNull()?.message}"
                                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().height(42.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastAccentBlue),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                if (isSyncing) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = DigicastAccentBlue,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Syncing...")
                                } else {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Sync Cloud")
                                }
                            }

                            // Sign out
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
                            // Not signed in — just a message; onboarding handles sign-in
                            Text(
                                "You are not signed in. Go back and sign in with your workspace email to connect to your studio.",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }

            // ── Extensions & Plugins Card (.dcast) ────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("EXTENSIONS (.DCAST)", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        IconButton(onClick = { extensionViewModel.loadCatalog() }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = DigicastSlate)
                        }
                    }

                    extensions.forEach { item ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                            shape = RoundedCornerShape(8.dp),
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
                                        Text("INSTALLED", color = DigicastEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                if (item.isInstalling) {
                                    LinearProgressIndicator(
                                        progress = { item.downloadProgress / 100f },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(4.dp),
                                        color = DigicastAccentBlue
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (item.isInstalled) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Uninstall",
                                            color = DigicastLiveRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            modifier = Modifier.clickable { extensionViewModel.removeExtension(item) }.padding(4.dp)
                                        )
                                    } else {
                                        Button(
                                            onClick = { extensionViewModel.installExtension(item) },
                                            enabled = !item.isInstalling,
                                            colors = ButtonDefaults.buttonColors(containerColor = DigicastNavy),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.height(32.dp),
                                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                                        ) {
                                            Text("Install .dcast", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Privacy & Security ────────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("SECURITY ARCHITECTURE", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            "• Chat messages are processed in-memory and stored only locally in Room DB.",
                            color = DigicastSlate,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                        Text(
                            "• Zero cross-account data leakage: Workspaces and clip markers are bounded by your verified workspace UID.",
                            color = DigicastSlate,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                        Text(
                            "• Telegram bot tokens are executed serverless in Cloud Run and never stored in this APK.",
                            color = DigicastSlate,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                        Text(
                            "• Sign-in uses your registered workspace email. No passwords are stored on-device.",
                            color = DigicastSlate,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }
    }
}
