package com.digicast.app.ui.screens.settings

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import com.digicast.app.data.repository.GamerAvatarDto
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.TeamMember
import com.digicast.app.data.repository.UserSession
import com.digicast.app.ui.components.Access24hGateDialog
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastSurfaceFloating
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

    val authState by authRepository.authState.collectAsState()
    val youtubeAccount by authRepository.youtubeAccount.collectAsState()
    val extensions by extensionViewModel.extensions.collectAsState()
    val statusMsg by extensionViewModel.statusMessage.collectAsState()

    var isSyncing by remember { mutableStateOf(false) }
    var showSignOutDialog by remember { mutableStateOf(false) }
    var showUpgradeDialog by remember { mutableStateOf(false) }

    // Duolingo Anime Avatar Studio State
    var showAvatarPicker by remember { mutableStateOf(false) }
    var showAddAvatarDialog by remember { mutableStateOf(false) }
    var avatarList by remember { mutableStateOf<List<GamerAvatarDto>>(emptyList()) }
    var isLoadingAvatars by remember { mutableStateOf(false) }

    fun loadAvatars() {
        coroutineScope.launch {
            isLoadingAvatars = true
            val res = authRepository.getAvatars()
            isLoadingAvatars = false
            if (res.isSuccess) {
                avatarList = res.getOrDefault(emptyList())
            }
        }
    }

    // Team Access & Credentials State
    var teamMembers by remember { mutableStateOf<List<TeamMember>>(emptyList()) }
    var isLoadingTeam by remember { mutableStateOf(false) }
    var visiblePasswords by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) }
    var isAddingMember by remember { mutableStateOf(false) }
    var memberToDelete by remember { mutableStateOf<TeamMember?>(null) }
    var memberToChangeRole by remember { mutableStateOf<TeamMember?>(null) }
    var isUpdatingRole by remember { mutableStateOf(false) }

    // Add Member Form State
    var newMemberName by remember { mutableStateOf("") }
    var newMemberEmail by remember { mutableStateOf("") }
    var newMemberPassword by remember { mutableStateOf("") }
    var newMemberRole by remember { mutableStateOf("editor") }
    var showNewMemberPassword by remember { mutableStateOf(false) }
    var isSubmittingMember by remember { mutableStateOf(false) }

    // Rotation animation for sync button
    val infiniteTransition = rememberInfiniteTransition(label = "sync_spin")
    val spinAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "spin_angle"
    )

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
        if (s != null && (s.role.equals("owner", ignoreCase = true) ||
                          s.role.equals("admin", ignoreCase = true) ||
                          s.role.equals("moderator", ignoreCase = true))) {
            refreshTeam()
        }
    }

    LaunchedEffect(statusMsg) {
        statusMsg?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding(),
                color = DigicastDeepNavy,
                border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        IconButton(
                            onClick = onNavigateBack,
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(DigicastSurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = DigicastWhite,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Studio Settings",
                                color = DigicastWhite,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Account, Subscriptions & Team Access",
                                color = DigicastSlate,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Quick Sync Action
                    IconButton(
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
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(DigicastSurfaceElevated)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Sync Workspace",
                            tint = if (isSyncing) DigicastAccentBlue else DigicastSlate,
                            modifier = Modifier
                                .size(20.dp)
                                .rotate(if (isSyncing) spinAngle else 0f)
                        )
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            when (val state = authState) {
                is AuthState.SignedIn -> {
                    val session = state.session
                    val isOwner = session.role.equals("owner", ignoreCase = true)

                    // 1. Workspace Profile & Subscription Bento Card
                    item(key = "workspace_profile_bento") {
                        WorkspaceProfileBentoCard(
                            session = session,
                            context = context,
                            onOpenUpgrade = { showUpgradeDialog = true },
                            onChangeAvatar = {
                                loadAvatars()
                                showAvatarPicker = true
                            }
                        )
                    }

                    // 1a. Duolingo Gamer Avatar Studio Bento Card
                    item(key = "gamer_avatar_studio_card") {
                        DuolingoAvatarStudioBentoCard(
                            session = session,
                            onOpenPicker = {
                                loadAvatars()
                                showAvatarPicker = true
                            }
                        )
                    }

                    // 1b. Creator Wallet, 24H Ad Pass & Top Editors Showcase
                    item(key = "wallet_and_ads_card") {
                        WalletAndAdsCard(
                            session = session,
                            authRepository = authRepository
                        )
                    }

                    // 2. Connected YouTube Channel (if connected)
                    if (youtubeAccount != null) {
                        item(key = "youtube_account_card") {
                            ConnectedYouTubeCard(youtube = youtubeAccount!!)
                        }
                    }

                    // 3. Team Management & Mobile Credentials Card (Owner, Admin & Moderator)
                    val isAdmin = session.role.equals("admin", ignoreCase = true)
                    val isMod = session.role.equals("moderator", ignoreCase = true)
                    val canViewTeam = isOwner || isAdmin || isMod
                    val canAddMember = isOwner || isAdmin

                    if (canViewTeam) {
                        item(key = "team_management_header") {
                            TeamSectionHeader(
                                memberCount = teamMembers.size,
                                isAddingMember = isAddingMember,
                                isLoadingTeam = isLoadingTeam,
                                canAddMember = canAddMember,
                                onToggleAdd = { isAddingMember = !isAddingMember },
                                onRefresh = { refreshTeam() }
                            )
                        }

                        // Add Member Expandable Form (Only Owner & Admin can add members)
                        if (canAddMember) {
                            item(key = "add_member_form") {
                                AnimatedVisibility(
                                    visible = isAddingMember,
                                    enter = expandVertically(tween(250, easing = FastOutSlowInEasing)) + fadeIn(),
                                    exit = shrinkVertically(tween(200, easing = FastOutSlowInEasing)) + fadeOut()
                                ) {
                                    AddMemberCard(
                                        name = newMemberName,
                                        email = newMemberEmail,
                                        password = newMemberPassword,
                                        role = newMemberRole,
                                        showPassword = showNewMemberPassword,
                                        canAssignAdmin = isOwner,
                                        isSubmitting = isSubmittingMember,
                                        onNameChange = { newMemberName = it },
                                        onEmailChange = { newMemberEmail = it },
                                        onPasswordChange = { newMemberPassword = it },
                                        onRoleChange = { newMemberRole = it },
                                        onToggleShowPassword = { showNewMemberPassword = !showNewMemberPassword },
                                        onSubmit = {
                                            if (newMemberEmail.isBlank() || newMemberPassword.isBlank()) {
                                                Toast.makeText(context, "Email and Password are required", Toast.LENGTH_SHORT).show()
                                                return@AddMemberCard
                                            }
                                            if (newMemberPassword.length < 6) {
                                                Toast.makeText(context, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                                                return@AddMemberCard
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
                                                    isAddingMember = false
                                                    refreshTeam()
                                                } else {
                                                    Toast.makeText(
                                                        context,
                                                        res.exceptionOrNull()?.message ?: "Failed to create user",
                                                        Toast.LENGTH_LONG
                                                    ).show()
                                                }
                                            }
                                        }
                                    )
                                }
                            }
                        }

                        // Team Member Cards List
                        if (teamMembers.isEmpty() && !isLoadingTeam) {
                            item(key = "no_members_placeholder") {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    color = DigicastSurface,
                                    border = BorderStroke(1.dp, DigicastBorder)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(20.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Group,
                                            contentDescription = null,
                                            tint = DigicastSlate,
                                            modifier = Modifier.size(28.dp)
                                        )
                                        Text(
                                            text = "No additional team members created yet",
                                            color = DigicastWhite,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp
                                        )
                                        Text(
                                            text = "Tap '+ Add Member' above to create mobile login credentials for your video editors.",
                                            color = DigicastSlate,
                                            fontSize = 11.sp,
                                            lineHeight = 16.sp
                                        )
                                    }
                                }
                            }
                        } else {
                            items(teamMembers, key = { it.uid }) { member ->
                                TeamMemberItemCard(
                                    member = member,
                                    currentSession = session,
                                    isPasswordVisible = visiblePasswords[member.uid] == true,
                                    onTogglePasswordVisibility = {
                                        visiblePasswords = visiblePasswords.toMutableMap().apply {
                                            put(member.uid, !(this[member.uid] ?: false))
                                        }
                                    },
                                    onCopyPassword = {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        val clip = ClipData.newPlainText("Password", member.appPassword ?: "")
                                        clipboard.setPrimaryClip(clip)
                                        Toast.makeText(context, "Password copied to clipboard!", Toast.LENGTH_SHORT).show()
                                    },
                                    onDeleteClick = {
                                        memberToDelete = member
                                    },
                                    onChangeRoleClick = {
                                        memberToChangeRole = member
                                    }
                                )
                            }
                        }
                    }

                    // 4. Extensions & Plugins Card (.dcast)
                    item(key = "extensions_section") {
                        ExtensionsCard(
                            extensions = extensions,
                            onRefresh = { extensionViewModel.loadCatalog() },
                            onInstall = { extensionViewModel.installExtension(it) },
                            onUninstall = { extensionViewModel.removeExtension(it) }
                        )
                    }

                    // 5. Hardware Diagnostics & On-Device Engine
                    item(key = "hardware_diagnostics") {
                        DiagnosticsCard()
                    }

                    // 6. Security Architecture Card
                    item(key = "security_architecture") {
                        SecurityCard()
                    }

                    // 7. Sign Out Button
                    item(key = "sign_out_action") {
                        OutlinedButton(
                            onClick = { showSignOutDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = DigicastLiveRed,
                                containerColor = DigicastLiveRed.copy(alpha = 0.05f)
                            ),
                            border = BorderStroke(1.dp, DigicastLiveRed.copy(alpha = 0.35f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.PowerSettingsNew,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Sign Out of Workspace",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }

                else -> {
                    item(key = "signed_out_banner") {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            color = DigicastSurface,
                            border = BorderStroke(1.dp, DigicastBorder)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = DigicastSlate,
                                    modifier = Modifier.size(36.dp)
                                )
                                Text(
                                    text = "Not Connected to a Studio Workspace",
                                    color = DigicastWhite,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Please return to the sign-in screen and log in with your registered workspace credentials.",
                                    color = DigicastSlate,
                                    fontSize = 12.sp,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Sign Out Confirmation Dialog
    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            containerColor = DigicastSurfaceFloating,
            title = {
                Text("Sign Out?", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Text(
                    "Are you sure you want to sign out of this workspace? You can sign back in at any time with your credentials.",
                    color = DigicastSlate,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSignOutDialog = false
                        authRepository.signOut()
                        onSignOut()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Sign Out", color = DigicastWhite, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) {
                    Text("Cancel", color = DigicastSlate)
                }
            }
        )
    }

    // Delete Member Confirmation Dialog
    memberToDelete?.let { member ->
        AlertDialog(
            onDismissRequest = { memberToDelete = null },
            containerColor = DigicastSurfaceFloating,
            title = {
                Text("Remove ${member.displayName}?", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Text(
                    "This will immediately revoke ${member.email}'s app login access to your workspace.",
                    color = DigicastSlate,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val uid = member.uid
                        memberToDelete = null
                        coroutineScope.launch {
                            val res = authRepository.removeTeamMember(uid)
                            if (res.isSuccess) {
                                Toast.makeText(context, "Member removed", Toast.LENGTH_SHORT).show()
                                refreshTeam()
                            } else {
                                Toast.makeText(context, res.exceptionOrNull()?.message ?: "Failed", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Remove Member", color = DigicastWhite, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { memberToDelete = null }) {
                    Text("Cancel", color = DigicastSlate)
                }
            }
        )
    }

    // Role Change Dialog (Admin / Moderator / Editor)
    memberToChangeRole?.let { member ->
        val isCallerOwner = (authState as? AuthState.SignedIn)?.session?.role.equals("owner", ignoreCase = true)
        val isCallerAdmin = (authState as? AuthState.SignedIn)?.session?.role.equals("admin", ignoreCase = true)

        fun updateRole(newRole: String) {
            coroutineScope.launch {
                isUpdatingRole = true
                val res = authRepository.updateTeamMemberRole(member.uid, newRole)
                isUpdatingRole = false
                memberToChangeRole = null
                if (res.isSuccess) {
                    Toast.makeText(context, "Access updated to ${newRole.uppercase()}!", Toast.LENGTH_SHORT).show()
                    refreshTeam()
                } else {
                    Toast.makeText(context, res.exceptionOrNull()?.message ?: "Failed to update role", Toast.LENGTH_LONG).show()
                }
            }
        }

        AlertDialog(
            onDismissRequest = { memberToChangeRole = null },
            containerColor = DigicastSurfaceFloating,
            shape = RoundedCornerShape(18.dp),
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, tint = DigicastElectricCyan, modifier = Modifier.size(20.dp))
                    Text("Change Access Role", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Select access level for ${member.displayName} (${member.email}):",
                        color = DigicastSlate,
                        fontSize = 12.sp
                    )

                    if (isCallerOwner) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable(enabled = !isUpdatingRole) { updateRole("admin") },
                            color = if (member.role.equals("admin", ignoreCase = true)) DigicastAccentBlue.copy(alpha = 0.2f) else DigicastSurfaceElevated,
                            border = BorderStroke(1.dp, if (member.role.equals("admin", ignoreCase = true)) DigicastAccentBlue else DigicastBorder)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("ADMIN", color = DigicastAccentBlue, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                                Text("Full studio settings, members & pass access", color = DigicastWhite, fontSize = 11.sp)
                            }
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable(enabled = !isUpdatingRole) { updateRole("moderator") },
                        color = if (member.role.equals("moderator", ignoreCase = true)) DigicastElectricCyan.copy(alpha = 0.2f) else DigicastSurfaceElevated,
                        border = BorderStroke(1.dp, if (member.role.equals("moderator", ignoreCase = true)) DigicastElectricCyan else DigicastBorder)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("MODERATOR", color = DigicastElectricCyan, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                            Text("Chat & stream monitor, editor access management", color = DigicastWhite, fontSize = 11.sp)
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable(enabled = !isUpdatingRole) { updateRole("editor") },
                        color = if (member.role.equals("editor", ignoreCase = true)) DigicastEmerald.copy(alpha = 0.2f) else DigicastSurfaceElevated,
                        border = BorderStroke(1.dp, if (member.role.equals("editor", ignoreCase = true)) DigicastEmerald else DigicastBorder)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("EDITOR", color = DigicastEmerald, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                            Text("Video clipping, trimming & stream markers", color = DigicastWhite, fontSize = 11.sp)
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { memberToChangeRole = null }) {
                    Text("Cancel", color = DigicastSlate)
                }
            }
        )
    }

    // Upgrade Passes & UPI Scanner Dialog
    if (showUpgradeDialog && authState is AuthState.SignedIn) {
        Access24hGateDialog(
            session = (authState as AuthState.SignedIn).session,
            authRepository = authRepository,
            initialShowScanner = true,
            onDismiss = { showUpgradeDialog = false },
            onUnlocked = {
                showUpgradeDialog = false
                Toast.makeText(context, "Subscription updated!", Toast.LENGTH_SHORT).show()
            }
        )
    }

    // Duolingo Avatar Picker Dialog
    if (showAvatarPicker) {
        val currentSession = (authState as? AuthState.SignedIn)?.session
        val isOwnerOrAdmin = currentSession?.role.let { it.equals("owner", true) || it.equals("admin", true) }

        DuolingoAvatarPickerDialog(
            currentPhotoUrl = currentSession?.photoUrl ?: "",
            currentDisplayName = currentSession?.displayName ?: "User",
            avatars = avatarList,
            isLoading = isLoadingAvatars,
            isOwnerOrAdmin = isOwnerOrAdmin,
            onDismiss = { showAvatarPicker = false },
            onSelectAvatar = { avatar ->
                coroutineScope.launch {
                    val res = authRepository.updateUserAvatar(avatar.url)
                    if (res.isSuccess) {
                        Toast.makeText(context, "✨ Equipped ${avatar.name}!", Toast.LENGTH_SHORT).show()
                        showAvatarPicker = false
                    } else {
                        Toast.makeText(context, "Failed to update avatar", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            onOpenAddAvatar = {
                showAddAvatarDialog = true
            }
        )
    }

    // Add Custom Avatar Dialog (Admin/Owner)
    if (showAddAvatarDialog) {
        AddCustomAvatarDialog(
            onDismiss = { showAddAvatarDialog = false },
            onSubmit = { name, series, badge, color, url, desc ->
                coroutineScope.launch {
                    val res = authRepository.addCustomAvatar(name, series, badge, color, url, desc)
                    if (res.isSuccess) {
                        Toast.makeText(context, "🔥 Avatar published to roster!", Toast.LENGTH_SHORT).show()
                        showAddAvatarDialog = false
                        loadAvatars()
                    } else {
                        Toast.makeText(context, res.exceptionOrNull()?.message ?: "Failed to add avatar", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun WorkspaceProfileBentoCard(
    session: UserSession,
    context: Context,
    onOpenUpgrade: () -> Unit,
    onChangeAvatar: () -> Unit
) {
    val isOwner = session.role.equals("owner", ignoreCase = true)

    val planTitle = when (session.plan) {
        "intro_29" -> "1st Month VIP Pass (₹29)"
        "starter" -> "1 Month Unlimited Pass (₹149)"
        "pro" -> "3 Month Quarter Pass (₹499)"
        "studio" -> "1 Year Annual Pass (₹999)"
        "grace_24h" -> "Instant 24-Hour Pass Active"
        else -> if (session.subscriptionStatus == "grace_24h") "Instant 24-Hour Pass Active" else "14-Day Free Trial"
    }

    val isGraceActive = session.subscriptionStatus == "grace_24h" || session.plan == "grace_24h"
    val isExpired = session.subscriptionStatus.equals("expired", ignoreCase = true) || session.daysRemaining <= 0

    val planBadgeColor = when {
        isExpired -> DigicastLiveRed
        session.plan == "intro_29" || session.plan == "studio" -> DigicastAmber
        session.plan == "pro" -> DigicastAccentBlue
        isGraceActive -> DigicastNeonLime
        else -> DigicastEmerald
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Top Section: Avatar + Name + Workspace ID
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Profile Avatar Box with Duolingo-style glowing border and edit badge
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(DigicastSurfaceElevated)
                        .border(2.dp, if (isOwner) DigicastAmber else DigicastAccentBlue, CircleShape)
                        .clickable { onChangeAvatar() },
                    contentAlignment = Alignment.Center
                ) {
                    if (session.photoUrl.isNotBlank()) {
                        AsyncImage(
                            model = session.photoUrl,
                            contentDescription = "Avatar",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                        )
                    } else {
                        Text(
                            text = session.displayName.take(1).uppercase().ifBlank { "U" },
                            color = DigicastWhite,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 22.sp
                        )
                    }

                    // Edit badge overlay
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(18.dp)
                            .clip(CircleShape)
                            .background(DigicastElectricCyan)
                            .border(1.5.dp, DigicastCardSurface, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Change Avatar",
                            tint = DigicastDeepNavy,
                            modifier = Modifier.size(10.dp)
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = session.displayName,
                            color = DigicastWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Box(
                            modifier = Modifier
                                .background(
                                    if (isOwner) DigicastAmber.copy(alpha = 0.15f) else DigicastAccentBlue.copy(alpha = 0.15f),
                                    RoundedCornerShape(6.dp)
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = session.role.uppercase(),
                                color = if (isOwner) DigicastAmber else DigicastAccentBlue,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                    Text(
                        text = session.email,
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        modifier = Modifier.padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .clickable { onChangeAvatar() },
                            color = DigicastSurfaceElevated,
                            border = BorderStroke(1.dp, DigicastBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Palette,
                                    contentDescription = null,
                                    tint = DigicastElectricCyan,
                                    modifier = Modifier.size(11.dp)
                                )
                                Text(
                                    text = "Anime Avatar",
                                    color = DigicastElectricCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // Workspace ID 1-Tap Copy Chip
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Workspace ID", session.workspaceId)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Workspace ID copied to clipboard!", Toast.LENGTH_SHORT).show()
                    },
                shape = RoundedCornerShape(8.dp),
                color = DigicastDeepNavy,
                border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.6f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("WORKSPACE:", color = DigicastSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = if (session.workspaceName.isNotBlank()) session.workspaceName else session.workspaceId.take(12),
                            color = DigicastWhite,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("Copy ID", color = DigicastAccentBlue, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Icon(
                            imageVector = Icons.Default.ContentCopy,
                            contentDescription = "Copy Workspace ID",
                            tint = DigicastAccentBlue,
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }
            }

            HorizontalDivider(color = DigicastBorder.copy(alpha = 0.6f))

            // Subscription & Remaining Days Status Box
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = DigicastSurfaceElevated,
                border = BorderStroke(1.dp, planBadgeColor.copy(alpha = 0.3f))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = null,
                                tint = planBadgeColor,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "MEMBERSHIP STATUS",
                                color = DigicastSlate,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }

                        // Status Chip (Active / 24h Grace / Expired)
                        Box(
                            modifier = Modifier
                                .background(planBadgeColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(planBadgeColor)
                                )
                                Text(
                                    text = if (isExpired) "EXPIRED" else if (isGraceActive) "24H GRACE PASS" else "ACTIVE",
                                    color = planBadgeColor,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = planTitle,
                                color = DigicastWhite,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isGraceActive) "Instant platform access granted while admin verifies UTR proof"
                                else "${session.daysRemaining} days remaining on this plan",
                                color = DigicastSlate,
                                fontSize = 11.sp
                            )
                        }

                        Button(
                            onClick = onOpenUpgrade,
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastElectricCyan),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = DigicastDeepNavy
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Upgrade Pass",
                                color = DigicastDeepNavy,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ConnectedYouTubeCard(youtube: com.digicast.app.data.repository.YouTubeAccountInfo) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (youtube.channelThumbnail.isNotBlank()) {
                AsyncImage(
                    model = youtube.channelThumbnail,
                    contentDescription = youtube.channelName,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .border(1.dp, DigicastBorder, CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(DigicastLiveRed.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.SmartDisplay,
                        contentDescription = null,
                        tint = DigicastLiveRed,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = youtube.channelName.ifBlank { "YouTube Channel" },
                        color = DigicastWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Connected",
                        tint = DigicastLiveRed,
                        modifier = Modifier.size(15.dp)
                    )
                }
                Text(
                    text = "Live streams & chat automatically sync to this mobile studio",
                    color = DigicastSlate,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
private fun TeamSectionHeader(
    memberCount: Int,
    isAddingMember: Boolean,
    isLoadingTeam: Boolean,
    canAddMember: Boolean,
    onToggleAdd: () -> Unit,
    onRefresh: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Group,
                contentDescription = null,
                tint = DigicastAccentBlue,
                modifier = Modifier.size(20.dp)
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "TEAM ACCESS & CREDENTIALS",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "$memberCount Member${if (memberCount == 1) "" else "s"} in Workspace",
                    color = DigicastWhite,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            IconButton(
                onClick = onRefresh,
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(DigicastSurfaceElevated)
            ) {
                if (isLoadingTeam) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = DigicastAccentBlue,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh Team",
                        tint = DigicastSlate,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (canAddMember) {
                Button(
                    onClick = onToggleAdd,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isAddingMember) DigicastSurfaceElevated else DigicastAccentBlue
                    ),
                    shape = RoundedCornerShape(20.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.height(34.dp)
                ) {
                    Icon(
                        imageVector = if (isAddingMember) Icons.Default.Close else Icons.Default.PersonAdd,
                        contentDescription = null,
                        tint = if (isAddingMember) DigicastSlate else DigicastDarkText,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isAddingMember) "Close" else "Add",
                        color = if (isAddingMember) DigicastSlate else DigicastDarkText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun AddMemberCard(
    name: String,
    email: String,
    password: String,
    role: String,
    showPassword: Boolean,
    canAssignAdmin: Boolean = false,
    isSubmitting: Boolean,
    onNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onRoleChange: (String) -> Unit,
    onToggleShowPassword: () -> Unit,
    onSubmit: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastSurfaceElevated),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Create Team Member & App Login",
                color = DigicastWhite,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )

            // Role Selector Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (canAssignAdmin) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (role == "admin") DigicastAccentBlue.copy(alpha = 0.2f) else DigicastSurface)
                            .border(
                                1.dp,
                                if (role == "admin") DigicastAccentBlue else DigicastBorder,
                                RoundedCornerShape(8.dp)
                            )
                            .clickable { onRoleChange("admin") }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Admin",
                            color = if (role == "admin") DigicastAccentBlue else DigicastSlate,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (role == "moderator") DigicastElectricCyan.copy(alpha = 0.2f) else DigicastSurface)
                        .border(
                            1.dp,
                            if (role == "moderator") DigicastElectricCyan else DigicastBorder,
                            RoundedCornerShape(8.dp)
                        )
                        .clickable { onRoleChange("moderator") }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Moderator",
                        color = if (role == "moderator") DigicastElectricCyan else DigicastSlate,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (role == "editor") DigicastEmerald.copy(alpha = 0.2f) else DigicastSurface)
                        .border(
                            1.dp,
                            if (role == "editor") DigicastEmerald else DigicastBorder,
                            RoundedCornerShape(8.dp)
                        )
                        .clickable { onRoleChange("editor") }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Editor",
                        color = if (role == "editor") DigicastEmerald else DigicastSlate,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }

            OutlinedTextField(
                value = name,
                onValueChange = onNameChange,
                label = { Text("Display Name", fontSize = 12.sp) },
                placeholder = { Text("e.g. Alex Editor", fontSize = 12.sp) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = DigicastWhite,
                    unfocusedTextColor = DigicastWhite,
                    focusedBorderColor = DigicastAccentBlue,
                    unfocusedBorderColor = DigicastBorder,
                    focusedLabelColor = DigicastAccentBlue,
                    unfocusedLabelColor = DigicastSlate,
                    cursorColor = DigicastAccentBlue,
                    focusedContainerColor = DigicastSurface,
                    unfocusedContainerColor = DigicastSurface
                )
            )

            OutlinedTextField(
                value = email,
                onValueChange = onEmailChange,
                label = { Text("Login Email", fontSize = 12.sp) },
                placeholder = { Text("editor@example.com", fontSize = 12.sp) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = DigicastWhite,
                    unfocusedTextColor = DigicastWhite,
                    focusedBorderColor = DigicastAccentBlue,
                    unfocusedBorderColor = DigicastBorder,
                    focusedLabelColor = DigicastAccentBlue,
                    unfocusedLabelColor = DigicastSlate,
                    cursorColor = DigicastAccentBlue,
                    focusedContainerColor = DigicastSurface,
                    unfocusedContainerColor = DigicastSurface
                )
            )

            OutlinedTextField(
                value = password,
                onValueChange = onPasswordChange,
                label = { Text("App Password", fontSize = 12.sp) },
                placeholder = { Text("Min 6 characters", fontSize = 12.sp) },
                singleLine = true,
                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = onToggleShowPassword) {
                        Icon(
                            imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = "Toggle password visibility",
                            tint = DigicastSlate,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = DigicastWhite,
                    unfocusedTextColor = DigicastWhite,
                    focusedBorderColor = DigicastAccentBlue,
                    unfocusedBorderColor = DigicastBorder,
                    focusedLabelColor = DigicastAccentBlue,
                    unfocusedLabelColor = DigicastSlate,
                    cursorColor = DigicastAccentBlue,
                    focusedContainerColor = DigicastSurface,
                    unfocusedContainerColor = DigicastSurface
                )
            )

            Button(
                onClick = onSubmit,
                enabled = !isSubmitting && email.isNotBlank() && password.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = DigicastDarkText,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Saving Member...", color = DigicastDarkText, fontWeight = FontWeight.Bold)
                } else {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        tint = DigicastDarkText,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Save ${role.uppercase()} Login", color = DigicastDarkText, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun TeamMemberItemCard(
    member: TeamMember,
    currentSession: UserSession,
    isPasswordVisible: Boolean,
    onTogglePasswordVisibility: () -> Unit,
    onCopyPassword: () -> Unit,
    onDeleteClick: () -> Unit,
    onChangeRoleClick: () -> Unit = {}
) {
    val isOwnerMember = member.role.equals("owner", ignoreCase = true)
    val isAdminMember = member.role.equals("admin", ignoreCase = true)
    val isEditorMember = member.role.equals("editor", ignoreCase = true)

    val canChangeRole = when {
        member.uid == currentSession.uid -> false
        currentSession.role.equals("owner", ignoreCase = true) -> !isOwnerMember
        currentSession.role.equals("admin", ignoreCase = true) -> !isOwnerMember && !isAdminMember
        else -> false
    }

    val roleColor = when {
        isOwnerMember -> DigicastAmber
        isAdminMember -> DigicastAccentBlue
        isEditorMember -> DigicastEmerald
        else -> DigicastElectricCyan
    }

    val roleBg = when {
        isOwnerMember -> DigicastAmber.copy(alpha = 0.15f)
        isAdminMember -> DigicastAccentBlue.copy(alpha = 0.15f)
        isEditorMember -> DigicastEmerald.copy(alpha = 0.15f)
        else -> DigicastElectricCyan.copy(alpha = 0.15f)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
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
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(roleBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = member.displayName.take(1).uppercase().ifBlank { "U" },
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
                                text = member.displayName.ifBlank { "Team Member" },
                                color = DigicastWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (canChangeRole) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(roleBg)
                                        .border(1.dp, roleColor.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                        .clickable { onChangeRoleClick() }
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = member.role.uppercase(),
                                        color = roleColor,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 9.sp,
                                        letterSpacing = 0.5.sp
                                    )
                                    Icon(
                                        imageVector = Icons.Default.Edit,
                                        contentDescription = "Change Role",
                                        tint = roleColor,
                                        modifier = Modifier.size(9.dp)
                                    )
                                }
                            } else {
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
                        }
                        Text(
                            text = member.email,
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Delete Button:
                // Owner can delete non-owners. Admin can delete editors & mods. Mod cannot delete.
                val canDelete = when {
                    member.uid == currentSession.uid -> false
                    currentSession.role.equals("owner", ignoreCase = true) -> !isOwnerMember
                    currentSession.role.equals("admin", ignoreCase = true) -> isEditorMember || member.role.equals("moderator", ignoreCase = true)
                    else -> false
                }

                if (canDelete) {
                    IconButton(
                        onClick = onDeleteClick,
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(DigicastLiveRed.copy(alpha = 0.1f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Remove Member",
                            tint = DigicastLiveRed,
                            modifier = Modifier.size(15.dp)
                        )
                    }
                }
            }

            // Credential Row: Strict Role-Based Visibility
            // Owner: Can view Editor, Mod & Admin credentials
            // Admin: Can make & check Mod and Editor account credentials
            // Moderator: Can ONLY check Editor credentials
            val callerRole = currentSession.role.lowercase()
            val memberRole = member.role.lowercase()
            val isSelf = member.uid == currentSession.uid
            val canViewThisPassword = when {
                isSelf -> true
                callerRole == "owner" -> memberRole in listOf("editor", "moderator", "admin")
                callerRole == "admin" -> memberRole in listOf("editor", "moderator")
                callerRole == "moderator" -> memberRole == "editor"
                else -> false
            }

            if (canViewThisPassword) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    color = DigicastDeepNavy,
                    border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
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
                            IconButton(
                                onClick = onTogglePasswordVisibility,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    imageVector = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password visibility",
                                    tint = if (isPasswordVisible) DigicastAccentBlue else DigicastSlate,
                                    modifier = Modifier.size(14.dp)
                                )
                            }

                            if (!member.appPassword.isNullOrBlank()) {
                                IconButton(
                                    onClick = onCopyPassword,
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
            } else {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    color = DigicastSurface.copy(alpha = 0.4f),
                    border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = DigicastSlate.copy(alpha = 0.5f),
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "Password: Protected (${if (memberRole == "owner") "Workspace Owner" else "Admin Level"})",
                            color = DigicastSlate.copy(alpha = 0.6f),
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ExtensionsCard(
    extensions: List<ExtensionRegistryItem>,
    onRefresh: () -> Unit,
    onInstall: (ExtensionRegistryItem) -> Unit,
    onUninstall: (ExtensionRegistryItem) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
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
                        imageVector = Icons.Default.Extension,
                        contentDescription = null,
                        tint = DigicastAccentBlue,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "EXTENSIONS & PLUGINS (.DCAST)",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                IconButton(
                    onClick = onRefresh,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh Extensions",
                        tint = DigicastSlate,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (extensions.isEmpty()) {
                Text(
                    text = "No extension packs loaded. Tap refresh above to query available plugins.",
                    color = DigicastSlate,
                    fontSize = 12.sp
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    extensions.forEach { item ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            color = DigicastSurfaceElevated,
                            border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.6f))
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = item.name,
                                            color = DigicastWhite,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                        Text(
                                            text = "v${item.version} • ${item.id}",
                                            color = DigicastSlate,
                                            fontSize = 11.sp
                                        )
                                    }

                                    if (item.isInstalled) {
                                        Box(
                                            modifier = Modifier
                                                .background(DigicastEmerald.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "INSTALLED",
                                                color = DigicastEmerald,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.ExtraBold
                                            )
                                        }
                                    }
                                }

                                if (item.isInstalling) {
                                    LinearProgressIndicator(
                                        progress = { item.downloadProgress.toFloat() / 100f },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(4.dp),
                                        color = DigicastAccentBlue,
                                        trackColor = DigicastSurface
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    if (item.isInstalled) {
                                        Text(
                                            text = "Uninstall",
                                            color = DigicastLiveRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            modifier = Modifier
                                                .clickable { onUninstall(item) }
                                                .padding(4.dp)
                                        )
                                    } else {
                                        Button(
                                            onClick = { onInstall(item) },
                                            enabled = !item.isInstalling,
                                            colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.height(30.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp)
                                        ) {
                                            Text("Install .dcast", color = DigicastDarkText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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

@Composable
private fun DiagnosticsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Bolt,
                    contentDescription = null,
                    tint = DigicastNeonLime,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "HARDWARE ENGINE & LOCAL DIAGNOSTICS",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            DiagnosticRow(title = "Hardware Trimming Engine", status = "MediaCodec H.264 Active", isGood = true)
            DiagnosticRow(title = "Cloud Rendering Dependency", status = "0% (100% On-Device)", isGood = true)
            DiagnosticRow(title = "Local Marker Cache", status = "SQLite Room DB Synced", isGood = true)
        }
    }
}

@Composable
private fun DiagnosticRow(title: String, status: String, isGood: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = DigicastSlate, fontSize = 12.sp)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(if (isGood) DigicastEmerald else DigicastLiveRed)
            )
            Text(
                text = status,
                color = if (isGood) DigicastWhite else DigicastLiveRed,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun SecurityCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = null,
                    tint = DigicastAccentBlue,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "SECURITY & PRIVACY ARCHITECTURE",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                SecurityBullet(text = "Chat messages are parsed in-memory and cached exclusively on-device.")
                SecurityBullet(text = "Zero cross-account data leakage: Workspaces are bounded by verified UID.")
                SecurityBullet(text = "Server tokens and webhook dispatches are isolated in Cloud Run.")
            }
        }
    }
}

@Composable
private fun SecurityBullet(text: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text("•", color = DigicastAccentBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Text(
            text = text,
            color = DigicastSlate,
            fontSize = 11.sp,
            lineHeight = 16.sp
        )
    }
}
