package com.digicast.dgimages.server

import android.content.Context
import android.util.Log
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.OutputStream
import java.io.OutputStreamWriter
import java.io.PrintWriter
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket

class DgImagesHttpDaemon(
    private val context: Context,
    private val port: Int = 5488
) {
    companion object {
        private const val TAG = "DgImagesDaemon"
    }

    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private var serverJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    fun isAlive(): Boolean = isRunning && serverSocket != null && serverSocket?.isBound == true && serverSocket?.isClosed == false

    fun start() {
        if (isAlive()) {
            Log.i(TAG, "🟢 Daemon already listening and healthy on 127.0.0.1:$port")
            return
        }
        isRunning = true

        serverJob = scope.launch {
            try {
                // Bind exclusively to 127.0.0.1 with reuseAddress enabled
                serverSocket = ServerSocket().apply {
                    reuseAddress = true
                    bind(InetSocketAddress(InetAddress.getByName("127.0.0.1"), port), 50)
                }
                Log.i(TAG, "🟢 Daemon listening on 127.0.0.1:$port")
                while (isRunning) {
                    val clientSocket = try {
                        serverSocket?.accept()
                    } catch (e: Exception) {
                        null
                    }
                    if (clientSocket != null) {
                        scope.launch { handleClient(clientSocket) }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Server socket error on port $port: ${e.message}", e)
                isRunning = false
                try { serverSocket?.close() } catch (_: Exception) {}
                serverSocket = null
            }
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (_: Exception) {}
        serverJob?.cancel()
    }

    private suspend fun handleClient(socket: Socket) {
        try {
            socket.use { s ->
                val rawInput = s.getInputStream()
                val rawOutput = s.getOutputStream()

                // 1. Read HTTP headers byte-by-byte until \r\n\r\n delimiter
                val headerStream = ByteArrayOutputStream()
                var p3 = -1
                var p2 = -1
                var p1 = -1
                while (true) {
                    val b = rawInput.read()
                    if (b == -1) break
                    headerStream.write(b)
                    if (p3 == '\r'.code && p2 == '\n'.code && p1 == '\r'.code && b == '\n'.code) {
                        break
                    }
                    p3 = p2
                    p2 = p1
                    p1 = b
                }

                val headerStr = headerStream.toString("ISO-8859-1")
                val lines = headerStr.split("\r\n")
                val requestLine = lines.firstOrNull() ?: return
                val parts = requestLine.split(" ")
                if (parts.size < 2) return

                val method = parts[0]
                val path = parts[1]

                var contentLength = 0
                for (line in lines) {
                    if (line.lowercase().startsWith("content-length:")) {
                        contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                    }
                }

                when {
                    method == "GET" && (path == "/v1/health" || path == "/health") -> {
                        val responseJson = JSONObject().apply {
                            put("status", "ok")
                            put("app", "Dg-Images")
                            put("version", com.digicast.dgimages.BuildConfig.VERSION_NAME)
                            put("versionCode", com.digicast.dgimages.BuildConfig.VERSION_CODE)
                            put("ready", true)
                            put("port", port)
                        }.toString()
                        sendResponse(rawOutput, 200, "application/json", responseJson)
                    }

                    method == "GET" && path.startsWith("/v1/image/") -> {
                        val fileName = path.substringAfter("/v1/image/").substringBefore("?")
                        val file = File(context.cacheDir, fileName)
                        if (file.exists() && file.isFile) {
                            val bytes = file.readBytes()
                            val mime = if (fileName.endsWith(".png", true)) "image/png" else "image/jpeg"
                            sendBinaryResponse(rawOutput, 200, mime, bytes)
                        } else {
                            val notFoundJson = JSONObject().apply {
                                put("error", "Image not found")
                                put("fileName", fileName)
                            }.toString()
                            sendResponse(rawOutput, 404, "application/json", notFoundJson)
                        }
                    }

                    method == "POST" && (path == "/v1/session/new" || path == "/v1/session/reset") -> {
                        val success = com.digicast.dgimages.browser.ChatGptSessionManager.startFreshSession(context)
                        val responseJson = JSONObject().apply {
                            put("status", if (success) "success" else "error")
                            put("message", if (success) "Fresh session initialized" else "Session reset failed")
                            put("timestamp", System.currentTimeMillis())
                        }.toString()
                        sendResponse(rawOutput, 200, "application/json", responseJson)
                    }

                    method == "POST" && path == "/v1/eval" -> {
                        val bodyBytes = ByteArray(contentLength)
                        var bytesRead = 0
                        while (bytesRead < contentLength) {
                            val count = rawInput.read(bodyBytes, bytesRead, contentLength - bytesRead)
                            if (count == -1) break
                            bytesRead += count
                        }
                        val jsCode = String(bodyBytes, 0, bytesRead, Charsets.UTF_8)
                        val adapter = com.digicast.dgimages.browser.ChatGptSessionManager.activeAdapter
                        if (adapter != null) {
                            val latch = java.util.concurrent.CountDownLatch(1)
                            var evalResult = ""
                            android.os.Handler(android.os.Looper.getMainLooper()).post {
                                adapter.webView.evaluateJavascript(jsCode) { res ->
                                    evalResult = res ?: ""
                                    latch.countDown()
                                }
                            }
                            latch.await(5, java.util.concurrent.TimeUnit.SECONDS)
                            sendResponse(rawOutput, 200, "application/json", JSONObject().apply {
                                put("result", evalResult)
                            }.toString())
                        } else {
                            sendResponse(rawOutput, 503, "application/json", "{\"error\":\"No active adapter\"}")
                        }
                    }

                    method == "POST" && (path == "/v1/thumbnail/generate" || path == "/v1/generate" || path == "/generate") -> {
                        // Read exactly contentLength bytes directly from rawInput without buffer corruption
                        val bodyBytes = ByteArray(contentLength)
                        var bytesRead = 0
                        while (bytesRead < contentLength) {
                            val count = rawInput.read(bodyBytes, bytesRead, contentLength - bytesRead)
                            if (count == -1) break
                            bytesRead += count
                        }

                        val bodyString = String(bodyBytes, 0, bytesRead, Charsets.UTF_8)
                        val json = try {
                            JSONObject(bodyString)
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse JSON body (length=$bytesRead): ${e.message}")
                            JSONObject()
                        }

                        val baseImageUrl = json.optString("baseImageUrl", "")
                        val maskPoints = json.optString("maskPoints", "[]")
                        val prompt = json.optString("prompt", "Enhanced clutch gaming thumbnail")

                        val refList = mutableListOf<String>()
                        val refArray = json.optJSONArray("referenceImages")
                        if (refArray != null) {
                            for (i in 0 until refArray.length()) {
                                val item = refArray.optString(i)
                                if (item.isNotBlank()) {
                                    refList.add(item)
                                }
                            }
                        }

                        Log.i(TAG, "📥 Received POST /generate: prompt=\"${prompt.take(30)}...\", baseImageUrl=${baseImageUrl.take(30)}, refs=${refList.size}")

                        val preferNewChat: Boolean? = if (json.has("preferNewChat")) json.optBoolean("preferNewChat") else null

                        val result = com.digicast.dgimages.browser.ChatGptSessionManager.executeGeneration(
                            context = context,
                            prompt = prompt,
                            baseImageUrl = baseImageUrl,
                            maskPointsJson = maskPoints,
                            referenceImageUrls = refList,
                            forceNewChat = preferNewChat
                        )

                        val responseJson = JSONObject().apply {
                            put("status", if (result.isSuccess) "success" else "error")
                            put("resultUrl", result.getOrDefault(baseImageUrl))
                            if (!result.isSuccess) {
                                put("error", result.exceptionOrNull()?.message ?: "Engine failed to produce a valid thumbnail")
                            }
                            put("prompt", prompt)
                            put("referenceCount", refList.size)
                            put("timestamp", System.currentTimeMillis())
                        }.toString()

                        sendResponse(rawOutput, 200, "application/json", responseJson)
                    }

                    else -> {
                        val notFoundJson = JSONObject().apply {
                            put("error", "Not Found")
                            put("path", path)
                        }.toString()
                        sendResponse(rawOutput, 404, "application/json", notFoundJson)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling client connection", e)
        }
    }

    private fun sendBinaryResponse(outputStream: OutputStream, statusCode: Int, contentType: String, bytes: ByteArray) {
        val header = "HTTP/1.1 $statusCode OK\r\n" +
                "Content-Type: $contentType\r\n" +
                "Content-Length: ${bytes.size}\r\n" +
                "Connection: close\r\n" +
                "Access-Control-Allow-Origin: *\r\n\r\n"
        outputStream.write(header.toByteArray(Charsets.UTF_8))
        outputStream.write(bytes)
        outputStream.flush()
    }

    private fun sendResponse(outputStream: OutputStream, statusCode: Int, contentType: String, body: String) {
        val bodyBytes = body.toByteArray(Charsets.UTF_8)
        val header = "HTTP/1.1 $statusCode OK\r\n" +
                "Content-Type: $contentType\r\n" +
                "Content-Length: ${bodyBytes.size}\r\n" +
                "Connection: close\r\n" +
                "Access-Control-Allow-Origin: *\r\n\r\n"
        outputStream.write(header.toByteArray(Charsets.UTF_8))
        outputStream.write(bodyBytes)
        outputStream.flush()
    }
}
