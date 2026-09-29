package com.digicast.app.ui.screens.team

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
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.ui.screens.settings.SettingsAuthWrapperViewModel
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun TeamScreen(
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val authState by authRepository.authState.collectAsState()

    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Team & Workspace", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)

            when (val state = authState) {
                is AuthState.SignedIn -> {
                    val session = state.session

                    // Active Member Profile Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Group, contentDescription = null, tint = DigicastAccentBlue)
                                Text("Current Workspace Member", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(DigicastAccentBlue),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = session.displayName.take(1).uppercase(),
                                        color = DigicastWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(session.displayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text(session.email, color = DigicastSlate, fontSize = 12.sp)
                                }
                                Box(
                                    modifier = Modifier
                                        .background(DigicastNavy, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(session.role.uppercase(), color = DigicastAccentBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Workspace: ${session.workspaceName}", color = DigicastSlate, fontSize = 13.sp)
                        }
                    }

                    // Role Permissions Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = DigicastAccentBlue)
                                Text("Role & Permissions", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            }

                            PermissionItem(
                                title = "Live Stream Capture",
                                allowed = true,
                                note = "On-device YouTube live chat monitoring & clip markers"
                            )
                            PermissionItem(
                                title = "On-Device .dcast Trimming",
                                allowed = true,
                                note = "Execute local video processing via installed extensions"
                            )
                            PermissionItem(
                                title = "Telegram Bot Integration",
                                allowed = session.role.lowercase() == "owner" || session.role.lowercase() == "editor",
                                note = "Securely dispatched to cloud backend without token exposure"
                            )
                            PermissionItem(
                                title = "Workspace & Member Management",
                                allowed = session.role.lowercase() == "owner",
                                note = "Invite editors and manage workspace settings via web portal"
                            )
                        }
                    }
                }
                else -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Not Connected to Cloud Workspace", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(
                                "Sign in with Google in Settings or Onboarding to link this device with your Creator/Editor team workspace.",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }

            // Security Overview
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = DigicastSlate)
                        Text("Zero-Trust Architecture", color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                    Text(
                        "All workspace data is bound to your verified Google Auth UID and encrypted at rest. Editors never receive sensitive API keys on device.",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionItem(
    title: String,
    allowed: Boolean,
    note: String
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            Text(note, color = DigicastSlate, fontSize = 11.sp)
        }
        Box(
            modifier = Modifier
                .background(
                    if (allowed) androidx.compose.ui.graphics.Color(0xFF1E3A2F)
                    else androidx.compose.ui.graphics.Color(0xFF3B2323),
                    RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(
                text = if (allowed) "ALLOWED" else "RESTRICTED",
                color = if (allowed) androidx.compose.ui.graphics.Color(0xFF4ADE80) else androidx.compose.ui.graphics.Color(0xFFF87171),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
