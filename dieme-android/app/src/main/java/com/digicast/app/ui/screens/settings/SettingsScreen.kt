package com.digicast.app.ui.screens.settings

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.digicast.app.ui.utils.WebNavigationUtil
import androidx.compose.ui.text.font.FontFamily
import com.digicast.app.util.AppUpdateManager
import com.digicast.app.util.AppUpdateInfo
import com.digicast.app.util.UpdateCheckResult
import com.digicast.app.ui.components.AppUpdateDialog
import kotlinx.coroutines.launch
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
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Paid
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
import androidx.compose.ui.draw.drawBehind
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
import com.digicast.app.ui.theme.DigicastNavy
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

    var showSignOutDialog by remember { mutableStateOf(false) }
    var showUpgradeDialog by remember { mutableStateOf(false) }

    fun checkDgImagesInstalled(): Boolean {
        return try {
            context.packageManager.getPackageInfo("com.digicast.dgimages", 0)
            true
        } catch (_: Exception) {
            false
        }
    }
    var isDgImagesInstalled by remember { mutableStateOf(checkDgImagesInstalled()) }

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
    var isTeamExpanded by remember { mutableStateOf(false) }
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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .drawBehind {
                        drawLine(
                            color = Color.White.copy(alpha = 0.08f),
                            start = androidx.compose.ui.geometry.Offset(0f, size.height),
                            end = androidx.compose.ui.geometry.Offset(size.width, size.height),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.08f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable(onClick = onNavigateBack),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Studio Settings",
                            color = Color.White,
                            fontSize = 17.sp,
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

                // Sign Out Action Button: Sleek subtle red pill conforming to theme
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(DigicastLiveRed.copy(alpha = 0.12f))
                        .border(1.dp, DigicastLiveRed.copy(alpha = 0.35f), RoundedCornerShape(9999.dp))
                        .clickable { showSignOutDialog = true }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PowerSettingsNew,
                            contentDescription = "Sign Out",
                            tint = DigicastLiveRed,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "Sign Out",
                            color = DigicastLiveRed,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
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
                    val isPaidSubscriber = (session.daysRemaining > 0 || session.subscriptionStatus.equals("active", true)) &&
                            !session.plan.equals("free", true) &&
                            !session.plan.equals("free_trial", true)

                    // 1. Workspace Profile, Membership & Currency Bento Card (Consolidated)
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

                    // 2. Team Management & Mobile Credentials Card (Moved UP above Avatar, Collapsible)
                    val isAdmin = session.role.equals("admin", ignoreCase = true)
                    val isMod = session.role.equals("moderator", ignoreCase = true)
                    val canViewTeam = isOwner || isAdmin || isMod
                    val canAddMember = isOwner || isAdmin

                    if (canViewTeam) {
                        val roleHierarchyOrder = mapOf("owner" to 0, "admin" to 1, "moderator" to 2, "editor" to 3)
                        val sortedTeamMembers = teamMembers.sortedBy { roleHierarchyOrder[it.role.lowercase()] ?: 99 }

                        item(key = "team_management_collapsible") {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .clickable { isTeamExpanded = !isTeamExpanded },
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                                border = BorderStroke(1.dp, DigicastBorder)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    // Collapsible Header Row (Tap to reveal)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            modifier = Modifier.weight(1f),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(38.dp)
                                                    .clip(RoundedCornerShape(10.dp))
                                                    .background(DigicastAccentBlue.copy(alpha = 0.2f))
                                                    .border(1.dp, DigicastAccentBlue.copy(alpha = 0.4f), RoundedCornerShape(10.dp)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Group,
                                                    contentDescription = null,
                                                    tint = DigicastAccentBlue,
                                                    modifier = Modifier.size(20.dp)
                                                )
                                            }

                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Team Members",
                                                    color = DigicastWhite,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 15.sp,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Text(
                                                    text = if (isTeamExpanded) "${sortedTeamMembers.size} members in workspace" else "Tap to reveal members (${sortedTeamMembers.size})",
                                                    color = DigicastSlate,
                                                    fontSize = 11.sp,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                        }

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(DigicastSurfaceElevated)
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = if (isTeamExpanded) "Hide" else "Reveal",
                                                color = DigicastAccentBlue,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }

                                    // Expandable Members Body
                                    AnimatedVisibility(
                                        visible = isTeamExpanded,
                                        enter = expandVertically(tween(250, easing = FastOutSlowInEasing)) + fadeIn(),
                                        exit = shrinkVertically(tween(200, easing = FastOutSlowInEasing)) + fadeOut()
                                    ) {
                                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            if (canAddMember) {
                                                Button(
                                                    onClick = { isAddingMember = !isAddingMember },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    colors = ButtonDefaults.buttonColors(
                                                        containerColor = if (isAddingMember) DigicastSurfaceElevated else DigicastWhite,
                                                        contentColor = if (isAddingMember) DigicastSlate else DigicastDeepNavy
                                                    ),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = if (isAddingMember) Icons.Default.Close else Icons.Default.PersonAdd,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(15.dp),
                                                        tint = if (isAddingMember) DigicastSlate else DigicastDeepNavy
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = if (isAddingMember) "Close Form" else "+ Add Team Member",
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 12.sp,
                                                        color = if (isAddingMember) DigicastSlate else DigicastDeepNavy
                                                    )
                                                }
                                            }

                                            if (isAddingMember && canAddMember) {
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
                                                                    res.exceptionOrNull()?.message ?: "Failed to create member",
                                                                    Toast.LENGTH_LONG
                                                                ).show()
                                                            }
                                                        }
                                                    }
                                                )
                                            }

                                            if (sortedTeamMembers.isEmpty() && !isLoadingTeam) {
                                                Text(
                                                    text = "No additional team members in workspace yet",
                                                    color = DigicastSlate,
                                                    fontSize = 12.sp,
                                                    modifier = Modifier.padding(vertical = 8.dp)
                                                )
                                            } else {
                                                sortedTeamMembers.forEach { member ->
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
                                    }
                                }
                            }
                        }
                    }

                    // 3. Avatar Section (1-Tap Direct Equip, No Extra Screen)
                    item(key = "avatar_studio_card") {
                        DuolingoAvatarStudioBentoCard(
                            session = session,
                            isPremium = isPaidSubscriber,
                            onEquipAvatar = { url, name ->
                                coroutineScope.launch {
                                    val res = authRepository.updateUserAvatar(url)
                                    if (res.isSuccess) {
                                        Toast.makeText(context, "✨ Equipped $name!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Failed to update avatar", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            onOpenUpgrade = {
                                showUpgradeDialog = true
                            }
                        )
                    }

                    // 4. Connected YouTube Channel / Link Action
                    item(key = "youtube_account_card") {
                        if (youtubeAccount != null) {
                            ConnectedYouTubeCard(
                                youtube = youtubeAccount!!,
                                onReconnect = {
                                    WebNavigationUtil.openWebConnectYouTube(
                                        context = context,
                                        workspaceId = session.workspaceId,
                                        token = session.token
                                    )
                                }
                            )
                        } else {
                            UnconnectedYouTubeCard(
                                onConnect = {
                                    WebNavigationUtil.openWebConnectYouTube(
                                        context = context,
                                        workspaceId = session.workspaceId,
                                        token = session.token
                                    )
                                }
                            )
                        }
                    }

                    // 4b. Nightbot Webhook Command Card (Tenant isolated per workspace)
                    item(key = "nightbot_command_card") {
                        NightbotCommandCard(
                            workspaceId = session.workspaceId,
                            context = context
                        )
                    }

                    // 4c. Official Dieme Apps & Companions
                    item(key = "official_apps_section") {
                        OfficialAppsCard(
                            context = context,
                            isDgImagesInstalled = isDgImagesInstalled,
                            onRefreshStatus = { isDgImagesInstalled = checkDgImagesInstalled() }
                        )
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

                    // 5. Security & Privacy Card (Direct Link)
                    item(key = "security_architecture") {
                        SecurityCard(context = context)
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

    // Avatar Picker Dialog
    if (showAvatarPicker) {
        val currentSession = (authState as? AuthState.SignedIn)?.session
        val isOwnerOrAdmin = currentSession?.role.let { it.equals("owner", true) || it.equals("admin", true) }
        val isPaidSubscriber = currentSession != null &&
                (currentSession.daysRemaining > 0 || currentSession.subscriptionStatus.equals("active", true)) &&
                !currentSession.plan.equals("free", true) &&
                !currentSession.plan.equals("free_trial", true)

        DuolingoAvatarPickerDialog(
            currentPhotoUrl = currentSession?.photoUrl ?: "",
            currentDisplayName = currentSession?.displayName ?: "User",
            avatars = avatarList,
            isLoading = isLoadingAvatars,
            isOwnerOrAdmin = isOwnerOrAdmin,
            isPremium = isPaidSubscriber,
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
            },
            onOpenUpgrade = {
                showAvatarPicker = false
                showUpgradeDialog = true
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
                // Profile Avatar Box (Cleaned - no green dot)
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
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = session.displayName,
                            color = DigicastWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
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
                                letterSpacing = 0.5.sp,
                                softWrap = false
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
                }
            }

            HorizontalDivider(color = DigicastBorder.copy(alpha = 0.6f))

            // Unified Membership & Currency Status Section (Consolidated in 1 Card)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = DigicastSurfaceElevated,
                border = BorderStroke(1.dp, planBadgeColor.copy(alpha = 0.3f))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // 1. Membership Status Row
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
                                text = "MEMBERSHIP PLAN",
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
                                    fontWeight = FontWeight.ExtraBold,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = planTitle,
                            color = DigicastWhite,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = if (isGraceActive) "Instant platform access granted while admin verifies UTR proof"
                            else "${session.daysRemaining} days remaining on this plan",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    HorizontalDivider(color = DigicastBorder.copy(alpha = 0.4f))

                    // 2. Creator Currency / Wallet Balance Row
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
                                imageVector = Icons.Default.Paid,
                                contentDescription = null,
                                tint = DigicastNeonLime,
                                modifier = Modifier.size(15.dp)
                            )
                            Column {
                                Text(
                                    text = "CREATOR CURRENCY",
                                    color = DigicastSlate,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = "10 D = 1 DP = ₹1 INR",
                                    color = DigicastSlate.copy(alpha = 0.7f),
                                    fontSize = 10.sp
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .background(DigicastNeonLime.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "120 D-Coins Balance",
                                color = DigicastNeonLime,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                softWrap = false
                            )
                        }
                    }

                    // Two Properly Arranged Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onOpenUpgrade,
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = DigicastWhite,
                                contentColor = DigicastDeepNavy
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = DigicastDeepNavy
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = if (isExpired) "Renew Plan" else "Upgrade Pass",
                                color = DigicastDeepNavy,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 12.sp,
                                softWrap = false
                            )
                        }

                        OutlinedButton(
                            onClick = onOpenUpgrade,
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = DigicastWhite
                            ),
                            border = BorderStroke(1.dp, DigicastWhite.copy(alpha = 0.6f)),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                        ) {
                            Text(
                                text = "All Plans",
                                color = DigicastWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                softWrap = false
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ConnectedYouTubeCard(
    youtube: com.digicast.app.data.repository.YouTubeAccountInfo,
    onReconnect: () -> Unit = {}
) {
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

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(9999.dp))
                    .background(DigicastElectricCyan.copy(alpha = 0.12f))
                    .border(1.dp, DigicastElectricCyan.copy(alpha = 0.35f), RoundedCornerShape(9999.dp))
                    .clickable { onReconnect() }
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(DigicastElectricCyan)
                )
                Text(
                    text = "Connected ↗",
                    fontSize = 11.sp,
                    color = DigicastElectricCyan,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun UnconnectedYouTubeCard(onConnect: () -> Unit) {
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
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(DigicastLiveRed.copy(alpha = 0.15f))
                    .border(1.dp, DigicastLiveRed.copy(alpha = 0.35f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.SmartDisplay,
                    contentDescription = null,
                    tint = DigicastLiveRed,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Connect YouTube Channel",
                    color = DigicastWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = "Link your Google account to sync live streams, chat & stats",
                    color = DigicastSlate,
                    fontSize = 11.sp
                )
            }

            Button(
                onClick = onConnect,
                colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                shape = RoundedCornerShape(9999.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text("Connect", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun NightbotCommandCard(workspaceId: String, context: Context) {
    val commandText = "!addcom !clip $(urlfetch https://www.dieme.in/api/webhooks/nightbot?workspaceId=$workspaceId&user=$(user)&query=$(querystring))"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
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
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF134E5E)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("NB", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        text = "Nightbot Stream Command",
                        color = DigicastWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Button(
                    onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                        val clip = android.content.ClipData.newPlainText("Nightbot Command", commandText)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Command copied to clipboard!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                    shape = RoundedCornerShape(9999.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(28.dp)
                ) {
                    Text("Copy", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            Text(
                text = "Paste this into your channel chat to let viewers & mods clip moments:",
                color = DigicastSlate,
                fontSize = 11.sp
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF041215))
                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(8.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = commandText,
                    color = DigicastElectricCyan,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 14.sp
                )
            }
        }
    }
}

@Composable
private fun TeamSectionHeader(
    memberCount: Int,
    isAddingMember: Boolean,
    canAddMember: Boolean,
    onToggleAdd: () -> Unit
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

        if (canAddMember) {
            Button(
                onClick = onToggleAdd,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isAddingMember) DigicastSurfaceElevated else DigicastWhite,
                    contentColor = if (isAddingMember) DigicastSlate else DigicastDeepNavy
                ),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                modifier = Modifier.height(34.dp)
            ) {
                Icon(
                    imageVector = if (isAddingMember) Icons.Default.Close else Icons.Default.PersonAdd,
                    contentDescription = null,
                    tint = if (isAddingMember) DigicastSlate else DigicastDeepNavy,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(5.dp))
                Text(
                    text = if (isAddingMember) "Close" else "+ Add Member",
                    color = if (isAddingMember) DigicastSlate else DigicastDeepNavy,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
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
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = member.displayName.ifBlank { "Team Member" },
                                color = DigicastWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
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
                                        letterSpacing = 0.5.sp,
                                        softWrap = false
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
                                        letterSpacing = 0.5.sp,
                                        softWrap = false
                                    )
                                }
                            }
                        }
                        if (!isOwnerMember && !isAdminMember) {
                            Text(
                                text = member.email,
                                color = DigicastSlate,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
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
            // For Owner & Admin: Never show password/credentials in the app (only Name & Role)
            // For other workers (Moderator, Editor): Show credentials to authorized supervisors
            if (!isOwnerMember && !isAdminMember) {
                val callerRole = currentSession.role.lowercase()
                val memberRole = member.role.lowercase()
                val isSelf = member.uid == currentSession.uid
                val canViewThisPassword = when {
                    isSelf -> true
                    callerRole == "owner" -> memberRole in listOf("editor", "moderator")
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
                        text = "STUDIO EXTENSIONS",
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
                    text = "No extensions available. Tap refresh above to query catalog.",
                    color = DigicastSlate,
                    fontSize = 12.sp
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    extensions.forEach { item ->
                        val (cleanName, purpose) = when {
                            item.id.contains("youtubedl", ignoreCase = true) || item.name.contains("youtubedl", ignoreCase = true) ->
                                "YouTube Stream Ingest" to "Live stream audio & video packets"
                            item.id.contains("ffmpeg", ignoreCase = true) || item.name.contains("ffmpeg", ignoreCase = true) ->
                                "Video Hardware Slicer" to "High-speed local video trimming engine"
                            item.id.contains("clipengine", ignoreCase = true) || item.name.contains("clipengine", ignoreCase = true) ->
                                "Smart Clip Indexer" to "Live AI highlight markers & chat spikes"
                            else ->
                                item.name.replace("com.digicast.ext.", "").replaceFirstChar { it.uppercase() } to "Studio video processing module"
                        }

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
                                    Column(
                                        modifier = Modifier
                                            .weight(1f)
                                            .padding(end = 10.dp)
                                    ) {
                                        Text(
                                            text = cleanName,
                                            color = DigicastWhite,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = purpose,
                                            color = DigicastSlate,
                                            fontSize = 11.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    // Single unified action button: Install or Uninstall
                                    if (item.isInstalled) {
                                        OutlinedButton(
                                            onClick = { onUninstall(item) },
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastLiveRed),
                                            border = BorderStroke(1.dp, DigicastLiveRed.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.height(30.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp)
                                        ) {
                                            Text(
                                                text = "Uninstall",
                                                color = DigicastLiveRed,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    } else {
                                        Button(
                                            onClick = { onInstall(item) },
                                            enabled = !item.isInstalling,
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = DigicastWhite,
                                                contentColor = DigicastDeepNavy
                                            ),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.height(30.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                                        ) {
                                            Text(
                                                text = if (item.isInstalling) "Installing..." else "Install",
                                                color = DigicastDeepNavy,
                                                fontSize = 11.sp,
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
                                            .height(3.dp),
                                        color = DigicastAccentBlue,
                                        trackColor = DigicastSurface
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

@Composable
private fun SecurityCard(context: Context) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable {
                val intent = android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse("https://www.dieme.in/privacy")
                )
                context.startActivity(intent)
            },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(DigicastAccentBlue.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = null,
                        tint = DigicastAccentBlue,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Security & Privacy Policy",
                        color = DigicastWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "View workspace encryption and data policies",
                        color = DigicastSlate,
                        fontSize = 11.sp
                    )
                }
            }

            Text(
                text = "Open ↗",
                color = DigicastAccentBlue,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun OfficialAppsCard(
    context: Context,
    isDgImagesInstalled: Boolean,
    onRefreshStatus: () -> Unit
) {
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusMessage by remember { mutableStateOf<String?>(null) }
    var availableUpdate by remember { mutableStateOf<AppUpdateInfo?>(null) }
    val coroutineScope = rememberCoroutineScope()
    val currentVersionName = remember { AppUpdateManager.getCurrentVersionName(context) }
    val currentVersionCode = remember { AppUpdateManager.getCurrentVersionCode(context) }

    // Display update dialog if an update is found
    if (availableUpdate != null) {
        AppUpdateDialog(
            updateInfo = availableUpdate!!,
            onUpdate = {
                AppUpdateManager.launchUpdateDownload(context, availableUpdate!!.downloadUrl)
            },
            onClose = {
                availableUpdate = null
            },
            onSkip24Hours = {
                AppUpdateManager.skipUpdateFor24Hours(context, availableUpdate!!.versionCode)
                availableUpdate = null
                Toast.makeText(context, "Update reminder paused for 24 hours", Toast.LENGTH_SHORT).show()
            }
        )
    }

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
            // Header Row
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
                        imageVector = Icons.Default.SmartDisplay,
                        contentDescription = null,
                        tint = DigicastAccentBlue,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "OFFICIAL DIEME APPS & COMPANIONS",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                IconButton(
                    onClick = onRefreshStatus,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh App Status",
                        tint = DigicastSlate,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // App 1: Dieme Live Studio (Core APK)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = DigicastSurface,
                border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(DigicastAccentBlue.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SmartDisplay,
                                    contentDescription = null,
                                    tint = DigicastAccentBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Dieme Live Studio",
                                    color = DigicastWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "com.digicast.app • v$currentVersionName (Build $currentVersionCode)",
                                    color = DigicastSlate,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        // Status Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(DigicastEmerald.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "ACTIVE APP",
                                color = DigicastEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = "Core stream companion: Nightbot !clip capture, local hardware trimming, Telegram dispatch, and UPI subscription management.",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )

                    // Inline Status Pill if checked
                    if (updateStatusMessage != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(DigicastEmerald.copy(alpha = 0.12f))
                                .border(1.dp, DigicastEmerald.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = updateStatusMessage!!,
                                color = DigicastEmerald,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // Action buttons: Check for Updates & Download APK
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    isCheckingUpdate = true
                                    updateStatusMessage = null
                                    val result = AppUpdateManager.checkForUpdates(context)
                                    isCheckingUpdate = false
                                    when (result) {
                                        is UpdateCheckResult.UpToDate -> {
                                            updateStatusMessage = "You are on the latest version • All good (v${result.currentVersionName})"
                                            Toast.makeText(context, "App is up to date!", Toast.LENGTH_SHORT).show()
                                        }
                                        is UpdateCheckResult.UpdateAvailable -> {
                                            availableUpdate = result.updateInfo
                                        }
                                        is UpdateCheckResult.Error -> {
                                            updateStatusMessage = "Check failed: ${result.message}"
                                            Toast.makeText(context, result.message, Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
                            },
                            enabled = !isCheckingUpdate,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue.copy(alpha = 0.2f)),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, DigicastAccentBlue.copy(alpha = 0.5f))
                        ) {
                            if (isCheckingUpdate) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(14.dp),
                                    strokeWidth = 2.dp,
                                    color = DigicastWhite
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = null,
                                    tint = DigicastWhite,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isCheckingUpdate) "Checking..." else "Check for Updates",
                                color = DigicastWhite,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Button(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.dieme.in/api/download/apk")).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                try {
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Cannot open download link: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastSurfaceFloating),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, DigicastBorder)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                tint = DigicastWhite,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Download APK",
                                color = DigicastWhite,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // App 2: Dg-Images Thumbnail Studio (Companion APK)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = DigicastSurface,
                border = BorderStroke(1.dp, if (isDgImagesInstalled) DigicastBorder.copy(alpha = 0.5f) else Color(0xFFF59E0B).copy(alpha = 0.4f))
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF8B5CF6).copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Palette,
                                    contentDescription = null,
                                    tint = Color(0xFFA78BFA),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Dg-Images AI Studio",
                                    color = DigicastWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "com.digicast.dgimages • Companion",
                                    color = DigicastSlate,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        // Status Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isDgImagesInstalled) DigicastEmerald.copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = if (isDgImagesInstalled) "CONNECTED" else "NOT INSTALLED",
                                color = if (isDgImagesInstalled) DigicastEmerald else Color(0xFFF59E0B),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = "Local AI companion: On-device image inpainting daemon, ChatGPT-canvas bridge, pinpoint coordinate editing, and 1080p thumbnail export.",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (isDgImagesInstalled) {
                            Button(
                                onClick = {
                                    val launchIntent = context.packageManager.getLaunchIntentForPackage("com.digicast.dgimages")
                                    if (launchIntent != null) {
                                        launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                        context.startActivity(launchIntent)
                                    } else {
                                        Toast.makeText(context, "Dg-Images is running in background daemon mode", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastSurfaceFloating),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, DigicastBorder)
                            ) {
                                Text("Open App", color = DigicastWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Button(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.dieme.in/api/download/apk?app=dg-images")).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                try {
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Cannot open download link: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = if (isDgImagesInstalled) DigicastSurfaceFloating else DigicastAccentBlue),
                            shape = RoundedCornerShape(8.dp),
                            border = if (isDgImagesInstalled) BorderStroke(1.dp, DigicastBorder) else null
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                tint = DigicastWhite,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isDgImagesInstalled) "Re-download APK" else "Download APK (~22 MB)",
                                color = DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}
