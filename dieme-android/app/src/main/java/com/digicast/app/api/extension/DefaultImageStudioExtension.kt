package com.digicast.app.api.extension

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
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

class DefaultImageStudioExtension : ImageStudioExtension {

    override val extensionId: String = "com.digicast.ext.dgimages"
    override val name: String = "Dg-Images AI Bridge (Built-in)"
    override val description: String = "Direct built-in IPC bridge to Dg-Images companion app."
    override val versionName: String = "1.1.0"
    override val versionCode: Int = 2
    override val type: ExtensionType = ExtensionType.IMAGE_STUDIO

    companion object {
        private const val TAG = "DefaultImageStudio"
        const val DG_IMAGES_PACKAGE = "com.digicast.dgimages"
        const val ACTION_START_SERVICE = "com.digicast.dgimages.START_DAEMON"
        const val DAEMON_HOST = "127.0.0.1"
        const val DAEMON_PORT = 5488
        const val BASE_URL = "http://$DAEMON_HOST:$DAEMON_PORT"

        private var activeServiceConnection: android.content.ServiceConnection? = null
        private var isBound = false
    }

    // Force Proxy.NO_PROXY so OkHttp communicates directly with local loopback without carrier cellular proxy interception
    private val httpClient = OkHttpClient.Builder()
        .proxy(Proxy.NO_PROXY)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .writeTimeout(180, TimeUnit.SECONDS)
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
            onProgress(10, "Verifying Dg-Images companion...")
            val installed = isDgImagesInstalled(context)
            if (!installed) {
                return@withContext Result.failure(
                    IllegalStateException("Dg-Images companion app is not installed on this device. Please install Dg-Images.")
                )
            }

            onProgress(20, "Connecting to Dg-Images engine (127.0.0.1:5488)...")

            // Check if daemon is active; if not, wake it up and poll for up to 6 seconds
            var daemonReady = checkDaemonHealth()
            if (!daemonReady) {
                wakeUpDaemon(context)
                for (attempt in 0 until 12) {
                    delay(500)
                    if (checkDaemonHealth()) {
                        daemonReady = true
                        break
                    }
                }
            }

            if (!daemonReady) {
                return@withContext Result.failure(
                    IllegalStateException("Dg-Images engine is not responding on 127.0.0.1:5488. Please ensure Dg-Images background service is running.")
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
                            val refs = maskObj.getJSONArray("referenceImages")
                            put("referenceImages", refs)
                            Log.i(TAG, "📦 Injected ${refs.length()} reference image(s) into payload")
                        }
                        if (maskObj.has("preferNewChat")) {
                            put("preferNewChat", maskObj.getBoolean("preferNewChat"))
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing maskPointsJson wrapper", e)
                        put("maskPoints", maskPointsJson)
                    }
                } else {
                    put("maskPoints", maskPointsJson ?: "[]")
                }
            }

            onProgress(40, "Sending inpaint task with reference assets...")

            val requestBody = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$BASE_URL/v1/thumbnail/generate")
                .header("X-Digicast-Client", "Core-App")
                .post(requestBody)
                .build()

            val response = try {
                httpClient.newCall(request).execute()
            } catch (e: Exception) {
                Log.e(TAG, "Communication error with Dg-Images daemon", e)
                return@withContext Result.failure(
                    IllegalStateException("Communication error with Dg-Images daemon: ${e.message}")
                )
            }

            response.use { resp ->
                if (resp.isSuccessful) {
                    onProgress(85, "Synthesizing specular details & neon text...")
                    val bodyStr = resp.body?.string() ?: ""
                    val respJson = JSONObject(bodyStr)
                    val status = respJson.optString("status", "")
                    val generatedUrl = respJson.optString("resultUrl", "").ifBlank {
                        respJson.optString("resultBase64", "")
                    }

                    if (status == "success" && generatedUrl.isNotBlank()) {
                        onProgress(95, "Caching generated result to local storage...")
                        val localUri = downloadAndCacheLocally(context, generatedUrl)
                        onProgress(100, "Thumbnail successfully generated by Dg-Images!")
                        Log.i(TAG, "✅ Success! Final Local URI: $localUri (from ${generatedUrl.take(40)}...)")
                        Result.success(localUri)
                    } else {
                        val errMsg = respJson.optString("error", "Engine failed to produce a valid thumbnail")
                        Log.w(TAG, "⚠️ Daemon error response: $errMsg")
                        Result.failure(IllegalStateException(errMsg))
                    }
                } else {
                    Result.failure(
                        IllegalStateException("Dg-Images returned error code HTTP ${resp.code}")
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during generateThumbnail", e)
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
            response.use { resp ->
                if (resp.isSuccessful) {
                    Log.i(TAG, "✨ Successfully reset session on Dg-Images companion")
                    Result.success(true)
                } else {
                    Result.failure(IllegalStateException("Failed to reset Dg-Images session: HTTP ${resp.code}"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error calling resetSession on Dg-Images", e)
            Result.failure(e)
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
                Log.i(TAG, "💾 Saved Base64 result to local cache -> ${destFile.absolutePath} (${bytes.size} bytes)")
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
                        Log.i(TAG, "💾 Downloaded HTTP result to local cache -> ${destFile.absolutePath} (${destFile.length()} bytes)")
                        android.net.Uri.fromFile(destFile).toString()
                    } else {
                        Log.w(TAG, "⚠️ Failed to download image from HTTP source: HTTP ${resp.code}")
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

    private fun wakeUpDaemon(context: Context) {
        // 1. Primary: Activate com.digicast.dgimages in the background via DgImagesDaemonProvider
        try {
            val uri = android.net.Uri.parse("content://com.digicast.dgimages.daemon")
            context.contentResolver.call(uri, "start_daemon", null, null)
            Log.i(TAG, "📡 Woke Dg-Images companion via DgImagesDaemonProvider")
        } catch (e: Exception) {
            Log.w(TAG, "DgImagesDaemonProvider wake fallback: ${e.message}")
        }

        // 2. Secondary: Bind service to keep background daemon connected permanently
        if (!isBound) {
            try {
                val sIntent = Intent().apply {
                    component = android.content.ComponentName(DG_IMAGES_PACKAGE, "com.digicast.dgimages.service.DgImagesService")
                }
                val conn = object : android.content.ServiceConnection {
                    override fun onServiceConnected(name: android.content.ComponentName?, service: android.os.IBinder?) {
                        Log.i(TAG, "🔗 DgImagesService bound successfully")
                        isBound = true
                    }
                    override fun onServiceDisconnected(name: android.content.ComponentName?) {
                        Log.w(TAG, "⚡ DgImagesService disconnected")
                        isBound = false
                    }
                }
                val flags = Context.BIND_AUTO_CREATE or Context.BIND_IMPORTANT
                val success = context.applicationContext.bindService(sIntent, conn, flags)
                if (success) {
                    activeServiceConnection = conn
                    Log.i(TAG, "✅ bindService call returned true")
                }
            } catch (e: Exception) {
                Log.w(TAG, "bindService fallback error: ${e.message}")
            }
        }
    }
}

