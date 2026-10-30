package com.digicast.app.ui.screens.streams

import android.content.Context
import android.widget.Toast
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
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.StopCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.digicast.app.ui.screens.clips.ClipVideoPlayer
import com.digicast.app.ui.screens.clips.YouTubeStreamPreview
import com.digicast.app.ui.screens.clips.resolveYouTubeVideoId
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
            dao.clearChatMessagesForStream(sId)
            val jsonStr = context.assets.open("real_chat_g_4KXSxPzGo.json").bufferedReader().use { it.readText() }
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

    // Track live capture state reactively
    var isCapturing by remember { mutableStateOf(LiveChatCaptureService.isServiceRunning) }
    val authState by viewModel.authRepository.authState.collectAsState()
    val session = (authState as? AuthState.SignedIn)?.session

    val videoId = resolveYouTubeVideoId(stream, null)

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
                        text = stream?.channelTitle ?: "Stream Console",
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
                // Actual livestream player without any 45s clip time restriction!
                YouTubeStreamPreview(
                    videoId = videoId,
                    startSeconds = 0L,
                    endSeconds = null,
                    modifier = Modifier.fillMaxSize()
                )
            }

            // ── 2. Streamer Info & Quick "Clip This Moment" Action Bar ────────
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
                        text = stream?.title ?: "FREE FIRE INDIA LIVE 🇮🇳 | Playing With Friends",
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

                // ── ✂️ THE REAL CLIP ACTION SYSTEM ────────────────────────────
                Button(
                    onClick = {
                        val currentStream = stream
                        val newId = "CLP-${System.currentTimeMillis().toString().takeLast(6).uppercase()}"
                        val streamStart = currentStream?.startedAtMs ?: 0L
                        val now = System.currentTimeMillis()
                        val offsetMs = if (streamStart in 1L..now && (now - streamStart) < 86_400_000L) {
                            now - streamStart
                        } else {
                            2016000L // default marker offset (33:36)
                        }
                        val newMarker = ClipMarkerEntity(
                            id = newId,
                            streamId = videoId,
                            authorName = session?.displayName ?: currentStream?.channelTitle ?: "HellxShakti",
                            authorId = session?.uid ?: "creator",
                            triggerMessageId = "app_clip_${System.currentTimeMillis()}",
                            timestampMs = offsetMs,
                            label = "Clip Marker $newId",
                            status = "PENDING",
                            localFilePath = null,
                            telegramMessageUrl = null
                        )

                        viewModel.createClip(newMarker) {
                            Toast.makeText(context, "✂️ Moment clipped! Opening clip editor...", Toast.LENGTH_SHORT).show()
                            onNavigateToClipGenerate(newId)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DigicastSunsetCoral),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                    modifier = Modifier.height(38.dp)
                ) {
                    Icon(Icons.Default.ContentCut, contentDescription = null, tint = DigicastWhite, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Clip Moment ✂️", fontSize = 12.sp, color = DigicastWhite, fontWeight = FontWeight.Bold)
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
                                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                                            ) {
                                                Text("HOST 👑", color = DigicastSunsetCoral, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                            }
                                        } else if (isMod) {
                                            Box(
                                                modifier = Modifier
                                                    .background(DigicastEmerald.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                                            ) {
                                                Text(if (msg.authorDisplayName.contains("nightbot", ignoreCase = true)) "BOT 🛡️" else "MOD 🛡️", color = DigicastEmerald, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                            }
                                        } else if (isTrigger) {
                                            Box(
                                                modifier = Modifier
                                                    .background(DigicastSunsetCoral, RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                                            ) {
                                                Text("!CLIP TRIGGER ⚡", color = DigicastWhite, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
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
                                    text = msg.messageText,
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
                                Text("No clips created for this stream yet. Tap 'Clip Moment ✂️' above to mark highlights!", color = DigicastSlate, fontSize = 13.sp)
                            }
                        }
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
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(CircleShape)
                                            .background(DigicastSunsetCoral.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.ContentCut, contentDescription = null, tint = DigicastSunsetCoral, modifier = Modifier.size(18.dp))
                                    }
                                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(clip.label, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("by ${clip.authorName} • ${MetricFormatter.formatDuration(clip.timestampMs, null)}", color = DigicastSlate, fontSize = 12.sp)
                                    }
                                }

                                Button(
                                    onClick = { onNavigateToClipGenerate(clip.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                    modifier = Modifier.height(32.dp)
                                ) {
                                    Text("Open & Render", fontSize = 11.sp, color = DigicastDeepNavy, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
