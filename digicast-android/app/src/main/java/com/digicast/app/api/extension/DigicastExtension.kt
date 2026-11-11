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
    COMPANION_TOOL,
    IMAGE_STUDIO
}

/**
 * A specialized extension interface for AI thumbnail generation & object inpainting.
 * Extensions implementing this will connect to companion apps like Dg-Images or cloud endpoints.
 */
interface ImageStudioExtension : DigicastExtension {
    /**
     * Checks whether the companion Dg-Images app is installed on the host device.
     */
    fun isDgImagesInstalled(context: android.content.Context): Boolean

    /**
     * Executes thumbnail synthesis or inpainting through the Dg-Images companion bridge.
     *
     * @param context Host application context
     * @param baseImageUrl URL of the source thumbnail
     * @param maskPointsJson Serialized coordinates or mask data for inpainting
     * @param prompt User styling and object replacement instructions
     * @param onProgress Status callback for UI updates
     * @return Result containing generated image URL or local cached file path
     */
    suspend fun generateThumbnail(
        context: android.content.Context,
        baseImageUrl: String,
        maskPointsJson: String?,
        prompt: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String>
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
