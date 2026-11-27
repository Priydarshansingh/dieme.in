package com.digicast.app.ui.screens.home

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.LiveTv
import com.digicast.app.ui.utils.WebNavigationUtil
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.service.LiveChatCaptureService
import com.digicast.app.ui.components.Access24hGateDialog
import com.digicast.app.ui.components.ChannelPerformanceGraph
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastElectricViolet
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import javax.inject.Inject

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

    @OptIn(ExperimentalCoroutinesApi::class)
    val activeStreams = authRepository.authState.flatMapLatest { state ->
        val session = (state as? AuthState.SignedIn)?.session
        if (session != null) {
            streamRepository.getActiveStreamsForWorkspace(session.workspaceId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val allStreams = authRepository.authState.flatMapLatest { state ->
        val session = (state as? AuthState.SignedIn)?.session
        if (session != null) {
            streamRepository.getStreamsForWorkspace(session.workspaceId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val clips = authRepository.authState.flatMapLatest { state ->
        val session = (state as? AuthState.SignedIn)?.session
        if (session != null) {
            clipRepository.getClipsForWorkspace(session.workspaceId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val recentMessages = allStreams
        .map { list -> list.firstOrNull { it.isActive } ?: list.firstOrNull() }
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
            val session = (authRepository.authState.value as? AuthState.SignedIn)?.session
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
    onNavigateToThumbnailStudio: () -> Unit = {},
    onNavigateToStreams: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val activeStreams by viewModel.activeStreams.collectAsState()
    val allStreams by viewModel.allStreams.collectAsState()
    val messages by viewModel.recentMessages.collectAsState()
    val authState by viewModel.authState.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val context = LocalContext.current
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

    val liveStreams = remember(realAllStreams, realActiveStreams, ytAccount) {
        if (ytAccount == null) {
            emptyList()
        } else {
            (realActiveStreams + realAllStreams)
                .distinctBy { it.id }
                .filter { it.status == "live" }
        }
    }
    val isUserLive = liveStreams.isNotEmpty() || LiveChatCaptureService.isServiceRunning
    val pastStreams = remember(realAllStreams) {
        realAllStreams.filter { it.status != "live" }
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

    val configuration = LocalConfiguration.current
    val screenWidthDp = configuration.screenWidthDp
    val isSmallScreen = screenWidthDp < 360
    val isTablet = screenWidthDp >= 600

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = if (isSmallScreen) 12.dp else 18.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Official Dieme Logo Mark + Brand Wordmark
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Image(
                        painter = painterResource(id = com.digicast.app.R.drawable.logo_round),
                        contentDescription = "Dieme Logo",
                        modifier = Modifier.size(28.dp)
                    )
                    Text(
                        text = "Dieme",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        letterSpacing = (-0.5).sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Status Pill (Only shown when LIVE, IDLE pill is completely removed)
                    if (isUserLive) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(9999.dp))
                                .background(DigicastLiveRed.copy(alpha = 0.15f))
                                .border(
                                    1.dp,
                                    DigicastLiveRed.copy(alpha = 0.5f),
                                    RoundedCornerShape(9999.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(DigicastLiveRed)
                                )
                                Text(
                                    text = "LIVE",
                                    color = DigicastLiveRed,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 0.5.sp
                                )
                            }
                        }
                    }

                    // Profile Avatar in Top-Right
                    ProfileAvatarButton(
                        displayName = signedInSession?.displayName,
                        photoUrl = signedInSession?.photoUrl,
                        onClick = onNavigateToSettings
                    )
                }
            }
        }
    ) { padding ->
        val onConnectYouTube = {
            val session = signedInSession
            WebNavigationUtil.openWebConnectYouTube(
                context = context,
                workspaceId = session?.workspaceId ?: "",
                token = session?.token ?: ""
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.TopCenter
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 760.dp),
                contentPadding = PaddingValues(if (isSmallScreen) 12.dp else 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ── 1. Interactive Channel Performance Graph ───────────────────────
                item {
                    ChannelPerformanceGraph(
                        streams = if (ytAccount != null) realAllStreams else emptyList(),
                        totalMessagesCount = if (ytAccount != null) messages.size else 0,
                        youtubeAccount = ytAccount,
                        onConnectYouTube = onConnectYouTube,
                        onViewDetailsClick = onNavigateToStreams
                    )
                }

                // ── 2. AI Studio Bento Row (Thumbnail Studio & Voice Studio) ────────
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(if (isSmallScreen) 8.dp else 12.dp)
                    ) {
                        // Left Bento: Thumbnail Studio
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(20.dp))
                                .background(AppleDarkEdgeCardBrush)
                                .border(1.dp, AppleSpecularBorder, RoundedCornerShape(20.dp))
                                .clickable(onClick = onNavigateToThumbnailStudio)
                                .padding(if (isSmallScreen) 10.dp else 14.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(if (isSmallScreen) 28.dp else 32.dp)
                                            .clip(CircleShape)
                                            .background(DigicastElectricCyan.copy(alpha = 0.15f))
                                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.35f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AutoAwesome,
                                            contentDescription = null,
                                            tint = DigicastElectricCyan,
                                            modifier = Modifier.size(if (isSmallScreen) 14.dp else 16.dp)
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(DigicastElectricCyan.copy(alpha = 0.2f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("Cloud AI", color = DigicastElectricCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = "Thumbnail Studio",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "AI Inpaint & 1080p Export",
                                    color = DigicastSlate,
                                    fontSize = 10.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Right Bento: Voice Studio
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(20.dp))
                            .clickable {
                                Toast.makeText(context, "Voice Studio (.dcast) launching soon!", Toast.LENGTH_SHORT).show()
                            }
                            .padding(if (isSmallScreen) 10.dp else 14.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(if (isSmallScreen) 28.dp else 32.dp)
                                        .clip(CircleShape)
                                        .background(DigicastElectricViolet.copy(alpha = 0.15f))
                                        .border(1.dp, DigicastElectricViolet.copy(alpha = 0.35f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.RecordVoiceOver,
                                        contentDescription = null,
                                        tint = DigicastElectricViolet,
                                        modifier = Modifier.size(if (isSmallScreen) 14.dp else 16.dp)
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(DigicastElectricViolet.copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("VoiceStudio", color = DigicastElectricViolet, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = "Voice Studio",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Zero-Shot Voice Clones",
                                    color = DigicastSlate,
                                    fontSize = 10.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }

            // ── 3. Active Live Broadcast Cards (Supports multiple live streams; shows nothing if no active stream) ──
            if (liveStreams.isNotEmpty()) {
                items(liveStreams, key = { "live_stream_${it.id}" }) { activeStream ->
                    val thumbUrl = activeStream.thumbnailUrl
                        ?: if (activeStream.id.isNotBlank()) "https://i.ytimg.com/vi/${activeStream.id}/hqdefault.jpg" else null

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .clickable { onNavigateToStreamDetail(activeStream.id) }
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            // Header: LIVE NOW badge + Watching counter
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = Modifier
                                        .background(DigicastLiveRed, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Box(modifier = Modifier.size(6.dp).background(DigicastWhite, CircleShape))
                                    Text(
                                        text = "LIVE NOW",
                                        color = DigicastWhite,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 0.5.sp
                                    )
                                }

                                Text(
                                    text = if (activeStream.concurrentViewers > 0)
                                        "${MetricFormatter.formatCount(activeStream.concurrentViewers)} watching"
                                    else "Active Broadcast",
                                    color = DigicastLiveRed,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Thumbnail + Title Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(76.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(DigicastSurfaceElevated)
                                ) {
                                    if (!thumbUrl.isNullOrEmpty()) {
                                        AsyncImage(
                                            model = thumbUrl,
                                            contentDescription = activeStream.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Icon(
                                            imageVector = Icons.Default.LiveTv,
                                            contentDescription = null,
                                            tint = DigicastSlate,
                                            modifier = Modifier.size(32.dp).align(Alignment.Center)
                                        )
                                    }
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = MetricFormatter.cleanText(activeStream.title),
                                        color = DigicastWhite,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Text(
                                        text = "Tap to open live stream controls & chat triggers",
                                        color = DigicastElectricCyan,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
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

    if (show24hGate && signedInSession != null) {
        Access24hGateDialog(
            session = signedInSession,
            authRepository = viewModel.authRepository,
            onDismiss = { show24hGate = false },
            onUnlocked = {
                show24hGate = false
                viewModel.syncData()
            }
        )
    }
}
