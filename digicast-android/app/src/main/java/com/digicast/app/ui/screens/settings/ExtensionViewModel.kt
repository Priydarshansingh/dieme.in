package com.digicast.app.api.extension

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import javax.inject.Inject

data class ExtensionRegistryItem(
    val id: String,
    val name: String,
    val version: String,
    val description: String,
    val downloadUrl: String,       // URL to the .dcast file on GitHub Releases
    val entryClass: String,
    val iconUrl: String? = null,
    val minCoreVersion: Int = 1,   // Minimum Digicast Core app version required
    val isInstalled: Boolean = false,
    val isInstalling: Boolean = false
)

@HiltViewModel
class ExtensionViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val extensionLoader: ExtensionLoader
) : ViewModel() {

    private val _extensions = MutableStateFlow<List<ExtensionRegistryItem>>(emptyList())
    val extensions: StateFlow<List<ExtensionRegistryItem>> = _extensions.asStateFlow()

    private val _loadedProcessor = MutableStateFlow<ClipProcessorExtension?>(null)
    val loadedProcessor: StateFlow<ClipProcessorExtension?> = _loadedProcessor.asStateFlow()

    // Fixed dummy repos for the MVP catalog
    init {
        loadMockRegistry()
    }

    private fun loadMockRegistry() {
        val mockRegistry = listOf(
            ExtensionRegistryItem(
                id = "com.digicast.ext.clipengine",
                name = "Digicast Clip Engine",
                version = "1.0.0",
                description = "Core video processing engine. Enables local clip downloading and trimming.",
                downloadUrl = "https://raw.githubusercontent.com/Priydarshansingh/Digicast/main/extensions/com.digicast.ext.clipengine.dcast",
                entryClass = "com.digicast.ext.clipengine.ClipEngineExtension",
                isInstalled = checkIsInstalled("com.digicast.ext.clipengine")
            )
        )
        _extensions.value = mockRegistry

        // Auto-load if already installed
        val installed = mockRegistry.filter { it.isInstalled }
        installed.forEach { loadInstalledExtension(it) }
    }

    private fun checkIsInstalled(extensionId: String): Boolean {
        val file = File(context.filesDir, "$extensionId.dcast")
        return file.exists()
    }

    fun installExtension(item: ExtensionRegistryItem) {
        viewModelScope.launch {
            // Update UI state to installing
            _extensions.value = _extensions.value.map {
                if (it.id == item.id) it.copy(isInstalling = true) else it
            }

            try {
                // In production, use OkHttp/DownloadManager.
                // For MVP stub, we simulate a small delay as if downloading the APK.
                withContext(Dispatchers.IO) {
                    kotlinx.coroutines.delay(1500)
                    // File download logic would go here.
                    // val file = File(context.filesDir, "${item.id}.dcast")
                    // URL(item.apkUrl).openStream().use { input -> ... }
                }

                // Temporary simulation: Just mark as installed in memory
                // Once we have a real APK compiled, we will write it to disk.

                _extensions.value = _extensions.value.map {
                    if (it.id == item.id) it.copy(isInstalled = true, isInstalling = false) else it
                }

                // Attempt to load it (will fail silently if file doesn't exist yet in the stub format)
                loadInstalledExtension(item)

            } catch (e: Exception) {
                e.printStackTrace()
                _extensions.value = _extensions.value.map {
                    if (it.id == item.id) it.copy(isInstalling = false) else it
                }
            }
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
