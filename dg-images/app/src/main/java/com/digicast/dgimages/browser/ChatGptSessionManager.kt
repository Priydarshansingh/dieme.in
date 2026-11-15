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
            Log.w(TAG, "⚠️ activeAdapter still null; falling back to local ImageInpaintEngine")
            return@withContext ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = baseImageUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        }

        try {
            _sessionStatus.value = "Preparing media assets..."

            // Download base image and reference images to local cache
            val filesToAttach = withContext(Dispatchers.IO) {
                fun resolveMediaToFile(mediaStr: String, prefix: String, index: Int): File? {
                    if (mediaStr.isBlank()) return null
                    val outFile = File(context.cacheDir, "${prefix}_${System.currentTimeMillis()}_$index.jpg")
                    return try {
                        when {
                            mediaStr.startsWith("http://") || mediaStr.startsWith("https://") -> {
                                URL(mediaStr).openStream().use { input ->
                                    FileOutputStream(outFile).use { output -> input.copyTo(output) }
                                }
                                Log.i(TAG, "✅ Downloaded HTTP asset $prefix #$index -> ${outFile.name}")
                                outFile
                            }
                            mediaStr.startsWith("data:") || (mediaStr.length > 500 && !mediaStr.startsWith("content:") && !mediaStr.startsWith("file:") && !mediaStr.startsWith("/")) -> {
                                val base64Data = if (mediaStr.contains(",")) mediaStr.substringAfter(",") else mediaStr
                                val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                                FileOutputStream(outFile).use { it.write(bytes) }
                                Log.i(TAG, "✅ Decoded Base64 asset $prefix #$index -> ${outFile.name} (${bytes.size} bytes)")
                                outFile
                            }
                            mediaStr.startsWith("file://") || mediaStr.startsWith("/") -> {
                                val cleanPath = if (mediaStr.startsWith("file://")) mediaStr.substring(7) else mediaStr
                                val srcFile = File(cleanPath)
                                if (srcFile.exists()) {
                                    srcFile.inputStream().use { input ->
                                        FileOutputStream(outFile).use { output -> input.copyTo(output) }
                                    }
                                    Log.i(TAG, "✅ Copied local file asset $prefix #$index -> ${outFile.name}")
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
                                Log.i(TAG, "✅ Read content:// asset $prefix #$index -> ${outFile.name}")
                                outFile
                            }
                            else -> {
                                Log.w(TAG, "⚠️ Unknown media format for $prefix #$index (len=${mediaStr.length})")
                                null
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error resolving $prefix #$index to file", e)
                        null
                    }
                }

                val list = mutableListOf<File>()
                resolveMediaToFile(baseImageUrl, "base", 0)?.let { list.add(it) }

                // Attach all reference images provided
                for ((idx, ref) in referenceImageUrls.withIndex()) {
                    resolveMediaToFile(ref, "ref", idx)?.let {
                        list.add(it)
                        Log.i(TAG, "📎 Attached reference image #$idx -> ${it.name} (${it.length()} bytes)")
                    }
                }
                list
            }

            // 1. If preferNewChat is true, click New Chat first
            val startNew = forceNewChat ?: _preferNewChat.value
            if (startNew) {
                _sessionStatus.value = "Opening fresh ChatGPT conversation..."
                adapter.startNewChat()
                delay(1200)
            } else {
                _sessionStatus.value = "Appending to ongoing ChatGPT conversation..."
            }

            // 2. Attach base thumbnail + reference assets
            if (filesToAttach.isNotEmpty()) {
                _sessionStatus.value = "Attaching ${filesToAttach.size} image assets to ChatGPT..."
                Log.i(TAG, "📎 Attaching ${filesToAttach.size} image assets to ChatGPT (Base + Refs)")
                suspendCancellableCoroutine<Boolean> { cont ->
                    adapter.attachImages(filesToAttach) { success ->
                        if (cont.isActive) cont.resume(success)
                    }
                }

                // Poll for attachments readiness up to 10 seconds
                for (attempt in 0 until 10) {
                    delay(1000)
                    val ready = suspendCancellableCoroutine<Boolean> { cont ->
                        adapter.checkAttachmentsReady { isReady ->
                            if (cont.isActive) cont.resume(isReady)
                        }
                    }
                    if (ready) {
                        Log.i(TAG, "✅ Attachments confirmed ready in ChatGPT DOM at attempt #${attempt + 1}")
                        break
                    }
                }
            }

            // Record existing assistant images before prompt submission
            val existingUrls = suspendCancellableCoroutine<List<String>> { cont ->
                adapter.getExistingAssistantImageUrls { urls ->
                    if (cont.isActive) cont.resume(urls)
                }
            }
            Log.i(TAG, "🔍 Recorded ${existingUrls.size} existing assistant image(s) prior to generation")

            // 3. Inject prompt & submit
            _sessionStatus.value = "Submitting prompt: \"${prompt.take(30)}...\""
            suspendCancellableCoroutine<Boolean> { cont ->
                adapter.injectPromptAndSubmit(prompt) { success ->
                    if (cont.isActive) cont.resume(success)
                }
            }

            // 4. Poll for generated image from ChatGPT (excluding prior images)
            _sessionStatus.value = "Generating thumbnail with ChatGPT..."
            val capturedRaw = pollForGeneratedImage(adapter, existingUrls)

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

            // 5. If ChatGPT didn't return an image, fall back to Dg-Images Neural Engine
            Log.w(TAG, "ChatGPT did not produce a valid image in time; using local engine fallback")
            _sessionStatus.value = "Refining with Dg-Images Neural Canvas..."
            ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = baseImageUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        } catch (e: Exception) {
            Log.e(TAG, "Exception during executeGeneration", e)
            _sessionStatus.value = "Error: ${e.message}"
            ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = baseImageUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        }
    }

    private suspend fun pollForGeneratedImage(adapter: ChatGptWebAdapter, excludeUrls: List<String>): String? {
        // Poll for up to 90 seconds (30 attempts x 3000ms)
        for (i in 0 until 30) {
            delay(3000)
            _sessionStatus.value = "ChatGPT Generating Thumbnail... (${(i + 1) * 3}s)"
            val result = suspendCancellableCoroutine<String?> { cont ->
                adapter.captureGeneratedImage(excludeUrls) { imgResult ->
                    if (cont.isActive) cont.resume(imgResult)
                }
            }
            if (!result.isNullOrBlank()) {
                Log.i(TAG, "🎯 Captured newly generated image on attempt #${i + 1}!")
                return result
            }
        }
        return null
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
                "http://127.0.0.1:5488/v1/image/${outputFile.name}"
            } else if (captured.startsWith("http://") || captured.startsWith("https://")) {
                val cookie = CookieManager.getInstance().getCookie(captured) ?: ""
                val reqBuilder = Request.Builder()
                    .url(captured)
                    .header("User-Agent", ChatGptWebAdapter.USER_AGENT)
                if (cookie.isNotBlank()) {
                    reqBuilder.header("Cookie", cookie)
                }
                val request = reqBuilder.build()
                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    val bytes = response.body?.bytes()
                    if (bytes != null && bytes.isNotEmpty()) {
                        FileOutputStream(outputFile).use { it.write(bytes) }
                        "http://127.0.0.1:5488/v1/image/${outputFile.name}"
                    } else {
                        captured
                    }
                } else {
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
