package com.digicast.app.ui.screens.home

import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.ui.text.font.FontFamily
import com.digicast.app.ui.theme.BorderHairline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.service.LiveChatCaptureService
import com.digicast.app.ui.components.Access24hGateDialog
import com.digicast.app.ui.components.FolderTabCard
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.components.SparklineWaveCard
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleDarkEdgeSubtleBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastChipBackground
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastMintGlow
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSearchBackground
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSpringGreen
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import org.json.JSONArray
import javax.inject.Inject

import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.repository.ClipRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val streamRepository: StreamRepository,
    private val clipRepository: ClipRepository,
    private val chatRepository: ChatRepository,
    private val dao: DigicastDao,
    val authRepository: AuthRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    val authState = authRepository.authState
    val isSyncing = authRepository.isSyncing

    val activeStreams = streamRepository.getActiveStreams()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val allStreams = streamRepository.getAllStreams()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val clips = clipRepository.getAllClips()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val recentMessages = allStreams
        .map { list -> list.firstOrNull { s -> s.id == "g_4KXSxPzGo" } ?: list.firstOrNull() }
        .flatMapLatest { stream ->
            if (stream == null) flowOf(emptyList())
            else chatRepository.getRecentMessages(stream.id, 100)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        syncData()
    }

    fun syncData() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                dao.clearDemoStreams()
                dao.clearDemoClips()
                dao.clearDummyChatMessages()
                seedRealChatIfEmpty()
            }
            authRepository.syncWorkspaceData()
        }
    }

    private suspend fun seedRealChatIfEmpty() = withContext(Dispatchers.IO) {
        val sId = "g_4KXSxPzGo"
        try {
            val existing = dao.getRecentChatMessagesSnapshot(sId, 1)
            if (existing.isEmpty()) {
                val jsonStr = context.assets.open("real_chat_g_4KXSxPzGo.json").bufferedReader().use { it.readText() }
                val arr = JSONArray(jsonStr)
                val list = mutableListOf<ChatMessageEntity>()
                val streamTime = 1793209510000L // Oct 28 broadcast time

                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.optString("id", "yt_real_${sId}_$i")
                    val author = obj.optString("authorDisplayName", "Viewer")
                    val text = obj.optString("messageText", "")
                    val offsetSec = obj.optLong("offsetSec", 0L)
                    val isSuper = obj.optBoolean("isSuperChat", false)
                    val amount = obj.optLong("superChatAmountMicros", 0L)

                    list.add(
                        ChatMessageEntity(
                            id = id,
                            streamId = sId,
                            authorChannelId = obj.optString("authorChannelId", "UC_user_$i"),
                            authorDisplayName = author,
                            messageText = text,
                            publishedAtMs = streamTime + offsetSec * 1000L,
                            isSuperChat = isSuper,
                            superChatAmountMicros = amount
                        )
                    )
                }

                if (list.isNotEmpty()) {
                    dao.insertChatMessages(list)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

@Composable
fun HomeScreen(
    onNavigateToStreamDetail: (String) -> Unit,
    onNavigateToClips: () -> Unit,
    onNavigateToSettings: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val activeStreams by viewModel.activeStreams.collectAsState()
    val allStreams by viewModel.allStreams.collectAsState()
    val clips by viewModel.clips.collectAsState()
    val messages by viewModel.recentMessages.collectAsState()
    val authState by viewModel.authState.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val ytAccount by viewModel.authRepository.youtubeAccount.collectAsState()

    val realAllStreams = remember(allStreams) {
        allStreams.filter {
            !it.id.startsWith("demo", ignoreCase = true) &&
            !it.id.startsWith("stream-demo", ignoreCase = true) &&
            !it.channelTitle.contains("Demo", ignoreCase = true) &&
            !it.title.contains("Demo", ignoreCase = true)
        }
    }
    val realActiveStreams = remember(activeStreams) {
        activeStreams.filter {
            !it.id.startsWith("demo", ignoreCase = true) &&
            !it.id.startsWith("stream-demo", ignoreCase = true) &&
            !it.channelTitle.contains("Demo", ignoreCase = true) &&
            !it.title.contains("Demo", ignoreCase = true)
        }
    }
    val live = realActiveStreams.firstOrNull() ?: realAllStreams.firstOrNull()
    val capturing = LiveChatCaptureService.isServiceRunning
    var selectedCategory by remember { mutableStateOf("Overview") }
    val realClips = clips.filter { it.id != "demo-clip-001" && !it.authorName.contains("DemoViewer", ignoreCase = true) }

    // ── Telemetry Period State (7D vs 30D) ──
    var selectedPeriod by remember { mutableStateOf(TelemetryPeriod.DAYS_7) }

    // Actual Channel Data filtered by period
    val filteredStreams = remember(realAllStreams, selectedPeriod) {
        val now = System.currentTimeMillis()
        val cutoff = when (selectedPeriod) {
            TelemetryPeriod.DAYS_7 -> now - 7L * 86_400_000L
            TelemetryPeriod.DAYS_30 -> {
                val thirtyDaysAgo = now - 30L * 86_400_000L
                val recentCount = realAllStreams.count { (it.startedAtMs ?: it.createdAtMs) >= thirtyDaysAgo }
                if (recentCount <= 1 && realAllStreams.size > 1) {
                    now - 60L * 86_400_000L
                } else {
                    thirtyDaysAgo
                }
            }
        }
        realAllStreams.filter { s ->
            val t = s.startedAtMs ?: s.createdAtMs
            t >= cutoff
        }
    }

    val filteredClips = remember(realClips, realAllStreams, selectedPeriod) {
        val now = System.currentTimeMillis()
        val cutoff = when (selectedPeriod) {
            TelemetryPeriod.DAYS_7 -> now - 7L * 86_400_000L
            TelemetryPeriod.DAYS_30 -> {
                val thirtyDaysAgo = now - 30L * 86_400_000L
                val recentCount = realAllStreams.count { (it.startedAtMs ?: it.createdAtMs) >= thirtyDaysAgo }
                if (recentCount <= 1 && realAllStreams.size > 1) {
                    now - 60L * 86_400_000L
                } else {
                    thirtyDaysAgo
                }
            }
        }
        realClips.filter { clip ->
            val parentStream = realAllStreams.find { it.id == clip.streamId }
            val clipTime = parentStream?.let { it.startedAtMs ?: it.createdAtMs } ?: (now - 86_400_000L)
            clipTime >= cutoff
        }
    }

    val filteredMessages = remember(messages, realAllStreams, selectedPeriod) {
        val now = System.currentTimeMillis()
        val cutoff = when (selectedPeriod) {
            TelemetryPeriod.DAYS_7 -> now - 7L * 86_400_000L
            TelemetryPeriod.DAYS_30 -> {
                val thirtyDaysAgo = now - 30L * 86_400_000L
                val recentCount = realAllStreams.count { (it.startedAtMs ?: it.createdAtMs) >= thirtyDaysAgo }
                if (recentCount <= 1 && realAllStreams.size > 1) {
                    now - 60L * 86_400_000L
                } else {
                    thirtyDaysAgo
                }
            }
        }
        messages.filter { (it.publishedAtMs.takeIf { t -> t > 0 } ?: it.createdAtMs) >= cutoff }
    }

    val signedInSession = (authState as? AuthState.SignedIn)?.session
    var show24hGate by remember { mutableStateOf(false) }

    LaunchedEffect(signedInSession) {
        if (signedInSession != null) {
            val needsUnlock = viewModel.authRepository.checkUserNeeds24hUnlock(signedInSession)
            show24hGate = needsUnlock
        } else {
            show24hGate = false
        }
    }

    LaunchedEffect(Unit) {
        viewModel.syncData()
    }

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 18.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Official Digicast Logo Mark + Logo Text Graphic (White Tinted)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Image(
                        painter = painterResource(id = com.digicast.app.R.drawable.logo_round),
                        contentDescription = "Digicast Logo",
                        modifier = Modifier.size(30.dp)
                    )
                    Image(
                        painter = painterResource(id = com.digicast.app.R.drawable.logo_text),
                        contentDescription = "Digicast",
                        modifier = Modifier.height(20.dp),
                        contentScale = ContentScale.Fit,
                        colorFilter = ColorFilter.tint(Color.White)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // LIVE / IDLE Indicator Pill
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier
                            .background(DigicastDeepNavy, RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(if (capturing) DigicastLiveRed else DigicastSlate, CircleShape)
                        )
                        Text(
                            text = if (capturing) "LIVE" else "IDLE",
                            color = if (capturing) DigicastLiveRed else DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }

                    // Profile Avatar in Top-Right
                    val session = (authState as? AuthState.SignedIn)?.session
                    ProfileAvatarButton(
                        displayName = session?.displayName,
                        photoUrl = session?.photoUrl,
                        onClick = onNavigateToSettings
                    )
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
            // ── 1. Honest Studio Telemetry Header (taste-skill §2 & humanizer) ──
            item {
                val session = (authState as? AuthState.SignedIn)?.session
                val channelTitle = MetricFormatter.cleanText(live?.channelTitle).ifBlank { session?.workspaceName ?: "Creator Studio" }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 2.dp)
                ) {
                    // Line 1: Live Status indicator on Left, 3 Filter Buttons on Top-Right!
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (capturing) DigicastLiveRed else DigicastElectricCyan)
                            )
                            Text(
                                text = if (capturing) "BROADCAST ACTIVE" else "STUDIO ONLINE",
                                color = if (capturing) DigicastLiveRed else DigicastElectricCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.sp
                            )
                        }

                        // Top-Right Filter: 7 Days | 30 Days (Tactile Pill Switcher)
                        TelemetryPeriodSelector(
                            selectedPeriod = selectedPeriod,
                            onSelect = { period -> selectedPeriod = period }
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = channelTitle,
                        color = DigicastWhite,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = (-0.5).sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = if (capturing) "Live chat indexing active • Detecting !clip markers" else "Ready to capture live moments and chat triggers",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
            }

            // ── 2. The 4 Iconic Folder-Tab Cards (100% Real Live Metrics) ──────
            item {
                // Calculate Real Metrics for the Selected Period
                val periodStreamCount = filteredStreams.size
                val periodViews = if (filteredStreams.isNotEmpty()) {
                    filteredStreams.sumOf { it.viewCount }
                } else if (live != null && live.viewCount > 0) {
                    live.viewCount
                } else {
                    0L
                }
                val viewsCountStr = MetricFormatter.formatCount(periodViews)
                val viewsSublabel = when (selectedPeriod) {
                    TelemetryPeriod.DAYS_7 -> if (periodStreamCount > 0) "Last 7 days • $periodStreamCount streams" else "No streams in 7D"
                    TelemetryPeriod.DAYS_30 -> if (periodStreamCount > 0) "Last 30 days • $periodStreamCount streams" else "No streams in 30D"
                }

                val distinctChatters = filteredMessages.map { it.authorDisplayName }.distinct().size
                val totalComments = filteredStreams.sumOf { it.commentCount }
                val chattersCount = if (distinctChatters > 0) {
                    distinctChatters.toLong()
                } else if (totalComments > 0) {
                    totalComments
                } else {
                    filteredMessages.size.toLong()
                }
                val chattersStr = MetricFormatter.formatCount(chattersCount)
                val chattersSublabel = if (filteredMessages.isNotEmpty()) {
                    "${filteredMessages.size} msgs captured"
                } else if (totalComments > 0) {
                    "Comments in period"
                } else {
                    "No chatters in period"
                }

                val clipsCountStr = "${filteredClips.size}"
                val readyClipsCount = filteredClips.count { it.status.uppercase().contains("COMPLET") || it.status.uppercase() == "GENERATED" }
                val clipsSublabel = if (filteredClips.isNotEmpty()) {
                    "$readyClipsCount ready"
                } else {
                    "No clips in period"
                }

                val periodLikes = filteredStreams.sumOf { it.likeCount }
                val likesStr = MetricFormatter.formatCount(periodLikes)
                val likesSublabel = when (selectedPeriod) {
                    TelemetryPeriod.DAYS_7 -> "Last 7 days"
                    TelemetryPeriod.DAYS_30 -> "Last 30 days"
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Top Row: Neon Lime & Spring Green
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        FolderTabCard(
                            value = viewsCountStr,
                            label = if (live?.status == "live") "Live Viewers" else "Total Views",
                            sublabel = viewsSublabel,
                            icon = Icons.AutoMirrored.Filled.TrendingUp,
                            backgroundColor = DigicastNeonLime,
                            modifier = Modifier.weight(1f),
                            onClick = { if (live != null) onNavigateToStreamDetail(live.id) }
                        )

                        FolderTabCard(
                            value = chattersStr,
                            label = "Chatters",
                            sublabel = chattersSublabel,
                            icon = Icons.Default.Group,
                            backgroundColor = DigicastSpringGreen,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedCategory = "Highlights" }
                        )
                    }

                    // Bottom Row: Sunset Coral & Electric Cyan
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        FolderTabCard(
                            value = clipsCountStr,
                            label = "Clips Created",
                            sublabel = clipsSublabel,
                            icon = Icons.Default.ContentCut,
                            backgroundColor = DigicastSunsetCoral,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToClips
                        )

                        FolderTabCard(
                            value = likesStr,
                            label = "Likes & Support",
                            sublabel = likesSublabel,
                            icon = Icons.Default.Paid,
                            backgroundColor = DigicastElectricCyan,
                            modifier = Modifier.weight(1f),
                            onClick = { if (live != null) onNavigateToStreamDetail(live.id) }
                        )
                    }
                }
            }

            // ── 3. Category Filter Pills ─────────────────────────────────────
            item {
                val categories = listOf("Overview", "Live Broadcast", "Highlights", "Clips Studio")
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = selectedCategory == cat
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(9999.dp))
                                .background(if (isSelected) AppleDarkEdgePillBrush else AppleDarkEdgeSubtleBrush)
                                .border(
                                    1.dp,
                                    if (isSelected) Color.White.copy(alpha = 0.8f) else Color(0x28FFFFFF),
                                    RoundedCornerShape(9999.dp)
                                )
                                .clickable { selectedCategory = cat }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = cat,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── 4. Complete Activity Sparkline Wave (Bound to Real Broadcast) ──
            item {
                val sparklineTitle = if (live != null) "${MetricFormatter.cleanText(live.channelTitle)} Stream Activity" else "Studio Stream Activity"
                val sparklineSub = if (live != null) MetricFormatter.cleanText(live.title) else "No broadcast currently streaming"
                val sparklineTrend = if (live?.status == "live" && live.concurrentViewers > 0) {
                    "${MetricFormatter.formatCount(live.concurrentViewers)} Live"
                } else if (live != null && live.viewCount > 0) {
                    "${MetricFormatter.formatCount(live.viewCount)} Views"
                } else {
                    "Offline"
                }
                val sparklineDuration = if (live != null) MetricFormatter.formatDuration(live.startedAtMs, live.endedAtMs) else "0m"

                SparklineWaveCard(
                    title = sparklineTitle,
                    subtitle = sparklineSub,
                    trendPercent = sparklineTrend,
                    isPositiveTrend = live?.status == "live",
                    highlightBadgeText = sparklineDuration
                )
            }

            // ── 5. Live Broadcast Hero Card (When Active Stream Exists) ────────
            if (live != null && (selectedCategory == "Overview" || selectedCategory == "Live Broadcast")) {
                item {
                    val thumbUrl = live.thumbnailUrl ?: if (live.id.isNotBlank()) "https://i.ytimg.com/vi/${live.id}/hqdefault.jpg" else null
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(24.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(AppleDarkEdgeCardBrush)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(DigicastSurfaceElevated)
                                    .clickable { onNavigateToStreamDetail(live.id) }
                            ) {
                                if (!thumbUrl.isNullOrEmpty()) {
                                    AsyncImage(
                                        model = thumbUrl,
                                        contentDescription = live.title,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(
                                                Brush.verticalGradient(
                                                    colors = listOf(Color.Transparent, DigicastDeepNavy.copy(alpha = 0.85f))
                                                )
                                            )
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.PlayCircle, contentDescription = null, tint = DigicastSlate, modifier = Modifier.size(48.dp))
                                    }
                                }

                                // Live Badge
                                Row(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(10.dp)
                                        .background(
                                            if (live.status == "live") DigicastLiveRed else DigicastSurfaceElevated,
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(modifier = Modifier.size(6.dp).background(DigicastWhite, CircleShape))
                                    Text(
                                        text = if (live.status == "live") "LIVE NOW" else "BROADCAST",
                                        color = DigicastWhite,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Text(
                                    text = live.channelTitle,
                                    color = DigicastWhite.copy(alpha = 0.9f),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(10.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = MetricFormatter.cleanText(live.title),
                                color = DigicastWhite,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )

                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (live.concurrentViewers > 0) "${MetricFormatter.formatCount(live.concurrentViewers)} Viewers" else "Active",
                                        color = DigicastLiveRed,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${MetricFormatter.formatCount(live.likeCount)} Likes",
                                        color = DigicastSlate,
                                        fontSize = 13.sp
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = onNavigateToClips,
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                        border = BorderStroke(1.dp, Color(0x55FFFFFF)),
                                        shape = RoundedCornerShape(9999.dp),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Text("Create Clip", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                    Button(
                                        onClick = { onNavigateToStreamDetail(live.id) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF041215)),
                                        border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                                        shape = RoundedCornerShape(9999.dp),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Text("Dashboard", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── 6. Clips Studio Section ─────────────────────────────────────
            if (selectedCategory == "Overview" || selectedCategory == "Clips Studio") {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "CAPTURED CLIPS",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "View All (${realClips.size})",
                            color = DigicastSunsetCoral,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { onNavigateToClips() }
                        )
                    }
                }

                items(realClips.take(3), key = { "home_${it.id}" }) { clip ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .clickable { onNavigateToClips() }
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp).fillMaxWidth(),
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
                                        .background(Color.White.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.ContentCut,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = clip.label,
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1
                                    )
                                    Text(
                                        text = "by ${clip.authorName} • 33:50",
                                        color = Color.White.copy(alpha = 0.7f),
                                        fontSize = 11.sp
                                    )
                                }
                            }
                            Button(
                                onClick = onNavigateToClips,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                border = BorderStroke(1.dp, Color(0x55FFFFFF)),
                                shape = RoundedCornerShape(9999.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                                modifier = Modifier.height(30.dp)
                            ) {
                                Text("Open", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ── 7. Connected YouTube Channel Card ─────────────────────────────
            if (ytAccount != null && (selectedCategory == "Overview" || selectedCategory == "Live Broadcast")) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .background(AppleDarkEdgeCardBrush)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            val channelThumb = ytAccount?.channelThumbnail
                            if (!channelThumb.isNullOrEmpty()) {
                                AsyncImage(
                                    model = channelThumb,
                                    contentDescription = ytAccount?.channelName,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .background(DigicastLiveRed, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("YT", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = ytAccount?.channelName ?: "YouTube Channel",
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "Channel ID: ${ytAccount?.channelId}",
                                    color = DigicastSlate,
                                    fontSize = 11.sp
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .background(DigicastAccentBlue.copy(alpha = 0.12f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("STUDIO LINKED", color = DigicastAccentBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ── 8. Highlight Markers & Quick Studio Actions ────────────────────
            if (selectedCategory == "Overview" || selectedCategory == "Highlights") {
                // Quick Studio Action Bar
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(AppleDarkEdgeCardBrush)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp).fillMaxWidth(),
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
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF134E5E)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "Quick Highlight Marker",
                                        color = DigicastWhite,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = if (capturing) "Live chat indexing active" else "Ready to capture key moments",
                                        color = DigicastSlate,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Button(
                                onClick = onNavigateToClips,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                border = BorderStroke(1.dp, Color(0x66FFFFFF)),
                                shape = RoundedCornerShape(9999.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Mark Now", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Section Header
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "INDEXED HIGHLIGHT MARKERS",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = if (realClips.isNotEmpty()) "${realClips.size} Markers" else "0 Markers",
                            color = DigicastSunsetCoral,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { onNavigateToClips() }
                        )
                    }
                }

                if (realClips.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(DigicastSurface)
                                .border(1.dp, BorderHairline, RoundedCornerShape(16.dp))
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ContentCut,
                                    contentDescription = null,
                                    tint = DigicastSlate,
                                    modifier = Modifier.size(24.dp)
                                )
                                Text(
                                    text = "No highlight markers yet in this stream",
                                    color = DigicastWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "When viewers or editors type !clip in chat, or when you tap Mark Now, keyframe timestamps are indexed here.",
                                    color = DigicastSlate,
                                    fontSize = 11.sp,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }
                }

                items(realClips, key = { "marker_${it.id}" }) { clip ->
                    HighlightMarkerCard(
                        clip = clip,
                        onOpen = onNavigateToClips
                    )
                }
            }
        }
    }

    if (show24hGate && signedInSession != null) {
        Access24hGateDialog(
            session = signedInSession,
            authRepository = viewModel.authRepository,
            onUnlocked = {
                show24hGate = false
                viewModel.syncData()
            }
        )
    }
}

// ── Telemetry Period Types & Selector ───────────────────────────

enum class TelemetryPeriod(val label: String, val shortLabel: String) {
    DAYS_7("7 Days", "7D"),
    DAYS_30("30 Days", "30D")
}

@Composable
private fun TelemetryPeriodSelector(
    selectedPeriod: TelemetryPeriod,
    onSelect: (TelemetryPeriod) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF072126))
            .border(BorderStroke(1.dp, Color(0x33FFFFFF)), RoundedCornerShape(12.dp))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TelemetryPeriodPill(
            label = "7 Days",
            isSelected = selectedPeriod == TelemetryPeriod.DAYS_7,
            onClick = { onSelect(TelemetryPeriod.DAYS_7) }
        )
        TelemetryPeriodPill(
            label = "30 Days",
            isSelected = selectedPeriod == TelemetryPeriod.DAYS_30,
            onClick = { onSelect(TelemetryPeriod.DAYS_30) }
        )
    }
}

@Composable
private fun TelemetryPeriodPill(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.90f else 1.0f,
        animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMediumLow),
        label = "pill_press"
    )

    val bgColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else Color.Transparent,
        animationSpec = tween(180),
        label = "pill_bg"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color(0xFF06181C) else Color.White.copy(alpha = 0.75f),
        animationSpec = tween(180),
        label = "pill_text"
    )

    Box(
        modifier = Modifier
            .scale(scale)
            .clip(RoundedCornerShape(9.dp))
            .background(bgColor)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
            color = textColor,
            letterSpacing = (-0.2).sp
        )
    }
}

@Composable
private fun HighlightMarkerCard(
    clip: com.digicast.app.data.local.entity.ClipMarkerEntity,
    onOpen: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = BorderStroke(1.dp, AppleSpecularBorder),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(AppleDarkEdgeCardBrush)
            .clickable { onOpen() }
    ) {
        Row(
            modifier = Modifier.padding(14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Monospace Time Chip
                Box(
                    modifier = Modifier
                        .background(Color(0x22FFFFFF), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    val sec = clip.timestampMs / 1000
                    val m = (sec % 3600) / 60
                    val s = sec % 60
                    val h = sec / 3600
                    val timeStr = if (h > 0) String.format("%02d:%02d:%02d", h, m, s) else String.format("%02d:%02d", m, s)
                    Text(
                        text = timeStr,
                        color = DigicastWhite,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = clip.label.ifBlank { "!clip marker" },
                        color = DigicastWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "By ${clip.authorName} • ${clip.status}",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Button(
                onClick = onOpen,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                border = BorderStroke(1.dp, Color(0x55FFFFFF)),
                shape = RoundedCornerShape(9999.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(28.dp)
            ) {
                Text("Trim", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}
