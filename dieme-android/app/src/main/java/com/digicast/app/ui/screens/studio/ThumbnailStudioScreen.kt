package com.digicast.app.ui.screens.studio

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.graphics.Matrix
import android.media.ExifInterface
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import com.digicast.app.ui.utils.PermissionHelper
import com.digicast.app.ui.utils.WorkPermissionRequester
import com.digicast.app.util.AppUpdateManager
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.runtime.derivedStateOf
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.heightIn
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Menu
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import kotlinx.coroutines.isActive
import com.digicast.app.ui.screens.settings.ExtensionViewModel
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.regex.Pattern

// ── Data Models ─────────────────────────────────────────────────────────────

data class MarkedPin(
    val id: Int,
    val xPercent: Float, // 0..100
    val yPercent: Float  // 0..100
)

data class ThumbnailChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val isUser: Boolean,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val previewImageUrl: String? = null,
    val pins: List<MarkedPin> = emptyList(),
    val referenceImageCount: Int = 0,
    val isGenerating: Boolean = false,
    val status: String? = null
)

data class ThumbnailSession(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val thumbnailUrl: String? = null,
    val generatedImageUrl: String? = null,
    val videoId: String = "",
    val videoUrl: String = "",
    val messages: List<ThumbnailChatMessage> = emptyList()
)

object ThumbnailSessionStorage {
    private const val PREFS_NAME = "thumbnail_studio_sessions_v1"
    private const val KEY_SESSIONS = "saved_sessions"

    fun sessionToJson(session: ThumbnailSession): JSONObject {
        val obj = JSONObject()
        obj.put("id", session.id)
        obj.put("title", session.title)
        obj.put("createdAt", session.createdAt)
        obj.put("updatedAt", session.updatedAt)
        if (session.thumbnailUrl != null) obj.put("thumbnailUrl", session.thumbnailUrl)
        if (session.generatedImageUrl != null) obj.put("generatedImageUrl", session.generatedImageUrl)
        obj.put("videoId", session.videoId)
        obj.put("videoUrl", session.videoUrl)

        val msgsArray = JSONArray()
        session.messages.forEach { msg ->
            val mObj = JSONObject()
            mObj.put("id", msg.id)
            mObj.put("isUser", msg.isUser)
            mObj.put("text", msg.text)
            mObj.put("timestamp", msg.timestamp)
            if (msg.previewImageUrl != null) mObj.put("previewImageUrl", msg.previewImageUrl)
            mObj.put("referenceImageCount", msg.referenceImageCount)
            val pinsArray = JSONArray()
            msg.pins.forEach { p ->
                val pObj = JSONObject()
                pObj.put("id", p.id)
                pObj.put("xPercent", p.xPercent.toDouble())
                pObj.put("yPercent", p.yPercent.toDouble())
                pinsArray.put(pObj)
            }
            mObj.put("pins", pinsArray)
            msgsArray.put(mObj)
        }
        obj.put("messages", msgsArray)
        return obj
    }

    fun jsonToSession(obj: JSONObject): ThumbnailSession {
        val id = obj.optString("id", UUID.randomUUID().toString())
        val title = obj.optString("title", "Studio Session")
        val createdAt = obj.optLong("createdAt", System.currentTimeMillis())
        val updatedAt = obj.optLong("updatedAt", System.currentTimeMillis())
        val thumbnailUrl = if (obj.has("thumbnailUrl") && !obj.isNull("thumbnailUrl")) obj.getString("thumbnailUrl") else null
        val generatedImageUrl = if (obj.has("generatedImageUrl") && !obj.isNull("generatedImageUrl")) obj.getString("generatedImageUrl") else null
        val videoId = obj.optString("videoId", "")
        val videoUrl = obj.optString("videoUrl", "")

        val msgs = mutableListOf<ThumbnailChatMessage>()
        val msgsArray = obj.optJSONArray("messages")
        if (msgsArray != null) {
            for (i in 0 until msgsArray.length()) {
                val mObj = msgsArray.getJSONObject(i)
                val pList = mutableListOf<MarkedPin>()
                val pinsArray = mObj.optJSONArray("pins")
                if (pinsArray != null) {
                    for (j in 0 until pinsArray.length()) {
                        val pObj = pinsArray.getJSONObject(j)
                        pList.add(
                            MarkedPin(
                                id = pObj.optInt("id", j + 1),
                                xPercent = pObj.optDouble("xPercent", 0.0).toFloat(),
                                yPercent = pObj.optDouble("yPercent", 0.0).toFloat()
                            )
                        )
                    }
                }
                msgs.add(
                    ThumbnailChatMessage(
                        id = mObj.optString("id", UUID.randomUUID().toString()),
                        isUser = mObj.optBoolean("isUser", false),
                        text = mObj.optString("text", ""),
                        timestamp = mObj.optLong("timestamp", System.currentTimeMillis()),
                        previewImageUrl = if (mObj.has("previewImageUrl") && !mObj.isNull("previewImageUrl")) mObj.getString("previewImageUrl") else null,
                        pins = pList,
                        referenceImageCount = mObj.optInt("referenceImageCount", 0),
                        isGenerating = false,
                        status = null
                    )
                )
            }
        }
        return ThumbnailSession(
            id = id,
            title = title,
            createdAt = createdAt,
            updatedAt = updatedAt,
            thumbnailUrl = thumbnailUrl,
            generatedImageUrl = generatedImageUrl,
            videoId = videoId,
            videoUrl = videoUrl,
            messages = msgs
        )
    }

    fun persistSessions(context: Context, sessions: List<ThumbnailSession>) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val arr = JSONArray()
            sessions.take(50).forEach { s ->
                arr.put(sessionToJson(s))
            }
            prefs.edit().putString(KEY_SESSIONS, arr.toString()).apply()
        } catch (e: Exception) {
            Log.e("ThumbnailStudio", "Failed to persist sessions: ${e.message}")
        }
    }

    fun loadSessions(context: Context): List<ThumbnailSession> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val raw = prefs.getString(KEY_SESSIONS, null) ?: return emptyList()
            val arr = JSONArray(raw)
            val list = mutableListOf<ThumbnailSession>()
            for (i in 0 until arr.length()) {
                list.add(jsonToSession(arr.getJSONObject(i)))
            }
            list.sortedByDescending { it.updatedAt }
        } catch (e: Exception) {
            Log.e("ThumbnailStudio", "Failed to load sessions: ${e.message}")
            emptyList()
        }
    }
}

// ── Dot Matrix Snake Game for Loading Screen ───────────────────────────────

enum class DotSnakeDirection { UP, DOWN, LEFT, RIGHT }
data class DotGridPoint(val x: Int, val y: Int)

