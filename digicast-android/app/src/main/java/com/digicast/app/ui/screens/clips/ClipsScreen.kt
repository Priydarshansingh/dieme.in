package com.digicast.app.ui.screens.clips

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.ui.components.FolderTabCard
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastChipBackground
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastMintGlow
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSearchBackground
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSpringGreen
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClipsViewModel @Inject constructor(
    clipRepository: ClipRepository,
    val authRepository: AuthRepository
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
    onNavigateToSettings: () -> Unit = {},
    viewModel: ClipsViewModel = hiltViewModel()
) {
    val clips by viewModel.clips.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val authState by viewModel.authRepository.authState.collectAsState()
    var selectedCategory by remember { mutableStateOf("All Clips") }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.sync()
    }

    val filteredClips = clips.filter { clip ->
        val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"
        val matchesCategory = when (selectedCategory) {
            "Generated" -> isReady
            "Pending" -> !isReady
            else -> true
        }
        val matchesSearch = if (searchQuery.isBlank()) true else {
            clip.label.contains(searchQuery, ignoreCase = true) || clip.authorName.contains(searchQuery, ignoreCase = true)
        }
        matchesCategory && matchesSearch
    }

    Scaffold(
        containerColor = DigicastDeepNavy,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DigicastNavy)
                    .padding(horizontal = 18.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(modifier = Modifier.size(width = 3.dp, height = 13.dp).background(DigicastAccentBlue, RoundedCornerShape(2.dp)))
                    Box(modifier = Modifier.size(width = 3.dp, height = 20.dp).background(DigicastNeonLime, RoundedCornerShape(2.dp)))
                    Box(modifier = Modifier.size(width = 3.dp, height = 10.dp).background(DigicastElectricCyan, RoundedCornerShape(2.dp)))

                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "CLIP STUDIO",
                        color = DigicastWhite,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        letterSpacing = 1.sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = DigicastAccentBlue,
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(onClick = { viewModel.sync() }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = DigicastSlate)
                        }
                    }

                    val session = (authState as? com.digicast.app.data.repository.AuthState.SignedIn)?.session
                    ProfileAvatarButton(
                        displayName = session?.displayName,
                        photoUrl = session?.photoUrl,
                        onClick = onNavigateToSettings
                    )
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── 1. Search Bar ──────────────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DigicastSearchBackground)
                        .border(1.dp, DigicastBorder, RoundedCornerShape(14.dp))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = DigicastSlate,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Search clip markers, authors, timestamps...",
                        color = DigicastSlate.copy(alpha = 0.8f),
                        fontSize = 13.sp
                    )
                }
            }

            // ── 2. Stat Folder Tab Cards ──────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    val readyCount = clips.count { it.status.uppercase().contains("COMPLET") || it.status.uppercase() == "GENERATED" }
                    val pendingCount = clips.size - readyCount

                    FolderTabCard(
                        value = "${clips.size}",
                        label = "Total Clips",
                        sublabel = "$pendingCount pending",
                        icon = Icons.Default.ContentCut,
                        backgroundColor = DigicastSunsetCoral,
                        modifier = Modifier.weight(1f)
                    )

                    FolderTabCard(
                        value = "$readyCount",
                        label = "Ready to Publish",
                        sublabel = "Generated MP4",
                        icon = Icons.Default.CheckCircle,
                        backgroundColor = DigicastSpringGreen,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // ── 3. Category Filter Chips ──────────────────────────────────────
            item {
                val categories = listOf("All Clips", "Generated", "Pending")
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = selectedCategory == cat
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) DigicastMintGlow else DigicastChipBackground)
                                .border(
                                    1.dp,
                                    if (isSelected) DigicastMintGlow else DigicastBorder,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { selectedCategory = cat }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = cat,
                                color = if (isSelected) DigicastDarkText else DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── 4. Clips List ─────────────────────────────────────────────────
            if (filteredClips.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(DigicastCardSurface)
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (clips.isEmpty()) "No clip markers captured yet. During a live stream, type !clip in chat or tap Create Clip to mark highlights."
                                   else "No clips matching '$selectedCategory'.",
                            color = DigicastSlate,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            items(filteredClips, key = { it.id }) { clip ->
                val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"

                Card(
                    colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .clickable { onNavigateToClipGenerate(clip.id) }
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            // Marker Avatar Box
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(if (isReady) DigicastEmerald.copy(alpha = 0.15f) else DigicastSunsetCoral.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isReady) Icons.Default.CheckCircle else Icons.Default.ContentCut,
                                    contentDescription = null,
                                    tint = if (isReady) DigicastEmerald else DigicastSunsetCoral,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = clip.label,
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 12.sp)
                                    Text("•", color = DigicastSlate, fontSize = 12.sp)
                                    Text(
                                        text = if (isReady) "READY" else "PENDING",
                                        color = if (isReady) DigicastEmerald else DigicastAmber,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = { onNavigateToClipGenerate(clip.id) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isReady) DigicastSurfaceElevated else DigicastAccentBlue.copy(alpha = 0.18f)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(
                                text = if (isReady) "View" else "Process",
                                fontSize = 11.sp,
                                color = if (isReady) DigicastWhite else DigicastAccentBlue,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
