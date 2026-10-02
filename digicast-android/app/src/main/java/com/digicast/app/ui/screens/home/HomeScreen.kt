package com.digicast.app.ui.screens.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.PlayArrow
import coil.compose.AsyncImage
import com.digicast.app.ui.utils.MetricFormatter
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.service.LiveChatCaptureService
import com.digicast.app.ui.components.DigicastLogo
import com.digicast.app.ui.components.MetricCard
import com.digicast.app.ui.components.StatusBadge
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastWhite
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
        // Automatic sync when ViewModel is initialized
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

    // Auto-fetch data whenever screen opens
    LaunchedEffect(Unit) {
        viewModel.syncData()
    }

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 18.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DIGICAST",
                        color = DigicastWhite,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        letterSpacing = 1.sp
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
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

                        val session = (authState as? AuthState.SignedIn)?.session
                        com.digicast.app.ui.components.ProfileAvatarButton(
                            displayName = session?.displayName,
                            photoUrl = session?.photoUrl,
                            onClick = onNavigateToSettings
                        )
                    }
                }

                if (live != null) {
                    Spacer(modifier = Modifier.height(12.dp))

                    // 16:9 Hero Thumbnail with LIVE Badge
                    val thumbUrl = live.thumbnailUrl ?: if (live.id.isNotBlank()) "https://i.ytimg.com/vi/${live.id}/hqdefault.jpg" else null
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(170.dp)
                            .clip(RoundedCornerShape(10.dp))
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
                            // Gradient shadow on bottom for readability
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

                        // Badge top-left
                        Row(
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(8.dp)
                                .background(
                                    if (live.status == "live") DigicastLiveRed else DigicastSurfaceElevated,
                                    RoundedCornerShape(4.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(modifier = Modifier.size(6.dp).background(DigicastWhite, CircleShape))
                            Text(
                                text = if (live.status == "live") "LIVE NOW" else "STREAM",
                                color = DigicastWhite,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Channel info at bottom inside thumbnail
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

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = live.title,
                        color = DigicastWhite,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = live.channelTitle,
                            color = DigicastSlate,
                            fontSize = 13.sp
                        )
                        // Real Viewers or Views Count
                        if (live.status == "live") {
                            Text(
                                text = if (live.concurrentViewers > 0) "${MetricFormatter.formatCount(live.concurrentViewers)} Viewers" else "Live",
                                color = DigicastLiveRed,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        } else {
                            Text(
                                text = "${MetricFormatter.formatCount(live.viewCount)} Views",
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                        }
                        Text(
                            text = MetricFormatter.formatDuration(live.startedAtMs, live.endedAtMs),
                            color = DigicastAccentBlue,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Live Control Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DigicastDeepNavy, RoundedCornerShape(8.dp))
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Column {
                                Text("STATUS", color = DigicastSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    text = if (live.status == "live") "Active Live" else "Broadcast Ended",
                                    color = if (live.status == "live") DigicastLiveRed else DigicastEmerald,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Column {
                                Text("LIKES", color = DigicastSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    text = MetricFormatter.formatCount(live.likeCount),
                                    color = DigicastWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = onNavigateToClips,
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastSurfaceElevated),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Create Clip", fontSize = 12.sp, color = DigicastWhite)
                            }
                            Button(
                                onClick = { onNavigateToStreamDetail(live.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue.copy(alpha = 0.15f)),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Dashboard", fontSize = 12.sp, color = DigicastAccentBlue, fontWeight = FontWeight.SemiBold)
                            }
                        }
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Workspace Banner
            if (authState is AuthState.SignedIn) {
                val session = (authState as AuthState.SignedIn).session
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(session.workspaceName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${session.displayName} • ${session.role.uppercase()}", color = DigicastSlate, fontSize = 12.sp)
                            }
                            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                val isTrial = session.subscriptionStatus == "trial" || session.plan == "free_trial"
                                val subText = if (isTrial) "TRIAL (${session.daysRemaining}D)" else "PRO STUDIO"
                                Box(
                                    modifier = Modifier
                                        .background(
                                            if (isTrial) DigicastNavy else DigicastAccentBlue.copy(alpha = 0.2f),
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(subText, color = DigicastAccentBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                                Text("CONNECTED", color = DigicastSlate, fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // Connected YouTube Channel Card
            if (ytAccount != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastNavy),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
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
                                        .size(36.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(DigicastLiveRed, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("YT", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
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
                                    .background(DigicastAccentBlue.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("STUDIO LINKED", color = DigicastAccentBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Stream Card (Now replaced by Live Control Bar in topBar, but we'll remove it from here)
            if (live == null) {
                item {
                    Text(
                        text = "LIVE BROADCAST",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            item {
                Text(
                    text = "CHAT INTELLIGENCE",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    MetricCard("Captured Messages", "${messages.size}", modifier = Modifier.weight(1f))
                    val distinctChatters = messages.map { it.authorDisplayName }.toSet().size
                    MetricCard("Active Chatters", "$distinctChatters", modifier = Modifier.weight(1f))
                }
            }
            item {
                Text(
                    text = "LIVE CHAT",
                    color = DigicastWhite,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            if (messages.isEmpty()) {
                item { Text("Chat stays on this device. Capture a live stream or receive markers from viewers.", color = DigicastSlate) }
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
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.Transparent),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(vertical = 6.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(msg.authorDisplayName, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            Spacer(Modifier.height(4.dp))
            Text(msg.messageText, color = DigicastSlate, fontSize = 13.sp)
        }
    }
}
