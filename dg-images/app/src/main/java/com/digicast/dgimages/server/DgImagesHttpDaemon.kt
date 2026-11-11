package com.digicast.dgimages.server

import android.content.Context
import com.digicast.dgimages.engine.ImageInpaintEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.io.PrintWriter
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket

class DgImagesHttpDaemon(
    private val context: Context,
    private val port: Int = 5488
) {
    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private var serverJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    fun start() {
        if (isRunning) return
        isRunning = true

        serverJob = scope.launch {
            try {
                // Bind exclusively to 127.0.0.1 for local device security
                serverSocket = ServerSocket(port, 50, InetAddress.getByName("127.0.0.1"))
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
                e.printStackTrace()
            }
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            // Ignored
        }
        serverJob?.cancel()
    }

    private suspend fun handleClient(socket: Socket) {
        try {
            socket.use { s ->
                val reader = BufferedReader(InputStreamReader(s.getInputStream()))
                val writer = PrintWriter(OutputStreamWriter(s.getOutputStream()), true)

                val requestLine = reader.readLine() ?: return
                val parts = requestLine.split(" ")
                if (parts.size < 2) return

                val method = parts[0]
                val path = parts[1]

                var contentLength = 0
                var line: String? = reader.readLine()
                while (!line.isNullOrEmpty()) {
                    if (line.lowercase().startsWith("content-length:")) {
                        contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                    }
                    line = reader.readLine()
                }

                when {
                    method == "GET" && (path == "/v1/health" || path == "/health") -> {
                        val responseJson = JSONObject().apply {
                            put("status", "ok")
                            put("app", "Dg-Images")
                            put("version", "1.0.0")
                            put("ready", true)
                            put("port", port)
                        }.toString()
                        sendResponse(writer, 200, "application/json", responseJson)
                    }

                    method == "POST" && (path == "/v1/thumbnail/generate" || path == "/generate") -> {
                        val body = CharArray(contentLength)
                        var read = 0
                        while (read < contentLength) {
                            val r = reader.read(body, read, contentLength - read)
                            if (r == -1) break
                            read += r
                        }
                        val bodyString = String(body, 0, read)
                        val json = try { JSONObject(bodyString) } catch (e: Exception) { JSONObject() }

                        val baseImageUrl = json.optString("baseImageUrl", "")
                        val maskPoints = json.optString("maskPoints", "[]")
                        val prompt = json.optString("prompt", "Enhanced clutch gaming thumbnail")

                        val refList = mutableListOf<String>()
                        val refArray = json.optJSONArray("referenceImages")
                        if (refArray != null) {
                            for (i in 0 until refArray.length()) {
                                refList.add(refArray.getString(i))
                            }
                        }

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
                            put("prompt", prompt)
                            put("timestamp", System.currentTimeMillis())
                        }.toString()

                        sendResponse(writer, 200, "application/json", responseJson)
                    }

                    else -> {
                        val notFoundJson = JSONObject().apply {
                            put("error", "Not Found")
                            put("path", path)
                        }.toString()
                        sendResponse(writer, 404, "application/json", notFoundJson)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun sendResponse(writer: PrintWriter, statusCode: Int, contentType: String, body: String) {
        val statusText = if (statusCode == 200) "OK" else "Not Found"
        writer.print("HTTP/1.1 $statusCode $statusText\r\n")
        writer.print("Content-Type: $contentType\r\n")
        writer.print("Content-Length: ${body.toByteArray().size}\r\n")
        writer.print("Connection: close\r\n")
        writer.print("Access-Control-Allow-Origin: *\r\n")
        writer.print("\r\n")
        writer.print(body)
        writer.flush()
    }
}

