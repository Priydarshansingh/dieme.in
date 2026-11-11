package com.digicast.dgimages.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.launch
import java.io.File

// Apple & Linear inspired obsidian dark design tokens
val DgCanvas = Color(0xFF030A0D)
val DgCardSurface = Color(0xFF09161B)
val DgCardBorder = Color(0x224DD0E1)
val DgElectricCyan = Color(0xFF2DD4BF)
val DgEmerald = Color(0xFF10B981)
val DgSlate = Color(0xFF8E9BAE)
val DgMuted = Color(0xFF5A6677)

@Composable
fun DgImagesDashboard() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val recentJobs by ImageInpaintEngine.recentJobs.collectAsState()
    val engineStatus by ImageInpaintEngine.engineStatus.collectAsState()

    var testFeedback by remember { mutableStateOf<String?>(null) }

    Scaffold(
        containerColor = DgCanvas,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF061217))
                    .statusBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Brush.linearGradient(listOf(Color(0xFF0F766E), Color(0xFF134E5E))))
                            .border(1.dp, DgElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Dg-Images",
                            color = Color.White,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.4).sp
                        )
                        Text(
                            text = "Thumbnail Companion for Digicast",
                            color = DgSlate,
                            fontSize = 11.sp
                        )
                    }
                }

                // Port status badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(DgEmerald.copy(alpha = 0.12f))
                        .border(1.dp, DgEmerald.copy(alpha = 0.35f), RoundedCornerShape(9999.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(DgEmerald)
                        )
                        Text(
                            text = "127.0.0.1:5488",
                            color = DgEmerald,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── 1. Daemon Status Card ─────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF091E26), Color(0xFF041014))
                            )
                        )
                        .border(1.dp, DgCardBorder, RoundedCornerShape(18.dp))
                        .padding(18.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ElectricBolt,
                                    contentDescription = null,
                                    tint = DgElectricCyan,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "LOCAL IPC DAEMON",
                                    color = DgElectricCyan,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp
                                )
                            }
                            Text(
                                text = "READY",
                                color = DgEmerald,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = engineStatus,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        testFeedback = "Simulating test dispatch..."
                                        ImageInpaintEngine.processInpaintTask(
                                            context = context,
                                            baseImageUrl = "https://img.youtube.com/vi/g_4KXSxPzGo/maxresdefault.jpg",
                                            maskPointsJson = "[]",
                                            prompt = "Test diagnostic handshake from dashboard"
                                        )
                                        testFeedback = "Test job successfully generated in cache!"
                                    }
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF134E5E)
                                ),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Test Self Handshake", fontSize = 12.sp, color = Color.White)
                            }
                        }

                        if (testFeedback != null) {
                            Text(
                                text = testFeedback!!,
                                color = DgElectricCyan,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // ── 2. Live Activity Feed ─────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "LIVE ACTIVITY FROM DIGICAST",
                        color = DgSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "${recentJobs.size} tasks",
                        color = DgMuted,
                        fontSize = 11.sp
                    )
                }
            }

            if (recentJobs.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(DgCardSurface)
                            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = null,
                                tint = DgMuted,
                                modifier = Modifier.size(32.dp)
                            )
                            Text(
                                text = "Awaiting Requests from Digicast",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Open Thumbnail Studio in Digicast and tap \"Generate with Dg-Images\"",
                                color = DgSlate,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            } else {
                items(recentJobs) { job ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(DgCardSurface)
                            .border(1.dp, DgCardBorder, RoundedCornerShape(16.dp))
                            .padding(14.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = DgEmerald, modifier = Modifier.size(14.dp))
                                    Text(job.status, color = DgEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                                Text(
                                    text = "${job.latencyMs}ms",
                                    color = DgSlate,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }

                            Text(
                                text = job.prompt,
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )

                            // 16:9 Thumbnail preview if generated file exists
                            val file = File(job.resultUrl)
                            val model = if (file.exists()) file else job.baseImageUrl
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(16f / 9f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.Black)
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            ) {
                                AsyncImage(
                                    model = ImageRequest.Builder(context)
                                        .data(model)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = "Thumbnail Preview",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
