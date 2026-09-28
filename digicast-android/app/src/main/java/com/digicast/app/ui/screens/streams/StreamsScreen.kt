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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.StatusBadge
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastWhite
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StreamsViewModel @Inject constructor(
    streamRepository: StreamRepository
) : ViewModel() {
    val streams = streamRepository.getActiveStreams()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}

@Composable
fun StreamsScreen(
    onNavigateToDetail: (String) -> Unit,
    viewModel: StreamsViewModel = hiltViewModel()
) {
    val streams by viewModel.streams.collectAsState()
    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Text("Streams", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
            if (streams.isEmpty()) {
                item { Text("No captured streams yet.", color = DigicastSlate) }
            }
            items(streams, key = { it.id }) { stream ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                    modifier = Modifier.fillMaxWidth().clickable { onNavigateToDetail(stream.id) }
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        StatusBadge(status = stream.status)
                        Text(stream.title, color = DigicastWhite, fontWeight = FontWeight.SemiBold)
                        Text(stream.channelTitle, color = DigicastSlate, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
