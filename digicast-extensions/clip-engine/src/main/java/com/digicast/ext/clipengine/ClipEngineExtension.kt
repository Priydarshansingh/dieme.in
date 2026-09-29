package com.digicast.ext.clipengine

import com.digicast.app.api.extension.ClipProcessorExtension
import com.digicast.app.api.extension.ExtensionType
import com.digicast.ext.clipengine.downloader.YtDlpEngine
import com.digicast.ext.clipengine.ffmpeg.FFmpegEngine
import java.io.File

class ClipEngineExtension : ClipProcessorExtension {

    override val extensionId: String = "com.digicast.ext.clipengine"
    override val name: String = "Digicast Clip Engine"
    override val description: String = "High quality on-device video downloader and lossless FFmpeg trimmer"
    override val versionName: String = "1.0.0"
    override val versionCode: Int = 1
    override val type: ExtensionType = ExtensionType.CLIP_PROCESSOR

    private val downloader = YtDlpEngine()
    private val trimmer = FFmpegEngine()

    override suspend fun processClip(
        videoId: String,
        startSeconds: Int,
        endSeconds: Int,
        outputDir: String,
        onProgress: (progressPercent: Int, statusMessage: String) -> Unit
    ): Result<String> {
        return try {
            onProgress(0, "Initializing Clip Engine v$versionName...")

            val cacheDir = File(outputDir, ".cache")
            val rawStreamFile = File(cacheDir, "stream_$videoId.mp4")
            val finalClipFile = File(outputDir, "LiveHellBoy_CLP_${videoId}_${startSeconds}s.mp4")

            // 1. Download stream via yt-dlp
            val downloadResult = downloader.downloadStream(videoId, rawStreamFile, onProgress)
            if (downloadResult.isFailure) {
                return Result.failure(downloadResult.exceptionOrNull() ?: Exception("Download failed"))
            }

            // 2. Trim clip via FFmpeg
            val trimResult = trimmer.trimClip(
                inputFile = rawStreamFile,
                startSeconds = startSeconds,
                endSeconds = endSeconds,
                outputFile = finalClipFile,
                onProgress = onProgress
            )

            if (trimResult.isSuccess) {
                Result.success(finalClipFile.absolutePath)
            } else {
                Result.failure(trimResult.exceptionOrNull() ?: Exception("FFmpeg trimming failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
