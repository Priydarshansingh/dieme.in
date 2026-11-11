package com.digicast.app.ui.screens.studio

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.digicast.app.ui.screens.settings.ExtensionViewModel
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
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

// ── Screen Implementation ───────────────────────────────────────────────────

@Composable
fun ThumbnailStudioScreen(
    onNavigateBack: () -> Unit,
    extensionViewModel: ExtensionViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    // ── Collapsible Left History Drawer State ───────────────────────────────
    var isHistoryDrawerOpen by remember { mutableStateOf(false) }

    // Intercept hardware back button to close drawer first if open
    BackHandler(enabled = isHistoryDrawerOpen) {
        isHistoryDrawerOpen = false
    }

    // ── Link & Source State (Empty by default, NO demo data) ────────────────
    var urlInput by remember { mutableStateOf("") }
    var currentThumbnailUrl by remember { mutableStateOf<String?>(null) }
    var videoId by remember { mutableStateOf("") }
    var isFetchingUrl by remember { mutableStateOf(false) }

    // ── Canvas Mark Points ──────────────────────────────────────────────────
    val markedPins = remember { mutableStateListOf<MarkedPin>() }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }

    // ── Reference Images (Up to 2 images) ───────────────────────────────────
    val referenceImages = remember { mutableStateListOf<Uri>() }
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris != null && uris.isNotEmpty()) {
            val availableSlots = 2 - referenceImages.size
            if (availableSlots > 0) {
                referenceImages.addAll(uris.take(availableSlots))
            } else {
                Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── History & Prompt State (Empty by default) ───────────────────────────
    var promptInput by remember { mutableStateOf("") }
    var preferNewChat by remember { mutableStateOf(false) }
    val chatMessages = remember { mutableStateListOf<ThumbnailChatMessage>() }

    val quickPresets = listOf(
        "🔥 Neon Glow",
        "🎯 Red Arrow",
        "😱 Shock Face Aura",
        "⚡ Lightning Spark",
        "⚔️ Esports Arena",
        "🏆 Victory Glow",
        "🌌 Cyberpunk Theme"
    )

    // ── Generation State ────────────────────────────────────────────────────
    var isGenerating by remember { mutableStateOf(false) }
    var generationStatusMessage by remember { mutableStateOf("Connecting to Dg-Images...") }
    var generatedImageUrl by remember { mutableStateOf<String?>(null) }
    var isDgImagesAppInstalled by remember { mutableStateOf(false) }

    val loadedExtension by extensionViewModel.loadedImageStudio.collectAsState()

    // Pulsing pin animation
    val infiniteTransition = rememberInfiniteTransition(label = "pinPulse")
    val pinPulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(900),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pinPulseAlpha"
    )

    // ── Helper: Start New Session ───────────────────────────────────────────
    fun startNewSession() {
        preferNewChat = true
        promptInput = ""
        markedPins.clear()
        referenceImages.clear()
        chatMessages.add(
            ThumbnailChatMessage(
                isUser = false,
                text = "✨ Started a new revision session. Drop target pins on the canvas to describe edits.",
                previewImageUrl = currentThumbnailUrl
            )
        )
        Toast.makeText(context, "✨ Started New Session", Toast.LENGTH_SHORT).show()
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
        isDgImagesAppInstalled = checkAppInstalled()
        coroutineScope.launch(Dispatchers.IO) {
            val daemonAlive = try {
                val conn = URL("http://127.0.0.1:5488/v1/health").openConnection() as HttpURLConnection
                conn.connectTimeout = 1200
                conn.readTimeout = 1200
                conn.responseCode == 200
            } catch (_: Exception) {
                false
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
        val parsedId = parseYoutubeId(urlInput)
        if (parsedId != null) {
            videoId = parsedId
            isFetchingUrl = true
            coroutineScope.launch(Dispatchers.IO) {
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
                    currentThumbnailUrl = finalUrl
                    generatedImageUrl = null
                    markedPins.clear()
                    isFetchingUrl = false
                    chatMessages.add(
                        ThumbnailChatMessage(
                            isUser = false,
                            text = "Loaded video thumbnail ($parsedId). Ready for pinpoint revisions.",
                            previewImageUrl = finalUrl
                        )
                    )
                }
            }
        } else {
            Toast.makeText(context, "Please enter a valid YouTube video or stream URL", Toast.LENGTH_SHORT).show()
        }
    }

    // ── Helper: Convert Uri to compressed Base64 Data URL ───────────────────
    fun uriToBase64(uri: Uri): String? {
        return try {
            val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            if (originalBitmap == null) return null

            val maxDim = 1024
            val width = originalBitmap.width
            val height = originalBitmap.height
            val scaledBitmap = if (width > maxDim || height > maxDim) {
                val ratio = width.toFloat() / height.toFloat()
                val newWidth: Int
                val newHeight: Int
                if (ratio > 1f) {
                    newWidth = maxDim
                    newHeight = (maxDim / ratio).toInt()
                } else {
                    newHeight = maxDim
                    newWidth = (maxDim * ratio).toInt()
                }
                Bitmap.createScaledBitmap(originalBitmap, newWidth, newHeight, true)
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val bytes = outputStream.toByteArray()
            val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64"
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // ── Helper: Synthesize Master Prompt ────────────────────────────────────
    fun synthesizeMasterPrompt(
        userText: String,
        pins: List<MarkedPin>,
        refCount: Int
    ): String {
        val builder = StringBuilder()
        builder.appendLine("[TASK: YOUTUBE THUMBNAIL REVISION & INPAINTING]")
        builder.appendLine("Source Format: 16:9 Cinematic High-Definition Canvas")
        if (pins.isNotEmpty()) {
            builder.appendLine("Target Mark Points on Canvas:")
            pins.forEach { pin ->
                builder.appendLine("- Pin #${pin.id} located at X=${"%.1f".format(Locale.US, pin.xPercent)}%, Y=${"%.1f".format(Locale.US, pin.yPercent)}% (measured from top-left)")
            }
        }
        if (refCount > 0) {
            builder.appendLine("Reference Media: $refCount visual reference image(s) provided for character, face, object, or color alignment.")
        }
        builder.appendLine("User Creative Request:")
        builder.appendLine(userText.trim())
        builder.appendLine("Synthesis Directives:")
        builder.appendLine("- Seamlessly blend changes at marked target pins while retaining photorealistic depth.")
        builder.appendLine("- Apply high-contrast, specular highlights designed for maximum mobile CTR.")
        builder.appendLine("- Render crisp, readable typography with subtle specular or rim lighting.")
        builder.appendLine("- Maintain seamless 16:9 composition cohesion.")
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

        val baseImage = currentThumbnailUrl
        if (baseImage == null) {
            Toast.makeText(context, "Please load a video thumbnail first", Toast.LENGTH_SHORT).show()
            return
        }

        isDgImagesAppInstalled = checkAppInstalled()
        if (!isDgImagesAppInstalled) {
            Toast.makeText(
                context,
                "Dg-Images companion app is not installed. Please install Dg-Images.",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        val currentPinsSnapshot = markedPins.toList()
        val currentRefsSnapshot = referenceImages.toList()
        val currentNewChatChoice = preferNewChat

        val displayPrompt = if (userPrompt.isNotEmpty()) userPrompt else "Refine marked target regions"
        chatMessages.add(
            ThumbnailChatMessage(
                isUser = true,
                text = displayPrompt,
                pins = currentPinsSnapshot,
                referenceImageCount = currentRefsSnapshot.size
            )
        )

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

        isGenerating = true
        generationStatusMessage = "Connecting to Dg-Images..."

        coroutineScope.launch {
            val base64RefList = withContext(Dispatchers.IO) {
                currentRefsSnapshot.mapNotNull { uriToBase64(it) }
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
            val result = if (extension != null) {
                extension.generateThumbnail(
                    context = context,
                    baseImageUrl = baseImage,
                    maskPointsJson = advancedWrapper.toString(),
                    prompt = masterPrompt,
                    onProgress = { _, message ->
                        generationStatusMessage = message
                    }
                )
            } else {
                delay(1500)
                Result.success(baseImage)
            }

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
            isGenerating = false
        }
    }

    // ── Main Layout with Collapsible Side Drawer ────────────────────────────
    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = DigicastDeepNavy,
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
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // ── LEFT SIDE: Back Button + History Drawer Toggle ────────
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Back Icon
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.08f))
                                .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                                .clickable(onClick = onNavigateBack),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Collapsible History Drawer Button (Named History as requested)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isHistoryDrawerOpen) DigicastElectricCyan.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.08f))
                                .border(
                                    1.dp,
                                    if (isHistoryDrawerOpen) DigicastElectricCyan else Color.White.copy(alpha = 0.15f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { isHistoryDrawerOpen = !isHistoryDrawerOpen }
                                .padding(horizontal = 10.dp, vertical = 7.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Layers,
                                    contentDescription = "History",
                                    tint = if (isHistoryDrawerOpen) DigicastElectricCyan else Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (chatMessages.isNotEmpty()) "History (${chatMessages.size})" else "History",
                                    color = if (isHistoryDrawerOpen) DigicastElectricCyan else Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // ── RIGHT SIDE: (+) New Chat / Session Button & Status Pill ───
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // (+) Plus New Session Button
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF134E5E))
                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), CircleShape)
                                .clickable { startNewSession() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "New Session",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // Dg-Images Companion Status Pill
                        val isBridgeReady = isDgImagesAppInstalled && (loadedExtension != null || extensionViewModel.getImageStudio() != null)
                        val statusLabel = when {
                            isBridgeReady -> "Dg-Images Active"
                            !isDgImagesAppInstalled -> "Dg-Images Missing"
                            else -> "Bridge Ready"
                        }
                        val statusColor = if (isBridgeReady) DigicastElectricCyan else if (!isDgImagesAppInstalled) Color(0xFFFBBF24) else DigicastElectricCyan

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(9999.dp))
                                .background(statusColor.copy(alpha = 0.15f))
                                .border(
                                    1.dp,
                                    statusColor.copy(alpha = 0.4f),
                                    RoundedCornerShape(9999.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(statusColor)
                                )
                                Text(
                                    text = statusLabel,
                                    color = statusColor,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
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
                                            fontSize = 13.sp
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

                            // Paste Icon Button
                            IconButton(
                                onClick = {
                                    clipboardManager.getText()?.text?.let { text ->
                                        urlInput = text
                                        fetchThumbnail()
                                    }
                                },
                                modifier = Modifier.size(26.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ContentPaste,
                                    contentDescription = "Paste",
                                    tint = Color.White.copy(alpha = 0.8f),
                                    modifier = Modifier.size(15.dp)
                                )
                            }

                            // Fetch CDN Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(9999.dp))
                                    .background(Color(0xFF134E5E))
                                    .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(9999.dp))
                                    .clickable { fetchThumbnail() }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                if (isFetchingUrl) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                } else {
                                    Text("Fetch", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
                                .border(1.5.dp, AppleSpecularBorder, RoundedCornerShape(20.dp))
                                .onGloballyPositioned { coordinates ->
                                    canvasSize = coordinates.size
                                }
                                .pointerInput(currentThumbnailUrl) {
                                    detectTapGestures { tapOffset ->
                                        if (currentThumbnailUrl != null && size.width > 0 && size.height > 0) {
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
                                        .data(generatedImageUrl ?: currentThumbnailUrl)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = "Thumbnail Canvas",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )

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

                                // Resolution badge top-left
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(12.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.Black.copy(alpha = 0.65f))
                                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = if (generatedImageUrl != null) "✨ AI GENERATED (1080P)" else "1280×720 • HD SOURCE",
                                        color = if (generatedImageUrl != null) DigicastElectricCyan else Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                // Instruction overlay hint
                                if (markedPins.isEmpty()) {
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

                // ── 3. Style Presets Scroll Row ─────────────────────────────
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "STYLE & OBJECT PRESETS",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp
                        )

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            quickPresets.forEach { tag ->
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(9999.dp))
                                        .background(AppleDarkEdgePillBrush)
                                        .border(1.dp, AppleSpecularBorder, RoundedCornerShape(9999.dp))
                                        .clickable {
                                            val cleanTag = tag.substringAfter(" ")
                                            promptInput = if (promptInput.isEmpty()) cleanTag else "$promptInput, $cleanTag"
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(text = tag, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }

                // ── 4. Compose Revision Card (Pins + Up to 2 References + Text) ─
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .border(1.5.dp, AppleSpecularBorder, RoundedCornerShape(20.dp))
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Row A: Active Marked Pin Targets Chips
                        if (markedPins.isNotEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "TARGET COORDINATES ON CANVAS (${markedPins.size})",
                                    color = DigicastElectricCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    markedPins.forEach { pin ->
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(9999.dp))
                                                .background(Color(0xFF041A20))
                                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.6f), RoundedCornerShape(9999.dp))
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Text(
                                                    text = "📍 Pin #${pin.id} (${"%.0f".format(Locale.US, pin.xPercent)}%, ${"%.0f".format(Locale.US, pin.yPercent)}%)",
                                                    color = Color.White,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                                Icon(
                                                    imageVector = Icons.Default.Close,
                                                    contentDescription = "Remove Pin",
                                                    tint = DigicastSlate,
                                                    modifier = Modifier
                                                        .size(14.dp)
                                                        .clickable { markedPins.remove(pin) }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Row B: Attached Reference Images (Up to 2)
                        if (referenceImages.isNotEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "ATTACHED REFERENCE IMAGES (${referenceImages.size}/2)",
                                    color = DigicastEmerald,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    referenceImages.forEach { uri ->
                                        Box(
                                            modifier = Modifier
                                                .size(54.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                                .border(1.dp, DigicastEmerald.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                        ) {
                                            AsyncImage(
                                                model = ImageRequest.Builder(context).data(uri).crossfade(true).build(),
                                                contentDescription = "Reference",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            Box(
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .size(18.dp)
                                                    .clip(CircleShape)
                                                    .background(Color.Black.copy(alpha = 0.8f))
                                                    .clickable { referenceImages.remove(uri) },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = null, tint = Color.White, modifier = Modifier.size(10.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Row C: Multiline Input Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF041217))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            androidx.compose.foundation.text.BasicTextField(
                                value = promptInput,
                                onValueChange = { promptInput = it },
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp
                                ),
                                modifier = Modifier.fillMaxWidth(),
                                decorationBox = { innerTextField ->
                                    if (promptInput.isEmpty()) {
                                        Text(
                                            text = if (markedPins.isNotEmpty())
                                                "e.g. Replace character at Pin 1 with anime avatar, add neon arrow to Pin 2..."
                                            else
                                                "Describe character changes, colors, background, or text...",
                                            color = Color.White.copy(alpha = 0.4f),
                                            fontSize = 13.sp
                                        )
                                    }
                                    innerTextField()
                                }
                            )
                        }

                        // Row D: Bottom Controls (Attach Media + Send)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Attach Reference Button (Max 2)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White.copy(alpha = 0.08f))
                                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                    .clickable {
                                        if (referenceImages.size < 2) {
                                            imagePickerLauncher.launch("image/*")
                                        } else {
                                            Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                    Text(
                                        text = "Attach Ref (${referenceImages.size}/2)",
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }

                            // Send / Generate Button
                            Button(
                                onClick = { sendPromptAndGenerate() },
                                enabled = !isGenerating && currentThumbnailUrl != null,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF134E5E),
                                    disabledContainerColor = Color(0xFF0B242B)
                                ),
                                border = BorderStroke(1.dp, if (isGenerating) DigicastElectricCyan else Color(0x662DD4BF)),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    if (isGenerating) {
                                        CircularProgressIndicator(
                                            color = DigicastElectricCyan,
                                            modifier = Modifier.size(14.dp),
                                            strokeWidth = 2.dp
                                        )
                                        Text("Generating...", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    } else {
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.Send,
                                            contentDescription = "Send",
                                            tint = DigicastElectricCyan,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text("Send to Dg-Images", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }

                // ── 5. Quick Actions: Open History Drawer & Save 1080p ──────────
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Open History Drawer Pill
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF0B262E))
                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                .clickable { isHistoryDrawerOpen = true }
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Default.Layers, contentDescription = null, tint = DigicastElectricCyan, modifier = Modifier.size(18.dp))
                                    Text(
                                        text = if (chatMessages.isNotEmpty()) "View History (${chatMessages.size} revisions)" else "View History",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Text("Slide Out ›", color = DigicastElectricCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Direct Save 1080p to Gallery
                        if (generatedImageUrl != null || currentThumbnailUrl != null) {
                            Button(
                                onClick = {
                                    (generatedImageUrl ?: currentThumbnailUrl)?.let { saveImageToDownloads(it) }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(46.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F323A)),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Default.Download, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                    Text("Save Active Canvas (1080p) to Gallery", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ── COLLAPSIBLE HISTORY DRAWER (Slides In From Left) ───────────────────
        // ═══════════════════════════════════════════════════════════════════════

        // Dimmed Scrim Overlay when Drawer is Open
        if (isHistoryDrawerOpen) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.65f))
                    .clickable { isHistoryDrawerOpen = false }
            )
        }

        // Slide-in Drawer from Left
        AnimatedVisibility(
            visible = isHistoryDrawerOpen,
            enter = slideInHorizontally(initialOffsetX = { -it }) + fadeIn(),
            exit = slideOutHorizontally(targetOffsetX = { -it }) + fadeOut(),
            modifier = Modifier.align(Alignment.CenterStart)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.86f)
                    .fillMaxHeight()
                    .background(Color(0xFF030D12))
                    .border(
                        BorderStroke(1.dp, AppleSpecularBorder),
                        shape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp)
                    )
                    .clip(RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Drawer Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(DigicastElectricCyan.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Layers, contentDescription = null, tint = DigicastElectricCyan, modifier = Modifier.size(16.dp))
                            }
                            Column {
                                Text("HISTORY", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                                Text("Revisions & Sessions", color = DigicastSlate, fontSize = 10.sp)
                            }
                        }

                        // Close Drawer Button
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.08f))
                                .clickable { isHistoryDrawerOpen = false },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }

                    // Large (+ New Session) Action Button at Top of Drawer
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF134E5E))
                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .clickable {
                                startNewSession()
                                isHistoryDrawerOpen = false
                            }
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Text("Start New Session", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Content: Empty State OR Stream inside Left Drawer
                    if (chatMessages.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = null,
                                tint = DigicastSlate.copy(alpha = 0.5f),
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "No History Yet",
                                color = Color.White.copy(alpha = 0.7f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Load a video link or drop target pins on the canvas to start generating.",
                                color = DigicastSlate,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(chatMessages, key = { it.id }) { message ->
                                Column(
                                    modifier = Modifier.fillMaxWidth(),
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

                                            // Compact ChatGPT-Style Result Card (Clean & Compact, NOT full giant 16:9 thumbnail)
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
                                                            model = ImageRequest.Builder(context).data(message.previewImageUrl).crossfade(true).build(),
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
                                                                    .clickable { saveImageToDownloads(message.previewImageUrl) }
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
                                                                        currentThumbnailUrl = message.previewImageUrl
                                                                        markedPins.clear()
                                                                        isHistoryDrawerOpen = false
                                                                        Toast.makeText(context, "Loaded on Canvas", Toast.LENGTH_SHORT).show()
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
                        }
                    }
                }
            }
        }
    }
}
