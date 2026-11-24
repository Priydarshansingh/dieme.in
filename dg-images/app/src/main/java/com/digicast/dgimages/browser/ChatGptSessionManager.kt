package com.digicast.dgimages.browser

import android.content.Context
import android.content.Intent
import android.util.Log
import android.webkit.CookieManager
import com.digicast.dgimages.engine.GenerationJob
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume

object ChatGptSessionManager {

    private const val TAG = "ChatGptSessionManager"

    var activeAdapter: ChatGptWebAdapter? = null

    private val _preferNewChat = MutableStateFlow(true)
    val preferNewChat: StateFlow<Boolean> = _preferNewChat.asStateFlow()

    private val _isChatGptConnected = MutableStateFlow(false)
    val isChatGptConnected: StateFlow<Boolean> = _isChatGptConnected.asStateFlow()

    private val _sessionStatus = MutableStateFlow("ChatGPT Ready (Web Engine)")
    val sessionStatus: StateFlow<String> = _sessionStatus.asStateFlow()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    fun setPreferNewChat(newChat: Boolean) {
        _preferNewChat.value = newChat
    }

    fun setIsChatGptConnected(connected: Boolean) {
        _isChatGptConnected.value = connected
    }

    fun disconnect(onComplete: () -> Unit = {}) {
        _isChatGptConnected.value = false
        val adapter = activeAdapter
        if (adapter != null) {
            val cookieManager = CookieManager.getInstance()
            cookieManager.removeAllCookies {
                cookieManager.flush()
                adapter.webView.clearCache(true)
                adapter.webView.clearHistory()
                adapter.webView.loadUrl(ChatGptWebAdapter.CHATGPT_URL)
                onComplete()
            }
        } else {
            val cookieManager = CookieManager.getInstance()
            cookieManager.removeAllCookies {
                cookieManager.flush()
                onComplete()
            }
        }
    }

