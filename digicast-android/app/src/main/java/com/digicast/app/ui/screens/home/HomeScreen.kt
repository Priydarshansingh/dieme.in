package com.digicast.app.ui.screens.home

import androidx.compose.animation.AnimatedVisibility
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
import com.digicast.app.ui.components.FolderTabCard
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.components.SparklineWaveCard
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

@HiltViewModel
class HomeViewModel @Inject constructor(
    streamRepository: StreamRepository,
    chatRepository: ChatRepository,
    val authRepository: AuthRepository
) : ViewModel() {

    val authState = authRepository.authState
    val isSyncing = authRepository.isSyncing

    val activeStreams = streamRepository.getActiveStreams()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val recentMessages = activeStreams
        .map { it.firstOrNull() }
        .flatMapLatest { stream ->
            if (stream == null) flowOf(emptyList())
            else chatRepository.getRecentMessages(stream.id, 20)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        syncData()
    }

    fun syncData() {
        viewModelScope.launch {
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
    val streams by viewModel.activeStreams.collectAsState()
    val messages by viewModel.recentMessages.collectAsState()
    val authState by viewModel.authState.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val ytAccount by viewModel.authRepository.youtubeAccount.collectAsState()

    val live = streams.firstOrNull()
    val capturing = LiveChatCaptureService.isServiceRunning
    var selectedCategory by remember { mutableStateOf("All Streams") }

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
                // Minimalist Sound/Stream Wave Glyph from UI Reference
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(modifier = Modifier.size(width = 3.dp, height = 13.dp).background(DigicastAccentBlue, RoundedCornerShape(2.dp)))
                    Box(modifier = Modifier.size(width = 3.dp, height = 20.dp).background(DigicastNeonLime, RoundedCornerShape(2.dp)))
                    Box(modifier = Modifier.size(width = 3.dp, height = 10.dp).background(DigicastElectricCyan, RoundedCornerShape(2.dp)))

                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "DIGICAST",
                        color = DigicastWhite,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        letterSpacing = 1.sp
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
            // ── 1. Greeting Row (From Reference Image 1) ───────────────────────
            item {
                val session = (authState as? AuthState.SignedIn)?.session
                val firstName = session?.displayName?.split(" ")?.firstOrNull() ?: "Creator"

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Hello $firstName",
                            color = DigicastWhite,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.5).sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Welcome Back !",
                            color = DigicastSlate,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Normal
                        )
                    }

                    IconButton(
                        onClick = onNavigateToSettings,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(DigicastSearchBackground)
                            .border(1.dp, DigicastBorder, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Tune,
                            contentDescription = "Studio Settings",
                            tint = DigicastWhite,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // ── 2. Modern Search Pill (From Reference Image 1) ─────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DigicastSearchBackground)
                        .border(1.dp, DigicastBorder, RoundedCornerShape(14.dp))
                        .clickable { /* Search action */ }
                        .padding(horizontal = 14.dp, vertical = 12.dp),
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
                            tint = DigicastSlate,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Search streams, clips, markers...",
                            color = DigicastSlate.copy(alpha = 0.8f),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // ── 3. The 4 Iconic Folder-Tab Cards (2x2 Grid from Reference 1) ───
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
                        } else {
                            "230k"
                        }

                        FolderTabCard(
                            value = viewsCount,
                            label = if (live?.status == "live") "Live Views" else "Total Views",
                            sublabel = if (live != null) live.channelTitle else "Current Stream",
                            icon = Icons.AutoMirrored.Filled.TrendingUp,
                            backgroundColor = DigicastNeonLime,
                            modifier = Modifier.weight(1f),
                            onClick = { if (live != null) onNavigateToStreamDetail(live.id) }
                        )

                        val chattersCount = messages.map { it.authorDisplayName }.toSet().size
                        val chattersStr = if (chattersCount > 0) MetricFormatter.formatCount(chattersCount.toLong()) else "8.549k"

                        FolderTabCard(
                            value = chattersStr,
                            label = "Chatters",
                            sublabel = "Active Community",
                            icon = Icons.Default.Group,
                            backgroundColor = DigicastSpringGreen,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Bottom Row: Sunset Coral & Electric Cyan
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        FolderTabCard(
                            value = "1.423k",
                            label = "Clips Created",
                            sublabel = "Captured Markers",
                            icon = Icons.Default.ContentCut,
                            backgroundColor = DigicastSunsetCoral,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToClips
                        )

                        val likesStr = if (live != null && live.likeCount > 0) {
                            MetricFormatter.formatCount(live.likeCount)
                        } else {
                            "$9745"
                        }

                        FolderTabCard(
                            value = likesStr,
                            label = "Likes & Support",
                            sublabel = "Superchats & Bits",
                            icon = Icons.Default.Paid,
                            backgroundColor = DigicastElectricCyan,
                            modifier = Modifier.weight(1f)
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
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) DigicastMintGlow else DigicastChipBackground)
                                .border(
                                    1.dp,
                                    if (isSelected) DigicastMintGlow else DigicastBorder,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { selectedCategory = cat }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = cat,
                                color = if (isSelected) DigicastDarkText else DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── 5. Complete Activity Sparkline Wave (From Reference Image 1) ───
            item {
                SparklineWaveCard(
                    title = "Complete Stream Activity",
                    subtitle = "Real-time Viewer Engagement",
                    trendPercent = "+4.93%",
                    isPositiveTrend = true,
                    highlightBadgeText = "2h 12m"
                )
            }

            // ── 6. Live Broadcast Hero Card (When Active Stream Exists) ────────
            if (live != null && (selectedCategory == "All Streams" || selectedCategory == "Live Broadcast")) {
                item {
                    val thumbUrl = live.thumbnailUrl ?: if (live.id.isNotBlank()) "https://i.ytimg.com/vi/${live.id}/hqdefault.jpg" else null
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(12.dp))
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
                                text = live.title,
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
                                        colors = ButtonDefaults.buttonColors(containerColor = DigicastSurfaceElevated),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Text("Create Clip", fontSize = 12.sp, color = DigicastWhite)
                                    }
                                    Button(
                                        onClick = { onNavigateToStreamDetail(live.id) },
                                        colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue.copy(alpha = 0.15f)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Text("Dashboard", fontSize = 12.sp, color = DigicastAccentBlue, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── 7. Connected YouTube Channel Card ─────────────────────────────
            if (ytAccount != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
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
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
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
