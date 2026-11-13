package com.digicast.dgimages.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

object FileProviderUtils {
    private const val AUTHORITY = "com.digicast.dgimages.fileprovider"

    fun getContentUri(context: Context, file: File): Uri {
        return FileProvider.getUriForFile(context, AUTHORITY, file)
    }

    fun getMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension) ?: when (extension) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "webp" -> "image/webp"
            else -> "image/jpeg"
        }
    }

    fun resolveImageFile(context: Context, imageSource: String): File? {
        val filename = imageSource.substringAfterLast("/")
        val cacheFile = File(context.cacheDir, filename)
        if (cacheFile.exists()) return cacheFile
        val directFile = File(imageSource)
        if (directFile.exists()) return directFile
        return null
    }

    fun saveImageToGallery(
        context: Context,
        imageSource: String,
        onFinished: (success: Boolean, message: String) -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val bitmap: Bitmap? = when {
                    imageSource.startsWith("http://") || imageSource.startsWith("https://") -> {
                        val localFile = resolveImageFile(context, imageSource)
                        if (localFile != null && localFile.exists()) {
                            BitmapFactory.decodeFile(localFile.absolutePath)
                        } else {
                            val stream = URL(imageSource).openStream()
                            BitmapFactory.decodeStream(stream)
                        }
                    }
                    imageSource.startsWith("/") -> {
                        val f = File(imageSource)
                        if (f.exists()) BitmapFactory.decodeFile(f.absolutePath) else null
                    }
                    else -> {
                        val f = resolveImageFile(context, imageSource)
                        if (f != null && f.exists()) BitmapFactory.decodeFile(f.absolutePath) else null
                    }
                }

                if (bitmap == null) {
                    withContext(Dispatchers.Main) {
                        onFinished(false, "Could not load image source")
                    }
                    return@launch
                }

                val fileName = "Dieme_Thumb_${System.currentTimeMillis()}.jpg"
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Dieme/Thumbnails")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                val uri: Uri? = context.contentResolver.insert(
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI
                    } else {
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                    },
                    contentValues
                )

                if (uri != null) {
                    context.contentResolver.openOutputStream(uri)?.use { out ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 96, out)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        contentValues.clear()
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                        context.contentResolver.update(uri, contentValues, null, null)
                    }
                    withContext(Dispatchers.Main) {
                        onFinished(true, "Saved to Gallery (Downloads/Dieme/Thumbnails/$fileName)")
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        onFinished(false, "Failed to create destination in Gallery")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onFinished(false, "Error: ${e.message}")
                }
            }
        }
    }

    fun shareImage(context: Context, imageSource: String) {
        val file = resolveImageFile(context, imageSource) ?: return
        try {
            val uri = getContentUri(context, file)
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(shareIntent, "Share Inpainted Thumbnail"))
        } catch (_: Exception) {}
    }
}