    suspend fun executeGeneration(
        context: Context,
        prompt: String,
        baseImageUrl: String,
        maskPointsJson: String,
        referenceImageUrls: List<String> = emptyList(),
        forceNewChat: Boolean? = null
    ): Result<String> = withContext(Dispatchers.Main) {
        Log.i(TAG, "🚀 executeGeneration invoked: prompt=\"${prompt.take(40)}...\", baseImageUrl=${baseImageUrl.take(40)}, refs=${referenceImageUrls.size}")

        var adapter = activeAdapter
        if (adapter == null) {
            // Wake up background service if not active
            try {
                val serviceIntent = Intent(context, com.digicast.dgimages.service.DgImagesService::class.java)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not start service: ${e.message}")
            }

            for (i in 0 until 10) {
                delay(500)
                if (activeAdapter != null) {
                    adapter = activeAdapter
                    break
                }
            }
        }

        if (adapter == null) {
            Log.w(TAG, "⚠️ activeAdapter is null; Dg-Images ChatGPT engine is not active")
            return@withContext Result.failure(
                IllegalStateException("Dg-Images ChatGPT engine is not active. Please open Dg-Images and ensure ChatGPT is signed in.")
            )
        }

        try {
            withContext(Dispatchers.Main) {
                adapter.webView.resumeTimers()
                adapter.webView.onResume()
            }
            _sessionStatus.value = "Preparing media assets..."

            // Download base image and reference images to local cache
            val filesToAttach = withContext(Dispatchers.IO) {
                fun resolveMediaToFile(mediaStr: String, prefix: String, index: Int): File? {
                    if (mediaStr.isBlank()) return null
                    val outFile = File(context.cacheDir, "${prefix}_${System.currentTimeMillis()}_$index.jpg")
                    return try {
                        when {
                            mediaStr.startsWith("data:") || (mediaStr.length > 300 && !mediaStr.startsWith("content:") && !mediaStr.startsWith("http:") && !mediaStr.startsWith("https:") && !mediaStr.startsWith("file:") && !mediaStr.startsWith("/")) -> {
                                val base64Data = if (mediaStr.contains(",")) mediaStr.substringAfter(",") else mediaStr
                                val cleanB64 = base64Data.trim().replace("\n", "").replace("\r", "")
                                val bytes = android.util.Base64.decode(cleanB64, android.util.Base64.DEFAULT)
                                FileOutputStream(outFile).use { it.write(bytes) }
                                Log.i(TAG, "✅ Decoded Base64 asset $prefix #$index -> ${outFile.name} (${bytes.size} bytes)")
                                outFile
                            }
                            mediaStr.startsWith("http://") || mediaStr.startsWith("https://") -> {
                                val conn = (URL(mediaStr).openConnection() as java.net.HttpURLConnection).apply {
                                    setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
                                    setRequestProperty("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
                                    connectTimeout = 15000
                                    readTimeout = 15000
                                }
                                if (conn.responseCode in 200..299) {
                                    conn.inputStream.use { input ->
                                        FileOutputStream(outFile).use { output -> input.copyTo(output) }
                                    }
                                    Log.i(TAG, "✅ Downloaded HTTP asset $prefix #$index -> ${outFile.name} (${outFile.length()} bytes)")
                                    outFile
                                } else {
                                    Log.w(TAG, "⚠️ HTTP asset download returned HTTP ${conn.responseCode} for $mediaStr")
                                    null
                                }
                            }
                            mediaStr.startsWith("file://") || mediaStr.startsWith("/") -> {
                                val cleanPath = if (mediaStr.startsWith("file://")) mediaStr.substring(7) else mediaStr
                                val srcFile = File(cleanPath)
                                if (srcFile.exists()) {
                                    srcFile.inputStream().use { input ->
                                        FileOutputStream(outFile).use { output -> input.copyTo(output) }
                                    }
                                    Log.i(TAG, "✅ Copied local file asset $prefix #$index -> ${outFile.name} (${outFile.length()} bytes)")
                                    outFile
                                } else {
                                    Log.w(TAG, "⚠️ Local file not found: $cleanPath")
                                    null
                                }
                            }
                            mediaStr.startsWith("content://") -> {
                                context.contentResolver.openInputStream(android.net.Uri.parse(mediaStr))?.use { input ->
                                    FileOutputStream(outFile).use { output -> input.copyTo(output) }
                                }
                                Log.i(TAG, "✅ Read content:// asset $prefix #$index -> ${outFile.name} (${outFile.length()} bytes)")
                                outFile
                            }
                            else -> {
                                Log.w(TAG, "⚠️ Unknown media format for $prefix #$index (len=${mediaStr.length})")
                                null
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error resolving $prefix #$index to file: ${e.message}", e)
                        null
                    }
                }

                val list = mutableListOf<File>()
                resolveMediaToFile(baseImageUrl, "base", 0)?.let {
                    list.add(it)
                    Log.i(TAG, "📎 Successfully queued base image: ${it.name} (${it.length()} bytes)")
                } ?: run {
                    Log.w(TAG, "⚠️ Failed to resolve baseImageUrl! Prefix: ${baseImageUrl.take(60)}")
                }

                // Attach reference images provided (strictly limit to top 1 reference to prevent over-attachment)
                for ((idx, ref) in referenceImageUrls.take(1).withIndex()) {
                    resolveMediaToFile(ref, "ref", idx)?.let {
                        list.add(it)
                        Log.i(TAG, "📎 Successfully queued reference image #$idx -> ${it.name} (${it.length()} bytes)")
                    } ?: run {
                        Log.w(TAG, "⚠️ Failed to resolve ref image #$idx! Prefix: ${ref.take(60)}")
                    }
                }
                val distinct = list.distinctBy { it.canonicalPath }
                Log.i(TAG, "📦 Prepared ${distinct.size} distinct image file(s) for ChatGPT composer")
                distinct
            }

            // If images were requested but could not be prepared, fail early to prevent sending prompt without assets
            if (filesToAttach.isEmpty() && (baseImageUrl.isNotBlank() || referenceImageUrls.isNotEmpty())) {
                Log.e(TAG, "❌ Failed to prepare image assets: base or reference files could not be resolved")
                _sessionStatus.value = "Error: Failed to prepare image assets"
                return@withContext Result.failure(
                    IllegalStateException("Failed to prepare image assets for ChatGPT composer. Please verify images are valid.")
                )
            }

            // 1. If preferNewChat is true, click New Chat first
            val startNew = forceNewChat ?: _preferNewChat.value
            adapter.lastCapturedDataUrl = null
            if (startNew) {
                _sessionStatus.value = "Opening fresh ChatGPT conversation..."
                suspendCancellableCoroutine<Boolean> { cont ->
                    adapter.startNewChat {
                        adapter.ensureComposerReady(timeoutMs = 8000L) { ready ->
                            if (cont.isActive) cont.resume(ready)
                        }
                    }
                }
                delay(400)
            } else {
                _sessionStatus.value = "Appending to ongoing ChatGPT conversation..."
                suspendCancellableCoroutine<Boolean> { cont ->
                    adapter.ensureComposerReady(timeoutMs = 4000L) { ready ->
                        if (cont.isActive) cont.resume(ready)
                    }
                }
            }

            // 2. Attach base thumbnail + reference assets
            if (filesToAttach.isNotEmpty()) {
                // Pre-clean composer attachments to prevent lingering duplicates from past retries
                suspendCancellableCoroutine<Int> { cont ->
                    adapter.clearComposerAttachments { count ->
                        if (cont.isActive) cont.resume(count)
                    }
                }
                delay(300)

                withContext(Dispatchers.Main) {
                    adapter.webView.resumeTimers()
                    adapter.webView.onResume()
                }

                _sessionStatus.value = "Attaching ${filesToAttach.size} image assets to ChatGPT..."
                Log.i(TAG, "📎 Attaching ${filesToAttach.size} image assets to ChatGPT (Base + Refs)")
                suspendCancellableCoroutine<Boolean> { cont ->
                    adapter.attachImages(filesToAttach) { success ->
                        if (cont.isActive) cont.resume(success)
                    }
                }

                // Poll for attachments readiness up to 12 seconds
                var attachmentsReady = false
                val expectedCount = filesToAttach.size
                for (attempt in 0 until 12) {
                    delay(1000)
                    withContext(Dispatchers.Main) {
                        adapter.webView.resumeTimers()
                        adapter.webView.onResume()
                    }
                    val ready = suspendCancellableCoroutine<Boolean> { cont ->
                        adapter.checkAttachmentsReady(expectedCount) { isReady ->
                            if (cont.isActive) cont.resume(isReady)
                        }
                    }
                    if (ready) {
                        Log.i(TAG, "✅ Attachments confirmed ready ($expectedCount chips) in ChatGPT DOM at attempt #${attempt + 1}")
                        attachmentsReady = true
                        break
                    }
                    if (attempt % 3 == 0) {
                        _sessionStatus.value = "Uploading image assets to ChatGPT (${attempt + 1}s)..."
                    }
                }

                if (!attachmentsReady) {
                    // Check if at least 1 attachment is present
                    val partialReady = suspendCancellableCoroutine<Boolean> { cont ->
                        adapter.checkAttachmentsReady(expectedCount = 1) { isReady ->
                            if (cont.isActive) cont.resume(isReady)
                        }
                    }
                    if (partialReady) {
                        Log.i(TAG, "ℹ️ At least 1 attachment chip confirmed ready; proceeding with prompt submission.")
                        attachmentsReady = true
                    } else {
                        Log.w(TAG, "⚠️ Attachment detector timed out; proceeding with prompt submission since files were dispatched.")
                        attachmentsReady = true
                    }
                }
            }

            // Record assistant turn count and existing images prior to generation
            val initialTurnCount = suspendCancellableCoroutine<Int> { cont ->
                adapter.getAssistantTurnCount { count ->
                    if (cont.isActive) cont.resume(count)
                }
            }
            val existingUrls = suspendCancellableCoroutine<List<String>> { cont ->
                adapter.getExistingAssistantImageUrls { urls ->
                    if (cont.isActive) cont.resume(urls)
                }
            }.toMutableList()

            // Also exclude the base image and reference URLs if they are web URLs
            if (baseImageUrl.startsWith("http")) existingUrls.add(baseImageUrl)
            referenceImageUrls.forEach { if (it.startsWith("http")) existingUrls.add(it) }

            Log.i(TAG, "🔍 Initial state: turnCount=$initialTurnCount, existingImages=${existingUrls.size}")

            // 3. Inject prompt & submit
            _sessionStatus.value = "Submitting prompt: \"${prompt.take(30)}...\""
            suspendCancellableCoroutine<Boolean> { cont ->
                adapter.injectPromptAndSubmit(prompt) { success ->
                    if (cont.isActive) cont.resume(success)
                }
            }

            // 4. Poll for generated image strictly from the NEW assistant turn
            _sessionStatus.value = "Generating thumbnail with ChatGPT..."
            val capturedRaw = pollForGeneratedImage(adapter, initialTurnCount, existingUrls)

            adapter.clearPendingFiles()

            if (!capturedRaw.isNullOrBlank()) {
                val savedUrl = saveGeneratedResultToCache(context, capturedRaw)
                if (savedUrl != null) {
                    _sessionStatus.value = "Thumbnail Generated by ChatGPT (1080P)"
                    val job = GenerationJob(
                        prompt = prompt,
                        baseImageUrl = baseImageUrl,
                        resultUrl = savedUrl,
                        latencyMs = 2400,
                        status = "CHATGPT GENERATED"
                    )
                    ImageInpaintEngine.recordJob(job)
                    return@withContext Result.success(savedUrl)
                }
            }

            // 5. If ChatGPT didn't return an image, return failure instead of silently echoing base image
            Log.w(TAG, "ChatGPT did not produce a valid new image in time")
            _sessionStatus.value = "Generation timed out or not produced. Please retry."
            return@withContext Result.failure(
                IllegalStateException("ChatGPT did not produce a new thumbnail revision within 165s. Please ensure you are logged in to ChatGPT in Dg-Images.")
            )
        } catch (e: Exception) {
            Log.e(TAG, "Exception during executeGeneration", e)
            _sessionStatus.value = "Error: ${e.message}"
            return@withContext Result.failure(e)
        }
    }

    private suspend fun pollForGeneratedImage(
        adapter: ChatGptWebAdapter,
        initialTurnCount: Int,
        excludeUrls: List<String>
    ): String? {
        // Poll for up to 165 seconds (55 attempts x 3000ms) to accommodate Thinking models and DALL-E queues
        for (i in 0 until 55) {
            delay(3000)

            // 1. Check if asynchronous DataURL push from in-WebView fetch already arrived
            val pushed = adapter.lastCapturedDataUrl
            if (!pushed.isNullOrBlank() && pushed.startsWith("data:")) {
                Log.i(TAG, "🎯 Captured image from asynchronous DataURL push on attempt #${i + 1} (len=${pushed.length})!")
                return pushed
            }

            withContext(Dispatchers.Main) {
                adapter.webView.resumeTimers()
                adapter.webView.onResume()
            }
            val result = suspendCancellableCoroutine<String?> { cont ->
                adapter.captureGeneratedImage(initialTurnCount, excludeUrls) { imgResult ->
                    if (cont.isActive) cont.resume(imgResult)
                }
            }

            // 2. Check again immediately after evaluateJavascript in case the callback populated it
            val pushedAfter = adapter.lastCapturedDataUrl
            if (!pushedAfter.isNullOrBlank() && pushedAfter.startsWith("data:")) {
                Log.i(TAG, "🎯 Captured image from asynchronous DataURL push on attempt #${i + 1} (len=${pushedAfter.length})!")
                return pushedAfter
            }

            when {
                result == "LOADING" || (result != null && result.startsWith("blob:")) -> {
                    _sessionStatus.value = "ChatGPT rendering 1080p canvas... (${(i + 1) * 3}s)"
                }
                result == "GENERATING" || result.isNullOrBlank() || result == "null" -> {
                    _sessionStatus.value = "ChatGPT Generating Thumbnail... (${(i + 1) * 3}s)"
                }
                result.startsWith("http://") || result.startsWith("https://") || result.startsWith("data:") -> {
                    if (i < 1) {
                        Log.i(TAG, "⏳ Image candidate at attempt #${i + 1}, waiting for generation cycle to settle...")
                        _sessionStatus.value = "ChatGPT Generating Thumbnail... (${(i + 1) * 3}s)"
                    } else {
                        Log.i(TAG, "🎯 Captured newly generated image on attempt #${i + 1}!")
                        return result
                    }
                }
                result.startsWith("TEXT_RESPONSE:") -> {
                    val text = result.substringAfter("TEXT_RESPONSE:").trim()
                    Log.w(TAG, "⚠️ ChatGPT responded with text instead of image: ${text.take(200)}")
                    _sessionStatus.value = "ChatGPT: \"${text.take(45)}...\""
                    return null
                }
                else -> {
                    Log.d(TAG, "Polling attempt #${i + 1}: $result")
                }
            }
        }
        return null
    }

    suspend fun startFreshSession(context: Context): Boolean = withContext(Dispatchers.Main) {
        val adapter = activeAdapter ?: return@withContext false
        try {
            _sessionStatus.value = "Starting fresh ChatGPT session..."
            adapter.clearPendingFiles()
            adapter.lastCapturedDataUrl = null

            suspendCancellableCoroutine<Boolean> { cont ->
                adapter.startNewChat { success ->
                    adapter.ensureComposerReady(timeoutMs = 6000L) { ready ->
                        adapter.clearComposerAttachments {
                            if (cont.isActive) cont.resume(ready)
                        }
                    }
                }
            }

            withContext(Dispatchers.IO) {
                try {
                    context.cacheDir.listFiles()?.forEach { file ->
                        if (file.name.startsWith("chatgpt_gen_") ||
                            file.name.startsWith("base_") ||
                            file.name.startsWith("ref_") ||
                            file.name.startsWith("inpaint_")) {
                            file.delete()
                        }
                    }
                } catch (_: Exception) {}
            }

            _sessionStatus.value = "ChatGPT Ready (Fresh Session)"
            Log.i(TAG, "✨ Fresh session started: new chat active, composer and cache cleared")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error starting fresh session", e)
            false
        }
    }

    private suspend fun saveGeneratedResultToCache(
        context: Context,
        captured: String
    ): String? = withContext(Dispatchers.IO) {
        try {
            val outputFile = File(context.cacheDir, "chatgpt_gen_${System.currentTimeMillis()}.jpg")
            if (captured.startsWith("data:")) {
                val base64Data = captured.substringAfter(",")
                val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                FileOutputStream(outputFile).use { it.write(bytes) }
                Log.i(TAG, "💾 Saved Base64 generated result -> ${outputFile.name} (${bytes.size} bytes)")
                "http://127.0.0.1:5488/v1/image/${outputFile.name}"
            } else if (captured.startsWith("http://") || captured.startsWith("https://")) {
                val chatGptCookie = CookieManager.getInstance().getCookie("https://chatgpt.com") ?: ""
                val specificCookie = CookieManager.getInstance().getCookie(captured) ?: ""
                val combinedCookie = listOf(chatGptCookie, specificCookie).filter { it.isNotBlank() }.joinToString("; ")

                val reqBuilder = Request.Builder()
                    .url(captured)
                    .header("User-Agent", ChatGptWebAdapter.USER_AGENT)
                    .header("Referer", "https://chatgpt.com/")
                    .header("Origin", "https://chatgpt.com")
                    .header("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")

                if (combinedCookie.isNotBlank()) {
                    reqBuilder.header("Cookie", combinedCookie)
                }
                val request = reqBuilder.build()
                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    val bytes = response.body?.bytes()
                    if (bytes != null && bytes.isNotEmpty()) {
                        FileOutputStream(outputFile).use { it.write(bytes) }
                        Log.i(TAG, "💾 Downloaded CDN generated result -> ${outputFile.name} (${bytes.size} bytes)")
                        "http://127.0.0.1:5488/v1/image/${outputFile.name}"
                    } else {
                        captured
                    }
                } else {
                    Log.w(TAG, "⚠️ CDN fetch returned HTTP ${response.code} for $captured")
                    captured
                }
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving generated result to cache", e)
            null
        }
    }
}
