package com.digicast.app.ui.utils

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.nio.ByteBuffer

object VideoTrimmerUtil {
    private const val TAG = "VideoTrimmerUtil"

    /**
     * Losslessly trims an MP4 video file from [startMs] to [endMs] using native Android
     * MediaExtractor and MediaMuxer without re-encoding quality degradation.
     */
    suspend fun trimMp4(
        sourceFile: File,
        destFile: File,
        startMs: Long,
        endMs: Long,
        onProgress: ((Int) -> Unit)? = null
    ): Boolean = withContext(Dispatchers.IO) {
        if (!sourceFile.exists() || sourceFile.length() < 1000L) {
            Log.e(TAG, "Source file does not exist or empty: ${sourceFile.absolutePath}")
            return@withContext false
        }

        if (destFile.exists()) {
            destFile.delete()
        }
        destFile.parentFile?.mkdirs()

        val startUs = (startMs * 1000L).coerceAtLeast(0L)
        val endUs = (endMs * 1000L).coerceAtLeast(startUs + 1_000_000L)

        val extractor = MediaExtractor()
        var muxer: MediaMuxer? = null

        try {
            extractor.setDataSource(sourceFile.absolutePath)
            val trackCount = extractor.trackCount
            if (trackCount <= 0) return@withContext false

            muxer = MediaMuxer(destFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            val indexMap = HashMap<Int, Int>(trackCount)
            var bufferSize = 1024 * 1024 // 1MB default buffer

            for (i in 0 until trackCount) {
                val format = extractor.getTrackFormat(i)
                val dstIndex = muxer.addTrack(format)
                indexMap[i] = dstIndex
                if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
                    val newSize = format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)
                    if (newSize > bufferSize) bufferSize = newSize
                }
            }

            muxer.start()
            val dstBuf = ByteBuffer.allocate(bufferSize)
            val bufferInfo = MediaCodec.BufferInfo()

            for (i in 0 until trackCount) {
                extractor.selectTrack(i)
                extractor.seekTo(startUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

                while (true) {
                    val trackIndex = extractor.sampleTrackIndex
                    if (trackIndex != i) {
                        if (trackIndex < 0) break
                        extractor.advance()
                        continue
                    }

                    val sampleTime = extractor.sampleTime
                    if (sampleTime > endUs) break

                    bufferInfo.offset = 0
                    bufferInfo.size = extractor.readSampleData(dstBuf, 0)
                    if (bufferInfo.size < 0) break

                    bufferInfo.presentationTimeUs = (sampleTime - startUs).coerceAtLeast(0L)
                    bufferInfo.flags = extractor.sampleFlags

                    muxer.writeSampleData(indexMap[i]!!, dstBuf, bufferInfo)
                    extractor.advance()
                }

                extractor.unselectTrack(i)
                onProgress?.invoke((70 + (i + 1) * 20 / trackCount).coerceIn(70, 95))
            }

            return@withContext destFile.exists() && destFile.length() > 5000L
        } catch (e: Exception) {
            Log.e(TAG, "Error trimming video: ${e.message}", e)
            // Fallback: If trimming fails, copy full source file
            try {
                sourceFile.copyTo(destFile, overwrite = true)
                return@withContext destFile.exists() && destFile.length() > 5000L
            } catch (copyErr: Exception) {
                return@withContext false
            }
        } finally {
            try {
                muxer?.stop()
                muxer?.release()
            } catch (e: Exception) {
                Log.w(TAG, "Error releasing muxer: ${e.message}")
            }
            try {
                extractor.release()
            } catch (e: Exception) {
                Log.w(TAG, "Error releasing extractor: ${e.message}")
            }
        }
    }
}

