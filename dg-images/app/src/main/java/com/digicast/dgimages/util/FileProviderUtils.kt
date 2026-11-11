package com.digicast.dgimages.util

import android.content.Context
import android.net.Uri
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import java.io.File

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
}

