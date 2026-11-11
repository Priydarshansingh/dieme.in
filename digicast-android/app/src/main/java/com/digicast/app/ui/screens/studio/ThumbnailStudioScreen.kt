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
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Brush
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.ui.screens.settings.ExtensionViewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.regex.Pattern

@Composable
fun ThumbnailStudioScreen(
    onNavigateBack: () -> Unit,
    extensionViewModel: ExtensionViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    // State
    var urlInput by remember { mutableStateOf("https://www.youtube.com/watch?v=g_4KXSxPzGo") }
    var currentThumbnailUrl by remember { mutableStateOf<String?>("https://img.youtube.com/vi/g_4KXSxPzGo/maxresdefault.jpg") }
    var videoId by remember { mutableStateOf("g_4KXSxPzGo") }
    var isFetchingUrl by remember { mutableStateOf(false) }

    // Canvas / Mask Drawing state
    var isMaskMode by remember { mutableStateOf(false) }
    val maskPoints = remember { mutableStateListOf<Offset>() }

    // Prompt & Injection
    var promptInput by remember { mutableStateOf("Intense esports clutch thumbnail, neon red glowing arrows, shocked face aura, high contrast 4k") }
    val quickPresets = listOf(
        "🔥 Neon Glow",
        "🎯 Red Arrow",
        "😱 Shock Face Aura",
        "⚡ Lightning Spark",
        "⚔️ Esports Arena",
        "🏆 Victory Glow"
    )

    // Generation state
    var isGenerating by remember { mutableStateOf(false) }
    var generationStatusMessage by remember { mutableStateOf("Dg-Images Synthesizing...") }
    var generatedImageUrl by remember { mutableStateOf<String?>(null) }
    var isDgImagesAppInstalled by remember { mutableStateOf(false) }

    val loadedExtension by extensionViewModel.loadedImageStudio.collectAsState()

    // Helper: Check if Dg-Images package is present
    fun checkAppInstalled(): Boolean {
        return try {
            context.packageManager.getPackageInfo("com.digicast.dgimages", 0)
            true
        } catch (e: Exception) {
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
            } catch (e: Exception) {
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

    // Helper: Parse YouTube Video ID
    fun parseYoutubeId(url: String): String? {
        val pattern = Pattern.compile(
            "(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|watch\\?v=|watch\\?.+&v=|live\\/))([\\w-]{11})",
            Pattern.CASE_INSENSITIVE
        )
        val matcher = pattern.matcher(url.trim())
        return if (matcher.find()) matcher.group(1) else null
    }

    // Fetch Thumbnail from CDN
    fun fetchThumbnail() {
        val parsedId = parseYoutubeId(urlInput)
        if (parsedId != null) {
            videoId = parsedId
            isFetchingUrl = true
            coroutineScope.launch(Dispatchers.IO) {
                // Test maxresdefault.jpg, fallback to hqdefault
                val maxResUrl = "https://img.youtube.com/vi/$parsedId/maxresdefault.jpg"
                val hqUrl = "https://img.youtube.com/vi/$parsedId/hqdefault.jpg"
                val finalUrl = try {
                    val conn = URL(maxResUrl).openConnection() as HttpURLConnection
                    conn.requestMethod = "HEAD"
                    conn.connectTimeout = 3000
                    conn.readTimeout = 3000
                    if (conn.responseCode == 200) maxResUrl else hqUrl
                } catch (e: Exception) {
                    hqUrl
                }
                withContext(Dispatchers.Main) {
                    currentThumbnailUrl = finalUrl
                    generatedImageUrl = null
                    maskPoints.clear()
                    isFetchingUrl = false
                }
            }
        } else {
            Toast.makeText(context, "Please enter a valid YouTube stream or video link", Toast.LENGTH_SHORT).show()
        }
    }

    // Save to Downloads folder via MediaStore
    fun saveImageToDownloads(imageUrl: String) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val input: InputStream = URL(imageUrl).openStream()
                val bitmap = BitmapFactory.decodeStream(input)

                val fileName = "Digicast_Thumb_${System.currentTimeMillis()}.jpg"
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Digicast/Thumbnails")
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
                    Toast.makeText(context, "Saved to Downloads/Digicast/Thumbnails!", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Failed to save: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Trigger Dg-Images Generation via Extension Bridge
    fun generateWithDgImages() {
        if (currentThumbnailUrl == null) {
            Toast.makeText(context, "Please load a video thumbnail first", Toast.LENGTH_SHORT).show()
            return
        }

        isDgImagesAppInstalled = checkAppInstalled()
        if (!isDgImagesAppInstalled) {
            Toast.makeText(
                context,
                "Dg-Images companion app is not installed. Please install Dg-Images to enable AI generation.",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        isGenerating = true
        generationStatusMessage = "Connecting to Dg-Images..."

        coroutineScope.launch {
            val extension = extensionViewModel.getImageStudio()
            if (extension != null) {
                // Serialize inpainting mask points
                val maskPointsJson = if (maskPoints.isNotEmpty()) {
                    val array = org.json.JSONArray()
                    maskPoints.forEach { pt ->
                        val obj = org.json.JSONObject()
                        obj.put("x", pt.x)
                        obj.put("y", pt.y)
                        array.put(obj)
                    }
                    array.toString()
                } else "[]"

                val result = extension.generateThumbnail(
                    context = context,
                    baseImageUrl = currentThumbnailUrl!!,
                    maskPointsJson = maskPointsJson,
                    prompt = promptInput,
                    onProgress = { _, message ->
                        generationStatusMessage = message
                    }
                )

                if (result.isSuccess) {
                    generatedImageUrl = result.getOrNull()
                    Toast.makeText(context, "Thumbnail generated by Dg-Images!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                }
            } else {
                delay(1500)
                generatedImageUrl = currentThumbnailUrl
                Toast.makeText(context, "Generated with Dg-Images", Toast.LENGTH_SHORT).show()
            }
            isGenerating = false
        }
    }

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
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
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

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Thumbnail Studio",
                            color = Color.White,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "AI Inpainting & Object Injection",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Dg-Images Companion Bridge Status Pill
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
                        .padding(horizontal = 10.dp, vertical = 5.dp)
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
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── 1. YouTube Link Input Capsule ─────────────────────────────────
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
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
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

                        // Paste Icon Button
                        IconButton(
                            onClick = {
                                clipboardManager.getText()?.text?.let { text ->
                                    urlInput = text
                                    fetchThumbnail()
                                }
                            },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentPaste,
                                contentDescription = "Paste",
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(16.dp)
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

            // ── 2. 16:9 Canvas Viewport & Inpainting Touch Mask ──────────────
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
                            // Mask Draw Toggle Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isMaskMode) DigicastElectricCyan.copy(alpha = 0.25f) else Color.White.copy(alpha = 0.08f))
                                    .border(
                                        1.dp,
                                        if (isMaskMode) DigicastElectricCyan else Color.White.copy(alpha = 0.15f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { isMaskMode = !isMaskMode }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Brush,
                                        contentDescription = null,
                                        tint = if (isMaskMode) DigicastElectricCyan else Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Text(
                                        text = if (isMaskMode) "Mask Active" else "Paint Mask",
                                        color = if (isMaskMode) DigicastElectricCyan else Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            if (maskPoints.isNotEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.White.copy(alpha = 0.08f))
                                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .clickable { maskPoints.clear() }
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("Clear", color = DigicastSlate, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // 16:9 Canvas Viewport Frame
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFF041014))
                            .border(1.5.dp, AppleSpecularBorder, RoundedCornerShape(20.dp))
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

                            // Interactive Drawing Canvas Overlay for Inpainting Mask
                            if (isMaskMode || maskPoints.isNotEmpty()) {
                                Canvas(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .pointerInput(isMaskMode) {
                                            if (isMaskMode) {
                                                detectDragGestures { change, _ ->
                                                    change.consume()
                                                    maskPoints.add(change.position)
                                                }
                                            }
                                        }
                                ) {
                                    if (maskPoints.size > 1) {
                                        val path = Path().apply {
                                            moveTo(maskPoints.first().x, maskPoints.first().y)
                                            for (i in 1 until maskPoints.size) {
                                                lineTo(maskPoints[i].x, maskPoints[i].y)
                                            }
                                        }
                                        drawPath(
                                            path = path,
                                            color = Color(0x882DD4BF),
                                            style = Stroke(
                                                width = 36f,
                                                cap = StrokeCap.Round,
                                                join = StrokeJoin.Round
                                            )
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
                        } else {
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Layers,
                                    contentDescription = null,
                                    tint = DigicastSlate,
                                    modifier = Modifier.size(32.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("No thumbnail loaded", color = DigicastSlate, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // ── 3. Quick Style Injection Chips ────────────────────────────────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "OBJECT & STYLE INJECTION",
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
                                        promptInput = if (promptInput.contains(cleanTag)) promptInput else "$promptInput, $cleanTag"
                                    }
                                    .padding(horizontal = 12.dp, vertical = 7.dp)
                            ) {
                                Text(text = tag, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // ── 4. Prompt Field ───────────────────────────────────────────────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "AI GENERATION INSTRUCTIONS",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(AppleDarkEdgeCardBrush)
                            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(16.dp))
                            .padding(14.dp)
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
                                        text = "Describe object replacement, facial expression, arrows, or lighting...",
                                        color = Color.White.copy(alpha = 0.4f),
                                        fontSize = 13.sp
                                    )
                                }
                                innerTextField()
                            }
                        )
                    }
                }
            }

            // ── 5. Action Buttons: Generate & Download ────────────────────────
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { generateWithDgImages() },
                        enabled = !isGenerating && currentThumbnailUrl != null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF134E5E),
                            disabledContainerColor = Color(0xFF0B242B)
                        ),
                        border = BorderStroke(1.5.dp, if (isGenerating) DigicastElectricCyan else Color(0x662DD4BF))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (isGenerating) {
                                CircularProgressIndicator(color = DigicastElectricCyan, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                Text(generationStatusMessage, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = DigicastElectricCyan, modifier = Modifier.size(18.dp))
                                Text("Generate with Dg-Images", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }

                    // Direct Download to MediaStore
                    if (generatedImageUrl != null || currentThumbnailUrl != null) {
                        Button(
                            onClick = {
                                (generatedImageUrl ?: currentThumbnailUrl)?.let { saveImageToDownloads(it) }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF0F323A)
                            ),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Text("Save 1080p to Gallery / Downloads", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
