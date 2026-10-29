package com.digicast.app.data.local

import android.content.Context
import android.os.Environment
import android.provider.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

/**
 * Persists device verification, account linking, and pass state in a hidden vault
 * that survives app uninstalls / reinstalls by leveraging hardware ANDROID_ID
 * and cloud device synchronization with digicast-web.
 */
object DeviceSecureStorage {

    private const val HIDDEN_FILE_NAME = ".digicast_device_vault.bin"
    private const val XOR_KEY: Byte = 0x5A
    private const val CLOUD_ENDPOINT = "https://digicast-web.vercel.app/api/mobile/device"

    fun getDeviceId(context: Context): String {
        return try {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "device_unknown"
        } catch (e: Exception) {
            "device_unknown"
        }
    }

    private fun getVaultFiles(context: Context): List<File> {
        val files = mutableListOf<File>()
        try {
            // 1. App internal files directory
            files.add(File(context.filesDir, HIDDEN_FILE_NAME))
            // 2. App external files directory (if mounted)
            context.getExternalFilesDir(null)?.let {
                files.add(File(it, HIDDEN_FILE_NAME))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return files
    }

    fun saveVaultData(
        context: Context,
        email: String?,
        uid: String?,
        workspaceId: String?,
        token: String?,
        hasActiveAdUnlock: Boolean,
        unlockExpiresAtMs: Long
    ) {
        try {
            val json = JSONObject().apply {
                put("deviceId", getDeviceId(context))
                put("email", email ?: "")
                put("uid", uid ?: "")
                put("workspaceId", workspaceId ?: "")
                put("token", token ?: "")
                put("hasActiveAdUnlock", hasActiveAdUnlock)
                put("unlockExpiresAtMs", unlockExpiresAtMs)
                put("updatedAt", System.currentTimeMillis())
            }

            val rawBytes = json.toString().toByteArray(StandardCharsets.UTF_8)
            val obfuscated = ByteArray(rawBytes.size) { i -> (rawBytes[i].toInt() xor XOR_KEY.toInt()).toByte() }

            for (file in getVaultFiles(context)) {
                try {
                    FileOutputStream(file).use { out ->
                        out.write(obfuscated)
                    }
                } catch (e: Exception) {
                    // Ignore individual path failure
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun readVaultData(context: Context): JSONObject? {
        for (file in getVaultFiles(context)) {
            try {
                if (file.exists() && file.length() > 0) {
                    val obfuscated = FileInputStream(file).use { it.readBytes() }
                    val rawBytes = ByteArray(obfuscated.size) { i -> (obfuscated[i].toInt() xor XOR_KEY.toInt()).toByte() }
                    val jsonStr = String(rawBytes, StandardCharsets.UTF_8)
                    val obj = JSONObject(jsonStr)
                    return obj
                }
            } catch (e: Exception) {
                // Try next file
            }
        }
        return null
    }

    /**
     * Pushes current device verification and 24h pass state to cloud Firestore.
     * Guarantees survival across complete app uninstallation & cache clear.
     */
    suspend fun syncVaultToCloud(
        context: Context,
        email: String?,
        uid: String?,
        workspaceId: String?,
        hasActiveAdUnlock: Boolean,
        unlockExpiresAtMs: Long
    ) = withContext(Dispatchers.IO) {
        try {
            val deviceId = getDeviceId(context)
            val payload = JSONObject().apply {
                put("deviceId", deviceId)
                put("email", email ?: "")
                put("uid", uid ?: "")
                put("workspaceId", workspaceId ?: "")
                put("hasActiveAdUnlock", hasActiveAdUnlock)
                if (hasActiveAdUnlock) {
                    val remaining = unlockExpiresAtMs - System.currentTimeMillis()
                    put("unlockDurationMs", remaining.coerceAtLeast(0L))
                }
            }

            val url = URL(CLOUD_ENDPOINT)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.doOutput = true

            conn.outputStream.use { out ->
                out.write(payload.toString().toByteArray(StandardCharsets.UTF_8))
            }

            val code = conn.responseCode
            conn.disconnect()
        } catch (e: Exception) {
            // Non-fatal if offline
        }
    }

    /**
     * Recovers device verification, last login email, and 24h pass from cloud Firestore.
     * Automatically invoked on fresh app installs or after data clearing.
     */
    suspend fun fetchVaultFromCloud(context: Context): JSONObject? = withContext(Dispatchers.IO) {
        try {
            val deviceId = getDeviceId(context)
            val url = URL("$CLOUD_ENDPOINT?deviceId=$deviceId")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            if (conn.responseCode == 200) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()
                val json = JSONObject(responseText)
                if (json.optBoolean("exists", false)) {
                    // Cache locally
                    saveVaultData(
                        context = context,
                        email = json.optString("email", ""),
                        uid = json.optString("uid", ""),
                        workspaceId = json.optString("workspaceId", ""),
                        token = "",
                        hasActiveAdUnlock = json.optBoolean("hasActiveAdUnlock", false),
                        unlockExpiresAtMs = json.optLong("unlockExpiresAtMs", 0L)
                    )
                    return@withContext json
                }
            }
            conn.disconnect()
            null
        } catch (e: Exception) {
            null
        }
    }
}
