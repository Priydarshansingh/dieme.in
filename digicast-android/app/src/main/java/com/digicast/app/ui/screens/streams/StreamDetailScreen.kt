package com.digicast.app.ui.screens.streams

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.utils.MetricFormatter
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.MetricCard
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastWhite
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StreamDetailScreen(
    onNavigateBack: () -> Unit,
    onNavigateToClipGenerate: (String) -> Unit,
    viewModel: StreamDetailViewModel = hiltViewModel()
) {
    val stream by viewModel.stream.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val clips by viewModel.clips.collectAsState()

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onNavigateBack, modifier = Modifier.size(24.dp).padding(end = 8.dp)) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = DigicastSlate)
                        }
                        Text("Stream Detail", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                    }
                    if (stream?.status == "live") {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(DigicastLiveRed))
                            Text("LIVE", color = DigicastLiveRed, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }
                }

                val currentStream = stream
                val thumbUrl = currentStream?.thumbnailUrl
                    ?: if (!currentStream?.id.isNullOrBlank()) "https://i.ytimg.com/vi/${currentStream?.id}/hqdefault.jpg" else null

                if (!thumbUrl.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(160.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(DigicastSurfaceElevated)
                    ) {
                        AsyncImage(
                            model = thumbUrl,
                            contentDescription = currentStream?.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(stream?.title ?: "Untitled Stream", color = DigicastWhite, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    val s = stream
                    if (s?.status == "live") {
                        Text(
                            text = if (s.concurrentViewers > 0) "${MetricFormatter.formatCount(s.concurrentViewers)} Live Viewers" else "Live Broadcast",
                            color = DigicastLiveRed,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    } else {
                        Text(
                            text = "${MetricFormatter.formatCount(s?.viewCount ?: 0L)} Views",
                            color = DigicastWhite,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Text(
                        text = "${MetricFormatter.formatCount(s?.likeCount ?: 0L)} Likes",
                        color = DigicastSlate,
                        fontSize = 13.sp
                    )
                    Text(
                        text = MetricFormatter.formatDuration(s?.startedAtMs, s?.endedAtMs),
                        color = DigicastAccentBlue,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    Text("Overview", color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Chat (${messages.size})", color = DigicastSlate, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text("Clips (${clips.size})", color = DigicastSlate, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "STREAM METRICS",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    MetricCard("Total Views", MetricFormatter.formatCount(stream?.viewCount ?: 0L), modifier = Modifier.weight(1f))
                    MetricCard("Total Likes", MetricFormatter.formatCount(stream?.likeCount ?: 0L), modifier = Modifier.weight(1f))
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    MetricCard("Stream Duration", MetricFormatter.formatDuration(stream?.startedAtMs, stream?.endedAtMs), modifier = Modifier.weight(1f))
                    MetricCard("Comments", MetricFormatter.formatCount(stream?.commentCount ?: 0L), modifier = Modifier.weight(1f))
                }
            }

            item {
                Text(
                    text = "ACTIVITY & CHAT INTELLIGENCE",
                    color = DigicastSlate,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Captured Messages", color = DigicastSlate, fontSize = 13.sp)
                            Text("${messages.size}", color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                        val activeChatters = messages.map { it.authorDisplayName }.toSet().size
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Active Chatters", color = DigicastSlate, fontSize = 13.sp)
                            Text("$activeChatters", color = DigicastAccentBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Clips Created", color = DigicastSlate, fontSize = 13.sp)
                            Text("${clips.size}", color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            if (clips.isNotEmpty()) {
                item {
                    Text(
                        text = "AI FOUND ${clips.size} MOMENTS",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
                items(clips, key = { it.id }) { clip ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateToClipGenerate(clip.id) }
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(clip.label, color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text("Score 94", color = DigicastAccentBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
