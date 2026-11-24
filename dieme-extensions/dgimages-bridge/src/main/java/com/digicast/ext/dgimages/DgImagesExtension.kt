package com.digicast.ext.dgimages

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.digicast.app.api.extension.ExtensionType
import com.digicast.app.api.extension.ImageStudioExtension
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.net.Proxy
import java.util.concurrent.TimeUnit

class DgImagesExtension : ImageStudioExtension {

    override val extensionId: String = "com.digicast.ext.dgimages"
    override val name: String = "Dg-Images AI Bridge"
    override val description: String = "High-fidelity thumbnail generation & object inpainting bridge for Dg-Images companion app."
    override val versionName: String = "1.0.0"
    override val versionCode: Int = 1
    override val type: ExtensionType = ExtensionType.IMAGE_STUDIO

    companion object {
        const val DG_IMAGES_PACKAGE = "com.digicast.dgimages"
        const val ACTION_START_SERVICE = "com.digicast.dgimages.START_DAEMON"
        const val DAEMON_HOST = "127.0.0.1"
        const val DAEMON_PORT = 5488
        const val BASE_URL = "http://$DAEMON_HOST:$DAEMON_PORT"
    }

    // Force Proxy.NO_PROXY so OkHttp communicates directly with local loopback without carrier cellular proxy interception
    private val httpClient = OkHttpClient.Builder()
        .proxy(Proxy.NO_PROXY)
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .build()

    override fun isDgImagesInstalled(context: Context): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    DG_IMAGES_PACKAGE,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(DG_IMAGES_PACKAGE, 0)
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun generateThumbnail(
        context: Context,
        baseImageUrl: String,
        maskPointsJson: String?,
        prompt: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            onProgress(10, "Verifying Dg-Images companion installation...")
            val installed = isDgImagesInstalled(context)
            if (!installed) {
                return@withContext Result.failure(
                    IllegalStateException("Dg-Images companion app is not installed on this device. Please install Dg-Images.")
                )
            }

            onProgress(20, "Connecting to Dg-Images local engine...")

            // Check if daemon is active, if not, send wake-up broadcast and service intent
            var daemonReady = checkDaemonHealth()
            if (!daemonReady) {
                wakeUpDaemon(context)
                delay(1500)
                daemonReady = checkDaemonHealth()
            }

            if (!daemonReady) {
                return@withContext Result.failure(
                    IllegalStateException("Dg-Images engine is not running on 127.0.0.1:5488. Please open Dg-Images and keep it active in the background.")
                )
            }

            val payload = JSONObject().apply {
                put("baseImageUrl", baseImageUrl)
                put("prompt", prompt)
                put("aspectRatio", "16:9")
                put("resolution", "1080p")
                put("client", "Dieme-Core")
                put("timestamp", System.currentTimeMillis())

                if (maskPointsJson != null && maskPointsJson.trim().startsWith("{")) {
                    try {
                        val maskObj = JSONObject(maskPointsJson)
                        if (maskObj.has("maskPoints")) {
                            put("maskPoints", maskObj.get("maskPoints"))
                        } else if (maskObj.has("pins")) {
                            put("maskPoints", maskObj.get("pins"))
                        } else {
                            put("maskPoints", "[]")
                        }
                        if (maskObj.has("referenceImages")) {
                            put("referenceImages", maskObj.getJSONArray("referenceImages"))
                        }
                        if (maskObj.has("preferNewChat")) {
                            put("preferNewChat", maskObj.getBoolean("preferNewChat"))
                        }
                    } catch (_: Exception) {
                        put("maskPoints", maskPointsJson)
                    }
                } else {
                    put("maskPoints", maskPointsJson ?: "[]")
                }
            }

            onProgress(40, "Sending inpaint task to Dg-Images...")

            val requestBody = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$BASE_URL/v1/thumbnail/generate")
                .header("X-Digicast-Client", "Core-App")
                .post(requestBody)
                .build()

            val response = try {
                httpClient.newCall(request).execute()
            } catch (e: Exception) {
                return@withContext Result.failure(
                    IllegalStateException("Communication error with Dg-Images daemon: ${e.message}")
                )
            }

            if (response.isSuccessful) {
                onProgress(85, "Synthesizing specular details & neon text...")
                val bodyStr = response.body?.string() ?: ""
                val respJson = JSONObject(bodyStr)
                val status = respJson.optString("status", "")
                val generatedUrl = respJson.optString("resultUrl", "")

                if (status == "success" && generatedUrl.isNotBlank()) {
                    onProgress(95, "Caching generated result to local storage...")
                    val localUri = downloadAndCacheLocally(context, generatedUrl)
                    onProgress(100, "Thumbnail successfully generated by Dg-Images!")
                    Result.success(localUri)
                } else {
                    val errMsg = respJson.optString("error", "Engine failed to produce a valid thumbnail")
                    Result.failure(IllegalStateException(errMsg))
                }
            } else {
                Result.failure(
                    IllegalStateException("Dg-Images returned error code HTTP ${response.code}")
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun resetSession(context: Context): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            if (!isDgImagesInstalled(context)) {
                return@withContext Result.failure(IllegalStateException("Dg-Images companion app is not installed."))
            }
            if (!checkDaemonHealth()) {
                wakeUpDaemon(context)
                delay(1000)
            }
            val request = Request.Builder()
                .url("$BASE_URL/v1/session/new")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                Result.failure(IllegalStateException("Failed to reset session: HTTP ${response.code}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun checkDaemonHealth(): Boolean {
        return try {
            val request = Request.Builder()
                .url("$BASE_URL/v1/health")
                .get()
                .build()
            val response = httpClient.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    private fun downloadAndCacheLocally(context: Context, urlOrUri: String): String {
        return try {
            val destFile = java.io.File(context.cacheDir, "dieme_gen_${System.currentTimeMillis()}.jpg")
            if (urlOrUri.startsWith("data:")) {
                val base64Data = urlOrUri.substringAfter(",")
                val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                java.io.FileOutputStream(destFile).use { output ->
                    output.write(bytes)
                    output.flush()
                }
                android.net.Uri.fromFile(destFile).toString()
            } else if (urlOrUri.startsWith("http://") || urlOrUri.startsWith("https://")) {
                val req = Request.Builder().url(urlOrUri).get().build()
                httpClient.newCall(req).execute().use { resp ->
                    if (resp.isSuccessful) {
                        resp.body?.byteStream()?.use { input ->
                            java.io.FileOutputStream(destFile).use { output ->
                                input.copyTo(output)
                                output.flush()
                            }
                        }
                        android.net.Uri.fromFile(destFile).toString()
                    } else {
                        urlOrUri
                    }
                }
            } else {
                urlOrUri
            }
        } catch (e: Exception) {
            urlOrUri
        }
    }

    private fun wakeUpDaemon(context: Context) {
        try {
            val intent = Intent(ACTION_START_SERVICE).apply {
                setPackage(DG_IMAGES_PACKAGE)
            }
            context.sendBroadcast(intent)
        } catch (_: Exception) {}

        try {
            val serviceIntent = Intent().apply {
                component = ComponentName(DG_IMAGES_PACKAGE, "com.digicast.dgimages.service.DgImagesService")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (_: Exception) {}
    }
}
