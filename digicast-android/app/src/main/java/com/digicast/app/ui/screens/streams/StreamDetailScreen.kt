package com.digicast.app.ui.screens.streams

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.FastForward
import androidx.compose.material.icons.filled.FastRewind
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SentimentSatisfied
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StopCircle
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.service.LiveChatCaptureService
import com.digicast.app.ui.screens.clips.ClipType
import com.digicast.app.ui.screens.clips.ClipVideoPlayer
import com.digicast.app.ui.screens.clips.YouTubeStreamPreview
import com.digicast.app.ui.screens.clips.resolveYouTubeVideoId
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleDarkEdgeSubtleBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.File
import javax.inject.Inject

@HiltViewModel
class StreamDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val streamRepository: StreamRepository,
    private val chatRepository: ChatRepository,
    private val clipRepository: ClipRepository,
    private val dao: DigicastDao,
    @ApplicationContext private val context: Context,
    val authRepository: AuthRepository
) : ViewModel() {
    private val streamId: String = checkNotNull(savedStateHandle["streamId"])

    val messages = chatRepository.getRecentMessages(streamId, 200)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val clips = clipRepository.getClipsForStream(streamId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _stream = kotlinx.coroutines.flow.MutableStateFlow<StreamEntity?>(null)
    val stream: StateFlow<StreamEntity?> = _stream

    init {
        viewModelScope.launch {
            _stream.value = streamRepository.getStreamById(streamId)

            // Always purge any legacy mock messages starting with "msg_"
            withContext(Dispatchers.IO) {
                dao.clearDummyChatMessages()
            }

            // Verify if real chat messages exist for this stream
            val snapshot = withContext(Dispatchers.IO) {
                dao.getRecentChatMessagesSnapshot(streamId, 50)
            }
            if (snapshot.size < 50 || snapshot.any { it.id.startsWith("msg_") || it.authorDisplayName.contains("FreeFire_Fan") }) {
                loadRealChat(streamId)
            }
        }
    }

    private suspend fun loadRealChat(sId: String) = withContext(Dispatchers.IO) {
        try {
            val assetName = if (context.assets.list("")?.contains("real_chat_${sId}.json") == true) {
                "real_chat_${sId}.json"
            } else if (sId == "g_4KXSxPzGo") {
                "real_chat_g_4KXSxPzGo.json"
            } else {
                null
            } ?: return@withContext

            dao.clearChatMessagesForStream(sId)
            val jsonStr = context.assets.open(assetName).bufferedReader().use { it.readText() }
            val arr = JSONArray(jsonStr)
            val list = mutableListOf<ChatMessageEntity>()

            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "yt_real_${sId}_$i")
                val author = obj.optString("authorDisplayName", "Viewer")
                val text = obj.optString("messageText", "")
                val offsetSec = obj.optLong("offsetSec", 0L)
                val videoOffsetMsec = obj.optLong("videoOffsetTimeMsec", offsetSec * 1000L)
                val isSuper = obj.optBoolean("isSuperChat", false)
                val amount = obj.optLong("superChatAmountMicros", 0L)

                list.add(
                    ChatMessageEntity(
                        id = id,
                        streamId = sId,
                        authorChannelId = obj.optString("authorChannelId", "UC_user_$i"),
                        authorDisplayName = author,
                        messageText = text,
                        publishedAtMs = if (videoOffsetMsec > 0L) videoOffsetMsec else (offsetSec * 1000L),
                        isSuperChat = isSuper,
                        superChatAmountMicros = amount
                    )
                )
            }

            if (list.isNotEmpty()) {
                dao.insertChatMessages(list)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun createClip(marker: ClipMarkerEntity, onCreated: () -> Unit) {
        viewModelScope.launch {
            clipRepository.createClipMarker(marker)
            authRepository.syncWorkspaceData()
            withContext(Dispatchers.Main) {
                onCreated()
            }
        }
    }
}

@Composable
fun StreamDetailScreen(
    onNavigateBack: () -> Unit,
    onNavigateToClipGenerate: (String) -> Unit,
    viewModel: StreamDetailViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val stream by viewModel.stream.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val clips by viewModel.clips.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Live Chat, 1 = Clips
    var showAddMomentDialog by remember { mutableStateOf(false) }
    var targetMomentSec by remember { mutableLongStateOf(0L) }
    var currentPlaybackSec by remember { mutableFloatStateOf(0f) }
    var playerDurationSec by remember { mutableFloatStateOf(0f) }
    var seekController by remember { mutableStateOf<((Long) -> Unit)?>(null) }

    // Track live capture state reactively
    var isCapturing by remember { mutableStateOf(LiveChatCaptureService.isServiceRunning) }
    val authState by viewModel.authRepository.authState.collectAsState()
    val session = (authState as? AuthState.SignedIn)?.session

    val videoId = resolveYouTubeVideoId(stream, null)

    val currentStream = stream
    val streamStart = currentStream?.startedAtMs ?: 0L
    val streamEnd = currentStream?.endedAtMs
    val now = System.currentTimeMillis()
    val totalDurationSec = remember(playerDurationSec) {
        if (playerDurationSec > 10f) {
            playerDurationSec.toLong()
        } else {
            3600L // 1 hour default until player delivers metadata
        }
    }

    val activeOffsetSec = currentPlaybackSec.toLong().coerceIn(0L, totalDurationSec)

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .statusBarsPadding()
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
                        text = MetricFormatter.cleanText(stream?.channelTitle).ifBlank { "Stream Console" },
                        color = DigicastWhite,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // LIVE badge
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

                    // Start / Stop Live Chat Capture button
                    val canCapture = !stream?.liveChatId.isNullOrEmpty() && session != null && session.uid != "demo-uid"
                    if (stream?.status == "live" || isCapturing) {
                        Button(
                            onClick = {
                                val currentStream = stream
                                val chatId = currentStream?.liveChatId
                                if (isCapturing) {
                                    LiveChatCaptureService.stop(context)
                                    isCapturing = false
                                } else if (currentStream != null && !chatId.isNullOrEmpty() && session != null) {
                                    LiveChatCaptureService.start(
                                        context = context,
                                        streamId = currentStream.id,
                                        videoId = currentStream.id,
                                        liveChatId = chatId,
                                        streamTitle = currentStream.title,
                                        channelId = currentStream.channelId,
                                        channelTitle = currentStream.channelTitle,
                                        workspaceId = session.workspaceId,
                                        authToken = session.token
                                    )
                                    isCapturing = true
                                }
                            },
                            enabled = canCapture || isCapturing,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isCapturing) DigicastLiveRed.copy(alpha = 0.2f)
                                else DigicastEmerald.copy(alpha = 0.2f)
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Icon(
                                imageVector = if (isCapturing) Icons.Default.StopCircle else Icons.Default.FiberManualRecord,
                                contentDescription = null,
                                tint = if (isCapturing) DigicastLiveRed else DigicastEmerald,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isCapturing) "Stop" else "Capture",
                                fontSize = 11.sp,
                                color = if (isCapturing) DigicastLiveRed else DigicastEmerald,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // ── 1. Hero 16:9 Playable ACTUAL LIVESTREAM PLAYER ─────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                // Actual livestream player with real-time playback sync
                YouTubeStreamPreview(
                    videoId = videoId,
                    startSeconds = 0L,
                    endSeconds = null,
                    onTimeUpdate = { cur, dur ->
                        if (cur >= 0f) currentPlaybackSec = cur
                        if (dur > 0f) playerDurationSec = dur
                    },
                    onPlayerReady = { seekAction ->
                        seekController = seekAction
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }

            // ── 2. Streamer Info & Quick Actions ─────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastSurface)
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = MetricFormatter.cleanText(stream?.title).ifBlank { "FREE FIRE INDIA LIVE | Playing With Friends" },
                        color = DigicastWhite,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = if (stream?.status == "live") "${MetricFormatter.formatCount(stream?.concurrentViewers ?: 502L)} Viewers"
                            else "${MetricFormatter.formatCount(stream?.viewCount ?: 1420L)} Views",
                            color = if (stream?.status == "live") DigicastLiveRed else DigicastWhite,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Box(modifier = Modifier.size(3.dp).clip(CircleShape).background(DigicastSlate))
                        Text(
                            text = "${MetricFormatter.formatCount(stream?.likeCount ?: 303L)} Likes",
                            color = DigicastSlate,
                            fontSize = 11.sp
                        )
                        Box(modifier = Modifier.size(3.dp).clip(CircleShape).background(DigicastSlate))
                        Text(
                            text = "#FreeFire",
                            color = DigicastAccentBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Add Moment Quick Trigger (Apple Dark-Edge Capsule Pill)
                Button(
                    onClick = {
                        targetMomentSec = activeOffsetSec
                        showAddMomentDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    shape = RoundedCornerShape(9999.dp),
                    border = BorderStroke(1.dp, AppleSpecularBorder),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                    modifier = Modifier
                        .height(36.dp)
                        .clip(RoundedCornerShape(9999.dp))
                        .background(AppleDarkEdgePillBrush)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Moment", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            // ── 3. Interactive Video Timeline & Moments Control ─────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Timeline Header Row
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
                            Icons.Default.Timeline,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            "Stream Timeline",
                            color = DigicastWhite,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(DigicastSurfaceElevated)
                                .padding(horizontal = 6.dp, vertical = 1.dp)
                        ) {
                            Text(
                                "${clips.size} Moments",
                                color = DigicastSlate,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Text(
                        "${MetricFormatter.formatSeconds(activeOffsetSec)} / ${MetricFormatter.formatSeconds(totalDurationSec)}",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Interactive Scrubber & Timeline Track
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 2.dp)
                ) {
                    val trackWidth = maxWidth

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        // Slider Track with Interactive Moment Pins
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(38.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            // Draggable real-time scrubber
                            Slider(
                                value = currentPlaybackSec.coerceIn(0f, totalDurationSec.toFloat()),
                                onValueChange = { newSec ->
                                    currentPlaybackSec = newSec
                                },
                                onValueChangeFinished = {
                                    seekController?.invoke(currentPlaybackSec.toLong())
                                },
                                valueRange = 0f..totalDurationSec.toFloat().coerceAtLeast(60f),
                                colors = SliderDefaults.colors(
                                    thumbColor = Color.White,
                                    activeTrackColor = Color(0xFF134E5E),
                                    inactiveTrackColor = Color(0xFF0B3037)
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .zIndex(1f)
                            )

                            // Moment Pins along track
                            clips.forEach { clip ->
                                val clipSec = MetricFormatter.toSeconds(clip.timestampMs, streamStart).coerceIn(0L, totalDurationSec)
                                val fraction = (clipSec.toFloat() / totalDurationSec.toFloat().coerceAtLeast(1f)).coerceIn(0.01f, 0.99f)
                                val type = ClipType.fromLabel(clip.label, clip.triggerMessageId)
                                val pinOffsetDp = ((trackWidth.value - 24f) * fraction).coerceAtLeast(0f).dp

                                Box(
                                    modifier = Modifier
                                        .offset(x = pinOffsetDp)
                                        .size(22.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF134E5E))
                                        .border(1.5.dp, Color.White, CircleShape)
                                        .zIndex(2f)
                                        .clickable {
                                            currentPlaybackSec = clipSec.toFloat()
                                            seekController?.invoke(clipSec)
                                            Toast.makeText(
                                                context,
                                                "Seeked to ${type.title} (${MetricFormatter.formatSeconds(clipSec)})",
                                                Toast.LENGTH_SHORT
                                            ).show()
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = type.icon,
                                        contentDescription = type.title,
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                        }

                        // Quick Jump Controls & Instant Moment Capture
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // -10s Jump Pill
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(9999.dp))
                                    .background(Color(0xFF0B3037))
                                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(9999.dp))
                                    .clickable {
                                        val newSec = (currentPlaybackSec.toLong() - 10L).coerceAtLeast(0L)
                                        currentPlaybackSec = newSec.toFloat()
                                        seekController?.invoke(newSec)
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.FastRewind, contentDescription = "-10s", tint = Color.White, modifier = Modifier.size(14.dp))
                                    Text("-10s", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            // +10s Jump Pill
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(9999.dp))
                                    .background(Color(0xFF0B3037))
                                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(9999.dp))
                                    .clickable {
                                        val newSec = (currentPlaybackSec.toLong() + 10L).coerceAtMost(totalDurationSec)
                                        currentPlaybackSec = newSec.toFloat()
                                        seekController?.invoke(newSec)
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.FastForward, contentDescription = "+10s", tint = Color.White, modifier = Modifier.size(14.dp))
                                    Text("+10s", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            // Primary Instant Moment Trigger (Deep Teal Silk)
                            Button(
                                onClick = {
                                    targetMomentSec = activeOffsetSec
                                    showAddMomentDialog = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                shape = RoundedCornerShape(9999.dp),
                                border = BorderStroke(1.dp, Color(0x44FFFFFF)),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(34.dp)
                            ) {
                                Icon(Icons.Default.Bookmark, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "Clip at ${MetricFormatter.formatSeconds(activeOffsetSec)}",
                                    fontSize = 11.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Horizontal Moments Chips Row
                if (clips.isNotEmpty()) {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(top = 2.dp, bottom = 2.dp)
                    ) {
                        items(clips, key = { it.id }) { clip ->
                            val type = ClipType.fromLabel(clip.label, clip.triggerMessageId)
                            val clipSec = MetricFormatter.toSeconds(clip.timestampMs, streamStart)
                            val timeStr = MetricFormatter.formatSeconds(clipSec)

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = DigicastSurfaceElevated,
                                border = BorderStroke(1.dp, type.color.copy(alpha = 0.6f)),
                                modifier = Modifier.clickable {
                                    currentPlaybackSec = clipSec.toFloat()
                                    seekController?.invoke(clipSec)
                                    onNavigateToClipGenerate(clip.id)
                                }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(18.dp)
                                            .clip(CircleShape)
                                            .background(type.color.copy(alpha = 0.25f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(type.icon, contentDescription = null, tint = type.color, modifier = Modifier.size(11.dp))
                                    }
                                    Text(type.title, color = type.color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text(timeStr, color = DigicastWhite, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }

            // ── 3. Kick-Style Segmented Navigation Tabs ───────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Tab 0: Live Chat
                val isChat = selectedTab == 0
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isChat) DigicastSurfaceElevated else Color.Transparent)
                        .clickable { selectedTab = 0 }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Live Chat (${messages.size})",
                        color = if (isChat) DigicastWhite else DigicastSlate,
                        fontSize = 12.sp,
                        fontWeight = if (isChat) FontWeight.Bold else FontWeight.Medium
                    )
                }

                // Tab 1: Clips
                val isClips = selectedTab == 1
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isClips) DigicastSurfaceElevated else Color.Transparent)
                        .clickable { selectedTab = 1 }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Clips (${clips.size})",
                        color = if (isClips) DigicastWhite else DigicastSlate,
                        fontSize = 12.sp,
                        fontWeight = if (isClips) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }

            // ── 4. Tab Content Area (Full Vertical Esports Layout) ─────────────
            if (selectedTab == 0) {
                // Live Chat Replay Stream
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(messages, key = { it.id }) { msg ->
                        val isTrigger = msg.messageText.contains("!clip", ignoreCase = true)
                        val isHost = msg.authorDisplayName.contains("HellxShakti", ignoreCase = true) || msg.authorDisplayName.contains("Host", ignoreCase = true) || msg.authorDisplayName.equals(stream?.channelTitle, ignoreCase = true)
                        val isMod = msg.authorDisplayName.contains("nightbot", ignoreCase = true) || msg.authorDisplayName.contains("Mod", ignoreCase = true)
                        val isSuper = msg.isSuperChat || msg.superChatAmountMicros > 0

                        val cardBg = when {
                            isSuper -> Color(0xFF1E1E14)
                            isTrigger -> DigicastSunsetCoral.copy(alpha = 0.15f)
                            else -> DigicastSurface
                        }

                        val borderStroke = when {
                            isSuper -> BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.6f))
                            isTrigger -> BorderStroke(1.5.dp, DigicastSunsetCoral.copy(alpha = 0.8f))
                            else -> BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.3f))
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = cardBg,
                            border = borderStroke,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
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
                                        val avatarColor = when {
                                            isHost -> DigicastSunsetCoral
                                            isMod -> DigicastEmerald
                                            isSuper -> Color(0xFFF59E0B)
                                            else -> DigicastAccentBlue
                                        }
                                        Box(
                                            modifier = Modifier
                                                .size(22.dp)
                                                .clip(CircleShape)
                                                .background(avatarColor.copy(alpha = 0.25f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = msg.authorDisplayName.removePrefix("@").take(1).uppercase(),
                                                color = avatarColor,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        Text(
                                            text = msg.authorDisplayName,
                                            color = if (isHost) DigicastSunsetCoral else if (isMod) DigicastEmerald else DigicastWhite,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )

                                        if (isHost) {
                                            Box(
                                                modifier = Modifier
                                                    .background(DigicastSunsetCoral.copy(alpha = 0.25f), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                                    Icon(Icons.Default.Verified, contentDescription = null, tint = DigicastSunsetCoral, modifier = Modifier.size(10.dp))
                                                    Text("HOST", color = DigicastSunsetCoral, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                                }
                                            }
                                        } else if (isMod) {
                                            Box(
                                                modifier = Modifier
                                                    .background(DigicastEmerald.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                                    Icon(Icons.Default.Shield, contentDescription = null, tint = DigicastEmerald, modifier = Modifier.size(10.dp))
                                                    Text(if (msg.authorDisplayName.contains("nightbot", ignoreCase = true)) "BOT" else "MOD", color = DigicastEmerald, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                                }
                                            }
                                        } else if (isTrigger) {
                                            Box(
                                                modifier = Modifier
                                                    .background(DigicastSunsetCoral, RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                                    Icon(Icons.Default.Bolt, contentDescription = null, tint = DigicastWhite, modifier = Modifier.size(10.dp))
                                                    Text("CLIP TRIGGER", color = DigicastWhite, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                                }
                                            }
                                        }
                                    }

                                    val offsetSec = (msg.publishedAtMs / 1000L) % 3600
                                    val timeStr = String.format("%02d:%02d", offsetSec / 60, offsetSec % 60)
                                    Text(
                                        text = timeStr,
                                        color = DigicastSlate,
                                        fontSize = 10.sp
                                    )
                                }

                                Text(
                                    text = com.digicast.app.ui.util.EmojiParser.parse(msg.messageText),
                                    color = DigicastWhite,
                                    fontSize = 13.sp,
                                    lineHeight = 17.sp
                                )
                            }
                        }
                    }
                }
            } else {
                // Clips captured for this stream
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (clips.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DigicastCardSurface)
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "No clips created for this stream yet. Tap '+ Add Moment' on the timeline above to mark highlights.",
                                    color = DigicastSlate,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }

                    items(clips, key = { it.id }) { clip ->
                        val type = ClipType.fromLabel(clip.label, clip.triggerMessageId)
                        val clipSec = MetricFormatter.toSeconds(clip.timestampMs, streamStart)
                        val timeStr = MetricFormatter.formatSeconds(clipSec)

                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                            border = BorderStroke(1.dp, AppleSpecularBorder),
                            shape = RoundedCornerShape(22.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(22.dp))
                                .background(AppleDarkEdgeCardBrush)
                                .clickable { onNavigateToClipGenerate(clip.id) }
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
                                            .size(38.dp)
                                            .clip(CircleShape)
                                            .background(type.color.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(type.icon, contentDescription = null, tint = type.color, modifier = Modifier.size(18.dp))
                                    }
                                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(type.color.copy(alpha = 0.25f))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(type.title, color = type.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Text(timeStr, color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                        }
                                        Text(clip.label, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1)
                                        Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 11.sp)
                                    }
                                }

                                Button(
                                    onClick = { onNavigateToClipGenerate(clip.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                    border = BorderStroke(1.dp, Color(0x55FFFFFF)),
                                    shape = RoundedCornerShape(9999.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text("Open & Render", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showAddMomentDialog) {
            AddClipMomentDialog(
                initialOffsetSec = targetMomentSec,
                totalDurationSec = totalDurationSec,
                onDismiss = { showAddMomentDialog = false },
                onConfirm = { type, sec, desc ->
                    showAddMomentDialog = false
                    val s = stream
                    val targetStreamId = s?.id ?: videoId
                    val newId = "CLP-${System.currentTimeMillis().toString().takeLast(6).uppercase()}"
                    val cleanTitle = if (desc.isNotBlank()) desc.trim() else "Moment at ${MetricFormatter.formatSeconds(sec)}"
                    val formattedLabel = "[${type.title}] $cleanTitle"

                    val newMarker = ClipMarkerEntity(
                        id = newId,
                        streamId = targetStreamId,
                        authorName = session?.displayName ?: s?.channelTitle ?: "Creator",
                        authorId = session?.uid ?: "creator",
                        triggerMessageId = "app_clip_${type.id}_${System.currentTimeMillis()}",
                        timestampMs = sec * 1000L,
                        label = formattedLabel,
                        status = "PENDING",
                        localFilePath = null,
                        telegramMessageUrl = null
                    )

                    viewModel.createClip(newMarker) {
                        Toast.makeText(context, "Moment saved at ${MetricFormatter.formatSeconds(sec)}. Opening console...", Toast.LENGTH_SHORT).show()
                        onNavigateToClipGenerate(newId)
                    }
                }
            )
        }
    }
}

@Composable
fun AddClipMomentDialog(
    initialOffsetSec: Long,
    totalDurationSec: Long,
    onDismiss: () -> Unit,
    onConfirm: (ClipType, Long, String) -> Unit
) {
    var selectedType by remember { mutableStateOf(ClipType.HIGHLIGHT) }
    var offsetSec by remember(initialOffsetSec) { mutableLongStateOf(initialOffsetSec.coerceIn(0L, totalDurationSec)) }
    var title by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DigicastNavy,
        shape = RoundedCornerShape(16.dp),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Bookmark, contentDescription = null, tint = DigicastSunsetCoral, modifier = Modifier.size(20.dp))
                    Text("Add Clip Moment", color = DigicastWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = DigicastSlate)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. Timestamp Scrubber
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Timeline Offset", color = DigicastSlate, fontSize = 12.sp)
                        Text(
                            MetricFormatter.formatSeconds(offsetSec),
                            color = selectedType.color,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    Slider(
                        value = offsetSec.toFloat(),
                        onValueChange = { offsetSec = it.toLong() },
                        valueRange = 0f..totalDurationSec.toFloat().coerceAtLeast(60f),
                        colors = SliderDefaults.colors(
                            thumbColor = selectedType.color,
                            activeTrackColor = selectedType.color,
                            inactiveTrackColor = DigicastBorder
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Step buttons (-30s, -10s, +10s, +30s)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(-30L, -10L, 10L, 30L).forEach { delta ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(DigicastSurfaceElevated)
                                    .clickable {
                                        offsetSec = (offsetSec + delta).coerceIn(0L, totalDurationSec)
                                    }
                                    .padding(vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    if (delta > 0) "+${delta}s" else "${delta}s",
                                    color = DigicastWhite,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                // 2. Clip Type Selector
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Clip Type", color = DigicastSlate, fontSize = 12.sp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        ClipType.entries.take(3).forEach { type ->
                            val isSelected = selectedType == type
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) type.color.copy(alpha = 0.25f) else DigicastSurfaceElevated)
                                    .border(if (isSelected) 1.5.dp else 1.dp, if (isSelected) type.color else DigicastBorder.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .clickable { selectedType = type }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(type.icon, contentDescription = null, tint = if (isSelected) type.color else DigicastSlate, modifier = Modifier.size(16.dp))
                                    Text(type.title, color = if (isSelected) DigicastWhite else DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        ClipType.entries.drop(3).forEach { type ->
                            val isSelected = selectedType == type
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) type.color.copy(alpha = 0.25f) else DigicastSurfaceElevated)
                                    .border(if (isSelected) 1.5.dp else 1.dp, if (isSelected) type.color else DigicastBorder.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .clickable { selectedType = type }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(type.icon, contentDescription = null, tint = if (isSelected) type.color else DigicastSlate, modifier = Modifier.size(16.dp))
                                    Text(type.title, color = if (isSelected) DigicastWhite else DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // 3. Moment Title / Note
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Description (Optional)", color = DigicastSlate, fontSize = 12.sp)
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        placeholder = { Text("e.g. 1v4 Clutch at final circle", color = DigicastSlate.copy(alpha = 0.6f), fontSize = 12.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = DigicastWhite,
                            unfocusedTextColor = DigicastWhite,
                            focusedBorderColor = selectedType.color,
                            unfocusedBorderColor = DigicastBorder,
                            focusedContainerColor = DigicastSurface,
                            unfocusedContainerColor = DigicastSurface
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(selectedType, offsetSec, title) },
                colors = ButtonDefaults.buttonColors(containerColor = selectedType.color),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Icon(Icons.Default.ContentCut, contentDescription = null, tint = DigicastDeepNavy, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save Moment & Open Console", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    )
}
