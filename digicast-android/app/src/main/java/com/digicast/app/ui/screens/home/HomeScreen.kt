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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DigicastLogo(size = 38)
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = DigicastAccentBlue,
                            strokeWidth = 2.dp
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = { viewModel.syncData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = DigicastSlate)
                    }
                    if (capturing) StatusBadge(status = "LIVE")
                    else Text("IDLE", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(DigicastLiveRed, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("YT", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
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
                                    .background(DigicastAccentBlue.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("STUDIO LINKED", color = DigicastAccentBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Stream Card
            if (live != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                StatusBadge(status = live.status)
                                Text(
                                    text = if (live.isActive) "ACTIVE BROADCAST" else "LATEST STREAM",
                                    color = DigicastAccentBlue,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = live.title,
                                color = DigicastWhite,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = live.channelTitle,
                                color = DigicastSlate,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Button(
                                onClick = { onNavigateToStreamDetail(live.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Open Stream Intelligence", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else {
                item {
                    Text(
                        text = "Live Broadcast",
                        color = DigicastWhite,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    MetricCard("Messages", messages.size.toString(), modifier = Modifier.weight(1f))
                    MetricCard("Status", if (capturing) "Capturing" else "Idle", modifier = Modifier.weight(1f))
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
