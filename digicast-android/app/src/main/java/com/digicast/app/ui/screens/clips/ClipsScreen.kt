package com.digicast.app.ui.screens.clips

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
import com.digicast.app.data.repository.ClipRepository
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
class ClipsViewModel @Inject constructor(
    clipRepository: ClipRepository
) : ViewModel() {
    val clips = clipRepository.getAllClips()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}

@Composable
fun ClipsScreen(
    onNavigateToClipGenerate: (String) -> Unit,
    viewModel: ClipsViewModel = hiltViewModel()
) {
    val clips by viewModel.clips.collectAsState()
    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item { Text("Clips", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold) }
            if (clips.isEmpty()) {
                item { Text("!clip markers from live chat will appear here.", color = DigicastSlate) }
            }
            items(clips, key = { it.id }) { clip ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                    modifier = Modifier.fillMaxWidth().clickable { onNavigateToClipGenerate(clip.id) }
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        StatusBadge(status = clip.status)
                        Text(clip.label, color = DigicastWhite, fontWeight = FontWeight.SemiBold)
                        Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
