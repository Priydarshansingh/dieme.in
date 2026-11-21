package com.digicast.dgimages.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebView
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import com.digicast.dgimages.util.AppUpdateManager
import com.digicast.dgimages.util.DgUpdateInfo
import com.digicast.dgimages.util.DgUpdateCheckResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.digicast.dgimages.browser.ChatGptSessionManager
import com.digicast.dgimages.browser.ChatGptWebAdapter
import com.digicast.dgimages.engine.GenerationJob
import com.digicast.dgimages.engine.ImageInpaintEngine
import com.digicast.dgimages.util.DevAccessManager
import com.digicast.dgimages.util.FileProviderUtils
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Apple & Linear inspired obsidian dark design tokens
val DgCanvas = Color(0xFF030A0D)
val DgCardSurface = Color(0xFF09161B)
val DgCardBorder = Color(0x224DD0E1)
val DgElectricCyan = Color(0xFF2DD4BF)
val DgEmerald = Color(0xFF10B981)
val DgAmber = Color(0xFFFBBF24)
val DgSlate = Color(0xFF8E9BAE)
val DgMuted = Color(0xFF5A6677)

fun resolveJobImageModel(context: Context, job: GenerationJob): Any {
    val localFile = FileProviderUtils.resolveImageFile(context, job.resultUrl)
    if (localFile != null && localFile.exists()) return localFile
    val baseFile = FileProviderUtils.resolveImageFile(context, job.baseImageUrl)
    if (baseFile != null && baseFile.exists()) return baseFile
    if (job.resultUrl.startsWith("http")) return job.resultUrl
    return job.baseImageUrl
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DgImagesDashboard() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val recentJobs by ImageInpaintEngine.recentJobs.collectAsState()
    val engineStatus by ImageInpaintEngine.engineStatus.collectAsState()
    val preferNewChat by ChatGptSessionManager.preferNewChat.collectAsState()
    val sessionStatus by ChatGptSessionManager.sessionStatus.collectAsState()
    val isChatGptConnected by ChatGptSessionManager.isChatGptConnected.collectAsState()

    var showActivitySheet by remember { mutableStateOf(false) }
    var webAdapter by remember { mutableStateOf<ChatGptWebAdapter?>(null) }
    var testFeedback by remember { mutableStateOf<String?>(null) }

    // Dev unlock dialog state & tap detector
    var showDevUnlockDialog by remember { mutableStateOf(false) }
    var devPasscodeInput by remember { mutableStateOf("") }
    var devUnlockError by remember { mutableStateOf<String?>(null) }
    var logoTapCount by remember { mutableIntStateOf(0) }
    var lastTapTimestamp by remember { mutableLongStateOf(0L) }

    // In-app update states
    var activeUpdateDialog by remember { mutableStateOf<DgUpdateInfo?>(null) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusMessage by remember { mutableStateOf<String?>(null) }
    var dismissedAutoUpdateThisSession by rememberSaveable { mutableStateOf(false) }

    val currentVersionName = remember { AppUpdateManager.getCurrentVersionName(context) }
    val currentVersionCode = remember { AppUpdateManager.getCurrentVersionCode(context) }

    val onTriggerCheckUpdates: () -> Unit = {
        coroutineScope.launch {
            isCheckingUpdate = true
            updateStatusMessage = null
            val result = AppUpdateManager.checkForUpdates(context)
            isCheckingUpdate = false
            when (result) {
                is DgUpdateCheckResult.UpToDate -> {
                    updateStatusMessage = "You are on the latest version • All good (v${result.currentVersionName})"
                    Toast.makeText(context, "App is up to date!", Toast.LENGTH_SHORT).show()
                }
                is DgUpdateCheckResult.UpdateAvailable -> {
                    activeUpdateDialog = result.updateInfo
                }
                is DgUpdateCheckResult.Error -> {
                    updateStatusMessage = "Check failed: ${result.message}"
                    Toast.makeText(context, result.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        DevAccessManager.init(context)
        ImageInpaintEngine.loadCachedJobs(context)
        webAdapter?.checkLoginStatus()

        // Background update check on app launch
        if (!dismissedAutoUpdateThisSession) {
            val result = AppUpdateManager.checkForUpdates(context)
            if (result is DgUpdateCheckResult.UpdateAvailable) {
                if (AppUpdateManager.shouldShowAutoPrompt(context, result.updateInfo.versionCode)) {
                    activeUpdateDialog = result.updateInfo
                }
            }
        }
    }

    // Active update dialog
    if (activeUpdateDialog != null) {
        AppUpdateDialog(
            updateInfo = activeUpdateDialog!!,
            onUpdate = {
                AppUpdateManager.launchUpdateDownload(context, activeUpdateDialog!!.downloadUrl)
            },
            onClose = {
                dismissedAutoUpdateThisSession = true
                activeUpdateDialog = null
            },
            onSkip = {
                dismissedAutoUpdateThisSession = true
                activeUpdateDialog = null
            }
        )
    }

    val onLogoClicked = {
        val now = System.currentTimeMillis()
        if (now - lastTapTimestamp > 2500L) {
            logoTapCount = 1
        } else {
            logoTapCount++
        }
        lastTapTimestamp = now
        if (logoTapCount >= 5) {
            logoTapCount = 0
            showDevUnlockDialog = true
        }
    }

    val configuration = LocalConfiguration.current
    val screenWidthDp = configuration.screenWidthDp
    val isSmallScreen = screenWidthDp < 360

    Scaffold(
        containerColor = DgCanvas,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF061217))
                    .statusBarsPadding()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = if (isSmallScreen) 12.dp else 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left: Logo icon + "Dg-Images" text ONLY (minimal, bold, uncluttered)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.clickable { onLogoClicked() }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF0F766E), Color(0xFF134E5E))))
                                .border(1.dp, DgElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text(
                            text = "Dg-Images",
                            color = Color.White,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.4).sp,
                            maxLines = 1
                        )
                    }

                    // Right: ONLY the green dot needed (live pulsing status dot that opens Activity sheet)
                    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                    val pulseScale by infiniteTransition.animateFloat(
                        initialValue = 1f,
                        targetValue = 1.7f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(1800, easing = FastOutSlowInEasing),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "scale"
                    )
                    val pulseAlpha by infiniteTransition.animateFloat(
                        initialValue = 0.5f,
                        targetValue = 0.05f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(1800, easing = FastOutSlowInEasing),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "alpha"
                    )

                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .clickable { showActivitySheet = true },
                        contentAlignment = Alignment.Center
                    ) {
                        // Pulsing outer aura ring
                        Box(
                            modifier = Modifier
                                .size(12.dp * pulseScale)
                                .clip(CircleShape)
                                .background(DgEmerald.copy(alpha = pulseAlpha))
                        )
                        // Inner solid emerald dot
                        Box(
                            modifier = Modifier
                                .size(8.5.dp)
                                .clip(CircleShape)
                                .background(DgEmerald)
                                .border(1.dp, Color.White.copy(alpha = 0.4f), CircleShape)
                        )
                    }
                }

                // Sleek specular hairline separator
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(Color.White.copy(alpha = 0.06f))
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // ALWAYS mount WebView in full unhindered view so ChatGPT chat displays completely
            AndroidView(
                factory = { ctx ->
                    val existingWv = ChatGptSessionManager.activeAdapter?.webView
                    if (existingWv != null) {
                        try {
                            (existingWv.parent as? ViewGroup)?.removeView(existingWv)
                        } catch (_: Throwable) {}
                        try {
                            val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
                            wm?.removeViewImmediate(existingWv)
                        } catch (_: Throwable) {}
                        webAdapter = ChatGptSessionManager.activeAdapter
                        existingWv
                    } else {
                        WebView(ctx).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            val adapter = ChatGptWebAdapter(
                                context = ctx,
                                webView = this,
                                onStateChanged = {},
                                onResultCaptured = {},
                                onAuthRequired = {}
                            )
                            webAdapter = adapter
                            ChatGptSessionManager.activeAdapter = adapter
                        }
                    }
                },
                onRelease = { wv ->
                    try {
                        (wv.parent as? ViewGroup)?.removeView(wv)
                    } catch (_: Throwable) {}
                },
                onReset = { wv ->
                    try {
                        (wv.parent as? ViewGroup)?.removeView(wv)
                    } catch (_: Throwable) {}
                },
                update = { wv ->
                    wv.layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    wv.resumeTimers()
                    wv.onResume()
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }

    // ── ACTIVITY & ENGINE STATUS BOTTOM SHEET ────────────────────────────────
    if (showActivitySheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showActivitySheet = false },
            sheetState = sheetState,
            containerColor = Color(0xFF061217),
            contentColor = Color.White,
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .size(width = 36.dp, height = 4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color.White.copy(alpha = 0.25f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                // Sheet Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(DgElectricCyan.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Layers,
                                contentDescription = null,
                                tint = DgElectricCyan,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = "Engine Activity",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color.White.copy(alpha = 0.08f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${recentJobs.size} tasks",
                                color = DgSlate,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Status badge inside sheet
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(9999.dp))
                                .background(DgEmerald.copy(alpha = 0.12f))
                                .border(1.dp, DgEmerald.copy(alpha = 0.35f), RoundedCornerShape(9999.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(DgEmerald))
                                Text(
                                    text = ":5488 Online",
                                    color = DgEmerald,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        IconButton(
                            onClick = { showActivitySheet = false },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Close",
                                tint = DgSlate,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Quick session control bar (neatly housed inside Activity sheet)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF091E26))
                        .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (preferNewChat) DgElectricCyan.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.06f))
                                .border(1.dp, if (preferNewChat) DgElectricCyan else Color.White.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                                .clickable { ChatGptSessionManager.setPreferNewChat(true) }
                                .padding(horizontal = 8.dp, vertical = 5.dp)
                        ) {
                            Text("✨ New Chat", color = if (preferNewChat) DgElectricCyan else DgSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (!preferNewChat) DgElectricCyan.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.06f))
                                .border(1.dp, if (!preferNewChat) DgElectricCyan else Color.White.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                                .clickable { ChatGptSessionManager.setPreferNewChat(false) }
                                .padding(horizontal = 8.dp, vertical = 5.dp)
                        ) {
                            Text("💬 Current Chat", color = if (!preferNewChat) DgElectricCyan else DgSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    IconButton(
                        onClick = {
                            webAdapter?.webView?.reload()
                            Toast.makeText(context, "Reloading ChatGPT...", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Reload", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Activity Feed List
                ActivityFeedView(
                    context = context,
                    coroutineScope = coroutineScope,
                    sessionStatus = sessionStatus,
                    recentJobs = recentJobs,
                    testFeedback = testFeedback,
                    onTestFeedbackChange = { testFeedback = it },
                    modifier = Modifier.fillMaxWidth().weight(1f, fill = false)
                )
            }
        }
    }

    // Developer Unlock Dialog
    if (showDevUnlockDialog) {
        AlertDialog(
            onDismissRequest = {
                showDevUnlockDialog = false
                devPasscodeInput = ""
                devUnlockError = null
            },
            containerColor = Color(0xFF09161B),
            title = {
                Text("Developer Access", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Enter developer passcode or account email to inspect ChatGPT Web Engine and internal debug logs.",
                        color = DgSlate,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                    OutlinedTextField(
                        value = devPasscodeInput,
                        onValueChange = {
                            devPasscodeInput = it
                            devUnlockError = null
                        },
                        placeholder = { Text("Passcode or email", color = DgMuted, fontSize = 13.sp) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = DgElectricCyan,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                            cursorColor = DgElectricCyan
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (devUnlockError != null) {
                        Text(text = devUnlockError!!, color = Color(0xFFEF4444), fontSize = 11.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val success = DevAccessManager.verifyAndUnlock(context, devPasscodeInput)
                        if (success) {
                            showDevUnlockDialog = false
                            devPasscodeInput = ""
                            devUnlockError = null
                            Toast.makeText(context, "Developer mode unlocked", Toast.LENGTH_SHORT).show()
                        } else {
                            devUnlockError = "Invalid passcode. Access denied."
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DgElectricCyan)
                ) {
                    Text("Unlock", color = Color(0xFF030A0D), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showDevUnlockDialog = false
                        devPasscodeInput = ""
                        devUnlockError = null
                    }
                ) {
                    Text("Cancel", color = DgSlate)
                }
            }
        )
    }
}

@Composable
fun NormalUserOverlay(
    context: Context,
    currentVersionName: String,
    isCheckingUpdate: Boolean,
    updateStatusMessage: String?,
    onTriggerCheckUpdates: () -> Unit,
    onLogoTap: () -> Unit,
    onDisconnect: () -> Unit
) {
    val configuration = LocalConfiguration.current
    val screenWidthDp = configuration.screenWidthDp
    val screenHeightDp = configuration.screenHeightDp
    val isSmallScreen = screenWidthDp < 360
    val isShortScreen = screenHeightDp < 700
    val isTablet = screenWidthDp >= 600

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DgCanvas)
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) {}, // Catch all touches so they never reach background WebView
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = if (isSmallScreen) 16.dp else 24.dp, vertical = if (isShortScreen) 12.dp else 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = if (isShortScreen) Arrangement.spacedBy(14.dp) else Arrangement.SpaceBetween
        ) {
            // Upper Section: App Branding & Status Badge (Constrained to max width for tablets)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(if (isShortScreen) 12.dp else 18.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 520.dp)
                    .padding(top = if (isShortScreen) 6.dp else 16.dp)
            ) {
                // Large App Logo (Adaptive sizing for small/short screens)
                Box(
                    modifier = Modifier
                        .size(if (isShortScreen || isSmallScreen) 58.dp else 74.dp)
                        .clip(RoundedCornerShape(if (isShortScreen) 18.dp else 22.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFF0F766E), Color(0xFF134E5E))))
                        .border(1.5.dp, DgElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(if (isShortScreen) 18.dp else 22.dp))
                        .clickable { onLogoTap() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(if (isShortScreen || isSmallScreen) 30.dp else 38.dp)
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = "Dg-Images",
                        color = Color.White,
                        fontSize = if (isShortScreen) 21.sp else 24.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.5).sp,
                        maxLines = 1
                    )
                    Text(
                        text = "Dieme AI Engine Companion",
                        color = DgSlate,
                        fontSize = if (isSmallScreen) 11.sp else 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // ChatGPT Connected Emerald Status Pill
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(DgEmerald.copy(alpha = 0.12f))
                        .border(1.dp, DgEmerald.copy(alpha = 0.4f), RoundedCornerShape(9999.dp))
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(DgEmerald)
                        )
                        Text(
                            text = "ChatGPT Connected",
                            color = DgEmerald,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.2.sp,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                // Information Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(DgCardSurface)
                        .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(16.dp))
                        .padding(if (isSmallScreen) 12.dp else 16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = DgElectricCyan,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Local AI Engine Active",
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                        Text(
                            text = "Dg-Images operates in background mode. All thumbnail generation requests from Dieme are processed automatically.",
                            color = DgSlate,
                            fontSize = if (isSmallScreen) 11.sp else 12.sp,
                            lineHeight = if (isSmallScreen) 15.sp else 17.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                // Primary CTA: Generate Thumbnail in Dieme
                Button(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("dieme://studio/thumbnail")).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        }
                        try {
                            context.startActivity(intent)
                        } catch (_: Exception) {
                            val launchIntent = context.packageManager.getLaunchIntentForPackage("com.digicast.app")
                            if (launchIntent != null) {
                                context.startActivity(launchIntent)
                            } else {
                                Toast.makeText(context, "Please open Dieme app to generate thumbnails", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = DgElectricCyan),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(if (isSmallScreen) 48.dp else 52.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color(0xFF030A0D),
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Generate Thumbnail in Dieme",
                            color = Color(0xFF030A0D),
                            fontSize = if (isSmallScreen) 13.sp else 14.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Disconnect Button
                Button(
                    onClick = onDisconnect,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1418)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(if (isSmallScreen) 42.dp else 46.dp)
                        .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = null,
                            tint = Color(0xFFF87171),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Disconnect Session",
                            color = Color(0xFFF87171),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1
                        )
                    }
                }
            }

            // Downside: dieme.in website link, update checker & engine info (Constrained to max width for tablets)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 520.dp)
                    .padding(bottom = 8.dp, top = if (isShortScreen) 8.dp else 0.dp)
            ) {
                // If update check returned a message, show status pill
                if (updateStatusMessage != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(DgEmerald.copy(alpha = 0.12f))
                            .border(1.dp, DgEmerald.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 12.dp, vertical = 7.dp)
                    ) {
                        Text(
                            text = updateStatusMessage,
                            color = DgEmerald,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Responsive row or stacked buttons based on screen width
                if (isSmallScreen) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Check for Updates Action Pill
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .clickable(enabled = !isCheckingUpdate) {
                                    onTriggerCheckUpdates()
                                }
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                if (isCheckingUpdate) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(12.dp),
                                        strokeWidth = 2.dp,
                                        color = DgElectricCyan
                                    )
                                } else {
                                    Icon(
                                        Icons.Default.Refresh,
                                        contentDescription = null,
                                        tint = DgElectricCyan,
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                                Text(
                                    text = if (isCheckingUpdate) "Checking..." else "v$currentVersionName • Check Updates",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1
                                )
                            }
                        }

                        // Website link
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .clickable {
                                    try {
                                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://dieme.in"))
                                        context.startActivity(browserIntent)
                                    } catch (_: Exception) {}
                                }
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    Icons.Default.Language,
                                    contentDescription = null,
                                    tint = DgElectricCyan,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "dieme.in ↗",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Check for Updates Action Pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .clickable(enabled = !isCheckingUpdate) {
                                    onTriggerCheckUpdates()
                                }
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                if (isCheckingUpdate) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(12.dp),
                                        strokeWidth = 2.dp,
                                        color = DgElectricCyan
                                    )
                                } else {
                                    Icon(
                                        Icons.Default.Refresh,
                                        contentDescription = null,
                                        tint = DgElectricCyan,
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                                Text(
                                    text = if (isCheckingUpdate) "Checking..." else "v$currentVersionName • Updates",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        // Website link
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .clickable {
                                    try {
                                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://dieme.in"))
                                        context.startActivity(browserIntent)
                                    } catch (_: Exception) {}
                                }
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    Icons.Default.Language,
                                    contentDescription = null,
                                    tint = DgElectricCyan,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "dieme.in ↗",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                Text(
                    text = "Dieme Studio • Background IPC Engine v$currentVersionName",
                    color = DgMuted,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun ActivityFeedView(
    context: Context,
    coroutineScope: kotlinx.coroutines.CoroutineScope,
    sessionStatus: String,
    recentJobs: List<GenerationJob>,
    testFeedback: String?,
    onTestFeedbackChange: (String?) -> Unit,
    modifier: Modifier = Modifier.fillMaxSize()
) {
    val configuration = LocalConfiguration.current
    val isSmallScreen = configuration.screenWidthDp < 360
    val latestJob = recentJobs.firstOrNull()

    Box(
        modifier = modifier,
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 680.dp)
                .padding(horizontal = if (isSmallScreen) 12.dp else 16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
                    // Daemon Status Card
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(18.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF091E26), Color(0xFF041014))))
                                .border(1.dp, DgCardBorder, RoundedCornerShape(18.dp))
                                .padding(18.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = null, tint = DgElectricCyan, modifier = Modifier.size(20.dp))
                                        Text("LOCAL IPC DAEMON", color = DgElectricCyan, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                                    }
                                    Text("READY", color = DgEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Text(text = sessionStatus, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            coroutineScope.launch {
                                                onTestFeedbackChange("Simulating test dispatch...")
                                                ImageInpaintEngine.processInpaintTask(
                                                    context = context,
                                                    baseImageUrl = "https://img.youtube.com/vi/g_4KXSxPzGo/maxresdefault.jpg",
                                                    maskPointsJson = "[]",
                                                    prompt = "Test diagnostic handshake from dashboard"
                                                )
                                                onTestFeedbackChange("Test job successfully generated in cache!")
                                            }
                                        },
                                        shape = RoundedCornerShape(10.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                    ) {
                                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Test Self Handshake", fontSize = 12.sp, color = Color.White)
                                    }
                                }

                                if (testFeedback != null) {
                                    Text(text = testFeedback, color = DgElectricCyan, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // ── FEATURED HERO CARD: LATEST GENERATED THUMBNAIL (1080P) ──────
                    if (latestJob != null) {
                        item {
                            val model = resolveJobImageModel(context, latestJob)
                            val timeStr = SimpleDateFormat("h:mm a, MMM d", Locale.getDefault()).format(Date(latestJob.timestamp))

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(
                                                Color(0xFF0B2129),
                                                Color(0xFF041014)
                                            )
                                        )
                                    )
                                    .border(1.5.dp, DgElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                                    .padding(16.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = DgElectricCyan, modifier = Modifier.size(16.dp))
                                            Text(
                                                "LATEST INPAINTED THUMBNAIL",
                                                color = DgElectricCyan,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                letterSpacing = 1.sp
                                            )
                                        }

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(DgEmerald.copy(alpha = 0.15f))
                                                .border(1.dp, DgEmerald.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                        ) {
                                            Text("1080P • ${latestJob.status}", color = DgEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    // High-Definition 16:9 Canvas Preview
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .aspectRatio(16f / 9f)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(Color.Black)
                                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                                    ) {
                                        AsyncImage(
                                            model = ImageRequest.Builder(context)
                                                .data(model)
                                                .crossfade(true)
                                                .build(),
                                            contentDescription = "Latest Generated Thumbnail",
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )

                                        // 1080P Badge Top Left
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.TopStart)
                                                .padding(10.dp)
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Color.Black.copy(alpha = 0.7f))
                                                .border(1.dp, DgElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                        ) {
                                            Text("✨ 1920×1080", color = DgElectricCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    // Prompt description
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(
                                            text = latestJob.prompt,
                                            color = Color.White,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            lineHeight = 18.sp
                                        )
                                        Text(
                                            text = "Generated at $timeStr • Latency: ${latestJob.latencyMs}ms",
                                            color = DgSlate,
                                            fontSize = 10.sp
                                        )
                                    }

                                    // Action Buttons: One-Tap Download & Share
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                FileProviderUtils.saveImageToGallery(context, latestJob.resultUrl) { success, msg ->
                                                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                                }
                                            },
                                            shape = RoundedCornerShape(12.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = DgElectricCyan),
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(44.dp)
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Icon(Icons.Default.Download, contentDescription = null, tint = Color(0xFF030A0D), modifier = Modifier.size(16.dp))
                                                Text("Download to Gallery", color = Color(0xFF030A0D), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        Box(
                                            modifier = Modifier
                                                .size(44.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Color.White.copy(alpha = 0.08f))
                                                .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                                .clickable {
                                                    FileProviderUtils.shareImage(context, latestJob.resultUrl)
                                                },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Default.Share, contentDescription = "Share", tint = Color.White, modifier = Modifier.size(18.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Feed Items Header
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("HISTORY & ACTIVITY LOG", color = DgSlate, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                            Text("${recentJobs.size} total tasks", color = DgMuted, fontSize = 11.sp)
                        }
                    }

                    if (recentJobs.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(DgCardSurface)
                                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Layers, contentDescription = null, tint = DgMuted, modifier = Modifier.size(32.dp))
                                    Text("Awaiting Requests from Dieme", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    Text("Open Thumbnail Studio in Dieme and tap \"Generate with Dg-Images\"", color = DgSlate, fontSize = 11.sp)
                                }
                            }
                        }
                    } else {
                        items(recentJobs) { job ->
                            val model = resolveJobImageModel(context, job)
                            val timeStr = SimpleDateFormat("h:mm a, MMM d", Locale.getDefault()).format(Date(job.timestamp))

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(DgCardSurface)
                                    .border(1.dp, DgCardBorder, RoundedCornerShape(16.dp))
                                    .padding(14.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = DgEmerald, modifier = Modifier.size(14.dp))
                                            Text(job.status, color = DgEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Text(text = timeStr, color = DgSlate, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                    }

                                    Text(text = job.prompt, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)

                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .aspectRatio(16f / 9f)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color.Black)
                                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                    ) {
                                        AsyncImage(
                                            model = ImageRequest.Builder(context).data(model).crossfade(true).build(),
                                            contentDescription = "Thumbnail Preview",
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "ID: ${job.id} • ${job.latencyMs}ms",
                                            color = DgMuted,
                                            fontSize = 10.sp,
                                            fontFamily = FontFamily.Monospace
                                        )

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(DgElectricCyan.copy(alpha = 0.15f))
                                                .border(1.dp, DgElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                                .clickable {
                                                    FileProviderUtils.saveImageToGallery(context, job.resultUrl) { _, msg ->
                                                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                                .padding(horizontal = 10.dp, vertical = 5.dp)
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(Icons.Default.Download, contentDescription = null, tint = DgElectricCyan, modifier = Modifier.size(13.dp))
                                                Text("Download", color = DgElectricCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
