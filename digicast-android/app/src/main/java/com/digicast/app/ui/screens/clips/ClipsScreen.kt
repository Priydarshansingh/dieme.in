package com.digicast.app.ui.screens.clips

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCut
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleDarkEdgeSubtleBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastChipBackground
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastMintGlow
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSearchBackground
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@HiltViewModel
class ClipsViewModel @Inject constructor(
    private val clipRepository: ClipRepository,
    private val streamRepository: StreamRepository,
    private val dao: DigicastDao,
    val authRepository: AuthRepository
) : ViewModel() {
    val isSyncing = authRepository.isSyncing

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val clips = authRepository.authState.flatMapLatest { state ->
        val session = (state as? com.digicast.app.data.repository.AuthState.SignedIn)?.session
        if (session != null) {
            clipRepository.getClipsForWorkspace(session.workspaceId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val streams = authRepository.authState.flatMapLatest { state ->
        val session = (state as? com.digicast.app.data.repository.AuthState.SignedIn)?.session
        if (session != null) {
            streamRepository.getStreamsForWorkspace(session.workspaceId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        sync()
    }

    fun sync() {
        viewModelScope.launch {
            val session = (authRepository.authState.value as? com.digicast.app.data.repository.AuthState.SignedIn)?.session
            val isDemo = session?.uid == com.digicast.app.data.repository.AuthRepository.DEMO_SESSION.uid
            withContext(Dispatchers.IO) {
                dao.clearDemoClips()
                dao.clearDemoStreams()
            }
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
    val streams by viewModel.streams.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val authState by viewModel.authRepository.authState.collectAsState()

    // Filter states — kept simple and clean per requirements
    var selectedStatusFilter by remember { mutableStateOf("All Clips") }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.sync()
    }

    // Only genuine clips and streams (purge any demo placeholders)
    val realClips = remember(clips) {
        clips.filter {
            it.id != "demo-clip-001" &&
            !it.id.startsWith("demo", ignoreCase = true) &&
            !it.authorName.contains("DemoViewer", ignoreCase = true)
        }
    }

    val realStreams = remember(streams) {
        streams.filter {
            it.id != "demo-stream-001" &&
            !it.id.startsWith("demo", ignoreCase = true) &&
            !it.channelTitle.contains("Demo", ignoreCase = true)
        }
    }

    val filteredClips = remember(realClips, selectedStatusFilter, searchQuery) {
        realClips.filter { clip ->
            val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"
            val matchesStatus = when (selectedStatusFilter) {
                "Ready" -> isReady
                "Pending" -> !isReady
                else -> true
            }

            val matchesSearch = if (searchQuery.isBlank()) true else {
                clip.label.contains(searchQuery, ignoreCase = true) || clip.authorName.contains(searchQuery, ignoreCase = true)
            }

            matchesStatus && matchesSearch
        }
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
                // Official Digicast Logo Mark + Logo Text Graphic
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Image(
                        painter = painterResource(id = com.digicast.app.R.drawable.logo_round),
                        contentDescription = "Digicast Logo",
                        modifier = Modifier.size(28.dp)
                    )
                    Image(
                        painter = painterResource(id = com.digicast.app.R.drawable.logo_text),
                        contentDescription = "Digicast",
                        modifier = Modifier.height(18.dp),
                        contentScale = ContentScale.Fit,
                        colorFilter = ColorFilter.tint(Color.White)
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ── 1. Search Bar (Apple Dark-Edge Capsule) ────────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(9999.dp))
                        .background(AppleDarkEdgePillBrush)
                        .border(1.dp, AppleSpecularBorder, RoundedCornerShape(9999.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    androidx.compose.foundation.text.BasicTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(
                            color = Color.White,
                            fontSize = 13.sp
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        decorationBox = { innerTextField ->
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = "Search clips, authors, tags...",
                                    color = Color.White.copy(alpha = 0.6f),
                                    fontSize = 13.sp
                                )
                            }
                            innerTextField()
                        }
                    )
                }
            }

            // ── 2. Focused Status Filter Pills Only (All Clips, Ready, Pending) ─
            item {
                val statusList = listOf("All Clips", "Ready", "Pending")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    statusList.forEach { status ->
                        val isSelected = selectedStatusFilter == status
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(9999.dp))
                                .background(if (isSelected) AppleDarkEdgePillBrush else AppleDarkEdgeSubtleBrush)
                                .border(
                                    1.dp,
                                    if (isSelected) Color.White.copy(alpha = 0.8f) else Color(0x28FFFFFF),
                                    RoundedCornerShape(9999.dp)
                                )
                                .clickable { selectedStatusFilter = status }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = status,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── 3. Conditional Data Rendering ──────────────────────────────────
            // If no clips exist, show ONLY the clean Kick-style empty state (no filler/mock data).
            if (filteredClips.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(DigicastCardSurface)
                            .padding(vertical = 48.dp, horizontal = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(CircleShape)
                                    .background(DigicastChipBackground),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ContentCut,
                                    contentDescription = null,
                                    tint = DigicastSunsetCoral,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Text(
                                text = if (realClips.isEmpty()) "No Clips Captured Yet" else "No Matching Clips",
                                color = DigicastWhite,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (realClips.isEmpty()) "Open any stream console and tap 'Add Moment' or type !clip in live chat to create highlights."
                                else "Try adjusting your search query or status filter.",
                                color = DigicastSlate,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center,
                                lineHeight = 17.sp
                            )
                        }
                    }
                }
            } else {
                // Header showing actual clip count
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp, bottom = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "CLIPS & HIGHLIGHTS",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "${filteredClips.size} ready",
                            color = DigicastAccentBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // Render genuine clips cleanly
                items(filteredClips, key = { it.id }) { clip ->
                    val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"
                    val streamInfo = realStreams.find { it.id == clip.streamId }
                    val offsetSec = (clip.timestampMs / 1000L) % 3600
                    val timeStr = String.format("%02d:%02d", offsetSec / 60, offsetSec % 60)
                    val type = ClipType.fromLabel(clip.label, clip.triggerMessageId)

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        border = BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(24.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .clickable { onNavigateToClipGenerate(clip.id) }
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Top Row: Avatar/Icon + Title + Action Button
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f, fill = false)
                                ) {
                                    // Marker Status Icon
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(CircleShape)
                                            .background(type.color.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = type.icon,
                                            contentDescription = null,
                                            tint = type.color,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(type.color.copy(alpha = 0.25f))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                                ) {
                                                    Icon(type.icon, contentDescription = null, tint = type.color, modifier = Modifier.size(10.dp))
                                                    Text(type.title, color = type.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                            Text(
                                                text = clip.label,
                                                color = DigicastWhite,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }

                                        Text(
                                            text = streamInfo?.title ?: "Live Broadcast",
                                            color = DigicastSlate,
                                            fontSize = 11.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                Button(
                                    onClick = { onNavigateToClipGenerate(clip.id) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF134E5E)
                                    ),
                                    border = BorderStroke(1.dp, Color(0x55FFFFFF)),
                                    shape = RoundedCornerShape(9999.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text(
                                        text = if (isReady) "View & Export" else "Render MP4",
                                        fontSize = 11.sp,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            // Bottom Subline: author • time • status badge pill
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "by ${clip.authorName}",
                                    color = DigicastSlate,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text("•", color = DigicastSlate, fontSize = 11.sp)
                                Text(timeStr, color = DigicastSlate, fontSize = 11.sp)
                                Text("•", color = DigicastSlate, fontSize = 11.sp)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(if (isReady) Color(0x2256F16A) else Color(0x22FBBF24))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (isReady) "READY MP4" else "PENDING",
                                        color = if (isReady) Color(0xFF56F16A) else DigicastAmber,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
