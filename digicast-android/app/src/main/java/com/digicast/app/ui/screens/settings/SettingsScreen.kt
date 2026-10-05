package com.digicast.app.ui.screens.settings

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.TeamMember
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    onSignOut: () -> Unit,
    onNavigateBack: () -> Unit = {},
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

    // Team Access & Credentials State
    var teamMembers by remember { mutableStateOf<List<TeamMember>>(emptyList()) }
    var isLoadingTeam by remember { mutableStateOf(false) }
    var visiblePasswords by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) }
    var isAddingMember by remember { mutableStateOf(false) }

    // Add Member Form State
    var newMemberName by remember { mutableStateOf("") }
    var newMemberEmail by remember { mutableStateOf("") }
    var newMemberPassword by remember { mutableStateOf("") }
    var newMemberRole by remember { mutableStateOf("editor") }
    var showNewMemberPassword by remember { mutableStateOf(false) }
    var isSubmittingMember by remember { mutableStateOf(false) }

    fun refreshTeam() {
        coroutineScope.launch {
            isLoadingTeam = true
            val res = authRepository.getTeamMembers()
            isLoadingTeam = false
            if (res.isSuccess) {
                teamMembers = res.getOrDefault(emptyList())
            }
        }
    }

    LaunchedEffect(authState) {
        val s = (authState as? AuthState.SignedIn)?.session
        if (s != null && (s.role.equals("owner", ignoreCase = true) || s.role.equals("admin", ignoreCase = true))) {
            refreshTeam()
        }
    }

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
            // Header with Back Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(onClick = onNavigateBack, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = DigicastWhite
                    )
                }
                Text(
                    text = "Profile & Settings",
                    color = DigicastWhite,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // ── Account & Role Card ───────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("WORKSPACE & USER ROLE", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    when (val state = authState) {
                        is AuthState.SignedIn -> {
                            val session = state.session
                            val isOwner = session.role.equals("owner", ignoreCase = true)

                            // Avatar + profile info
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(CircleShape)
                                        .background(DigicastNavy),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = session.displayName.take(1).uppercase(),
                                        color = DigicastWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 22.sp
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(session.displayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Text(session.email, color = DigicastSlate, fontSize = 13.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    if (isOwner) Color(0xFF2E1C0C) else DigicastNavy,
                                                    RoundedCornerShape(6.dp)
                                                )
                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                        ) {
                                            Text(
                                                "ROLE: ${session.role.uppercase()}",
                                                color = if (isOwner) Color(0xFFFBBF24) else DigicastAccentBlue,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                letterSpacing = 1.sp
                                            )
                                        }

                                        if (session.workspaceId.isNotBlank()) {
                                            Text(
                                                text = "WS: ${session.workspaceId.take(8)}...",
                                                color = DigicastSlate,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }
                            }

                            // Role Permissions Summary
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(DigicastSurface, RoundedCornerShape(8.dp))
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = if (isOwner) "Owner Capabilities (Full Studio Access)" else "Editor Capabilities (Production Team)",
                                    color = DigicastWhite,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )

                                RolePermissionRow(title = "Manage Streams & Live Chat", granted = true)
                                RolePermissionRow(title = "Capture & Publish Clip Markers", granted = true)
                                RolePermissionRow(title = "Manage Team & Invite Members", granted = isOwner, hint = if (!isOwner) "Owner only" else "")
                                RolePermissionRow(title = "Workspace Billing & API Keys", granted = isOwner, hint = if (!isOwner) "Owner only" else "")
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
                                    Text("Sync Workspace Data")
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

            // ── Team Access & Credentials Card (Owner & Admin) ───────────────
            val currentSession = (authState as? AuthState.SignedIn)?.session
            val canManageTeamInApp = currentSession != null &&
                (currentSession.role.equals("owner", ignoreCase = true) || currentSession.role.equals("admin", ignoreCase = true))

            if (canManageTeamInApp) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Group,
                                    contentDescription = null,
                                    tint = DigicastAccentBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                                Column {
                                    Text(
                                        text = "TEAM ACCESS & CREDENTIALS",
                                        color = DigicastSlate,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp
                                    )
                                    Text(
                                        text = "${teamMembers.size} Member${if (teamMembers.size == 1) "" else "s"} in Workspace",
                                        color = DigicastWhite,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                if (isLoadingTeam) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = DigicastAccentBlue,
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    IconButton(
                                        onClick = { refreshTeam() },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Refresh,
                                            contentDescription = "Refresh",
                                            tint = DigicastSlate,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }

                                IconButton(
                                    onClick = { isAddingMember = !isAddingMember },
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(if (isAddingMember) DigicastSurface else DigicastAccentBlue.copy(alpha = 0.15f))
                                ) {
                                    Icon(
                                        imageVector = if (isAddingMember) Icons.Default.Close else Icons.Default.PersonAdd,
                                        contentDescription = "Add Member",
                                        tint = if (isAddingMember) DigicastSlate else DigicastAccentBlue,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        // Add Member Form
                        if (isAddingMember) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(DigicastSurfaceElevated, RoundedCornerShape(10.dp))
                                    .border(1.dp, DigicastBorder, RoundedCornerShape(10.dp))
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "Add Team Member",
                                    color = DigicastWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                // Role selector: Editor or Moderator
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (newMemberRole == "editor") DigicastEmerald.copy(alpha = 0.2f) else DigicastSurface)
                                            .border(
                                                1.dp,
                                                if (newMemberRole == "editor") DigicastEmerald else DigicastBorder,
                                                RoundedCornerShape(8.dp)
                                            )
                                            .clickable { newMemberRole = "editor" }
                                            .padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "Editor",
                                            color = if (newMemberRole == "editor") DigicastEmerald else DigicastSlate,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (newMemberRole == "moderator") DigicastElectricCyan.copy(alpha = 0.2f) else DigicastSurface)
                                            .border(
                                                1.dp,
                                                if (newMemberRole == "moderator") DigicastElectricCyan else DigicastBorder,
                                                RoundedCornerShape(8.dp)
                                            )
                                            .clickable { newMemberRole = "moderator" }
                                            .padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "Moderator",
                                            color = if (newMemberRole == "moderator") DigicastElectricCyan else DigicastSlate,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }
                                }

                                OutlinedTextField(
                                    value = newMemberName,
                                    onValueChange = { newMemberName = it },
                                    label = { Text("Display Name", fontSize = 12.sp) },
                                    placeholder = { Text("e.g. Alex Editor", fontSize = 12.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = DigicastWhite,
                                        unfocusedTextColor = DigicastWhite,
                                        focusedBorderColor = DigicastAccentBlue,
                                        unfocusedBorderColor = DigicastBorder,
                                        focusedLabelColor = DigicastAccentBlue,
                                        unfocusedLabelColor = DigicastSlate,
                                        cursorColor = DigicastAccentBlue
                                    )
                                )

                                OutlinedTextField(
                                    value = newMemberEmail,
                                    onValueChange = { newMemberEmail = it },
                                    label = { Text("Login Email", fontSize = 12.sp) },
                                    placeholder = { Text("editor@example.com", fontSize = 12.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = DigicastWhite,
                                        unfocusedTextColor = DigicastWhite,
                                        focusedBorderColor = DigicastAccentBlue,
                                        unfocusedBorderColor = DigicastBorder,
                                        focusedLabelColor = DigicastAccentBlue,
                                        unfocusedLabelColor = DigicastSlate,
                                        cursorColor = DigicastAccentBlue
                                    )
                                )

                                OutlinedTextField(
                                    value = newMemberPassword,
                                    onValueChange = { newMemberPassword = it },
                                    label = { Text("App Password", fontSize = 12.sp) },
                                    placeholder = { Text("Min 6 characters", fontSize = 12.sp) },
                                    singleLine = true,
                                    visualTransformation = if (showNewMemberPassword) VisualTransformation.None else PasswordVisualTransformation(),
                                    trailingIcon = {
                                        IconButton(onClick = { showNewMemberPassword = !showNewMemberPassword }) {
                                            Icon(
                                                imageVector = if (showNewMemberPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = "Toggle password",
                                                tint = DigicastSlate,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = DigicastWhite,
                                        unfocusedTextColor = DigicastWhite,
                                        focusedBorderColor = DigicastAccentBlue,
                                        unfocusedBorderColor = DigicastBorder,
                                        focusedLabelColor = DigicastAccentBlue,
                                        unfocusedLabelColor = DigicastSlate,
                                        cursorColor = DigicastAccentBlue
                                    )
                                )

                                Button(
                                    onClick = {
                                        if (newMemberEmail.isBlank() || newMemberPassword.isBlank()) {
                                            Toast.makeText(context, "Email and Password are required", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }
                                        if (newMemberPassword.length < 6) {
                                            Toast.makeText(context, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }

                                        coroutineScope.launch {
                                            isSubmittingMember = true
                                            val res = authRepository.createTeamMember(
                                                email = newMemberEmail,
                                                password = newMemberPassword,
                                                displayName = newMemberName,
                                                role = newMemberRole
                                            )
                                            isSubmittingMember = false
                                            if (res.isSuccess) {
                                                Toast.makeText(context, "${newMemberRole.uppercase()} created successfully!", Toast.LENGTH_SHORT).show()
                                                newMemberName = ""
                                                newMemberEmail = ""
                                                newMemberPassword = ""
                                                refreshTeam()
                                            } else {
                                                Toast.makeText(
                                                    context,
                                                    res.exceptionOrNull()?.message ?: "Failed to create user",
                                                    Toast.LENGTH_LONG
                                                ).show()
                                            }
                                        }
                                    },
                                    enabled = !isSubmittingMember && newMemberEmail.isNotBlank() && newMemberPassword.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth().height(42.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue)
                                ) {
                                    if (isSubmittingMember) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = DigicastNavy, strokeWidth = 2.dp)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Saving Member...", color = DigicastNavy, fontWeight = FontWeight.Bold)
                                    } else {
                                        Icon(Icons.Default.Add, contentDescription = null, tint = DigicastNavy, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Save ${newMemberRole.uppercase()} Login", color = DigicastNavy, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        // Team Members Listing
                        if (teamMembers.isEmpty() && !isLoadingTeam) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(DigicastSurface, RoundedCornerShape(8.dp))
                                    .padding(vertical = 18.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No team members created yet. Tap '+' above to add your first editor.",
                                    color = DigicastSlate,
                                    fontSize = 12.sp
                                )
                            }
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                teamMembers.forEach { member ->
                                    val isOwnerMember = member.role.equals("owner", ignoreCase = true)
                                    val isAdminMember = member.role.equals("admin", ignoreCase = true)
                                    val isEditorMember = member.role.equals("editor", ignoreCase = true)

                                    val roleColor = when {
                                        isOwnerMember -> Color(0xFFFBBF24)
                                        isAdminMember -> DigicastAccentBlue
                                        isEditorMember -> DigicastEmerald
                                        else -> DigicastElectricCyan
                                    }

                                    val roleBg = when {
                                        isOwnerMember -> Color(0xFF2E1C0C)
                                        isAdminMember -> DigicastNavy
                                        isEditorMember -> Color(0xFF0F2E1E)
                                        else -> Color(0xFF0D2530)
                                    }

                                    val isPasswordVisible = visiblePasswords[member.uid] == true

                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(DigicastSurface, RoundedCornerShape(10.dp))
                                            .border(1.dp, DigicastBorder, RoundedCornerShape(10.dp))
                                            .padding(12.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(CircleShape)
                                                        .background(roleBg),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(
                                                        text = member.displayName.take(1).uppercase(),
                                                        color = roleColor,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 15.sp
                                                    )
                                                }

                                                Column(modifier = Modifier.weight(1f)) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                    ) {
                                                        Text(
                                                            text = member.displayName,
                                                            color = DigicastWhite,
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 13.sp
                                                        )
                                                        Box(
                                                            modifier = Modifier
                                                                .background(roleBg, RoundedCornerShape(4.dp))
                                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                                        ) {
                                                            Text(
                                                                text = member.role.uppercase(),
                                                                color = roleColor,
                                                                fontWeight = FontWeight.ExtraBold,
                                                                fontSize = 9.sp,
                                                                letterSpacing = 0.5.sp
                                                            )
                                                        }
                                                    }
                                                    Text(
                                                        text = member.email,
                                                        color = DigicastSlate,
                                                        fontSize = 11.sp
                                                    )
                                                }
                                            }

                                            // Delete Button (non-owner)
                                            if (!isOwnerMember && currentSession.role.equals("owner", ignoreCase = true)) {
                                                IconButton(
                                                    onClick = {
                                                        coroutineScope.launch {
                                                            val res = authRepository.removeTeamMember(member.uid)
                                                            if (res.isSuccess) {
                                                                Toast.makeText(context, "Member removed", Toast.LENGTH_SHORT).show()
                                                                refreshTeam()
                                                            } else {
                                                                Toast.makeText(context, res.exceptionOrNull()?.message ?: "Failed", Toast.LENGTH_SHORT).show()
                                                            }
                                                        }
                                                    },
                                                    modifier = Modifier.size(28.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.Delete,
                                                        contentDescription = "Remove",
                                                        tint = DigicastSlate.copy(alpha = 0.6f),
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                }
                                            }
                                        }

                                        // Credential Row with Hide / Unhide Button & Copy
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(DigicastNavy, RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Lock,
                                                    contentDescription = null,
                                                    tint = DigicastSlate,
                                                    modifier = Modifier.size(13.dp)
                                                )
                                                Text(
                                                    text = "Password:",
                                                    color = DigicastSlate,
                                                    fontSize = 11.sp
                                                )
                                                Text(
                                                    text = if (isPasswordVisible) (member.appPassword ?: "••••••••") else "••••••••",
                                                    color = if (isPasswordVisible) DigicastWhite else DigicastSlate,
                                                    fontWeight = if (isPasswordVisible) FontWeight.Bold else FontWeight.Normal,
                                                    fontSize = 11.sp
                                                )
                                            }

                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(2.dp)
                                            ) {
                                                // Eye Hide / Unhide Button
                                                IconButton(
                                                    onClick = {
                                                        visiblePasswords = visiblePasswords.toMutableMap().apply {
                                                            put(member.uid, !(this[member.uid] ?: false))
                                                        }
                                                    },
                                                    modifier = Modifier.size(24.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                        contentDescription = "Toggle password visibility",
                                                        tint = if (isPasswordVisible) DigicastAccentBlue else DigicastSlate,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                }

                                                // Copy Password Button
                                                if (!member.appPassword.isNullOrBlank()) {
                                                    IconButton(
                                                        onClick = {
                                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                                            val clip = ClipData.newPlainText("Password", member.appPassword)
                                                            clipboard.setPrimaryClip(clip)
                                                            Toast.makeText(context, "Password copied to clipboard!", Toast.LENGTH_SHORT).show()
                                                        },
                                                        modifier = Modifier.size(24.dp)
                                                    ) {
                                                        Icon(
                                                            imageVector = Icons.Default.ContentCopy,
                                                            contentDescription = "Copy password",
                                                            tint = DigicastSlate,
                                                            modifier = Modifier.size(13.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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

@Composable
private fun RolePermissionRow(
    title: String,
    granted: Boolean,
    hint: String = ""
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = if (granted) "✓" else "—",
                color = if (granted) DigicastEmerald else DigicastSlate,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = title,
                color = if (granted) DigicastWhite else DigicastSlate,
                fontSize = 12.sp
            )
        }
        if (hint.isNotEmpty()) {
            Text(
                text = hint,
                color = DigicastSlate,
                fontSize = 10.sp
            )
        }
    }
}

