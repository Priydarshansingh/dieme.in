package com.digicast.dgimages.browser

import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import com.digicast.dgimages.util.FileProviderUtils
import java.io.File

class ChatGptJsInterface(
    private val onPageLoaded: (Boolean) -> Unit,
    private val onResponseCaptured: (String) -> Unit,
    private val onError: (String) -> Unit,
    private val onAuthRequired: () -> Unit,
    private val pendingFilesProvider: () -> List<File>
) {
    @JavascriptInterface
    fun onChatGptPageLoaded(success: Boolean) {
        onPageLoaded(success)
    }

    @JavascriptInterface
    fun onCapturedResult(resultJson: String) {
        onResponseCaptured(resultJson)
    }

    @JavascriptInterface
    fun onAdapterError(errorMessage: String) {
        onError(errorMessage)
    }

    @JavascriptInterface
    fun onAuthenticationChallenge() {
        onAuthRequired()
    }

    @JavascriptInterface
    fun getPendingFilesCount(): Int {
        val files = pendingFilesProvider()
        return files.size
    }

    @JavascriptInterface
    fun getPendingFileBase64(index: Int): String {
        val files = pendingFilesProvider()
        if (index !in files.indices) return ""
        val file = files[index]
        return try {
            val bytes = file.readBytes()
            Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e("ChatGptJsInterface", "Error reading bytes for file: ${file.name}", e)
            ""
        }
    }

    @JavascriptInterface
    fun getPendingFileName(index: Int): String {
        val files = pendingFilesProvider()
        if (index !in files.indices) return "thumbnail.jpg"
        return files[index].name
    }

    @JavascriptInterface
    fun getPendingFileMime(index: Int): String {
        val files = pendingFilesProvider()
        if (index !in files.indices) return "image/jpeg"
        return FileProviderUtils.getMimeType(files[index])
    }
}

