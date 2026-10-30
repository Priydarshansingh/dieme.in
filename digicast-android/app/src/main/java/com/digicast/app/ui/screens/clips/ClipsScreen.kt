package com.digicast.app.ui.screens.clips

import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.ClipRepository
import com.digicast.app.data.repository.StreamRepository
import com.digicast.app.ui.components.ProfileAvatarButton
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastChipBackground
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastMintGlow
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSearchBackground
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSpringGreen
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClipsViewModel @Inject constructor(
    clipRepository: ClipRepository,
    streamRepository: StreamRepository,
    val authRepository: AuthRepository
) : ViewModel() {
    val isSyncing = authRepository.isSyncing
    val clips = clipRepository.getAllClips()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val streams = streamRepository.getAllStreams()
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
    val streams by viewModel.streams.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val authState by viewModel.authRepository.authState.collectAsState()

    // Filter states
    var selectedStreamFilter by remember { mutableStateOf("All Streams") }
    var selectedStatusFilter by remember { mutableStateOf("All Clips") }
    var selectedDateFilter by remember { mutableStateOf("All Time") }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.sync()
    }

    val realClips = remember(clips) {
        clips.filter { it.id != "demo-clip-001" && !it.authorName.contains("DemoViewer", ignoreCase = true) }
    }

    val realStreams = remember(streams) {
        streams.filter { it.id != "demo-stream-001" }
    }

    val streamTitles = remember(realStreams) {
        listOf("All Streams") + realStreams.map { it.title.take(22) + "..." }.distinct()
    }

    val filteredClips = remember(realClips, selectedStreamFilter, selectedStatusFilter, selectedDateFilter, searchQuery) {
        realClips.filter { clip ->
            val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"
            val matchesStatus = when (selectedStatusFilter) {
                "Ready" -> isReady
                "Pending" -> !isReady
                else -> true
            }

            val matchesStream = when (selectedStreamFilter) {
                "All Streams" -> true
                else -> {
                    val matchingStream = realStreams.find { it.id == clip.streamId }
                    matchingStream?.title?.take(22)?.let { selectedStreamFilter.startsWith(it) } ?: true
                }
            }

            val matchesDate = when (selectedDateFilter) {
                "Today" -> clip.timestampMs >= (System.currentTimeMillis() - 86400000L)
                "This Week" -> clip.timestampMs >= (System.currentTimeMillis() - 7 * 86400000L)
                else -> true
            }

            val matchesSearch = if (searchQuery.isBlank()) true else {
                clip.label.contains(searchQuery, ignoreCase = true) || clip.authorName.contains(searchQuery, ignoreCase = true)
            }

            matchesStatus && matchesStream && matchesDate && matchesSearch
        }
    }

    // Featured Hero Clip (Top Highlight)
    val featuredClip = remember(filteredClips) {
        filteredClips.firstOrNull { it.status == "GENERATED" || it.localFilePath != null } ?: filteredClips.firstOrNull()
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
                // Official Digicast Logo Mark + Logo Text Graphic (White Tinted)
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
                    androidx.compose.foundation.text.BasicTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(
                            color = DigicastWhite,
                            fontSize = 13.sp
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        decorationBox = { innerTextField ->
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = "Search clips, authors, tags...",
                                    color = DigicastSlate.copy(alpha = 0.8f),
                                    fontSize = 13.sp
                                )
                            }
                            innerTextField()
                        }
                    )
                }
            }

            // ── 2. Stream Name & Source Filters (Horizontal Chip Selector) ──────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.VideoLibrary, contentDescription = null, tint = DigicastAccentBlue, modifier = Modifier.size(14.dp))
                            Text("STREAM SOURCE", color = DigicastSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                        }
                        Text("${realStreams.size} Broadcasts", color = DigicastSlate, fontSize = 11.sp)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        streamTitles.forEach { title ->
                            val isSelected = selectedStreamFilter == title
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isSelected) DigicastAccentBlue.copy(alpha = 0.2f) else DigicastSurface)
                                    .border(
                                        1.dp,
                                        if (isSelected) DigicastAccentBlue else DigicastBorder.copy(alpha = 0.5f),
                                        RoundedCornerShape(20.dp)
                                    )
                                    .clickable { selectedStreamFilter = title }
                                    .padding(horizontal = 14.dp, vertical = 7.dp)
                            ) {
                                Text(
                                    text = title,
                                    color = if (isSelected) DigicastAccentBlue else DigicastWhite,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            // ── 3. Status & Date Range Bar ────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Status Pills: All, Ready, Pending
                    val statusList = listOf("All Clips", "Ready", "Pending")
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        statusList.forEach { status ->
                            val isSelected = selectedStatusFilter == status
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) DigicastMintGlow else DigicastChipBackground)
                                    .clickable { selectedStatusFilter = status }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = status,
                                    color = if (isSelected) DigicastDarkText else DigicastSlate,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            }
                        }
                    }

                    // Date Filters: Today, Week, All Time
                    val dateList = listOf("All Time", "Today", "This Week")
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(DigicastSurface)
                            .border(1.dp, DigicastBorder.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .padding(2.dp),
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        dateList.forEach { date ->
                            val isSelected = selectedDateFilter == date
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) DigicastSurfaceElevated else Color.Transparent)
                                    .clickable { selectedDateFilter = date }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = date,
                                    color = if (isSelected) DigicastWhite else DigicastSlate,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }
            }

            // ── 4. Rich Featured Moment Highlight Card (Never Feels Empty!) ───
            if (featuredClip != null && searchQuery.isBlank()) {
                item {
                    val streamInfo = realStreams.find { it.id == featuredClip.streamId }
                    val thumbUrl = streamInfo?.thumbnailUrl
                        ?: "https://i.ytimg.com/vi/${featuredClip.streamId}/hqdefault.jpg"

                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToClipGenerate(featuredClip.id) }
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            // 16:9 Thumbnail Header with Badges
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(160.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DigicastSurfaceElevated)
                            ) {
                                AsyncImage(
                                    model = thumbUrl,
                                    contentDescription = featuredClip.label,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )

                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            Brush.verticalGradient(
                                                colors = listOf(Color.Transparent, DigicastDeepNavy.copy(alpha = 0.85f))
                                            )
                                        )
                                )

                                // Top Highlights Pill
                                Row(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(10.dp)
                                        .background(DigicastSunsetCoral, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.ContentCut, contentDescription = null, tint = DigicastWhite, modifier = Modifier.size(12.dp))
                                    Text("TOP MOMENT", color = DigicastWhite, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                                }

                                // Offset Badge
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .padding(10.dp)
                                        .background(Color.Black.copy(alpha = 0.75f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("33:50 (!clip)", color = DigicastNeonLime, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Text(
                                    text = streamInfo?.title ?: "FREE FIRE INDIA LIVE 🇮🇳",
                                    color = DigicastWhite,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(10.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = featuredClip.label,
                                        color = DigicastWhite,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Triggered by ${featuredClip.authorName} • 1080p MP4 Ready",
                                        color = DigicastSlate,
                                        fontSize = 12.sp
                                    )
                                }

                                Button(
                                    onClick = { onNavigateToClipGenerate(featuredClip.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text("Open Console", fontSize = 12.sp, color = DigicastDeepNavy, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // ── 5. Clips List Header ──────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SAVED CLIPS & HIGHLIGHTS",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "${filteredClips.size} clips found",
                        color = DigicastAccentBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // ── 6. Clips List ─────────────────────────────────────────────────
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
                            text = if (realClips.isEmpty()) "No clip markers captured yet. During a livestream, type !clip in chat or tap 'Clip Moment ✂️' in Stream Console!"
                            else "No clips matching selected filters.",
                            color = DigicastSlate,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            items(filteredClips, key = { it.id }) { clip ->
                val isReady = clip.status.uppercase().contains("COMPLET") || clip.status.uppercase() == "GENERATED"
                val streamInfo = realStreams.find { it.id == clip.streamId }

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
                                    .size(44.dp)
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

                            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(
                                    text = clip.label,
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = streamInfo?.title?.take(28) ?: "Live Broadcast",
                                    color = DigicastSlate,
                                    fontSize = 11.sp,
                                    maxLines = 1
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text("by ${clip.authorName}", color = DigicastSlate, fontSize = 11.sp)
                                    Text("•", color = DigicastSlate, fontSize = 11.sp)
                                    Text(
                                        text = if (isReady) "READY MP4" else "PENDING",
                                        color = if (isReady) DigicastEmerald else DigicastAmber,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.ExtraBold
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
                                text = if (isReady) "View & Export" else "Render MP4",
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
