package com.digicast.app.api.extension

/**
 * The base interface that all Digicast extensions must implement.
 * This class definition must be identical in both the Digicast Core App and the compiled Extension APK.
 */
interface DigicastExtension {
    val extensionId: String
    val name: String
    val description: String
    val versionName: String
    val versionCode: Int
    val type: ExtensionType
}

/**
 * Defines the capabilities of the loaded extension.
 */
enum class ExtensionType {
    CLIP_PROCESSOR,
    CHAT_ANALYZER,
    COMPANION_TOOL
}

/**
 * A specialized extension interface for processing video clips locally.
 * Extensions implementing this will bundle tools like yt-dlp and FFmpeg.
 */
interface ClipProcessorExtension : DigicastExtension {
    /**
     * Executes the clip generation process.
     *
     * @param videoId The YouTube video ID (or other platform ID)
     * @param startSeconds The start timestamp of the clip
     * @param endSeconds The end timestamp of the clip
     * @param outputDir The absolute path where the final MP4 should be saved
     * @param onProgress Callback to update the Core App UI with progress and status messages
     * @return Result containing the absolute file path of the generated MP4 on success
     */
    suspend fun processClip(
        videoId: String,
        startSeconds: Int,
        endSeconds: Int,
        outputDir: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String>
}
