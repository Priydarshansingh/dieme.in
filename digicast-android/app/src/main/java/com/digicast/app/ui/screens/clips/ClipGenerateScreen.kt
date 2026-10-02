package com.digicast.app.ui.screens.clips

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClipGenerateViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val clipRepository: ClipRepository
) : ViewModel() {
    val clipId: String = checkNotNull(savedStateHandle["clipId"])
    private val _clip = MutableStateFlow<ClipMarkerEntity?>(null)
    val clip: StateFlow<ClipMarkerEntity?> = _clip.asStateFlow()

    init {
        viewModelScope.launch {
            _clip.value = clipRepository.getClipById(clipId)
        }
    }

    suspend fun markGenerating(id: String) = clipRepository.updateStatus(id, "GENERATING")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClipGenerateScreen(
    clipId: String,
    onNavigateBack: () -> Unit,
    viewModel: ClipGenerateViewModel = hiltViewModel()
) {
    val clip by viewModel.clip.collectAsState()
    val scope = rememberCoroutineScope()

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onNavigateBack, modifier = Modifier.size(24.dp).padding(end = 8.dp)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = DigicastSlate)
                    }
                    Text("Clip Details", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                }
                Button(
                    onClick = { scope.launch { viewModel.markGenerating(clipId); onNavigateBack() } },
                    colors = ButtonDefaults.buttonColors(containerColor = DigicastSurfaceElevated),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Export", fontSize = 12.sp, color = DigicastWhite, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            val title = clip?.label?.takeIf { it.isNotBlank() } ?: "Clip Marker #$clipId"
            Text(title, color = DigicastWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)

            // Info Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Marker Status", color = DigicastSlate, fontSize = 13.sp)
                        Text(
                            text = clip?.status?.uppercase() ?: "PENDING",
                            color = if (clip?.status == "GENERATED") DigicastEmerald else DigicastAccentBlue,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Author / Creator", color = DigicastSlate, fontSize = 13.sp)
                        Text(clip?.authorName ?: "Editor", color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Stream ID", color = DigicastSlate, fontSize = 13.sp)
                        Text(clip?.streamId ?: "Live Stream", color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Timestamp Offset", color = DigicastSlate, fontSize = 13.sp)
                        val ms = clip?.timestampMs ?: 0L
                        val seconds = (ms / 1000) % 60
                        val minutes = (ms / (1000 * 60))
                        Text(String.format("%02d:%02d", minutes, seconds), color = DigicastWhite, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            // Local file status
            val filePath = clip?.localFilePath
            if (!filePath.isNullOrEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Exported Video File", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(filePath, color = DigicastWhite, fontSize = 13.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { scope.launch { viewModel.markGenerating(clipId); onNavigateBack() } },
                colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Process & Render Clip", color = DigicastDeepNavy, fontWeight = FontWeight.Bold)
            }
        }
    }
}
