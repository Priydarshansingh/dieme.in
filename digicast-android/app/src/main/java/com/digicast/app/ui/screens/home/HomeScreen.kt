package com.digicast.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.service.LiveChatCaptureService
import com.digicast.app.ui.components.DigicastLogo
import com.digicast.app.ui.components.MetricCard
import com.digicast.app.ui.components.StatusBadge
import com.digicast.app.ui.theme.DigicastDeepNavy
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
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    streamRepository: StreamRepository,
    chatRepository: ChatRepository
) : ViewModel() {
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
}

@Composable
fun HomeScreen(
    onNavigateToStreamDetail: (String) -> Unit,
    onNavigateToClips: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val streams by viewModel.activeStreams.collectAsState()
    val messages by viewModel.recentMessages.collectAsState()
    val live = streams.firstOrNull()
    val capturing = LiveChatCaptureService.isServiceRunning

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                DigicastLogo(size = 32)
                if (capturing) StatusBadge(status = "LIVE")
                else Text("IDLE", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
            item {
                Text(
                    text = if (live != null) live.title else "No live stream",
                    color = DigicastWhite,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                if (live != null) {
                    Text(live.channelTitle, color = DigicastSlate, fontSize = 13.sp)
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    MetricCard("Messages", messages.size.toString(), modifier = Modifier.weight(1f))
                    MetricCard("Status", if (capturing) "Capturing" else "Idle", modifier = Modifier.weight(1f))
                }
            }
            if (live != null) {
                item {
                    Button(
                        onClick = { onNavigateToStreamDetail(live.id) },
                        colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Open live stream") }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Recent chat", color = DigicastWhite, fontWeight = FontWeight.SemiBold)
                    Button(
                        onClick = onNavigateToClips,
                        colors = ButtonDefaults.buttonColors(containerColor = DigicastNavy)
                    ) { Text("Clips") }
                }
            }
            if (messages.isEmpty()) {
                item { Text("Chat stays on this device. Capture a live stream to see messages here.", color = DigicastSlate) }
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
        colors = CardDefaults.cardColors(containerColor = DigicastSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(msg.authorDisplayName, color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            Spacer(Modifier.height(2.dp))
            Text(msg.messageText, color = DigicastSlate, fontSize = 13.sp)
        }
    }
}
