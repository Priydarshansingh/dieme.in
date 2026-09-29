package com.digicast.app.api.extension

/**
 * Base interface that matches the Core App definition exactly for dynamic Dex classloading.
 */
interface DigicastExtension {
    val extensionId: String
    val name: String
    val description: String
    val versionName: String
    val versionCode: Int
    val type: ExtensionType
}

enum class ExtensionType {
    CLIP_PROCESSOR,
    CHAT_ANALYZER,
    COMPANION_TOOL
}

interface ClipProcessorExtension : DigicastExtension {
    suspend fun processClip(
        videoId: String,
        startSeconds: Int,
        endSeconds: Int,
        outputDir: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String>
}
