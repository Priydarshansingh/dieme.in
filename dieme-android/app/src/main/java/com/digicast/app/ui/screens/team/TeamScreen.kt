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
            Text("TEAM", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)

            when (val state = authState) {
                is AuthState.SignedIn -> {
                    val session = state.session

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("MEMBERS", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }

                    // Active Member Profile Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
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
                                        fontSize = 18.sp
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(session.displayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Text(session.email, color = DigicastSlate, fontSize = 13.sp)
                                }
                                Box(
                                    modifier = Modifier
                                        .background(DigicastNavy, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(session.role.uppercase(), color = DigicastAccentBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("PERMISSIONS", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    // Role Permissions Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            PermissionItem(
                                title = "Manage Streams",
                                allowed = true,
                                note = ""
                            )
                            PermissionItem(
                                title = "Create & Publish Clips",
                                allowed = true,
                                note = ""
                            )
                            PermissionItem(
                                title = "Workspace Billing",
                                allowed = session.role.lowercase() == "owner",
                                note = ""
                            )
                            PermissionItem(
                                title = "Team Management",
                                allowed = session.role.lowercase() == "owner",
                                note = ""
                            )
                        }
                    }
                }
                else -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Not Connected", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(
                                "Sign in from Settings or Onboarding to link this device with your Creator/Editor team workspace.",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                        }
                    }
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
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            if (note.isNotEmpty()) {
                Text(note, color = DigicastSlate, fontSize = 11.sp)
            }
        }
        Text(
            text = if (allowed) "✓" else "—",
            color = if (allowed) DigicastWhite else DigicastSlate,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