@Composable
fun DotMatrixSnakeGame(
    modifier: Modifier = Modifier,
    elapsedSeconds: Int,
    onExitGame: () -> Unit
) {
    val cols = 18
    val rows = 24

    var snake by remember {
        mutableStateOf(
            listOf(
                DotGridPoint(6, 12),
                DotGridPoint(5, 12),
                DotGridPoint(4, 12)
            )
        )
    }
    var direction by remember { mutableStateOf(DotSnakeDirection.RIGHT) }
    var nextDirection by remember { mutableStateOf(DotSnakeDirection.RIGHT) }
    var food by remember { mutableStateOf(DotGridPoint(12, 12)) }
    var score by remember { mutableIntStateOf(0) }

    // Pulsing food animation
    val infiniteTransition = rememberInfiniteTransition(label = "foodPulse")
    val foodPulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(tween(400), RepeatMode.Reverse),
        label = "foodScale"
    )

    // Game loop running on coroutines
    LaunchedEffect(Unit) {
        while (isActive) {
            delay(120L)
            direction = nextDirection
            val head = snake.first()
            val (dx, dy) = when (direction) {
                DotSnakeDirection.UP -> 0 to -1
                DotSnakeDirection.DOWN -> 0 to 1
                DotSnakeDirection.LEFT -> -1 to 0
                DotSnakeDirection.RIGHT -> 1 to 0
            }

            val newX = (head.x + dx + cols) % cols
            val newY = (head.y + dy + rows) % rows
            val newHead = DotGridPoint(newX, newY)

            if (snake.contains(newHead)) {
                // Wrap reset on self collision
                snake = listOf(DotGridPoint(6, 12), DotGridPoint(5, 12), DotGridPoint(4, 12))
                direction = DotSnakeDirection.RIGHT
                nextDirection = DotSnakeDirection.RIGHT
                score = 0
            } else {
                val newSnake = mutableListOf(newHead)
                if (newHead == food) {
                    score++
                    newSnake.addAll(snake)
                    var randomFood: DotGridPoint
                    do {
                        randomFood = DotGridPoint((0 until cols).random(), (0 until rows).random())
                    } while (newSnake.contains(randomFood))
                    food = randomFood
                } else {
                    newSnake.addAll(snake.dropLast(1))
                }
                snake = newSnake
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF030D12))
            .pointerInput(Unit) {
                var totalDragX = 0f
                var totalDragY = 0f
                detectDragGestures(
                    onDragStart = { totalDragX = 0f; totalDragY = 0f },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        totalDragX += dragAmount.x
                        totalDragY += dragAmount.y
                    },
                    onDragEnd = {
                        if (kotlin.math.abs(totalDragX) > kotlin.math.abs(totalDragY)) {
                            if (totalDragX > 20f && direction != DotSnakeDirection.LEFT) nextDirection = DotSnakeDirection.RIGHT
                            else if (totalDragX < -20f && direction != DotSnakeDirection.RIGHT) nextDirection = DotSnakeDirection.LEFT
                        } else {
                            if (totalDragY > 20f && direction != DotSnakeDirection.UP) nextDirection = DotSnakeDirection.DOWN
                            else if (totalDragY < -20f && direction != DotSnakeDirection.DOWN) nextDirection = DotSnakeDirection.UP
                        }
                    }
                )
            }
    ) {
        // Retro Dot Matrix Canvas with clear, uncluttered view
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp)
        ) {
            val cellW = size.width / cols
            val cellH = size.height / rows
            val baseRadius = (cellW.coerceAtMost(cellH) * 0.28f)

            // 1. Subtle, small background guide dots (clean, no clutter)
            for (c in 0 until cols) {
                for (r in 0 until rows) {
                    val center = Offset(c * cellW + cellW / 2f, r * cellH + cellH / 2f)
                    drawCircle(
                        color = Color(0x0AFFFFFF),
                        radius = baseRadius * 0.25f,
                        center = center
                    )
                }
            }

            // 2. Food Target Pellet ("The Dot") - Highly prominent glowing neon cyan
            val foodCenter = Offset(food.x * cellW + cellW / 2f, food.y * cellH + cellH / 2f)
            // Outer pulsing glow
            drawCircle(
                color = Color(0x4000F0FF),
                radius = baseRadius * 2.4f * foodPulseScale,
                center = foodCenter
            )
            // Middle ring
            drawCircle(
                color = Color(0x9000F0FF),
                radius = baseRadius * 1.5f * foodPulseScale,
                center = foodCenter
            )
            // Core solid dot
            drawCircle(
                color = Color(0xFF00F0FF),
                radius = baseRadius * 1.1f,
                center = foodCenter
            )
            // Center white spark
            drawCircle(
                color = Color.White,
                radius = baseRadius * 0.45f,
                center = foodCenter
            )

            // 3. Snake Body Dots
            snake.forEachIndexed { index, pt ->
                val center = Offset(pt.x * cellW + cellW / 2f, pt.y * cellH + cellH / 2f)
                val isHead = index == 0
                drawCircle(
                    color = if (isHead) Color.White else Color(0xFF00F0FF),
                    radius = if (isHead) baseRadius * 1.3f else baseRadius * 0.95f,
                    center = center
                )
            }
        }
    }
}

// ── Screen Implementation ───────────────────────────────────────────────────

