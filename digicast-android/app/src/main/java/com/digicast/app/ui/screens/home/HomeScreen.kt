package com.digicast.app.ui.screens.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
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
import androidx.hilt.navigation.compose.hiltViewModel
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
    val authRepository: AuthRepository
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
    val recentMessages = activeStreams
        .map { list -> list.firstOrNull { s -> !s.liveChatId.isNullOrEmpty() } ?: list.firstOrNull() }
        .flatMapLatest { stream ->
            if (stream == null) flowOf(emptyList())
            else chatRepository.getRecentMessages(stream.id, 50)
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
            }
            authRepository.syncWorkspaceData()
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
    var selectedCategory by remember { mutableStateOf("All Streams") }
    val realClips = clips.filter { it.id != "demo-clip-001" && !it.authorName.contains("DemoViewer", ignoreCase = true) }

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
            // ── 1. Greeting Row ────────────────────────────────────────────────
            item {
                val session = (authState as? AuthState.SignedIn)?.session
                val firstName = session?.displayName?.split(" ")?.firstOrNull() ?: "Creator"

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 2.dp)
                ) {
                    Text(
                        text = "Hello $firstName",
                        color = DigicastWhite,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = (-0.5).sp
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = "Welcome back!",
                        color = DigicastSlate,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
            }

            // ── 2. Apple Dark-Edge Search Pill ───────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(9999.dp))
                        .background(AppleDarkEdgePillBrush)
                        .border(1.dp, AppleSpecularBorder, RoundedCornerShape(9999.dp))
                        .clickable { /* Search action */ }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Search streams, clips, markers...",
                            color = Color.White.copy(alpha = 0.75f),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // ── 3. The 4 Iconic Folder-Tab Cards (100% Real Live Metrics) ──────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Top Row: Neon Lime & Spring Green
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        val viewsCount = if (live != null && live.concurrentViewers > 0) {
                            MetricFormatter.formatCount(live.concurrentViewers)
                        } else if (live != null && live.viewCount > 0) {
                            MetricFormatter.formatCount(live.viewCount)
                        } else if (allStreams.isNotEmpty()) {
                            MetricFormatter.formatCount(allStreams.sumOf { it.viewCount })
                        } else {
                            "0"
                        }

                        FolderTabCard(
                            value = viewsCount,
                            label = if (live?.status == "live") "Live Viewers" else "Total Views",
                            sublabel = if (live != null) live.channelTitle else "No streams yet",
                            icon = Icons.AutoMirrored.Filled.TrendingUp,
                            backgroundColor = DigicastNeonLime,
                            modifier = Modifier.weight(1f),
                            onClick = { if (live != null) onNavigateToStreamDetail(live.id) }
                        )

                        val distinctChatters = messages.map { it.authorDisplayName }.distinct().size
                        val chattersStr = if (distinctChatters > 0) MetricFormatter.formatCount(distinctChatters.toLong()) else if (messages.isNotEmpty()) "${messages.size}" else "0"

                        FolderTabCard(
                            value = chattersStr,
                            label = "Chatters",
                            sublabel = if (messages.isNotEmpty()) "${messages.size} msgs captured" else "No chatters yet",
                            icon = Icons.Default.Group,
                            backgroundColor = DigicastSpringGreen,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedCategory = "Chat Intelligence" }
                        )
                    }

                    // Bottom Row: Sunset Coral & Electric Cyan
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        val clipsCount = "${realClips.size}"
                        val readyCount = realClips.count { it.status.uppercase().contains("COMPLET") || it.status.uppercase() == "GENERATED" }

                        FolderTabCard(
                            value = clipsCount,
                            label = "Clips Created",
                            sublabel = if (realClips.isNotEmpty()) "$readyCount ready" else "No clips yet",
                            icon = Icons.Default.ContentCut,
                            backgroundColor = DigicastSunsetCoral,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToClips
                        )

                        val likesStr = if (live != null && live.likeCount > 0) {
                            MetricFormatter.formatCount(live.likeCount)
                        } else if (realAllStreams.isNotEmpty()) {
                            MetricFormatter.formatCount(realAllStreams.sumOf { it.likeCount })
                        } else {
                            "0"
                        }

                        FolderTabCard(
                            value = likesStr,
                            label = "Likes & Support",
                            sublabel = if (live != null) "Current Stream" else "All broadcasts",
                            icon = Icons.Default.Paid,
                            backgroundColor = DigicastElectricCyan,
                            modifier = Modifier.weight(1f),
                            onClick = { if (live != null) onNavigateToStreamDetail(live.id) }
                        )
                    }
                }
            }

            // ── 4. Category Filter Pills (From Reference Image 2) ─────────────
            item {
                val categories = listOf("All Streams", "Live Broadcast", "Clips Studio", "Chat Intelligence")
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

            // ── 5. Complete Activity Sparkline Wave (Bound to Real Broadcast) ──
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

            // ── 6. Live Broadcast Hero Card (When Active Stream Exists) ────────
            if (live != null && (selectedCategory == "All Streams" || selectedCategory == "Live Broadcast")) {
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

            // ── 6.5 Clips Studio Section ─────────────────────────────────────
            if (selectedCategory == "All Streams" || selectedCategory == "Clips Studio") {
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
            if (ytAccount != null && selectedCategory == "All Streams") {
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

            // ── 8. Chat Intelligence Section ──────────────────────────────────
            if (selectedCategory == "All Streams" || selectedCategory == "Chat Intelligence") {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LIVE CHAT FEED",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "${messages.size} Messages",
                            color = DigicastAccentBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                if (messages.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(DigicastSurface)
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Live chat messages captured during streams appear here in real time.",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                items(messages, key = { it.id }) { msg ->
                    ChatRow(msg)
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

@Composable
private fun ChatRow(msg: ChatMessageEntity) {
    Card(
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(msg.authorDisplayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                if (msg.messageText.contains("!clip", ignoreCase = true)) {
                    Box(
                        modifier = Modifier
                            .background(DigicastSunsetCoral.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("!CLIP MARKER", color = DigicastSunsetCoral, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(msg.messageText, color = DigicastSlate, fontSize = 13.sp)
        }
    }
}
