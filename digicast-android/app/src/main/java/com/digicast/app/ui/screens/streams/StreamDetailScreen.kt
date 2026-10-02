package com.digicast.app.ui.screens.streams

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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.FolderTabCard
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
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSpringGreen
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StreamDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    streamRepository: StreamRepository,
    chatRepository: ChatRepository,
    clipRepository: ClipRepository
) : ViewModel() {
    private val streamId: String = checkNotNull(savedStateHandle["streamId"])

    val messages = chatRepository.getRecentMessages(streamId, 80)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val clips = clipRepository.getClipsForStream(streamId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _stream = kotlinx.coroutines.flow.MutableStateFlow<StreamEntity?>(null)
    val stream: StateFlow<StreamEntity?> = _stream

    init {
        viewModelScope.launch {
            _stream.value = streamRepository.getStreamById(streamId)
        }
    }
}

@Composable
fun StreamDetailScreen(
    onNavigateBack: () -> Unit,
    onNavigateToClipGenerate: (String) -> Unit,
    viewModel: StreamDetailViewModel = hiltViewModel()
) {
    val stream by viewModel.stream.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val clips by viewModel.clips.collectAsState()
    var selectedTab by remember { mutableStateOf("Overview") }

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
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
                        text = "Stream Console",
                        color = DigicastWhite,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (stream?.status == "live") {
                    Row(
                        modifier = Modifier
                            .background(DigicastLiveRed.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(DigicastLiveRed))
                        Text("LIVE", color = DigicastLiveRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
            // ── 1. Hero 16:9 Thumbnail ─────────────────────────────────────────
            item {
                val currentStream = stream
                val thumbUrl = currentStream?.thumbnailUrl
                    ?: if (!currentStream?.id.isNullOrBlank()) "https://i.ytimg.com/vi/${currentStream?.id}/hqdefault.jpg" else null

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
                        ) {
                            if (!thumbUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = thumbUrl,
                                    contentDescription = currentStream?.title,
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
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.PlayCircle, contentDescription = null, tint = DigicastSlate, modifier = Modifier.size(48.dp))
                                }
                            }

                            Text(
                                text = currentStream?.channelTitle ?: "Broadcast Studio",
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
                            text = currentStream?.title ?: "Untitled Stream",
                            color = DigicastWhite,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(
                                text = if (currentStream?.status == "live") "${MetricFormatter.formatCount(currentStream.concurrentViewers)} Viewers"
                                       else "${MetricFormatter.formatCount(currentStream?.viewCount ?: 0L)} Views",
                                color = if (currentStream?.status == "live") DigicastLiveRed else DigicastWhite,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "${MetricFormatter.formatCount(currentStream?.likeCount ?: 0L)} Likes",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                            Text(
                                text = MetricFormatter.formatDuration(currentStream?.startedAtMs, currentStream?.endedAtMs),
                                color = DigicastAccentBlue,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // ── 2. Stat Folder Tab Cards for this Stream ──────────────────────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        val vCount = if (stream?.status == "live") {
                            MetricFormatter.formatCount(stream?.concurrentViewers ?: 0L)
                        } else {
                            MetricFormatter.formatCount(stream?.viewCount ?: 0L)
                        }

                        FolderTabCard(
                            value = vCount,
                            label = if (stream?.status == "live") "Current Viewers" else "Total Views",
                            sublabel = "YouTube Audience",
                            icon = Icons.AutoMirrored.Filled.TrendingUp,
                            backgroundColor = DigicastNeonLime,
                            modifier = Modifier.weight(1f)
                        )

                        val activeChatters = messages.map { it.authorDisplayName }.distinct().size
                        FolderTabCard(
                            value = if (activeChatters > 0) "$activeChatters" else "0",
                            label = "Active Chatters",
                            sublabel = "${messages.size} msgs captured",
                            icon = Icons.Default.Group,
                            backgroundColor = DigicastSpringGreen,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        FolderTabCard(
                            value = "${clips.size}",
                            label = "Clips Created",
                            sublabel = "Captured Moments",
                            icon = Icons.Default.ContentCut,
                            backgroundColor = DigicastSunsetCoral,
                            modifier = Modifier.weight(1f)
                        )

                        FolderTabCard(
                            value = MetricFormatter.formatCount(stream?.likeCount ?: 0L),
                            label = "Stream Likes",
                            sublabel = "Viewer Support",
                            icon = Icons.Default.Paid,
                            backgroundColor = DigicastElectricCyan,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // ── 3. Real Sparkline Wave Card ───────────────────────────────────
            item {
                SparklineWaveCard(
                    title = "Broadcast Performance",
                    subtitle = stream?.title ?: "Stream Activity",
                    trendPercent = if (stream?.status == "live") "${MetricFormatter.formatCount(stream?.concurrentViewers ?: 0L)} Live" else "Broadcast Complete",
                    isPositiveTrend = stream?.status == "live",
                    highlightBadgeText = MetricFormatter.formatDuration(stream?.startedAtMs, stream?.endedAtMs)
                )
            }

            // ── 4. Tab Navigation Chips ───────────────────────────────────────
            item {
                val tabs = listOf("Overview", "Live Chat (${messages.size})", "Clips (${clips.size})")
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tabs.forEach { tab ->
                        val isSelected = selectedTab.startsWith(tab.take(4))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) DigicastMintGlow else DigicastChipBackground)
                                .border(
                                    1.dp,
                                    if (isSelected) DigicastMintGlow else DigicastBorder,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { selectedTab = tab }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = tab,
                                color = if (isSelected) DigicastDarkText else DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── 5. Dynamic Tab Content ────────────────────────────────────────
            if (clips.isNotEmpty() && !selectedTab.startsWith("Live")) {
                item {
                    Text(
                        text = "CAPTURED MOMENTS & CLIPS",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                items(clips, key = { it.id }) { clip ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onNavigateToClipGenerate(clip.id) }
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(clip.label, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 12.sp)
                            }
                            Button(
                                onClick = { onNavigateToClipGenerate(clip.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue.copy(alpha = 0.18f)),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Clip", fontSize = 11.sp, color = DigicastAccentBlue, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            if (selectedTab.startsWith("Live") || selectedTab == "Overview") {
                item {
                    Text(
                        text = "LIVE CHAT MESSAGES (${messages.size})",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                if (messages.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(DigicastCardSurface)
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No chat messages recorded for this stream.", color = DigicastSlate, fontSize = 13.sp)
                        }
                    }
                }

                items(messages.take(20), key = { it.id }) { msg ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(horizontal = 14.dp, vertical = 8.dp)) {
                            Text(msg.authorDisplayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(msg.messageText, color = DigicastSlate, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
