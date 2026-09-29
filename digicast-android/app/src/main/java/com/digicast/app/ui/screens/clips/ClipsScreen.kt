package com.digicast.app.ui.screens.clips

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
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
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.ui.components.StatusBadge
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastWhite
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClipsViewModel @Inject constructor(
    clipRepository: ClipRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    val isSyncing = authRepository.isSyncing
    val clips = clipRepository.getAllClips()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        sync()
    }

    fun sync() {
        viewModelScope.launch {
            authRepository.syncWorkspaceData()
        }
    }
}

@Composable
fun ClipsScreen(
    onNavigateToClipGenerate: (String) -> Unit,
    viewModel: ClipsViewModel = hiltViewModel()
) {
    val clips by viewModel.clips.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.sync()
    }

    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Clips", color = DigicastWhite, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = DigicastAccentBlue,
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(onClick = { viewModel.sync() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = DigicastSlate)
                        }
                    }
                }
            }
            if (clips.isEmpty()) {
                item { Text("No clip markers found yet. Captured !clip markers from chat and cloud appear here automatically.", color = DigicastSlate) }
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
