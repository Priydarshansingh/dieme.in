package com.digicast.app.ui.screens.studio

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
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
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Menu
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import coil.request.ImageRequest
import kotlinx.coroutines.isActive
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
                uris.take(availableSlots).forEachIndexed { index, uri ->
                    try {
                        val inputStream = context.contentResolver.openInputStream(uri)
                        if (inputStream != null) {
                            val cachedRefFile = File(context.cacheDir, "ref_picked_${System.currentTimeMillis()}_$index.jpg")
                            FileOutputStream(cachedRefFile).use { out ->
                                inputStream.copyTo(out)
                            }
                            inputStream.close()
                            referenceImages.add(Uri.fromFile(cachedRefFile))
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            } else {
                Toast.makeText(context, "Maximum 2 reference images allowed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── History & Prompt State (Empty by default) ───────────────────────────
    var promptInput by remember { mutableStateOf("") }
    var preferNewChat by remember { mutableStateOf(false) }
    val chatMessages = remember { mutableStateListOf<ThumbnailChatMessage>() }
    var showGalleryPicker by remember { mutableStateOf(false) }
    var galleryPickerTargetIsBase by remember { mutableStateOf(false) }

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
        }
    }

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

    fun uriToBase64(uri: Uri): String? {
        return try {
            val mimeType = try { context.contentResolver.getType(uri) ?: "" } catch (_: Throwable) { "" }
            val path = uri.path ?: ""
            val isVideo = mimeType.startsWith("video/") ||
                    path.endsWith(".mp4", true) ||
                    path.endsWith(".mov", true) ||
                    path.endsWith(".mkv", true) ||
                    path.endsWith(".webm", true)

            if (isVideo) {
                val videoFrame = extractFrameFromVideo(uri) ?: return null
                val maxDim = 1024
                val width = videoFrame.width
                val height = videoFrame.height
                val scaled = if (width > maxDim || height > maxDim) {
                    val ratio = width.toFloat() / height.toFloat()
                    val newWidth = if (width > height) maxDim else (maxDim * ratio).toInt()
                    val newHeight = if (height > width) maxDim else (maxDim / ratio).toInt()
                    Bitmap.createScaledBitmap(videoFrame, newWidth.coerceAtLeast(1), newHeight.coerceAtLeast(1), true)
                } else {
                    videoFrame
                }
                val stream = ByteArrayOutputStream()
                scaled.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                val bytes = stream.toByteArray()
                Log.i("ThumbnailStudio", "Extracted and encoded video frame from $uri (${bytes.size} bytes)")
                return "data:image/jpeg;base64," + android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            }

            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            var stream = if (uri.scheme == "file") {
                val f = File(path)
                if (f.exists()) f.inputStream() else context.contentResolver.openInputStream(uri)
            } else {
                context.contentResolver.openInputStream(uri)
            }
            BitmapFactory.decodeStream(stream, null, options)
            stream?.close()

            val maxDim = 1024
            var inSampleSize = 1
            if (options.outHeight > maxDim || options.outWidth > maxDim) {
                val halfHeight = options.outHeight / 2
                val halfWidth = options.outWidth / 2
                while ((halfHeight / inSampleSize) >= maxDim && (halfWidth / inSampleSize) >= maxDim) {
                    inSampleSize *= 2
                }
            }

            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
                inPreferredConfig = Bitmap.Config.RGB_565
            }
            stream = if (uri.scheme == "file") {
                val f = File(path)
                if (f.exists()) f.inputStream() else context.contentResolver.openInputStream(uri)
            } else {
                context.contentResolver.openInputStream(uri)
            }
            val originalBitmap = BitmapFactory.decodeStream(stream, null, decodeOptions)
            stream?.close()
            if (originalBitmap == null) {
                Log.w("ThumbnailStudio", "Could not decode bitmap from uri: $uri")
                return null
            }

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
            Log.i("ThumbnailStudio", "Decoded reference media $uri (${width}x${height}) -> ${bytes.size} bytes base64")
            "data:image/jpeg;base64,$base64"
        } catch (t: Throwable) {
            Log.e("ThumbnailStudio", "Error decoding uri to base64: $uri", t)
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
            val resolvedBaseImage = withContext(Dispatchers.IO) {
                if (baseImage.startsWith("content://") || baseImage.startsWith("file://")) {
                    try {
                        uriToBase64(Uri.parse(baseImage)) ?: baseImage
                    } catch (_: Throwable) {
                        baseImage
                    }
                } else {
                    baseImage
                }
            }

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
            if (extension == null) {
                isGenerating = false
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
                    // Left Group: Back Button + History Drawer Toggle + Screen Title (Shifted to Top-Left like ChatGPT)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Back Icon Button
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

                        // History Drawer Menu Icon (like ChatGPT top-left drawer toggle)
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.08f))
                                .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                                .clickable { isHistoryDrawerOpen = !isHistoryDrawerOpen },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "History Drawer",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Screen Title (Shifted to top left like ChatGPT)
                        Text(
                            text = "Thumbnail Studio",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Right: Clean normal indicator light (no rounded extra button needed)
                    val isBridgeReady = isDgImagesAppInstalled && (loadedExtension != null || extensionViewModel.getImageStudio() != null)
                    val statusDotColor = if (isBridgeReady) Color(0xFF10B981) else Color(0xFFEF4444)

                    Box(
                        modifier = Modifier
                            .padding(end = 6.dp)
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(statusDotColor)
                            .drawBehind {
                                drawCircle(
                                    color = statusDotColor.copy(alpha = 0.45f),
                                    radius = size.minDimension * 0.95f
                                )
                            }
                    )
                }
            },
            bottomBar = {
                // ChatGPT Floating Input Capsule (Docked at Bottom like ChatGPT App)
                Surface(
                    color = DigicastDeepNavy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .imePadding()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 8.dp)
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
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // (+) Attach Media Button
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.08f))
                                    .clickable {
                                        if (referenceImages.size < 2) {
                                            galleryPickerTargetIsBase = false
                                            showGalleryPicker = true
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
                                                fontSize = 14.sp
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
                                        .padding(horizontal = 14.dp, vertical = 7.dp)
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
                                            fontWeight = FontWeight.Bold
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
                                        .padding(horizontal = 14.dp, vertical = 7.dp)
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
                                                fontWeight = FontWeight.Bold
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
                                .pointerInput(currentThumbnailUrl, generatedImageUrl) {
                                    detectTapGestures { tapOffset ->
                                        if (generatedImageUrl == null && currentThumbnailUrl != null && size.width > 0 && size.height > 0) {
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

                                // Resolution badge top-left
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(12.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.Black.copy(alpha = 0.7f))
                                        .border(1.dp, if (generatedImageUrl != null) DigicastElectricCyan.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = if (generatedImageUrl != null) "✨ AI GENERATED (1080P)" else "1280×720 • HD SOURCE",
                                        color = if (generatedImageUrl != null) DigicastElectricCyan else Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                // ── CHATGPT-STYLE GENERATING ANIMATION OVERLAY ───────
                                if (isGenerating) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color(0xD9030A0D))
                                    ) {
                                        // 1. Moving shimmer sweep & horizontal laser scan line
                                        Canvas(modifier = Modifier.fillMaxSize()) {
                                            val w = size.width
                                            val h = size.height

                                            // Diagonal shimmer beam
                                            val shimmerX = shimmerOffset * w
                                            val shimmerBrush = Brush.linearGradient(
                                                colors = listOf(
                                                    Color.Transparent,
                                                    Color(0x3300F0FF),
                                                    Color(0x882DD4BF),
                                                    Color(0x3300F0FF),
                                                    Color.Transparent
                                                ),
                                                start = Offset(shimmerX - 180f, 0f),
                                                end = Offset(shimmerX + 180f, h)
                                            )
                                            drawRect(brush = shimmerBrush)

                                            // Horizontal neon laser scan line
                                            val laserY = scanY * h
                                            val laserGlow = Brush.verticalGradient(
                                                colors = listOf(
                                                    Color.Transparent,
                                                    Color(0x5500F0FF),
                                                    Color(0xEE2DD4BF),
                                                    Color(0x5500F0FF),
                                                    Color.Transparent
                                                ),
                                                startY = (laserY - 18f).coerceAtLeast(0f),
                                                endY = (laserY + 18f).coerceAtMost(h)
                                            )
                                            drawRect(
                                                brush = laserGlow,
                                                topLeft = Offset(0f, (laserY - 18f).coerceAtLeast(0f)),
                                                size = androidx.compose.ui.geometry.Size(w, 36f)
                                            )
                                        }

                                        // 2. Central Glassmorphic Status HUD Card
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.Center)
                                                .fillMaxWidth(0.88f)
                                                .clip(RoundedCornerShape(18.dp))
                                                .background(
                                                    Brush.verticalGradient(
                                                        listOf(
                                                            Color(0xF5081C24),
                                                            Color(0xF9041016)
                                                        )
                                                    )
                                                )
                                                .border(1.dp, DigicastElectricCyan.copy(alpha = borderPulseAlpha), RoundedCornerShape(18.dp))
                                                .padding(horizontal = 18.dp, vertical = 14.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                // Rotating neural spark icon
                                                Box(
                                                    modifier = Modifier
                                                        .size(42.dp)
                                                        .clip(CircleShape)
                                                        .background(
                                                            Brush.sweepGradient(
                                                                listOf(
                                                                    Color(0xFF00F0FF),
                                                                    Color(0xFF10B981),
                                                                    Color(0xFF0F766E),
                                                                    Color(0xFF00F0FF)
                                                                )
                                                            )
                                                        )
                                                        .graphicsLayer { rotationZ = sparkAngle },
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(34.dp)
                                                            .clip(CircleShape)
                                                            .background(Color(0xFF041014)),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Icon(
                                                            imageVector = Icons.Default.AutoAwesome,
                                                            contentDescription = null,
                                                            tint = DigicastElectricCyan,
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                    }
                                                }

                                                Text(
                                                    text = "ChatGPT Generating 1080p Canvas",
                                                    color = Color.White,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    letterSpacing = (-0.2).sp
                                                )

                                                val dynamicStatus = if (generationStatusMessage.isNotBlank() && generationStatusMessage != "Connecting to Dg-Images...") {
                                                    generationStatusMessage
                                                } else {
                                                    when {
                                                        generationElapsedSeconds < 4 -> "🧠 Analyzing reference pins & character pose..."
                                                        generationElapsedSeconds < 8 -> "⚡ Uploading reference image to ChatGPT Engine..."
                                                        generationElapsedSeconds < 24 -> "✨ Synthesizing photorealistic character in 1080p..."
                                                        else -> "🎨 Polishing specular highlights & composition..."
                                                    }
                                                }

                                                Text(
                                                    text = dynamicStatus,
                                                    color = DigicastElectricCyan,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    textAlign = TextAlign.Center,
                                                    maxLines = 2
                                                )

                                                Box(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(3.dp)
                                                        .clip(RoundedCornerShape(9999.dp))
                                                        .background(Color.White.copy(alpha = 0.1f))
                                                ) {
                                                    LinearProgressIndicator(
                                                        modifier = Modifier.fillMaxSize(),
                                                        color = DigicastElectricCyan,
                                                        trackColor = Color.Transparent
                                                    )
                                                }

                                                Text(
                                                    text = "Elapsed: ${generationElapsedSeconds}s • 127.0.0.1:5488",
                                                    color = DigicastSlate,
                                                    fontSize = 10.sp,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }
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

                        // ── DIRECT ONE-TAP DOWNLOAD BUTTON UNDER CANVAS ─────────
                        if (generatedImageUrl != null || currentThumbnailUrl != null) {
                            Button(
                                onClick = {
                                    (generatedImageUrl ?: currentThumbnailUrl)?.let { saveImageToDownloads(it) }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (generatedImageUrl != null) DigicastElectricCyan else Color(0xFF134E5E)
                                ),
                                border = BorderStroke(1.dp, if (generatedImageUrl != null) DigicastElectricCyan else Color.White.copy(alpha = 0.2f))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Download,
                                        contentDescription = null,
                                        tint = if (generatedImageUrl != null) Color(0xFF030A0D) else Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = if (generatedImageUrl != null) "Download 1080p Thumbnail to Gallery" else "Save HD Thumbnail to Gallery",
                                        color = if (generatedImageUrl != null) Color(0xFF030A0D) else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
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

    if (showGalleryPicker) {
        GalleryMediaPickerSheet(
            context = context,
            title = if (galleryPickerTargetIsBase) "Select Base Thumbnail / Video" else "Attach Visual Reference (${referenceImages.size}/2)",
            subtitle = "Organized by folder & date • Dieme/Thumbnails, Camera, Downloads",
            isOpen = showGalleryPicker,
            onDismiss = { showGalleryPicker = false },
            onMediaSelected = { selectedUri, isVideo ->
                if (galleryPickerTargetIsBase) {
                    if (isVideo) {
                        coroutineScope.launch(Dispatchers.IO) {
                            val frame = extractFrameFromVideo(selectedUri)
                            if (frame != null) {
                                val frameFile = File(context.cacheDir, "base_vid_frame_${System.currentTimeMillis()}.jpg")
                                FileOutputStream(frameFile).use { out ->
                                    frame.compress(Bitmap.CompressFormat.JPEG, 92, out)
                                }
                                val frameUri = Uri.fromFile(frameFile)
                                withContext(Dispatchers.Main) {
                                    currentThumbnailUrl = frameUri.toString()
                                    generatedImageUrl = null
                                    markedPins.clear()
                                    chatMessages.add(
                                        ThumbnailChatMessage(
                                            isUser = false,
                                            text = "🎬 Captured video frame from gallery. Ready for pinpoint revisions.",
                                            previewImageUrl = frameUri.toString()
                                        )
                                    )
                                }
                            } else {
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(context, "Could not extract video frame", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    } else {
                        currentThumbnailUrl = selectedUri.toString()
                        generatedImageUrl = null
                        markedPins.clear()
                        chatMessages.add(
                            ThumbnailChatMessage(
                                isUser = false,
                                text = "Loaded media from gallery. Ready for pinpoint revisions.",
                                previewImageUrl = selectedUri.toString()
                            )
                        )
                    }
                } else {
                    if (referenceImages.size < 2) {
                        if (isVideo) {
                            coroutineScope.launch(Dispatchers.IO) {
                                val frame = extractFrameFromVideo(selectedUri)
                                if (frame != null) {
                                    val frameFile = File(context.cacheDir, "ref_vid_frame_${System.currentTimeMillis()}.jpg")
                                    FileOutputStream(frameFile).use { out ->
                                        frame.compress(Bitmap.CompressFormat.JPEG, 90, out)
                                    }
                                    withContext(Dispatchers.Main) {
                                        referenceImages.add(Uri.fromFile(frameFile))
                                    }
                                }
                            }
                        } else {
                            referenceImages.add(selectedUri)
                        }
                    }
                }
            }
        )
    }
}

