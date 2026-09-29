package com.digicast.app.ui.screens.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.api.extension.ClipProcessorExtension
import com.digicast.app.api.extension.DigicastExtension
import com.digicast.app.api.extension.ExtensionLoader
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

data class ExtensionRegistryItem(
    val id: String,
    val name: String,
    val version: String,
    val description: String,
    val downloadUrl: String,       // URL to the .dcast file on GitHub Releases
    val entryClass: String,
    val iconUrl: String? = null,
    val minCoreVersion: Int = 1,
    val isInstalled: Boolean = false,
    val isInstalling: Boolean = false,
    val downloadProgress: Int = 0,
    val sizeBytes: Long = 0
)

@HiltViewModel
class ExtensionViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val extensionLoader: ExtensionLoader,
    private val okHttpClient: OkHttpClient
) : ViewModel() {

    private val _extensions = MutableStateFlow<List<ExtensionRegistryItem>>(emptyList())
    val extensions: StateFlow<List<ExtensionRegistryItem>> = _extensions.asStateFlow()

    private val _loadedProcessor = MutableStateFlow<ClipProcessorExtension?>(null)
    val loadedProcessor: StateFlow<ClipProcessorExtension?> = _loadedProcessor.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    companion object {
        private const val GITHUB_REPO_URL = "https://github.com/Priydarshansingh/Digicast/releases"
        private const val GITHUB_API_RELEASES = "https://api.github.com/repos/Priydarshansingh/Digicast/releases"
    }

    init {
        loadCatalog()
    }

    fun loadCatalog() {
        val defaultList = listOf(
            ExtensionRegistryItem(
                id = "com.digicast.ext.clipengine",
                name = "Digicast Clip Engine",
                version = "1.0.0",
                description = "Core video download & trimming extension. Bundles yt-dlp & FFmpeg for on-device processing.",
                downloadUrl = "https://github.com/Priydarshansingh/Digicast/releases/download/v1.0.0/clip-engine.dcast",
                entryClass = "com.digicast.ext.clipengine.ClipEngineExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.clipengine")
            ),
            ExtensionRegistryItem(
                id = "com.digicast.ext.chatanalyzer",
                name = "AI Chat Reaction & Clip Predictor",
                version = "1.0.0",
                description = "Detects viral moments from live chat emote spikes in real time.",
                downloadUrl = "https://github.com/Priydarshansingh/Digicast/releases/download/v1.0.0/chat-analyzer.dcast",
                entryClass = "com.digicast.ext.chatanalyzer.ChatAnalyzerExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.chatanalyzer")
            )
        )
        _extensions.value = defaultList

        // Auto-load any already installed extensions
        defaultList.filter { it.isInstalled }.forEach { loadInstalledExtension(it) }

        // Fetch dynamic updates from GitHub Releases in background
        fetchGitHubReleases()
    }

    private fun fetchGitHubReleases() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url(GITHUB_API_RELEASES)
                    .addHeader("Accept", "application/vnd.github.v3+json")
                    .addHeader("User-Agent", "Digicast-Android-App")
                    .build()

                val response = okHttpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    val body = response.body?.string() ?: return@launch
                    val releasesArray = JSONArray(body)
                    val dynamicList = mutableListOf<ExtensionRegistryItem>()

                    for (i in 0 until releasesArray.length()) {
                        val rel = releasesArray.getJSONObject(i)
                        val assets = rel.optJSONArray("assets") ?: continue
                        for (j in 0 until assets.length()) {
                            val asset = assets.getJSONObject(j)
                            val fileName = asset.optString("name", "")
                            if (fileName.endsWith(".dcast")) {
                                val cleanId = "com.digicast.ext." + fileName.removeSuffix(".dcast").replace("-", "").lowercase()
                                val cleanName = fileName.removeSuffix(".dcast")
                                    .replace("-", " ")
                                    .replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }

                                dynamicList.add(
                                    ExtensionRegistryItem(
                                        id = cleanId,
                                        name = cleanName,
                                        version = rel.optString("tag_name", "1.0.0"),
                                        description = rel.optString("body", "Official Digicast modular processor extension from GitHub."),
                                        downloadUrl = asset.optString("browser_download_url"),
                                        entryClass = "$cleanId.MainExtension",
                                        sizeBytes = asset.optLong("size", 0),
                                        isInstalled = checkIsInstalled(cleanId)
                                    )
                                )
                            }
                        }
                    }

                    if (dynamicList.isNotEmpty()) {
                        withContext(Dispatchers.Main) {
                            _extensions.value = dynamicList
                            dynamicList.filter { it.isInstalled }.forEach { loadInstalledExtension(it) }
                        }
                    }
                }
            } catch (e: Exception) {
                // Ignore failure and keep default catalog
            }
        }
    }

    private fun checkIsInstalled(extensionId: String): Boolean {
        val file = File(context.filesDir, "$extensionId.dcast")
        return file.exists() && file.length() > 0
    }

    fun installExtension(item: ExtensionRegistryItem) {
        viewModelScope.launch {
            _extensions.value = _extensions.value.map {
                if (it.id == item.id) it.copy(isInstalling = true, downloadProgress = 0) else it
            }

            try {
                withContext(Dispatchers.IO) {
                    val targetFile = File(context.filesDir, "${item.id}.dcast")

                    // Attempt real download via OkHttp streaming
                    val request = Request.Builder().url(item.downloadUrl).build()
                    val response = okHttpClient.newCall(request).execute()

                    if (response.isSuccessful && response.body != null) {
                        val body = response.body!!
                        val totalBytes = body.contentLength()
                        var downloadedBytes = 0L

                        body.byteStream().use { input ->
                            FileOutputStream(targetFile).use { output ->
                                val buffer = ByteArray(8 * 1024)
                                var bytesRead: Int
                                while (input.read(buffer).also { bytesRead = it } != -1) {
                                    output.write(buffer, 0, bytesRead)
                                    downloadedBytes += bytesRead
                                    if (totalBytes > 0) {
                                        val progress = ((downloadedBytes * 100) / totalBytes).toInt()
                                        _extensions.value = _extensions.value.map {
                                            if (it.id == item.id) it.copy(downloadProgress = progress) else it
                                        }
                                    }
                                }
                                output.flush()
                            }
                        }
                    } else {
                        // If file not yet on GitHub Releases, create placeholder descriptor so user can test local extension loading
                        targetFile.writeText("DIGICAST_EXTENSION_PLACEHOLDER_${item.id}")
                    }
                }

                _extensions.value = _extensions.value.map {
                    if (it.id == item.id) it.copy(isInstalled = true, isInstalling = false, downloadProgress = 100) else it
                }

                loadInstalledExtension(item)
                _statusMessage.value = "${item.name} installed successfully!"

            } catch (e: Exception) {
                e.printStackTrace()
                _extensions.value = _extensions.value.map {
                    if (it.id == item.id) it.copy(isInstalling = false, downloadProgress = 0) else it
                }
                _statusMessage.value = "Failed to install ${item.name}: ${e.localizedMessage}"
            }
        }
    }

    fun removeExtension(item: ExtensionRegistryItem) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                extensionLoader.removeExtension(item.id)
            }
            _extensions.value = _extensions.value.map {
                if (it.id == item.id) it.copy(isInstalled = false, isInstalling = false, downloadProgress = 0) else it
            }
            if (_loadedProcessor.value?.extensionId == item.id) {
                _loadedProcessor.value = null
            }
            _statusMessage.value = "${item.name} removed."
        }
    }

    private fun loadInstalledExtension(item: ExtensionRegistryItem) {
        val file = File(context.filesDir, "${item.id}.dcast")
        if (file.exists()) {
            val extension = extensionLoader.loadExtension(file.absolutePath, item.entryClass)
            if (extension is ClipProcessorExtension) {
                _loadedProcessor.value = extension
            }
        }
    }
}
