package com.digicast.app.ui.screens.streams

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.StatusBadge
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
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
            TopAppBar(
                title = { Text(stream?.title ?: "Stream", color = DigicastWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = DigicastWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DigicastNavy)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                StatusBadge(status = stream?.status ?: "unknown")
                Text("${clips.size} clip markers · ${messages.size} recent messages", color = DigicastSlate, fontSize = 13.sp)
            }
            item { Text("Clip markers", color = DigicastWhite, fontWeight = FontWeight.SemiBold) }
            items(clips, key = { it.id }) { clip ->
                Text(
                    text = "${clip.label} — ${clip.authorName}",
                    color = DigicastWhite,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToClipGenerate(clip.id) }
                        .padding(vertical = 6.dp)
                )
            }
            item { Text("Chat (local only)", color = DigicastWhite, fontWeight = FontWeight.SemiBold) }
            items(messages, key = { it.id }) { msg ->
                Column(Modifier.padding(vertical = 4.dp)) {
                    Text(msg.authorDisplayName, color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text(msg.messageText, color = DigicastSlate, fontSize = 13.sp)
                }
            }
        }
    }
}