@Composable
fun ThumbnailStudioScreen(
    onNavigateBack: () -> Unit,
    extensionViewModel: ExtensionViewModel = hiltViewModel()
) {
    val configuration = LocalConfiguration.current
    val screenWidthDp = configuration.screenWidthDp
    val screenHeightDp = configuration.screenHeightDp
    val isSmallScreen = screenWidthDp < 360
    val isTablet = screenWidthDp >= 600
    val isShortScreen = screenHeightDp < 700

    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    // ── Link & Source State (Empty by default, NO demo data) ────────────────
    var urlInput by remember { mutableStateOf("") }
    var currentThumbnailUrl by remember { mutableStateOf<String?>(null) }
    var originalSourceThumbnailUrl by remember { mutableStateOf<String?>(null) }
    var videoId by remember { mutableStateOf("") }
    var isFetchingUrl by remember { mutableStateOf(false) }
    var showStoragePermissionForThumbnail by remember { mutableStateOf(false) }
    var pendingImageUrlToSave by remember { mutableStateOf<String?>(null) }

    // ── Canvas Mark Points ──────────────────────────────────────────────────
    val markedPins = remember { mutableStateListOf<MarkedPin>() }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }

    // ── Reference Images (Up to 2 images) ───────────────────────────────────
    val referenceImages = remember { mutableStateListOf<Uri>() }
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(2)
    ) { uris ->
        if (uris != null && uris.isNotEmpty()) {
            val availableSlots = 2 - referenceImages.size
            if (availableSlots > 0) {
                coroutineScope.launch(Dispatchers.IO) {
                    uris.take(availableSlots).forEach { uri ->
                        val opt = optimizeAndCacheImage(context, uri) ?: uri
                        withContext(Dispatchers.Main) {
                            referenceImages.add(opt)
                        }
                    }
                }
            } else {
                Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── History & Prompt State (Empty by default) ───────────────────────────
    var promptInput by remember { mutableStateOf("") }
    var preferNewChat by remember { mutableStateOf(true) }
    var activeSessionId by remember { mutableStateOf(UUID.randomUUID().toString()) }
    val savedSessions = remember { mutableStateListOf<ThumbnailSession>() }
    val chatMessages = remember { mutableStateListOf<ThumbnailChatMessage>() }
    var showGalleryPicker by remember { mutableStateOf(false) }
    var galleryPickerTargetIsBase by remember { mutableStateOf(false) }

    // ── Generation State & Active Prompt Snapshot ───────────────────────────
    var isGenerating by remember { mutableStateOf(false) }
    var isSnakeGameActive by remember { mutableStateOf(false) }
    var generationStatusMessage by remember { mutableStateOf("Connecting to Dg-Images...") }
    var generatedImageUrl by remember { mutableStateOf<String?>(null) }
    var activeGeneratingBaseImage by remember { mutableStateOf<String?>(null) }
    var activeGeneratingPrompt by remember { mutableStateOf("") }
    var activeGeneratingRefs by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var activeGeneratingPins by remember { mutableStateOf<List<MarkedPin>>(emptyList()) }
    var isDgImagesAppInstalled by remember { mutableStateOf(false) }
    var showDgImagesDownloadDialog by remember { mutableStateOf(false) }

    val loadedExtension by extensionViewModel.loadedImageStudio.collectAsState()
    val isBridgeReady = isDgImagesAppInstalled && (loadedExtension != null || extensionViewModel.getImageStudio() != null)

    // Pulsing pin animation & ChatGPT generation transitions
    val infiniteTransition = rememberInfiniteTransition(label = "studioTransitions")
    val pinPulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(900),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pinPulseAlpha"
    )
    val borderPulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "borderPulseAlpha"
    )
    val shimmerOffset by infiniteTransition.animateFloat(
        initialValue = -1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerOffset"
    )
    val scanY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanY"
    )
    val sparkAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(3500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sparkAngle"
    )

    var generationElapsedSeconds by remember { mutableIntStateOf(0) }
    LaunchedEffect(isGenerating) {
        if (isGenerating) {
            generationElapsedSeconds = 0
            while (isActive) {
                delay(1000)
                generationElapsedSeconds++
            }
        } else {
            generationElapsedSeconds = 0
            isSnakeGameActive = false
        }
    }

    // ── Helper: Save Current Session to Persistent History ──────────────────
    fun saveCurrentSessionToHistory() {
        if (chatMessages.isEmpty() && currentThumbnailUrl == null && generatedImageUrl == null) return

        val firstUserMsg = chatMessages.firstOrNull { it.isUser && it.text.isNotBlank() }?.text
        val currentTitle = when {
            videoId.isNotBlank() -> "Video: $videoId"
            !firstUserMsg.isNullOrBlank() -> {
                if (firstUserMsg.length > 28) firstUserMsg.take(28) + "…" else firstUserMsg
            }
            urlInput.isNotBlank() -> "Link: ${urlInput.take(24)}…"
            else -> "Session ${SimpleDateFormat("MMM d, HH:mm", Locale.getDefault()).format(Date())}"
        }

        val updatedSession = ThumbnailSession(
            id = activeSessionId,
            title = currentTitle,
            updatedAt = System.currentTimeMillis(),
            thumbnailUrl = currentThumbnailUrl,
            generatedImageUrl = generatedImageUrl,
            videoId = videoId,
            videoUrl = urlInput,
            messages = chatMessages.toList()
        )

        val idx = savedSessions.indexOfFirst { it.id == activeSessionId }
        if (idx != -1) {
            savedSessions[idx] = updatedSession
        } else {
            savedSessions.add(0, updatedSession)
        }
        ThumbnailSessionStorage.persistSessions(context, savedSessions.toList())
    }

    // ── Helper: Start New Session ───────────────────────────────────────────
    fun startNewSession() {
        if (isGenerating) {
            Toast.makeText(context, "Generation in progress, please wait", Toast.LENGTH_SHORT).show()
            return
        }

        // 1. Save current session before wiping
        saveCurrentSessionToHistory()

        // 2. Clear past session workspace completely
        chatMessages.clear()
        promptInput = ""
        urlInput = ""
        videoId = ""
        currentThumbnailUrl = null
        originalSourceThumbnailUrl = null
        generatedImageUrl = null
        markedPins.clear()
        referenceImages.clear()
        activeGeneratingBaseImage = null
        activeGeneratingPrompt = ""
        activeGeneratingRefs = emptyList()
        activeGeneratingPins = emptyList()
        preferNewChat = true

        // 3. Generate a fresh new session ID
        activeSessionId = UUID.randomUUID().toString()

        // 4. Initial welcome message in new chat
        chatMessages.add(
            ThumbnailChatMessage(
                isUser = false,
                text = "✨ Started a fresh revision session. Paste a YouTube URL or select a base thumbnail to begin.",
                previewImageUrl = null
            )
        )

        // 5. Instruct Dg-Images companion app to start fresh ChatGPT conversation and reset cache
        coroutineScope.launch {
            try {
                com.digicast.app.api.extension.DefaultImageStudioExtension().resetSession(context)
            } catch (t: Throwable) {
                android.util.Log.w("ThumbnailStudio", "Error requesting resetSession from Dg-Images: ${t.message}")
            }
        }

        Toast.makeText(context, "✨ Started New Session", Toast.LENGTH_SHORT).show()
    }

    // ── Helper: Switch to a Past Session ────────────────────────────────────
    fun switchSession(session: ThumbnailSession) {
        if (isGenerating) {
            Toast.makeText(context, "Please wait until generation finishes", Toast.LENGTH_SHORT).show()
            return
        }
        if (activeSessionId != session.id) {
            saveCurrentSessionToHistory()
        }

        activeSessionId = session.id
        currentThumbnailUrl = session.thumbnailUrl
        generatedImageUrl = session.generatedImageUrl
        videoId = session.videoId
        urlInput = session.videoUrl
        markedPins.clear()
        referenceImages.clear()
        promptInput = ""
        preferNewChat = false

        chatMessages.clear()
        chatMessages.addAll(session.messages)

        Toast.makeText(context, "Loaded: ${session.title}", Toast.LENGTH_SHORT).show()
    }

    // ── Helper: Delete Session ──────────────────────────────────────────────
    fun deleteSession(sessionId: String) {
        savedSessions.removeAll { it.id == sessionId }
        ThumbnailSessionStorage.persistSessions(context, savedSessions.toList())
        if (activeSessionId == sessionId) {
            startNewSession()
        } else {
            Toast.makeText(context, "Session deleted", Toast.LENGTH_SHORT).show()
        }
    }

    // ── Helper: Check Dg-Images installation ────────────────────────────────
    fun checkAppInstalled(): Boolean {
        return try {
            context.packageManager.getPackageInfo("com.digicast.dgimages", 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    LaunchedEffect(Unit) {
        val loaded = ThumbnailSessionStorage.loadSessions(context)
        savedSessions.clear()
        savedSessions.addAll(loaded)
        val installed = checkAppInstalled()
        isDgImagesAppInstalled = installed
        coroutineScope.launch(Dispatchers.IO) {
            var daemonAlive = try {
                val conn = URL("http://127.0.0.1:5488/v1/health").openConnection(java.net.Proxy.NO_PROXY) as HttpURLConnection
                conn.connectTimeout = 2000
                conn.readTimeout = 2000
                conn.responseCode == 200
            } catch (_: Exception) {
                false
            }

            if (!daemonAlive && installed) {
                try {
                    val sIntent = Intent().apply {
                        component = android.content.ComponentName("com.digicast.dgimages", "com.digicast.dgimages.service.DgImagesService")
                    }
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        context.startForegroundService(sIntent)
                    } else {
                        context.startService(sIntent)
                    }
                } catch (_: Exception) {}
            }

            if (daemonAlive) {
                withContext(Dispatchers.Main) {
                    isDgImagesAppInstalled = true
                }
            }
        }
        extensionViewModel.getImageStudio()
    }

    // ── Helper: Parse YouTube Video ID ──────────────────────────────────────
    fun parseYoutubeId(url: String): String? {
        val pattern = Pattern.compile(
            "(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|watch\\?v=|watch\\?.+&v=|live\\/))([\\w-]{11})",
            Pattern.CASE_INSENSITIVE
        )
        val matcher = pattern.matcher(url.trim())
        return if (matcher.find()) matcher.group(1) else null
    }

    // ── Fetch Thumbnail from CDN ────────────────────────────────────────────
    fun fetchThumbnail() {
        if (isGenerating) {
            Toast.makeText(context, "Generation in progress, please wait", Toast.LENGTH_SHORT).show()
            return
        }
        val parsedId = parseYoutubeId(urlInput)
        if (parsedId != null) {
            videoId = parsedId
            isFetchingUrl = true
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    val maxResUrl = "https://img.youtube.com/vi/$parsedId/maxresdefault.jpg"
                    val hqUrl = "https://img.youtube.com/vi/$parsedId/hqdefault.jpg"
                    val finalUrl = try {
                        val conn = URL(maxResUrl).openConnection() as HttpURLConnection
                        conn.requestMethod = "HEAD"
                        conn.connectTimeout = 3000
                        conn.readTimeout = 3000
                        if (conn.responseCode == 200) maxResUrl else hqUrl
                    } catch (_: Exception) {
                        hqUrl
                    }
                    withContext(Dispatchers.Main) {
                        saveCurrentSessionToHistory()
                        chatMessages.clear()
                        activeSessionId = UUID.randomUUID().toString()

                        currentThumbnailUrl = finalUrl
                        originalSourceThumbnailUrl = finalUrl
                        generatedImageUrl = null
                        markedPins.clear()
                        referenceImages.clear()
                        promptInput = ""
                        preferNewChat = true
                        chatMessages.add(
                            ThumbnailChatMessage(
                                isUser = false,
                                text = "Loaded video thumbnail ($parsedId). Ready for pinpoint revisions.",
                                previewImageUrl = finalUrl
                            )
                        )
                        saveCurrentSessionToHistory()
                    }
                } finally {
                    withContext(Dispatchers.Main) {
                        isFetchingUrl = false
                    }
                }
            }
        } else {
            Toast.makeText(context, "Please enter a valid YouTube video or stream URL", Toast.LENGTH_SHORT).show()
        }
    }

    // ── Helper: Convert Uri to compressed Base64 Data URL ───────────────────
    fun extractFrameFromVideo(uri: Uri): Bitmap? {
        return try {
            val retriever = android.media.MediaMetadataRetriever()
            if (uri.scheme == "file") {
                retriever.setDataSource(uri.path)
            } else {
                retriever.setDataSource(context, uri)
            }
            // Retrieve keyframe at 1 second
            val timeUs = 1_000_000L
            val frame = retriever.getFrameAtTime(timeUs, android.media.MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                ?: retriever.frameAtTime
            retriever.release()
            frame
        } catch (e: Throwable) {
            Log.e("ThumbnailStudio", "Error extracting video frame: ${e.message}", e)
            null
        }
    }

    fun resolveMediaAssetToBase64(context: Context, mediaStr: String): String? {
        if (mediaStr.isBlank()) return null
        if (mediaStr.startsWith("data:image/")) return mediaStr

        return try {
            val rawBytes: ByteArray? = when {
                mediaStr.startsWith("http://") || mediaStr.startsWith("https://") -> {
                    try {
                        val conn = (URL(mediaStr).openConnection() as HttpURLConnection).apply {
                            setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
                            setRequestProperty("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
                            connectTimeout = 12000
                            readTimeout = 12000
                        }
                        if (conn.responseCode in 200..299) {
                            conn.inputStream.use { it.readBytes() }
                        } else null
                    } catch (e: Exception) {
                        Log.e("ThumbnailStudio", "Error downloading HTTP asset: ${e.message}", e)
                        null
                    }
                }
                mediaStr.startsWith("file://") -> {
                    val path = mediaStr.substring(7)
                    val f = File(path)
                    if (f.exists()) f.readBytes() else null
                }
                mediaStr.startsWith("content://") -> {
                    val uri = Uri.parse(mediaStr)
                    try {
                        val mimeType = try { context.contentResolver.getType(uri) ?: "" } catch (_: Throwable) { "" }
                        val isVideo = mimeType.startsWith("video/") ||
                                (uri.path ?: "").endsWith(".mp4", true) ||
                                (uri.path ?: "").endsWith(".mov", true)
                        if (isVideo) {
                            val videoFrame = extractFrameFromVideo(uri)
                            if (videoFrame != null) {
                                val stream = ByteArrayOutputStream()
                                videoFrame.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                                stream.toByteArray()
                            } else null
                        } else {
                            context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        }
                    } catch (e: Exception) {
                        Log.e("ThumbnailStudio", "Error reading content URI: ${e.message}", e)
                        null
                    }
                }
                mediaStr.startsWith("/") -> {
                    val f = File(mediaStr)
                    if (f.exists()) f.readBytes() else null
                }
                else -> null
            }

            if (rawBytes == null || rawBytes.isEmpty()) {
                Log.w("ThumbnailStudio", "Failed to retrieve raw bytes for media: ${mediaStr.take(50)}")
                return null
            }

            val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, boundsOptions)

            val maxDim = 1024
            var inSampleSize = 1
            val rawW = boundsOptions.outWidth
            val rawH = boundsOptions.outHeight
            if (rawW > maxDim || rawH > maxDim) {
                val halfW = rawW / 2
                val halfH = rawH / 2
                while ((halfW / inSampleSize) >= maxDim || (halfH / inSampleSize) >= maxDim) {
                    inSampleSize *= 2
                }
            }

            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
                inPreferredConfig = Bitmap.Config.RGB_565
            }
            val originalBitmap = BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, decodeOptions)
                ?: return null

            val width = originalBitmap.width
            val height = originalBitmap.height
            val scaledBitmap = if (width > maxDim || height > maxDim) {
                val ratio = width.toFloat() / height.toFloat()
                val newWidth = if (width > height) maxDim else (maxDim * ratio).toInt()
                val newHeight = if (height > width) maxDim else (maxDim / ratio).toInt()
                Bitmap.createScaledBitmap(originalBitmap, newWidth.coerceAtLeast(1), newHeight.coerceAtLeast(1), true)
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val bytes = outputStream.toByteArray()
            val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            Log.i("ThumbnailStudio", "⚡ Resolved media to Base64 (${width}x${height} -> ${bytes.size} bytes): ${mediaStr.take(30)}")
            "data:image/jpeg;base64,$base64"
        } catch (t: Throwable) {
            Log.e("ThumbnailStudio", "resolveMediaAssetToBase64 failed: ${t.message}", t)
            null
        }
    }

    fun uriToBase64(uri: Uri): String? {
        return resolveMediaAssetToBase64(context, uri.toString())
    }

    // ── Helper: Synthesize Master Prompt ────────────────────────────────────
    fun synthesizeMasterPrompt(
        userText: String,
        pins: List<MarkedPin>,
        refCount: Int
    ): String {
        val builder = StringBuilder()
        builder.appendLine("[TASK: INPAINTING & PRECISE SUBJECT REVISION]")
        builder.appendLine("STRICT PRESERVATION DIRECTIVES (DO NOT VIOLATE):")
        builder.appendLine("1. PRESERVE ALL EXISTING BACKGROUND TEXT, TYPOGRAPHY, HEADLINES, WORDS, NUMBERS, AND LOGOS EXACTLY AS THEY ARE IN THE BASE IMAGE. DO NOT REGENERATE, ALTER, SPELL, TRANSLATE, REPLACE, OR DISTORT ANY EXISTING TEXT OR GRAPHICS IN THE BASE THUMBNAIL.")
        builder.appendLine("2. PRESERVE THE OVERALL COMPOSITION, BACKGROUND ENVIRONMENT, LIGHTING SCHEME, AND COLOR PALETTE. ONLY EDIT/REPLACE THE SPECIFIC TARGETED CHARACTER/OBJECT AT THE DESIGNATED LOCATION.")
        if (pins.isNotEmpty()) {
            builder.appendLine("3. TARGET LOCATIONS ON CANVAS:")
            pins.forEach { pin ->
                builder.appendLine("   - Pin #${pin.id} at X=${"%.1f".format(Locale.US, pin.xPercent)}%, Y=${"%.1f".format(Locale.US, pin.yPercent)}% (measured from top-left)")
            }
        }
        if (refCount > 0) {
            builder.appendLine("4. REFERENCE CHARACTER / ASSET:")
            builder.appendLine("   - $refCount visual reference image(s) provided.")
            builder.appendLine("   - Explicitly match the subject/person/character from the attached reference photo (exact facial structure, skin tone, clothing, and likeness).")
            builder.appendLine("   - Blend the reference subject seamlessly into the scene with matching lighting, depth, shadows, and natural perspective.")
        }
        builder.appendLine("5. USER REQUEST:")
        builder.appendLine(userText.trim())
        builder.appendLine("6. QUALITY DIRECTIVE:")
        builder.appendLine("- Output a pristine 16:9 full-bleed 1080p photorealistic composition with seamless blending.")
        return builder.toString().trim()
    }

    // ── Save to Downloads via MediaStore ────────────────────────────────────
    fun saveImageToDownloads(imageUrl: String) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val input: InputStream = URL(imageUrl).openStream()
                val bitmap = BitmapFactory.decodeStream(input)

                val fileName = "Dieme_Thumb_${System.currentTimeMillis()}.jpg"
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Dieme/Thumbnails")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                val uri: Uri? = context.contentResolver.insert(
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI
                    } else {
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                    },
                    contentValues
                )

                uri?.let { destUri ->
                    context.contentResolver.openOutputStream(destUri)?.use { out ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        contentValues.clear()
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                        context.contentResolver.update(destUri, contentValues, null, null)
                    }
                }

                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Saved to Downloads/Dieme/Thumbnails!", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Failed to save: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // ── Execute Generation with Dg-Images Companion ─────────────────────────
    fun sendPromptAndGenerate() {
        val userPrompt = promptInput.trim()
        if (userPrompt.isEmpty() && markedPins.isEmpty()) {
            Toast.makeText(context, "Please enter an edit instruction or drop a target pin", Toast.LENGTH_SHORT).show()
            return
        }

        // Prioritize original video source thumbnail so character replacements and revisions don't compound old revisions unintentionally
        val baseImage = if (originalSourceThumbnailUrl != null && currentThumbnailUrl == generatedImageUrl && markedPins.isNotEmpty()) {
            originalSourceThumbnailUrl ?: currentThumbnailUrl
        } else {
            currentThumbnailUrl
        }
        if (baseImage == null) {
            Toast.makeText(context, "Please load a video thumbnail first", Toast.LENGTH_SHORT).show()
            return
        }

        isDgImagesAppInstalled = checkAppInstalled()
        if (!isDgImagesAppInstalled) {
            showDgImagesDownloadDialog = true
            Toast.makeText(
                context,
                "Dg-Images companion app is not installed. Please download Dg-Images to enable AI revisions.",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        val currentPinsSnapshot = markedPins.toList()
        val currentRefsSnapshot = referenceImages.toList()
        val currentNewChatChoice = preferNewChat

        // If starting a fresh new chat session, archive previous messages so active chat stays clean
        if (currentNewChatChoice && chatMessages.isNotEmpty()) {
            saveCurrentSessionToHistory()
            chatMessages.clear()
            activeSessionId = UUID.randomUUID().toString()
        }

        val displayPrompt = if (userPrompt.isNotEmpty()) userPrompt else "Refine marked target regions"
        chatMessages.add(
            ThumbnailChatMessage(
                isUser = true,
                text = displayPrompt,
                pins = currentPinsSnapshot,
                referenceImageCount = currentRefsSnapshot.size
            )
        )

        // Snapshot generation context for full-screen ChatGPT-style overlay
        activeGeneratingBaseImage = baseImage
        activeGeneratingPrompt = displayPrompt
        activeGeneratingRefs = currentRefsSnapshot
        activeGeneratingPins = currentPinsSnapshot

        // Clear active inputs as requested
        promptInput = ""
        urlInput = ""

        val pendingMessageId = UUID.randomUUID().toString()
        chatMessages.add(
            ThumbnailChatMessage(
                id = pendingMessageId,
                isUser = false,
                text = "Processing revision...",
                isGenerating = true,
                status = "Generating revision with AI engine..."
            )
        )
        saveCurrentSessionToHistory()

        isGenerating = true
        generationStatusMessage = "Connecting to Dg-Images..."

        coroutineScope.launch {
            try {
                val resolvedBaseImage = withContext(Dispatchers.IO) {
                    resolveMediaAssetToBase64(context, baseImage) ?: baseImage
                }

                val base64RefList = withContext(Dispatchers.IO) {
                    currentRefsSnapshot.mapNotNull { resolveMediaAssetToBase64(context, it.toString()) }
                }

                val masterPrompt = synthesizeMasterPrompt(
                    userText = displayPrompt,
                    pins = currentPinsSnapshot,
                    refCount = base64RefList.size
                )

                val advancedWrapper = JSONObject().apply {
                    val pinsArray = JSONArray()
                    currentPinsSnapshot.forEach { pin ->
                        val p = JSONObject().apply {
                            put("id", pin.id)
                            put("x", pin.xPercent)
                            put("y", pin.yPercent)
                        }
                        pinsArray.put(p)
                    }
                    put("pins", pinsArray)
                    put("preferNewChat", currentNewChatChoice)
                    val refArray = JSONArray()
                    base64RefList.forEach { refArray.put(it) }
                    put("referenceImages", refArray)
                }

                val extension = extensionViewModel.getImageStudio()
                if (extension == null) {
                    generationStatusMessage = ""
                    val index = chatMessages.indexOfFirst { it.id == pendingMessageId }
                    val errorMsg = ThumbnailChatMessage(
                        id = pendingMessageId,
                        isUser = false,
                        text = "⚠️ Extension bridge not ready. Please make sure Dg-Images companion app is installed.",
                        isGenerating = false
                    )
                    if (index != -1) {
                        chatMessages[index] = errorMsg
                    } else {
                        chatMessages.add(errorMsg)
                    }
                    Toast.makeText(context, "Dg-Images bridge not ready", Toast.LENGTH_LONG).show()
                    return@launch
                }

                val result = extension.generateThumbnail(
                    context = context,
                    baseImageUrl = resolvedBaseImage,
                    maskPointsJson = advancedWrapper.toString(),
                    prompt = masterPrompt,
                    onProgress = { _, message ->
                        generationStatusMessage = message
                    }
                )

                val index = chatMessages.indexOfFirst { it.id == pendingMessageId }
                        if (result.isSuccess) {
                    val resultUrl = result.getOrNull() ?: baseImage
                    generatedImageUrl = resultUrl
                    currentThumbnailUrl = resultUrl

                    val successMsg = ThumbnailChatMessage(
                        id = pendingMessageId,
                        isUser = false,
                        text = "Generated revision: ${if (currentPinsSnapshot.isNotEmpty()) "${currentPinsSnapshot.size} pins targeted" else "Canvas updated"}.",
                        previewImageUrl = resultUrl,
                        isGenerating = false
                    )
                    if (index != -1) {
                        chatMessages[index] = successMsg
                    } else {
                        chatMessages.add(successMsg)
                    }
                    markedPins.clear()
                    referenceImages.clear()
                    // Keep preferNewChat true so every thumbnail generation task gets a clean ChatGPT thread!
                    preferNewChat = true
                    Toast.makeText(context, "Thumbnail generated by Dg-Images!", Toast.LENGTH_SHORT).show()
                } else {
                    val errorMsg = ThumbnailChatMessage(
                        id = pendingMessageId,
                        isUser = false,
                        text = "Generation failed: ${result.exceptionOrNull()?.message ?: "Connection timeout"}",
                        isGenerating = false,
                        status = "Error"
                    )
                    if (index != -1) {
                        chatMessages[index] = errorMsg
                    } else {
                        chatMessages.add(errorMsg)
                    }
                    Toast.makeText(context, "Generation error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                val index = chatMessages.indexOfFirst { it.id == pendingMessageId }
                val errorMsg = ThumbnailChatMessage(
                    id = pendingMessageId,
                    isUser = false,
                    text = "Generation encountered an unexpected error: ${e.message ?: "Unknown"}",
                    isGenerating = false,
                    status = "Error"
                )
                if (index != -1) {
                    chatMessages[index] = errorMsg
                } else {
                    chatMessages.add(errorMsg)
                }
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                isGenerating = false
                saveCurrentSessionToHistory()
            }
        }
    }

    // ── Main Layout with Collapsible Side Drawer ────────────────────────────
    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = DigicastDeepNavy,
            modifier = Modifier.navigationBarsPadding(),
            topBar = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DigicastNavy)
                        .drawBehind {
                            drawLine(
                                color = Color.White.copy(alpha = 0.08f),
                                start = Offset(0f, size.height),
                                end = Offset(size.width, size.height),
                                strokeWidth = 1.dp.toPx()
                            )
                        }
                        .padding(horizontal = if (isSmallScreen) 10.dp else 14.dp, vertical = if (isShortScreen) 7.dp else 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left Group: Back Button + Screen Title
                    Row(
                        modifier = Modifier.weight(1f, fill = false),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(if (isSmallScreen) 6.dp else 10.dp)
                    ) {
                        // Back Navigation Button
                        Box(
                            modifier = Modifier
                                .size(if (isSmallScreen) 32.dp else 36.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.08f))
                                .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                                .clickable { onNavigateBack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White,
                                modifier = Modifier.size(if (isSmallScreen) 16.dp else 18.dp)
                            )
                        }

                        // Screen Title
                        Text(
                            text = "Thumbnail Studio",
                            color = Color.White,
                            fontSize = if (isSmallScreen) 14.sp else 16.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Right Group: Fresh New Session Button + Companion Indicator Pill
                    val isBridgeReady = isDgImagesAppInstalled && (loadedExtension != null || extensionViewModel.getImageStudio() != null)
                    val statusDotColor = if (isBridgeReady) Color(0xFF10B981) else Color(0xFFF59E0B)

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Start Fresh New Session Button
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color(0xFF134E5E).copy(alpha = 0.85f))
                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
                                .clickable { startNewSession() }
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
                                Text("New", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp),
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(statusDotColor.copy(alpha = 0.12f))
                                .border(1.dp, statusDotColor.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
                                .clickable {
                                    if (!isBridgeReady) {
                                        showDgImagesDownloadDialog = true
                                    }
                                }
                                .padding(horizontal = if (isSmallScreen) 7.dp else 9.dp, vertical = 5.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(if (isSmallScreen) 6.dp else 7.dp)
                                    .clip(CircleShape)
                                    .background(statusDotColor)
                            )
                            Text(
                                text = if (isBridgeReady) "Connected" else (if (isSmallScreen) "Companion 📥" else "Get Companion App 📥"),
                                color = statusDotColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            },
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.TopCenter
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 760.dp),
                    contentPadding = PaddingValues(if (isSmallScreen) 12.dp else 16.dp),
                    verticalArrangement = Arrangement.spacedBy(if (isShortScreen) 12.dp else 16.dp)
                ) {
                // ── 0. Dg-Images Companion Banner (When not installed)
                if (!isDgImagesAppInstalled) {
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            color = DigicastNavy,
                            border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.45f))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFF59E0B).copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Palette,
                                        contentDescription = null,
                                        tint = Color(0xFFF59E0B),
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Dg-Images Companion Required",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Install Dg-Images to enable local AI inpainting and generate YouTube thumbnails.",
                                        color = DigicastSlate,
                                        fontSize = 11.sp,
                                        lineHeight = 15.sp
                                    )
                                }
                                Button(
                                    onClick = { showDgImagesDownloadDialog = true },
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Download", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
                // ── 1. YouTube Link Input Capsule (Cleanable & Empty by Default)
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "STREAM / VIDEO SOURCE",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp
                        )

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(AppleDarkEdgeCardBrush)
                                .border(1.dp, AppleSpecularBorder, RoundedCornerShape(16.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Link,
                                contentDescription = null,
                                tint = DigicastElectricCyan,
                                modifier = Modifier.size(18.dp)
                            )

                            androidx.compose.foundation.text.BasicTextField(
                                value = urlInput,
                                onValueChange = { urlInput = it },
                                singleLine = true,
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = Color.White,
                                    fontSize = 13.sp
                                ),
                                modifier = Modifier.weight(1f),
                                decorationBox = { innerTextField ->
                                    if (urlInput.isEmpty()) {
                                        Text(
                                            text = "Paste YouTube livestream or video link...",
                                            color = Color.White.copy(alpha = 0.4f),
                                            fontSize = 13.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                    innerTextField()
                                }
                            )

                            // Clear Button (X) when text is present
                            if (urlInput.isNotEmpty()) {
                                IconButton(
                                    onClick = { urlInput = "" },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Clear URL",
                                        tint = Color.White.copy(alpha = 0.6f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }

                            // SINGLE Contextual Button: Shows "Paste" when empty; transforms to "Fetch" when link is present
                            if (urlInput.isBlank()) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(9999.dp))
                                        .background(Color.White.copy(alpha = 0.1f))
                                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(9999.dp))
                                        .clickable {
                                            clipboardManager.getText()?.text?.let { text ->
                                                if (text.isNotBlank()) {
                                                    urlInput = text.trim()
                                                    fetchThumbnail()
                                                }
                                            }
                                        }
                                        .padding(horizontal = 12.dp, vertical = 7.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ContentPaste,
                                            contentDescription = "Paste",
                                            tint = Color.White,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Text(
                                            text = "Paste",
                                            color = Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            softWrap = false
                                        )
                                    }
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(9999.dp))
                                        .background(Color(0xFF134E5E))
                                        .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), RoundedCornerShape(9999.dp))
                                        .clickable { fetchThumbnail() }
                                        .padding(horizontal = 12.dp, vertical = 7.dp)
                                ) {
                                    if (isFetchingUrl) {
                                        CircularProgressIndicator(
                                            color = DigicastElectricCyan,
                                            modifier = Modifier.size(14.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.AutoAwesome,
                                                contentDescription = "Fetch",
                                                tint = DigicastElectricCyan,
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Text(
                                                text = "Fetch",
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                softWrap = false
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ── 2. 16:9 Thumbnail Canvas Viewport with Clean Empty Placeholder
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "16:9 THUMBNAIL CANVAS",
                                color = DigicastSlate,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.sp
                            )

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (markedPins.isNotEmpty()) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color.White.copy(alpha = 0.08f))
                                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                            .clickable { markedPins.clear() }
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text("Clear ${markedPins.size} Pins", color = DigicastSlate, fontSize = 11.sp)
                                    }
                                }
                            }
                        }

                        // 16:9 Canvas Frame
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(16f / 9f)
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color(0xFF041014))
                                .border(
                                    width = if (isGenerating) 2.dp else 1.5.dp,
                                    brush = if (isGenerating) {
                                        Brush.sweepGradient(
                                            listOf(
                                                DigicastElectricCyan.copy(alpha = borderPulseAlpha),
                                                Color(0xFF10B981).copy(alpha = borderPulseAlpha),
                                                Color(0xFF134E5E),
                                                DigicastElectricCyan.copy(alpha = borderPulseAlpha)
                                            )
                                        )
                                    } else AppleSpecularBorder,
                                    shape = RoundedCornerShape(20.dp)
                                )
                                .onGloballyPositioned { coordinates ->
                                    canvasSize = coordinates.size
                                }
                                .pointerInput(currentThumbnailUrl, generatedImageUrl, isGenerating) {
                                    detectTapGestures { tapOffset ->
                                        if (!isGenerating && generatedImageUrl == null && currentThumbnailUrl != null && size.width > 0 && size.height > 0) {
                                            val xPct = (tapOffset.x / size.width.toFloat()) * 100f
                                            val yPct = (tapOffset.y / size.height.toFloat()) * 100f
                                            val nextId = (markedPins.maxOfOrNull { it.id } ?: 0) + 1
                                            markedPins.add(MarkedPin(id = nextId, xPercent = xPct, yPercent = yPct))
                                        }
                                    }
                                }
                        ) {
                            if (currentThumbnailUrl != null) {
                                AsyncImage(
                                    model = ImageRequest.Builder(context)
                                        .data(currentThumbnailUrl ?: generatedImageUrl)
                                        .crossfade(true)
                                        .memoryCachePolicy(CachePolicy.DISABLED)
                                        .diskCachePolicy(CachePolicy.DISABLED)
                                        .build(),
                                    contentDescription = "Thumbnail Canvas",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )

                                // Only draw pin markers when on base image (no pins on generated revision)
                                if (generatedImageUrl == null) {
                                    // Render Glowing Mark Points on Canvas
                                    Canvas(modifier = Modifier.fillMaxSize()) {
                                        markedPins.forEach { pin ->
                                            val px = (pin.xPercent / 100f) * size.width
                                            val py = (pin.yPercent / 100f) * size.height
                                            val center = Offset(px, py)

                                            // Outer pulsing ring
                                            drawCircle(
                                                color = Color(0xFF2DD4BF).copy(alpha = pinPulseAlpha),
                                                radius = 26f,
                                                center = center,
                                                style = Stroke(width = 3f)
                                            )

                                            // Inner target circle
                                            drawCircle(
                                                color = Color(0xFF134E5E),
                                                radius = 16f,
                                                center = center
                                            )
                                            drawCircle(
                                                color = Color.White,
                                                radius = 16f,
                                                center = center,
                                                style = Stroke(width = 2.5f)
                                            )
                                            // Target center dot
                                            drawCircle(
                                                color = Color(0xFF00F0FF),
                                                radius = 4f,
                                                center = center
                                            )
                                        }
                                    }

                                    // Render Pin Badges (#1, #2) with coordinates
                                    Box(modifier = Modifier.fillMaxSize()) {
                                        markedPins.forEach { pin ->
                                            Box(
                                                modifier = Modifier
                                                    .padding(
                                                        start = ((pin.xPercent / 100f) * 280).dp,
                                                        top = ((pin.yPercent / 100f) * 160).dp
                                                    )
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(Color.Black.copy(alpha = 0.85f))
                                                    .border(1.dp, DigicastElectricCyan, RoundedCornerShape(6.dp))
                                                    .clickable { markedPins.remove(pin) }
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(
                                                    text = "#${pin.id} (${"%.0f".format(Locale.US, pin.xPercent)}%, ${"%.0f".format(Locale.US, pin.yPercent)}%)",
                                                    color = DigicastElectricCyan,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    // Instruction overlay hint
                                    if (markedPins.isEmpty() && !isGenerating) {
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.BottomCenter)
                                                .padding(bottom = 10.dp)
                                                .clip(RoundedCornerShape(9999.dp))
                                                .background(Color.Black.copy(alpha = 0.65f))
                                                .padding(horizontal = 12.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = "Tap anywhere on image to drop a target pin",
                                                color = Color.White.copy(alpha = 0.85f),
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }

                                // Resolution / Source Toggle Badge top-left
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(12.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.Black.copy(alpha = 0.75f))
                                        .border(
                                            1.dp,
                                            if (generatedImageUrl != null) DigicastElectricCyan.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.2f),
                                            RoundedCornerShape(6.dp)
                                        )
                                        .clickable {
                                            if (generatedImageUrl != null && originalSourceThumbnailUrl != null) {
                                                if (currentThumbnailUrl == generatedImageUrl) {
                                                    currentThumbnailUrl = originalSourceThumbnailUrl
                                                    Toast.makeText(context, "Showing Original Source", Toast.LENGTH_SHORT).show()
                                                } else {
                                                    currentThumbnailUrl = generatedImageUrl
                                                    Toast.makeText(context, "Showing AI Revision", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = if (generatedImageUrl != null) {
                                            if (currentThumbnailUrl == generatedImageUrl) "✨ AI GENERATED (Tap: View Original)" else "🎬 ORIGINAL SOURCE (Tap: View AI Revision)"
                                        } else "1280×720 • HD SOURCE",
                                        color = if (generatedImageUrl != null) DigicastElectricCyan else Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }



                                // ── Background Canvas Placeholder when Generating ───────
                                if (isGenerating) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color(0xD9030A0D)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        CircularProgressIndicator(
                                            color = DigicastElectricCyan,
                                            strokeWidth = 2.dp,
                                            modifier = Modifier.size(28.dp)
                                        )
                                    }
                                }

                            } else {
                                // ── CLEAN EMPTY CANVAS PLACEHOLDER ─────────────────
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF0F323A))
                                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.SmartDisplay,
                                            contentDescription = null,
                                            tint = DigicastElectricCyan,
                                            modifier = Modifier.size(26.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = "16:9 Canvas Ready",
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Paste a YouTube link above & tap Fetch, or prompt to generate from scratch",
                                        color = DigicastSlate,
                                        fontSize = 11.sp,
                                        textAlign = TextAlign.Center,
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // ── 2.5 Active Revision Dispatch / Result Showcase ───────
                if (isGenerating) {
                    item {
                        ActiveRevisionDispatchCard(
                            status = generationStatusMessage.ifBlank { "Synthesizing revision with Dg-Images..." },
                            baseImageUrl = activeGeneratingBaseImage,
                            referenceImages = activeGeneratingRefs,
                            markedPins = activeGeneratingPins
                        )
                    }
                } else if (generatedImageUrl != null) {
                    item {
                        GeneratedResultShowcaseCard(
                            generatedUrl = generatedImageUrl!!,
                            onSave = {
                                if (PermissionHelper.hasStoragePermissions(context)) {
                                    saveImageToDownloads(generatedImageUrl!!)
                                } else {
                                    pendingImageUrlToSave = generatedImageUrl
                                    showStoragePermissionForThumbnail = true
                                }
                            },
                            onLoadAsBase = {
                                currentThumbnailUrl = generatedImageUrl
                                markedPins.clear()
                                generatedImageUrl = null
                                Toast.makeText(context, "Loaded as New Base Canvas", Toast.LENGTH_SHORT).show()
                            },
                            onReviseFurther = {
                                generatedImageUrl = null
                            }
                        )
                    }
                }

                // ── 3. ChatGPT-Style Input Capsule (Attachments Chips + Pill Composer) ─
                // Only shown when editing (hidden when generated result showcase is active)
                if (generatedImageUrl == null) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(26.dp))
                                .background(Color(0xFF161E24))
                                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(26.dp))
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                        // Attached Media & Active Pin Chips Row (shown inside top of capsule)
                        if (markedPins.isNotEmpty() || referenceImages.isNotEmpty()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                markedPins.forEach { pin ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(9999.dp))
                                            .background(Color(0xFF041A20))
                                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), RoundedCornerShape(9999.dp))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Text(
                                                text = "📍 Pin #${pin.id}",
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = "Remove Pin",
                                                tint = DigicastSlate,
                                                modifier = Modifier
                                                    .size(12.dp)
                                                    .clickable { markedPins.remove(pin) }
                                            )
                                        }
                                    }
                                }

                                referenceImages.forEach { uri ->
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    ) {
                                        AsyncImage(
                                            model = ImageRequest.Builder(context).data(uri).crossfade(true).build(),
                                            contentDescription = "Ref",
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.TopEnd)
                                                .size(16.dp)
                                                .clip(CircleShape)
                                                .background(Color.Black.copy(alpha = 0.75f))
                                                .clickable { referenceImages.remove(uri) },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(9.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // ChatGPT-Style Composer Bar ( (+) Attachment Icon | Message ChatGPT... | Circular (↑) Send Button )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.Bottom,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // (+) Attach Media Button
                            Box(
                                modifier = Modifier
                                    .padding(bottom = 2.dp)
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.08f))
                                    .clickable {
                                        if (referenceImages.size < 2) {
                                            try {
                                                imagePickerLauncher.launch(
                                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                                )
                                            } catch (_: Exception) {
                                                galleryPickerTargetIsBase = false
                                                showGalleryPicker = true
                                            }
                                        } else {
                                            Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = "Attach Reference",
                                    tint = if (referenceImages.isNotEmpty()) DigicastElectricCyan else Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            // Center Multiline Input
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(vertical = 4.dp)
                            ) {
                                androidx.compose.foundation.text.BasicTextField(
                                    value = promptInput,
                                    onValueChange = { promptInput = it },
                                    textStyle = androidx.compose.ui.text.TextStyle(
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        lineHeight = 20.sp
                                    ),
                                    modifier = Modifier.fillMaxWidth(),
                                    cursorBrush = SolidColor(DigicastElectricCyan),
                                    decorationBox = { innerTextField ->
                                        if (promptInput.isEmpty()) {
                                            Text(
                                                text = if (markedPins.isNotEmpty())
                                                    "Message ChatGPT (e.g. Inpaint Pin #1...)"
                                                else
                                                    "Message ChatGPT...",
                                                color = Color.White.copy(alpha = 0.45f),
                                                fontSize = 14.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                        innerTextField()
                                    }
                                )
                            }

                            // Circular Send Button
                            val canSend = !isGenerating && currentThumbnailUrl != null && (promptInput.isNotBlank() || markedPins.isNotEmpty() || referenceImages.isNotEmpty())

                            Box(
                                modifier = Modifier
                                    .padding(bottom = 2.dp)
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(if (canSend) DigicastElectricCyan else Color.White.copy(alpha = 0.08f))
                                    .clickable(enabled = canSend) { sendPromptAndGenerate() },
                                contentAlignment = Alignment.Center
                            ) {
                                if (isGenerating) {
                                    CircularProgressIndicator(
                                        color = DigicastElectricCyan,
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.ArrowUpward,
                                        contentDescription = "Send",
                                        tint = if (canSend) Color(0xFF030A0D) else Color.White.copy(alpha = 0.3f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(bottom = 24.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(if (isBridgeReady) Color(0xFF10B981) else Color(0xFFF59E0B))
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Dieme Studio v${AppUpdateManager.getCurrentVersionName(context)} (${AppUpdateManager.getCurrentVersionCode(context)}) • Dg-Images ${if (isBridgeReady) "Connected" else "Companion Standby"}",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
            }
        }
    }

    if (showGalleryPicker) {
        GalleryMediaPickerSheet(
            context = context,
            title = if (galleryPickerTargetIsBase) "Select Base Thumbnail Image" else "Attach Visual Reference (${referenceImages.size}/2)",
            subtitle = "Images Only • Camera, Screenshots, Downloads",
            isOpen = showGalleryPicker,
            onDismiss = { showGalleryPicker = false },
            onMediaSelected = { selectedUri, _ ->
                if (galleryPickerTargetIsBase) {
                    coroutineScope.launch(Dispatchers.IO) {
                        val optimizedUri = optimizeAndCacheImage(context, selectedUri) ?: selectedUri
                        withContext(Dispatchers.Main) {
                            currentThumbnailUrl = optimizedUri.toString()
                            generatedImageUrl = null
                            markedPins.clear()
                            chatMessages.add(
                                ThumbnailChatMessage(
                                    isUser = false,
                                    text = "Loaded image from gallery. Ready for pinpoint revisions.",
                                    previewImageUrl = optimizedUri.toString()
                                )
                            )
                            saveCurrentSessionToHistory()
                        }
                    }
                } else {
                    if (referenceImages.size < 2) {
                        coroutineScope.launch(Dispatchers.IO) {
                            val optimizedUri = optimizeAndCacheImage(context, selectedUri) ?: selectedUri
                            withContext(Dispatchers.Main) {
                                referenceImages.add(optimizedUri)
                            }
                        }
                    } else {
                        Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )
    }

    if (showDgImagesDownloadDialog) {
        AlertDialog(
            onDismissRequest = { showDgImagesDownloadDialog = false },
            containerColor = DigicastNavy,
            shape = RoundedCornerShape(16.dp),
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(DigicastElectricCyan.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Palette,
                            contentDescription = null,
                            tint = DigicastElectricCyan,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        text = "Download Dg-Images",
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Dieme Thumbnail Studio pairs with the Dg-Images companion app to run on-device AI inpainting and canvas revisions without uploading your full stream to external servers.",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                    Text(
                        text = "• On-device local AI daemon (Port 5488)\n• ChatGPT web canvas integration\n• High-fidelity 1080p thumbnail export",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        lineHeight = 17.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val downloadIntent = Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://www.dieme.in/api/download/apk?app=dg-images")
                        ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                        try {
                            context.startActivity(downloadIntent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Cannot open download link: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                        showDgImagesDownloadDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Download APK (~22 MB)", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        isDgImagesAppInstalled = checkAppInstalled()
                        showDgImagesDownloadDialog = false
                    }
                ) {
                    Text("Check Status", color = DigicastSlate)
                }
            }
        )
    }

    WorkPermissionRequester(
        show = showStoragePermissionForThumbnail,
        actionName = "save thumbnails to your device gallery",
        onPermissionGranted = {
            pendingImageUrlToSave?.let { saveImageToDownloads(it) }
            pendingImageUrlToSave = null
        },
        onDismiss = {
            showStoragePermissionForThumbnail = false
            pendingImageUrlToSave = null
        }
    )

    // ── Full-Screen ChatGPT-Style Generation Overlay with Auto-Playing Dot Snake ───
    AnimatedVisibility(
        visible = isGenerating,
        enter = fadeIn(animationSpec = tween(300)),
        exit = fadeOut(animationSpec = tween(300))
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF030712))
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // 1. Top Bar Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp)
                    .align(Alignment.TopCenter),
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
                            .clip(CircleShape)
                            .background(DigicastElectricCyan.copy(alpha = 0.15f))
                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = DigicastElectricCyan,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Generating 1080p Revision",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "ChatGPT AI Engine Active",
                            color = Color.White.copy(alpha = 0.55f),
                            fontSize = 11.sp
                        )
                    }
                }

                // Elapsed time badge with live seconds
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White.copy(alpha = 0.08f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF00F5A0))
                    )
                    Text(
                        text = String.format(Locale.US, "%02d:%02d", generationElapsedSeconds / 60, generationElapsedSeconds % 60),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // 2. Main Content: User prompt preview card + "Sketching it out" + Auto-Playing Dot Snake
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 65.dp, bottom = 100.dp)
            ) {
                // User Prompt & Media Request Card (ChatGPT Style)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    horizontalAlignment = Alignment.End
                ) {
                    // Preview images row (Base thumbnail + Gallery reference photo)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (activeGeneratingBaseImage != null) {
                            Box(
                                modifier = Modifier
                                    .size(width = 84.dp, height = 48.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF0F172A))
                                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            ) {
                                AsyncImage(
                                    model = activeGeneratingBaseImage,
                                    contentDescription = "Base Video Thumbnail",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }

                        activeGeneratingRefs.forEach { refUri ->
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF0F172A))
                                    .border(1.5.dp, DigicastElectricCyan, RoundedCornerShape(8.dp))
                            ) {
                                AsyncImage(
                                    model = refUri,
                                    contentDescription = "Gallery Reference",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // User Prompt bubble
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                            .background(Color(0xFF0E2A33))
                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = activeGeneratingPrompt.ifBlank { "Refine marked target regions" },
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // AI Status line (ChatGPT "Sketching it out" style)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(DigicastElectricCyan)
                    )
                    Text(
                        text = when {
                            generationElapsedSeconds < 4 -> "Sketching it out..."
                            generationElapsedSeconds < 14 -> "Drafting 1080p canvas with ChatGPT..."
                            generationElapsedSeconds < 24 -> "Blending reference face & specular highlights..."
                            else -> "Finalizing composition..."
                        },
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Dot Matrix Snake Game (Automatically runs!)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    DotMatrixSnakeGame(
                        modifier = Modifier.fillMaxSize(),
                        elapsedSeconds = generationElapsedSeconds,
                        onExitGame = { /* keeps running in full-screen */ }
                    )
                }
            }

            // 3. Bottom Bar: Single Clean Sleek Progress Loader
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color(0xFF030712).copy(alpha = 0.95f),
                                Color(0xFF030712)
                            )
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                contentAlignment = Alignment.Center
            ) {
                // Single sleek animated gradient progress bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.5.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color.White.copy(alpha = 0.12f))
                ) {
                    val progressFraction = ((generationElapsedSeconds % 25) / 25f).coerceIn(0.15f, 1f)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progressFraction)
                            .fillMaxHeight()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        DigicastElectricCyan,
                                        Color(0xFF00F5A0),
                                        DigicastElectricCyan
                                    )
                                )
                            )
                    )
                }
            }
        }
    }
}



