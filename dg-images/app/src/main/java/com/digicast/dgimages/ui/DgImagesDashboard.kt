package com.digicast.dgimages.ui

import android.view.ViewGroup
import android.webkit.WebView
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
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.digicast.dgimages.browser.ChatGptSessionManager
import com.digicast.dgimages.browser.ChatGptWebAdapter
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.launch
import java.io.File

// Apple & Linear inspired obsidian dark design tokens
val DgCanvas = Color(0xFF030A0D)
val DgCardSurface = Color(0xFF09161B)
val DgCardBorder = Color(0x224DD0E1)
val DgElectricCyan = Color(0xFF2DD4BF)
val DgEmerald = Color(0xFF10B981)
val DgAmber = Color(0xFFFBBF24)
val DgSlate = Color(0xFF8E9BAE)
val DgMuted = Color(0xFF5A6677)

@Composable
fun DgImagesDashboard() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val recentJobs by ImageInpaintEngine.recentJobs.collectAsState()
    val engineStatus by ImageInpaintEngine.engineStatus.collectAsState()
    val preferNewChat by ChatGptSessionManager.preferNewChat.collectAsState()
    val sessionStatus by ChatGptSessionManager.sessionStatus.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0 = ChatGPT Engine, 1 = Activity Feed
    var webAdapter by remember { mutableStateOf<ChatGptWebAdapter?>(null) }
    var testFeedback by remember { mutableStateOf<String?>(null) }

    Scaffold(
        containerColor = DgCanvas,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF061217))
                    .statusBarsPadding()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
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
                                text = "ChatGPT Thumbnail Engine",
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

                // Sub-tabs: ChatGPT Browser vs Activity Feed
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedTab == 0) DgCardSurface else Color.Transparent)
                            .border(
                                1.dp,
                                if (selectedTab == 0) DgElectricCyan.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.08f),
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { selectedTab = 0 }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.OpenInBrowser, contentDescription = null, tint = if (selectedTab == 0) DgElectricCyan else DgSlate, modifier = Modifier.size(15.dp))
                            Text("ChatGPT Web Engine", color = if (selectedTab == 0) Color.White else DgSlate, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedTab == 1) DgCardSurface else Color.Transparent)
                            .border(
                                1.dp,
                                if (selectedTab == 1) DgElectricCyan.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.08f),
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { selectedTab = 1 }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Layers, contentDescription = null, tint = if (selectedTab == 1) DgElectricCyan else DgSlate, modifier = Modifier.size(15.dp))
                            Text("Activity (${recentJobs.size})", color = if (selectedTab == 1) Color.White else DgSlate, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (selectedTab == 0) {
                // ── TAB 0: ChatGPT Browser View & Login ──────────────────────────
                Column(modifier = Modifier.fillMaxSize()) {
                    // Session control bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF041014))
                            .border(1.dp, Color.White.copy(alpha = 0.06f))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Toggle: New Chat vs Current Chat
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (preferNewChat) DgElectricCyan.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.06f))
                                    .border(1.dp, if (preferNewChat) DgElectricCyan else Color.White.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                                    .clickable { ChatGptSessionManager.setPreferNewChat(true) }
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                            ) {
                                Text("✨ New Chat", color = if (preferNewChat) DgElectricCyan else DgSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (!preferNewChat) DgElectricCyan.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.06f))
                                    .border(1.dp, if (!preferNewChat) DgElectricCyan else Color.White.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                                    .clickable { ChatGptSessionManager.setPreferNewChat(false) }
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                            ) {
                                Text("💬 Current Chat", color = if (!preferNewChat) DgElectricCyan else DgSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { webAdapter?.webView?.reload() }) {
                                Icon(Icons.Default.Refresh, contentDescription = "Reload", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    }

                    // Notice capsule
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF09161B))
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = DgElectricCyan, modifier = Modifier.size(12.dp))
                            Text(
                                text = "Sign in once with ChatGPT. All thumbnail generation requests from Dieme will automatically inject here.",
                                color = DgSlate,
                                fontSize = 10.sp,
                                lineHeight = 14.sp
                            )
                        }
                    }

                    // Embedded WebView (reusing background service WebView if already active)
                    AndroidView(
                        factory = { ctx ->
                            val existingWv = ChatGptSessionManager.activeAdapter?.webView
                            if (existingWv != null) {
                                (existingWv.parent as? ViewGroup)?.removeView(existingWv)
                                existingWv
                            } else {
                                WebView(ctx).apply {
                                    layoutParams = ViewGroup.LayoutParams(
                                        ViewGroup.LayoutParams.MATCH_PARENT,
                                        ViewGroup.LayoutParams.MATCH_PARENT
                                    )
                                    val adapter = ChatGptWebAdapter(
                                        context = ctx,
                                        webView = this,
                                        onStateChanged = {},
                                        onResultCaptured = {},
                                        onAuthRequired = {}
                                    )
                                    webAdapter = adapter
                                    ChatGptSessionManager.activeAdapter = adapter
                                }
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                // ── TAB 1: Activity Feed & Daemon Status ─────────────────────────
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Daemon Status Card
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(18.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF091E26), Color(0xFF041014))))
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
                                        Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = null, tint = DgElectricCyan, modifier = Modifier.size(20.dp))
                                        Text("LOCAL IPC DAEMON", color = DgElectricCyan, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                                    }
                                    Text("READY", color = DgEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Text(text = sessionStatus, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)

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
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF134E5E)),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                    ) {
                                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Test Self Handshake", fontSize = 12.sp, color = Color.White)
                                    }
                                }

                                if (testFeedback != null) {
                                    Text(text = testFeedback!!, color = DgElectricCyan, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // Feed Items
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("LIVE ACTIVITY FROM DIGICAST", color = DgSlate, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                            Text("${recentJobs.size} tasks", color = DgMuted, fontSize = 11.sp)
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
                                    Icon(imageVector = Icons.Default.Layers, contentDescription = null, tint = DgMuted, modifier = Modifier.size(32.dp))
                                    Text("Awaiting Requests from Dieme", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    Text("Open Thumbnail Studio in Dieme and tap \"Generate with Dg-Images\"", color = DgSlate, fontSize = 11.sp)
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
                                        Text(text = "${job.latencyMs}ms", color = DgSlate, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                    }

                                    Text(text = job.prompt, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)

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
                                            model = ImageRequest.Builder(context).data(model).crossfade(true).build(),
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
    }
}
