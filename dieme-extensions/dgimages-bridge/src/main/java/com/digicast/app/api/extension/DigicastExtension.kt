package com.digicast.app.api.extension

import android.content.Context

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
    COMPANION_TOOL,
    IMAGE_STUDIO
}

interface ImageStudioExtension : DigicastExtension {
    fun isDgImagesInstalled(context: Context): Boolean

    suspend fun generateThumbnail(
        context: Context,
        baseImageUrl: String,
        maskPointsJson: String?,
        prompt: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String>

    suspend fun resetSession(context: Context): Result<Boolean> = Result.success(true)
}