private // ── Helper: Optimize & Cache Reference Images (Orientation Correction + 1024px Downsampling) ─
fun optimizeAndCacheImage(context: Context, sourceUri: Uri): Uri? {
    return try {
        // 1. Read EXIF Orientation
        var orientation = ExifInterface.ORIENTATION_NORMAL
        try {
            val exifStream = if (sourceUri.scheme == "file") {
                val p = sourceUri.path ?: ""
                File(p).inputStream()
            } else {
                context.contentResolver.openInputStream(sourceUri)
            }
            if (exifStream != null) {
                val exif = ExifInterface(exifStream)
                orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
                exifStream.close()
            }
        } catch (e: Exception) {
            Log.w("ThumbnailStudio", "Could not read EXIF: ${e.message}")
        }

        // 2. Decode Bounds
        val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        var boundsStream = if (sourceUri.scheme == "file") {
            val p = sourceUri.path ?: ""
            File(p).inputStream()
        } else {
            context.contentResolver.openInputStream(sourceUri)
        }
        BitmapFactory.decodeStream(boundsStream, null, boundsOptions)
        boundsStream?.close()

        val maxDim = 1024
        var inSampleSize = 1
        val rawW = boundsOptions.outWidth
        val rawH = boundsOptions.outHeight
        if (rawW > maxDim || rawH > maxDim) {
            val halfW = rawW / 2
            val halfH = rawH / 2
            while ((halfW / inSampleSize) >= maxDim || (halfH / inSampleSize) >= maxDim) {
                inSampleSize *= 2
            }
        }

        // 3. Decode Bitmap
        val decodeOptions = BitmapFactory.Options().apply {
            this.inSampleSize = inSampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        var decStream = if (sourceUri.scheme == "file") {
            val p = sourceUri.path ?: ""
            File(p).inputStream()
        } else {
            context.contentResolver.openInputStream(sourceUri)
        }
        val decoded = BitmapFactory.decodeStream(decStream, null, decodeOptions)
        decStream?.close()

        if (decoded == null) return null

        // 4. Matrix for EXIF orientation
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
        }

        val rotated = if (!matrix.isIdentity) {
            Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
        } else {
            decoded
        }

        // 5. Constrain to maxDim
        val curW = rotated.width
        val curH = rotated.height
        val finalBitmap = if (curW > maxDim || curH > maxDim) {
            val ratio = curW.toFloat() / curH.toFloat()
            val targetW = if (curW > curH) maxDim else (maxDim * ratio).toInt()
            val targetH = if (curH > curW) maxDim else (maxDim / ratio).toInt()
            Bitmap.createScaledBitmap(rotated, targetW.coerceAtLeast(1), targetH.coerceAtLeast(1), true)
        } else {
            rotated
        }

        // 6. Write compressed JPEG to cache
        val outFile = File(context.cacheDir, "ref_opt_${System.currentTimeMillis()}_${(100..999).random()}.jpg")
        FileOutputStream(outFile).use { out ->
            finalBitmap.compress(Bitmap.CompressFormat.JPEG, 88, out)
        }
        Log.i("ThumbnailStudio", "⚡ Optimized image: ${rawW}x${rawH} -> ${finalBitmap.width}x${finalBitmap.height} (${outFile.length()} bytes)")
        Uri.fromFile(outFile)
    } catch (e: Exception) {
        Log.e("ThumbnailStudio", "Error optimizing image: ${e.message}", e)
        sourceUri
    }
}

