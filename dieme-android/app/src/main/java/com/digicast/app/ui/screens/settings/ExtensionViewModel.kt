package com.digicast.app.ui.screens.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.digicast.app.api.extension.ClipProcessorExtension
import com.digicast.app.api.extension.DigicastExtension
import com.digicast.app.api.extension.ExtensionLoader
import com.digicast.app.api.extension.ImageStudioExtension
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

    private val _loadedImageStudio = MutableStateFlow<ImageStudioExtension?>(null)
    val loadedImageStudio: StateFlow<ImageStudioExtension?> = _loadedImageStudio.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    companion object {
        private const val GITHUB_REPO_URL = "https://github.com/Priydarshansingh/dieme.in/releases"
        private const val GITHUB_API_RELEASES = "https://api.github.com/repos/Priydarshansingh/dieme.in/releases"
    }

    init {
        // Auto-provision official on-device clip engine extension from bundled assets
        val clipEngineFile = File(context.filesDir, "com.digicast.ext.clipengine.dcast")
        if (!clipEngineFile.exists() || clipEngineFile.length() < 1000L) {
            try {
                if (clipEngineFile.exists()) clipEngineFile.setWritable(true)
                context.assets.open("extensions/com.digicast.ext.clipengine.dcast").use { input ->
                    FileOutputStream(clipEngineFile).use { output ->
                        input.copyTo(output)
                    }
                }
                clipEngineFile.setReadOnly()
            } catch (e: Exception) {
                // Ignore if asset missing
            }
        }

        // Auto-provision official Dg-Images AI bridge extension from bundled assets
        val dgImagesFile = File(context.filesDir, "com.digicast.ext.dgimages.dcast")
        try {
            if (dgImagesFile.exists()) dgImagesFile.setWritable(true)
            context.assets.open("extensions/com.digicast.ext.dgimages.dcast").use { input ->
                FileOutputStream(dgImagesFile).use { output ->
                    input.copyTo(output)
                }
            }
            dgImagesFile.setReadOnly()
        } catch (_: Exception) {}

        loadCatalog()
    }

    fun loadCatalog() {
        val defaultList = listOf(
            ExtensionRegistryItem(
                id = "com.digicast.ext.clipengine",
                name = "Dieme Clip Engine",
                version = "1.0.0",
                description = "Core video download & trimming extension. Bundles yt-dlp & FFmpeg for on-device processing.",
                downloadUrl = "https://www.dieme.in/extensions/clip-engine.dcast",
                entryClass = "com.digicast.ext.clipengine.ClipEngineExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.clipengine")
            ),
            ExtensionRegistryItem(
                id = "com.digicast.ext.ffmpeg",
                name = "FFmpeg Lossless Trimmer",
                version = "1.0.0",
                description = "High-precision on-device stream cutting and keyframe-accurate MP4 encoder.",
                downloadUrl = "https://www.dieme.in/extensions/ffmpeg-trimmer.dcast",
                entryClass = "com.digicast.ext.clipengine.ClipEngineExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.ffmpeg")
            ),
            ExtensionRegistryItem(
                id = "com.digicast.ext.youtubedl",
                name = "YouTube Stream Extractor",
                version = "1.0.0",
                description = "Live stream buffer capture and multi-resolution DASH/HLS segment grabber.",
                downloadUrl = "https://www.dieme.in/extensions/youtube-downloader.dcast",
                entryClass = "com.digicast.ext.clipengine.ClipEngineExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.youtubedl")
            ),
            ExtensionRegistryItem(
                id = "com.digicast.ext.dgimages",
                name = "Dg-Images AI Bridge",
                version = "1.0.0",
                description = "High-fidelity thumbnail generation & object inpainting bridge for Dg-Images companion app.",
                downloadUrl = "https://www.dieme.in/extensions/dgimages-bridge.dcast",
                entryClass = "com.digicast.ext.dgimages.DgImagesExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.dgimages")
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
                    .addHeader("User-Agent", "Dieme-Android-App")
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
                                        description = rel.optString("body", "Official Dieme modular processor extension from GitHub."),
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

                    // 1. Try bundled asset first for instant 100% reliable offline install
                    var installedFromAsset = false
                    try {
                        context.assets.open("extensions/${item.id}.dcast").use { input ->
                            FileOutputStream(targetFile).use { output ->
                                input.copyTo(output)
                            }
                        }
                        installedFromAsset = targetFile.exists() && targetFile.length() > 1000L
                    } catch (e: Exception) {
                        // Asset not bundled, fallback to network download
                    }

                    if (!installedFromAsset) {
                        // 2. Download via network CDN
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
                            throw java.io.IOException("Failed to download extension (.dcast). HTTP ${response.code}")
                        }
                    }

                    // Android 14+ requires dynamically loaded dex files to be read-only
                    try {
                        targetFile.setReadOnly()
                    } catch (e: Exception) {
                        // Ignored
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
            if (_loadedImageStudio.value?.extensionId == item.id) {
                _loadedImageStudio.value = null
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
            } else if (extension is ImageStudioExtension) {
                _loadedImageStudio.value = extension
            }
        }
    }

    fun getImageStudio(): ImageStudioExtension? {
        if (_loadedImageStudio.value != null) return _loadedImageStudio.value
        val file = File(context.filesDir, "com.digicast.ext.dgimages.dcast")
        if (!file.exists()) {
            try {
                context.assets.open("extensions/com.digicast.ext.dgimages.dcast").use { input ->
                    FileOutputStream(file).use { output -> input.copyTo(output) }
                }
                file.setReadOnly()
            } catch (_: Exception) {}
        }
        if (file.exists()) {
            val extension = extensionLoader.loadExtension(file.absolutePath, "com.digicast.ext.dgimages.DgImagesExtension")
            if (extension is ImageStudioExtension) {
                _loadedImageStudio.value = extension
                return extension
            }
        }
        return null
    }
}
