package com.digicast.app.api.extension

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import dalvik.system.DexClassLoader
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ExtensionLoader @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        /** The proprietary Digicast extension file extension */
        const val EXTENSION_FILE_SUFFIX = ".dcast"
        const val EXTENSION_MIME_TYPE = "application/x-dcast"
    }

    /**
     * Loads a Digicast extension dynamically from a downloaded .dcast file.
     *
     * A .dcast file is a compiled Android APK renamed with a proprietary extension
     * so that the OS does not try to install it directly. Digicast registers as the
     * sole handler for this MIME type, enabling 1-tap install from the browser.
     *
     * @param dcastPath The absolute path to the downloaded .dcast extension file.
     * @param entryClassName The fully qualified class name that implements DigicastExtension.
     * @return The instantiated extension, or null if loading fails.
     */
    fun loadExtension(dcastPath: String, entryClassName: String): DigicastExtension? {
        val dcastFile = File(dcastPath)
        if (!dcastFile.exists()) {
            return null
        }

        // DexClassLoader requires a writable directory to cache optimized .dex output
        val optimizedDexOutputPath = context.getDir("dcast_cache", Context.MODE_PRIVATE)

        return try {
            val dexClassLoader = DexClassLoader(
                dcastFile.absolutePath,
                optimizedDexOutputPath.absolutePath,
                null,
                context.classLoader
            )

            val extensionClass = dexClassLoader.loadClass(entryClassName)
            val instance = extensionClass.getDeclaredConstructor().newInstance()

            instance as? DigicastExtension
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Returns all installed .dcast extension files from internal storage.
     */
    fun getInstalledExtensionFiles(): List<File> {
        return context.filesDir.listFiles { _, name ->
            name.endsWith(EXTENSION_FILE_SUFFIX)
        }?.toList() ?: emptyList()
    }

    /**
     * Removes an installed extension by its ID.
     */
    fun removeExtension(extensionId: String): Boolean {
        val file = File(context.filesDir, "$extensionId$EXTENSION_FILE_SUFFIX")
        return if (file.exists()) file.delete() else false
    }
}
