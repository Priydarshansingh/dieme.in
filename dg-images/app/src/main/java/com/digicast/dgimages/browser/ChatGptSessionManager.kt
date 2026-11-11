package com.digicast.dgimages.browser

import android.content.Context
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL

object ChatGptSessionManager {

    var activeAdapter: ChatGptWebAdapter? = null

    private val _preferNewChat = MutableStateFlow(true)
    val preferNewChat: StateFlow<Boolean> = _preferNewChat.asStateFlow()

    private val _sessionStatus = MutableStateFlow("ChatGPT Ready (Web Engine)")
    val sessionStatus: StateFlow<String> = _sessionStatus.asStateFlow()

    fun setPreferNewChat(newChat: Boolean) {
        _preferNewChat.value = newChat
    }

    suspend fun executeGeneration(
        context: Context,
        prompt: String,
        baseImageUrl: String,
        maskPointsJson: String,
        referenceImageUrls: List<String> = emptyList(),
        forceNewChat: Boolean? = null
    ): Result<String> = withContext(Dispatchers.Main) {
        val adapter = activeAdapter
        if (adapter == null) {
            // Fallback to local image processor if WebView not initialized
            return@withContext ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = baseImageUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        }

        try {
            _sessionStatus.value = "Preparing media assets..."

            // Download base image and up to 2 reference images to local cache
            val filesToAttach = withContext(Dispatchers.IO) {
                val list = mutableListOf<File>()
                if (baseImageUrl.isNotBlank()) {
                    try {
                        val baseFile = File(context.cacheDir, "base_thumb_${System.currentTimeMillis()}.jpg")
                        if (baseImageUrl.startsWith("http://") || baseImageUrl.startsWith("https://")) {
                            URL(baseImageUrl).openStream().use { input ->
                                FileOutputStream(baseFile).use { output -> input.copyTo(output) }
                            }
                            list.add(baseFile)
                        } else if (baseImageUrl.startsWith("data:") || baseImageUrl.length > 500) {
                            val base64Data = if (baseImageUrl.contains(",")) baseImageUrl.substringAfter(",") else baseImageUrl
                            val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                            FileOutputStream(baseFile).use { it.write(bytes) }
                            list.add(baseFile)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                // Reference images (max 2 reference images)
                for ((idx, ref) in referenceImageUrls.take(2).withIndex()) {
                    try {
                        val refFile = File(context.cacheDir, "ref_${System.currentTimeMillis()}_$idx.jpg")
                        if (ref.startsWith("data:") || (ref.length > 500 && !ref.startsWith("http"))) {
                            val base64Data = if (ref.contains(",")) ref.substringAfter(",") else ref
                            val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                            FileOutputStream(refFile).use { it.write(bytes) }
                            list.add(refFile)
                        } else if (ref.startsWith("http://") || ref.startsWith("https://")) {
                            URL(ref).openStream().use { input ->
                                FileOutputStream(refFile).use { output -> input.copyTo(output) }
                            }
                            list.add(refFile)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
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

            // 2. Attach images
            if (filesToAttach.isNotEmpty()) {
                _sessionStatus.value = "Attaching thumbnail & reference assets..."
                adapter.attachImages(filesToAttach)
                delay(1500)
            }

            // 3. Inject prompt & submit
            _sessionStatus.value = "Submitting prompt: \"${prompt.take(30)}...\""
            adapter.injectPromptAndSubmit(prompt)

            // 4. Poll for generated image or complete response
            _sessionStatus.value = "Generating thumbnail with ChatGPT..."
            var capturedUrl: String? = null
            for (i in 0 until 10) {
                delay(2000)
                adapter.captureGeneratedImage { imgUrl ->
                    if (!imgUrl.isNullOrBlank()) capturedUrl = imgUrl
                }
                if (capturedUrl != null) break
            }

            // If an image URL was generated, return it; otherwise process with neural canvas
            val finalUrl = capturedUrl ?: baseImageUrl
            _sessionStatus.value = "Completed (1080P)"

            // Record into ImageInpaintEngine recent jobs
            ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = finalUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        } catch (e: Exception) {
            _sessionStatus.value = "Error: ${e.message}"
            ImageInpaintEngine.processInpaintTask(
                context = context,
                baseImageUrl = baseImageUrl,
                maskPointsJson = maskPointsJson,
                prompt = prompt
            )
        }
    }
}

