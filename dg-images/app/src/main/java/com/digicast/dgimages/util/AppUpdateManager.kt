package com.digicast.dgimages.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class DgUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val minSupportedVersionCode: Int,
    val releaseNotes: String,
    val downloadUrl: String,
    val releaseDate: String = ""
)

sealed class DgUpdateCheckResult {
    data class UpdateAvailable(
        val updateInfo: DgUpdateInfo,
        val currentVersionCode: Int,
        val currentVersionName: String
    ) : DgUpdateCheckResult()

    data class UpToDate(
        val currentVersionCode: Int,
        val currentVersionName: String
    ) : DgUpdateCheckResult()

    data class Error(
        val message: String
    ) : DgUpdateCheckResult()
}

object AppUpdateManager {
    private const val TAG = "DgAppUpdateManager"
    private const val PREFS_NAME = "dg_images_update_prefs"
    private const val KEY_SKIPPED_VERSION = "skipped_version"
    private const val KEY_SKIPPED_TIME = "skipped_time"
    private const val TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000L

    private const val PRIMARY_URL = "https://www.dieme.in/api/version?app=dgimages"
    private const val FALLBACK_URL = "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/version.json"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    fun getCurrentVersionCode(context: Context): Int {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }
        } catch (_: Exception) {
            2 // default fallback for v1.1.0
        }
    }

    fun getCurrentVersionName(context: Context): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "1.1.0"
        } catch (_: Exception) {
            "1.1.0"
        }
    }

    suspend fun checkForUpdates(context: Context): DgUpdateCheckResult = withContext(Dispatchers.IO) {
        val currentCode = getCurrentVersionCode(context)
        val currentName = getCurrentVersionName(context)

        try {
            val updateInfo = fetchRemoteVersion()
            if (updateInfo == null) {
                return@withContext DgUpdateCheckResult.Error("Unable to reach update server.")
            }

            if (updateInfo.versionCode > currentCode) {
                DgUpdateCheckResult.UpdateAvailable(
                    updateInfo = updateInfo,
                    currentVersionCode = currentCode,
                    currentVersionName = currentName
                )
            } else {
                DgUpdateCheckResult.UpToDate(
                    currentVersionCode = currentCode,
                    currentVersionName = currentName
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Update check failed", e)
            DgUpdateCheckResult.Error(e.message ?: "Failed to check for updates.")
        }
    }

    private fun fetchRemoteVersion(): DgUpdateInfo? {
        // 1. Try Primary endpoint
        try {
            val req = Request.Builder()
                .url(PRIMARY_URL)
                .header("Cache-Control", "no-cache")
                .build()
            httpClient.newCall(req).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrBlank()) {
                        val parsed = parseUpdateJson(body)
                        if (parsed != null) return parsed
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Primary update URL failed, trying fallback: ${e.message}")
        }

        // 2. Try Fallback GitHub endpoint
        try {
            val req = Request.Builder()
                .url(FALLBACK_URL)
                .header("Cache-Control", "no-cache")
                .build()
            httpClient.newCall(req).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrBlank()) {
                        val parsed = parseUpdateJson(body)
                        if (parsed != null) return parsed
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Fallback update URL failed: ${e.message}")
        }

        return null
    }

    private fun parseUpdateJson(jsonStr: String): DgUpdateInfo? {
        return try {
            val root = JSONObject(jsonStr)
            val dgObj = if (root.has("dgImages")) {
                root.getJSONObject("dgImages")
            } else {
                root
            }

            DgUpdateInfo(
                versionCode = dgObj.optInt("versionCode", 0),
                versionName = dgObj.optString("versionName", "1.0.0"),
                minSupportedVersionCode = dgObj.optInt("minSupportedVersionCode", 1),
                releaseNotes = dgObj.optString("releaseNotes", "New performance and feature updates."),
                downloadUrl = dgObj.optString("downloadUrl", "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk"),
                releaseDate = dgObj.optString("releaseDate", "")
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse update JSON", e)
            null
        }
    }

    fun shouldShowAutoPrompt(context: Context, latestVersionCode: Int): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val skippedVersion = prefs.getInt(KEY_SKIPPED_VERSION, -1)
        val skippedTime = prefs.getLong(KEY_SKIPPED_TIME, 0L)
        val now = System.currentTimeMillis()

        val isWithin24Hours = (now - skippedTime) < TWENTY_FOUR_HOURS_MS
        if (skippedVersion == latestVersionCode && isWithin24Hours) {
            return false
        }
        return true
    }

    fun skipUpdateFor24Hours(context: Context, latestVersionCode: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putInt(KEY_SKIPPED_VERSION, latestVersionCode)
            .putLong(KEY_SKIPPED_TIME, System.currentTimeMillis())
            .apply()
    }

    fun launchUpdateDownload(context: Context, downloadUrl: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch browser for update", e)
        }
    }
}
