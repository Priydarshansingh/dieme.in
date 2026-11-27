package com.digicast.app.api.extension

import android.content.Context
import android.net.Uri
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

/**
 * Dieme Cloud AI Image Studio Extension.
 * Connects directly to Dieme backend APIs for high-CTR 16:9 thumbnail generation,
 * inpainting revisions, and creator strategy chat without requiring any companion APK.
 */
class DefaultImageStudioExtension : ImageStudioExtension {

    override val extensionId: String = "com.digicast.ext.cloudstudio"
    override val name: String = "Dieme Cloud AI Studio (Built-in)"
    override val description: String = "High-CTR 16:9 YouTube thumbnail synthesis and creator intelligence engine."
    override val versionName: String = "1.2.26"
    override val versionCode: Int = 29
    override val type: ExtensionType = ExtensionType.IMAGE_STUDIO

    companion object {
        private const val TAG = "DefaultImageStudio"
        private const val PRIMARY_API_URL = "https://www.dieme.in/api/studio/thumbnail"
        private const val FALLBACK_API_URL = "https://dieme.in/api/studio/thumbnail"
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    /**
     * Always returns true because Dieme Cloud AI is natively built into the Dieme app.
     * No external companion APK is required.
     */
    override fun isDgImagesInstalled(context: Context): Boolean = true

    override suspend fun generateThumbnail(
        context: Context,
        baseImageUrl: String,
        maskPointsJson: String?,
        prompt: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            onProgress(15, "Connecting to Dieme AI Studio...")

            val payload = JSONObject().apply {
                put("prompt", prompt)
                put("baseImageUrl", baseImageUrl)
                put("aspectRatio", "16:9")
                put("resolution", "1080p")
                put("client", "Dieme-Android")
                put("timestamp", System.currentTimeMillis())

                if (!maskPointsJson.isNullOrBlank() && maskPointsJson.trim().startsWith("{")) {
                    try {
                        val maskObj = JSONObject(maskPointsJson)
                        if (maskObj.has("pins")) {
                            put("pins", maskObj.get("pins"))
                        } else if (maskObj.has("maskPoints")) {
                            put("pins", maskObj.get("maskPoints"))
                        }
                        if (maskObj.has("referenceImages")) {
                            put("referenceImages", maskObj.getJSONArray("referenceImages"))
                        }
                        if (maskObj.has("sessionId")) {
                            put("sessionId", maskObj.getString("sessionId"))
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Unparsed mask points payload: ${e.message}")
                        put("maskPointsJson", maskPointsJson)
                    }
                }
            }

            onProgress(35, "Synthesizing YouTube thumbnail composition...")

            val requestBody = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(PRIMARY_API_URL)
                .header("User-Agent", "DiemeStudio-Android/1.2")
                .header("X-Digicast-Client", "Dieme-Core-App")
                .post(requestBody)
                .build()

            onProgress(60, "Generating 1080p canvas with Cloud AI...")

            var response = try {
                httpClient.newCall(request).execute()
            } catch (e: Exception) {
                Log.w(TAG, "Primary endpoint unreachable, trying fallback: ${e.message}")
                val fallbackRequest = request.newBuilder().url(FALLBACK_API_URL).build()
                httpClient.newCall(fallbackRequest).execute()
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val errBody = resp.body?.string() ?: ""
                    val errJson = try { JSONObject(errBody) } catch (_: Exception) { null }
                    val errMsg = errJson?.optString("message") ?: "Server returned HTTP ${resp.code}"
                    Log.e(TAG, "Server error: $errMsg")
                    return@withContext Result.failure(IllegalStateException(errMsg))
                }

                val bodyStr = resp.body?.string() ?: ""
                val respJson = JSONObject(bodyStr)
                val status = respJson.optString("status", "")
                val type = respJson.optString("type", "image")

                if (status != "success") {
                    val errMsg = respJson.optString("message", "Generation failed on server.")
                    return@withContext Result.failure(IllegalStateException(errMsg))
                }

                if (type == "chat") {
                    val reply = respJson.optString("reply", "No advice returned.")
                    onProgress(100, "Received strategy advice from Dieme AI!")
                    return@withContext Result.success("CHAT_REPLY: $reply")
                }

                val generatedUrl = respJson.optString("resultUrl", "").ifBlank {
                    respJson.optString("resultBase64", "")
                }

                if (generatedUrl.isBlank()) {
                    return@withContext Result.failure(IllegalStateException("No image data returned from AI engine."))
                }

                onProgress(90, "Caching 1080p thumbnail to local storage...")
                val localUri = downloadAndCacheLocally(context, generatedUrl)
                onProgress(100, "Thumbnail successfully generated by Dieme AI!")
                Log.i(TAG, "✨ Final local image URI: $localUri")
                Result.success(localUri)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during generateThumbnail", e)
            Result.failure(e)
        }
    }

    override suspend fun resetSession(context: Context): Result<Boolean> = withContext(Dispatchers.IO) {
        // Cloud sessions are stateless per request; reset is immediately ready
        Result.success(true)
    }

    private fun downloadAndCacheLocally(context: Context, urlOrUri: String): String {
        return try {
            val destFile = File(context.cacheDir, "dieme_thumb_${System.currentTimeMillis()}.jpg")
            if (urlOrUri.startsWith("data:")) {
                val base64Data = urlOrUri.substringAfter(",")
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                FileOutputStream(destFile).use { output ->
                    output.write(bytes)
                    output.flush()
                }
                Log.i(TAG, "💾 Saved Base64 result to cache: ${destFile.absolutePath} (${bytes.size} bytes)")
                Uri.fromFile(destFile).toString()
            } else if (urlOrUri.startsWith("http://") || urlOrUri.startsWith("https://")) {
                val req = Request.Builder().url(urlOrUri).get().build()
                httpClient.newCall(req).execute().use { resp ->
                    if (resp.isSuccessful) {
                        resp.body?.byteStream()?.use { input ->
                            FileOutputStream(destFile).use { output ->
                                input.copyTo(output)
                                output.flush()
                            }
                        }
                        Log.i(TAG, "💾 Downloaded HTTP result to cache: ${destFile.absolutePath} (${destFile.length()} bytes)")
                        Uri.fromFile(destFile).toString()
                    } else {
                        urlOrUri
                    }
                }
            } else {
                urlOrUri
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to download and cache result locally", e)
            urlOrUri
        }
    }
}