@Composable
private fun ThumbnailChatMessageBubble(
    message: ThumbnailChatMessage,
    generationStatusMessage: String,
    onDownload: (String) -> Unit,
    onLoadOnCanvas: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = if (message.isUser) Alignment.End else Alignment.Start
    ) {
        val cardModifier = if (message.isUser) {
            Modifier
                .fillMaxWidth(0.92f)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF0F323A))
                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
        } else {
            Modifier
                .fillMaxWidth(0.96f)
                .clip(RoundedCornerShape(14.dp))
                .background(AppleDarkEdgeCardBrush)
                .border(1.dp, AppleSpecularBorder, RoundedCornerShape(14.dp))
        }

        Box(modifier = cardModifier.padding(10.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (message.isUser) "YOU" else "AI ASSISTANT",
                        color = if (message.isUser) DigicastElectricCyan else DigicastEmerald,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(message.timestamp)),
                        color = DigicastSlate,
                        fontSize = 9.sp
                    )
                }

                // Text Message
                Text(
                    text = message.text,
                    color = Color.White,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )

                // Pins Chips
                if (message.pins.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        message.pins.forEach { pin ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Color.Black.copy(alpha = 0.4f))
                                    .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "📍 #${pin.id} (${"%.0f".format(Locale.US, pin.xPercent)}%, ${"%.0f".format(Locale.US, pin.yPercent)}%)",
                                    color = DigicastElectricCyan,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Loading Status
                if (message.isGenerating) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        CircularProgressIndicator(color = DigicastElectricCyan, modifier = Modifier.size(12.dp), strokeWidth = 1.5.dp)
                        Text(message.status ?: generationStatusMessage, color = DigicastSlate, fontSize = 11.sp)
                    }
                }

                // Compact ChatGPT-Style Result Card
                if (message.previewImageUrl != null && !message.isGenerating) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.Black.copy(alpha = 0.35f))
                            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(8.dp))
                            .padding(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Compact square preview thumbnail
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                        ) {
                            AsyncImage(
                                model = ImageRequest.Builder(context)
                                    .data(message.previewImageUrl)
                                    .crossfade(true)
                                    .memoryCachePolicy(CachePolicy.DISABLED)
                                    .diskCachePolicy(CachePolicy.DISABLED)
                                    .build(),
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }

                        // Compact actions
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text("✨ Revision Ready", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFF134E5E))
                                        .clickable {
                                            onDownload(message.previewImageUrl)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("Download", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.White.copy(alpha = 0.08f))
                                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                        .clickable {
                                            onLoadOnCanvas(message.previewImageUrl)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("Load on Canvas", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Live Dispatch Card (Shown Under Canvas When Generating) ─────────────────
@Composable
private fun ActiveRevisionDispatchCard(
    status: String,
    baseImageUrl: String?,
    referenceImages: List<Uri>,
    markedPins: List<MarkedPin>
) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0D141C))
            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(DigicastElectricCyan)
            )
            Text(
                text = "⚡ Generating Revision with Dg-Images...",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Text(
            text = status,
            color = Color.White.copy(alpha = 0.85f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )

        // Ongoing Assets & Pins Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Base Image Mini Preview
            if (baseImageUrl != null) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                ) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(baseImageUrl).crossfade(true).build(),
                        contentDescription = "Base",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Reference Assets Mini Previews
            referenceImages.forEach { refUri ->
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                ) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(refUri).crossfade(true).build(),
                        contentDescription = "Ref",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Pins Badge
            if (markedPins.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.White.copy(alpha = 0.08f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "🎯 ${markedPins.size} Target Pins",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ── Generated Result Showcase Card (Shown Under Canvas When Ready) ───────────
@Composable
private fun GeneratedResultShowcaseCard(
    generatedUrl: String,
    onSave: () -> Unit,
    onLoadAsBase: () -> Unit,
    onReviseFurther: () -> Unit
) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0D141C))
            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(DigicastEmerald)
                )
                Text(
                    text = "✨ Generated Revision Result",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = "1080P • AI ENGINE",
                color = DigicastSlate,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium
            )
        }

        // Crisp 16:9 Showcase Preview
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .clip(RoundedCornerShape(12.dp))
                .background(Color.Black)
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
        ) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(generatedUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = "Generated Result",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Action Buttons Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Save to Downloads Button
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF134E5E))
                    .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                    .clickable { onSave() }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "Save",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Set as Base Button
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                    .clickable { onLoadAsBase() }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Load as Base",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // Revise Further / New Edit Button
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                    .clickable { onReviseFurther() }
                    .padding(horizontal = 10.dp, vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "New Edit",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// ── Ongoing Assets & Pins Summary Card (Shown at Top of Drawer Tab 1) ────────
@Composable
private fun ActiveSessionOngoingSummaryCard(
    baseImageUrl: String?,
    referenceImages: List<Uri>,
    markedPins: List<MarkedPin>,
    generatedImageUrl: String?,
    isGenerating: Boolean,
    generationStatusMessage: String
) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0F1722))
            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "📌 Active Session Context",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (isGenerating) Color(0xFF0F323A)
                        else if (generatedImageUrl != null) Color(0xFF063A22)
                        else Color.White.copy(alpha = 0.08f)
                    )
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = if (isGenerating) "GENERATING" else if (generatedImageUrl != null) "RESULT READY" else "IDLE",
                    color = if (isGenerating) DigicastElectricCyan else if (generatedImageUrl != null) DigicastEmerald else DigicastSlate,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Assets Previews Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Base Image
            if (baseImageUrl != null) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                    ) {
                        AsyncImage(
                            model = ImageRequest.Builder(context).data(baseImageUrl).crossfade(true).build(),
                            contentDescription = "Base",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Text("Base", color = DigicastSlate, fontSize = 9.sp)
                }
            }

            // References
            referenceImages.forEachIndexed { idx, refUri ->
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    ) {
                        AsyncImage(
                            model = ImageRequest.Builder(context).data(refUri).crossfade(true).build(),
                            contentDescription = "Ref #$idx",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Text("Ref #${idx + 1}", color = DigicastElectricCyan, fontSize = 9.sp)
                }
            }

            // Generated Result Preview (if ready)
            if (generatedImageUrl != null) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(1.dp, DigicastEmerald.copy(alpha = 0.8f), RoundedCornerShape(8.dp))
                    ) {
                        AsyncImage(
                            model = ImageRequest.Builder(context).data(generatedImageUrl).crossfade(true).build(),
                            contentDescription = "Result",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Text("Result", color = DigicastEmerald, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Pins Coordinates Summary
            if (markedPins.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.Black.copy(alpha = 0.3f))
                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                        .padding(6.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text("🎯 Targeted Pins (${markedPins.size})", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    markedPins.take(2).forEach { pin ->
                        Text(
                            text = "Pin ${pin.id}: ${pin.xPercent.toInt()}%x, ${pin.yPercent.toInt()}%y",
                            color = DigicastSlate,
                            fontSize = 9.sp
                        )
                    }
                    if (markedPins.size > 2) {
                        Text("+${markedPins.size - 2} more pins", color = DigicastElectricCyan, fontSize = 9.sp)
                    }
                }
            }
        }
    }
}

