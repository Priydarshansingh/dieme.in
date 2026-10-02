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
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
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
                    Text("Clip Studio", color = DigicastSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
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
            Text("Gaming Marathon - Part 2", color = DigicastWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)

            // Video Player Mockup
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(DigicastSurfaceElevated, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text("VIDEO PREVIEW", color = DigicastSlate, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Timeline scrubber
            Column {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("00:32", color = DigicastWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text("01:12", color = DigicastSlate, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { 0.3f },
                    modifier = Modifier.fillMaxWidth().height(4.dp),
                    color = DigicastLiveRed,
                    trackColor = DigicastSurfaceElevated
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text("AI DETECTED MOMENTS", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("🔥", fontSize = 24.sp)
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("98 Viral Score", color = DigicastAccentBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("INSANE TEAM FIGHT", color = DigicastWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("⚡", fontSize = 24.sp)
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("91 Viral Score", color = DigicastAccentBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("CHAT GOES CRAZY", color = DigicastWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Text("AI TOOLS", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { }, colors = ButtonDefaults.buttonColors(containerColor = DigicastSurface), modifier = Modifier.weight(1f), shape = RoundedCornerShape(8.dp)) { Text("Auto Crop", color = DigicastWhite) }
                Button(onClick = { }, colors = ButtonDefaults.buttonColors(containerColor = DigicastSurface), modifier = Modifier.weight(1f), shape = RoundedCornerShape(8.dp)) { Text("Captions", color = DigicastWhite) }
            }
        }
    }
}
