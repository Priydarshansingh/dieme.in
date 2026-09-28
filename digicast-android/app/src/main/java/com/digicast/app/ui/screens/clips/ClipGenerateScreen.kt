package com.digicast.app.ui.screens.clips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClipGenerateViewModel @Inject constructor(
    private val clipRepository: ClipRepository
) : ViewModel() {
    suspend fun markGenerating(id: String) = clipRepository.updateStatus(id, "GENERATING")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClipGenerateScreen(
    clipId: String,
    onNavigateBack: () -> Unit,
    viewModel: ClipGenerateViewModel = hiltViewModel()
) {
    val scope = rememberCoroutineScope()
    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            TopAppBar(
                title = { Text("Generate clip", color = DigicastWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = DigicastWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DigicastNavy)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Clip $clipId", color = DigicastWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(
                "On-device clip generation (yt-dlp + FFmpeg) lands in a later phase. This screen queues the marker as GENERATING.",
                color = DigicastSlate
            )
            Button(
                onClick = { scope.launch { viewModel.markGenerating(clipId); onNavigateBack() } },
                colors = ButtonDefaults.buttonColors(containerColor = DigicastNavy),
                modifier = Modifier.fillMaxWidth()
            ) { Text("Queue generation") }
        }
    }
}
