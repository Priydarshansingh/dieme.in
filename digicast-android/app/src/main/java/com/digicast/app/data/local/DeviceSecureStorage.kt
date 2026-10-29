package com.digicast.app.data.local

import android.content.Context
import android.os.Environment
import android.provider.Settings
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets

/**
 * Persists device verification, account linking, and pass state in a hidden file
 * on the device that survives app uninstalls / reinstalls.
 */
object DeviceSecureStorage {

    private const val HIDDEN_FILE_NAME = ".digicast_device_vault.bin"
    private const val XOR_KEY: Byte = 0x5A

    fun getDeviceId(context: Context): String {
        return try {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "device_unknown"
        } catch (e: Exception) {
            "device_unknown"
        }
    }

    private fun getVaultFile(context: Context): File {
        // Primary path: External app-specific or root files dir, fallback to internal
        val externalDir = context.getExternalFilesDir(null)
        val targetDir = externalDir ?: context.filesDir
        return File(targetDir, HIDDEN_FILE_NAME)
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

            val file = getVaultFile(context)
            FileOutputStream(file).use { out ->
                out.write(obfuscated)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun readVaultData(context: Context): JSONObject? {
        return try {
            val file = getVaultFile(context)
            if (!file.exists()) return null

            val obfuscated = FileInputStream(file).use { it.readBytes() }
            val rawBytes = ByteArray(obfuscated.size) { i -> (obfuscated[i].toInt() xor XOR_KEY.toInt()).toByte() }
            val jsonStr = String(rawBytes, StandardCharsets.UTF_8)
            JSONObject(jsonStr)
        } catch (e: Exception) {
            null
        }
    }
}
