package com.digicast.app.util

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

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val minSupportedVersionCode: Int,
    val releaseNotes: String,
    val downloadUrl: String,
    val releaseDate: String = ""
)

sealed class UpdateCheckResult {
    data class UpdateAvailable(
        val updateInfo: AppUpdateInfo,
        val currentVersionCode: Int,
        val currentVersionName: String
    ) : UpdateCheckResult()

    data class UpToDate(
        val currentVersionCode: Int,
        val currentVersionName: String
    ) : UpdateCheckResult()

    data class Error(
        val message: String
    ) : UpdateCheckResult()
}

object AppUpdateManager {
    private const val TAG = "AppUpdateManager"
    private const val PREFS_NAME = "dieme_update_prefs"
    private const val KEY_SKIPPED_VERSION = "skipped_version"
    private const val KEY_SKIPPED_TIME = "skipped_time"
    private const val TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000L

    private const val PRIMARY_URL = "https://www.dieme.in/api/version?app=dieme"
    private const val FALLBACK_URL = "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/version.json"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    fun getCurrentVersionCode(context: Context): Int {
        return try {
            com.digicast.app.BuildConfig.VERSION_CODE
        } catch (_: Throwable) {
            try {
                val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    packageInfo.longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode
                }
            } catch (_: Throwable) {
                1
            }
        }
    }

    fun getCurrentVersionName(context: Context): String {
        return try {
            com.digicast.app.BuildConfig.VERSION_NAME
        } catch (_: Throwable) {
            try {
                val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                packageInfo.versionName ?: "1.0.0"
            } catch (_: Throwable) {
                "1.0.0"
            }
        }
    }

    suspend fun checkForUpdates(context: Context): UpdateCheckResult = withContext(Dispatchers.IO) {
        val currentCode = getCurrentVersionCode(context)
        val currentName = getCurrentVersionName(context)

        try {
            val updateInfo = fetchRemoteVersion()
            if (updateInfo == null) {
                return@withContext UpdateCheckResult.Error("Unable to reach update server.")
            }

            if (updateInfo.versionCode > currentCode) {
                UpdateCheckResult.UpdateAvailable(
                    updateInfo = updateInfo,
                    currentVersionCode = currentCode,
                    currentVersionName = currentName
                )
            } else {
                UpdateCheckResult.UpToDate(
                    currentVersionCode = currentCode,
                    currentVersionName = currentName
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Update check failed", e)
            UpdateCheckResult.Error(e.message ?: "Failed to check for updates.")
        }
    }

    private fun fetchRemoteVersion(): AppUpdateInfo? {
        // 1. Try Primary endpoint
        try {
            val req = Request.Builder()
                .url(PRIMARY_URL)
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .build()
            httpClient.newCall(req).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrBlank()) {
                        val parsed = parseUpdateJson(body, isNested = false)
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
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .build()
            httpClient.newCall(req).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrBlank()) {
                        val parsed = parseUpdateJson(body, isNested = true)
                        if (parsed != null) return parsed
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Fallback update URL failed: ${e.message}")
        }

        return null
    }

    private fun parseUpdateJson(jsonStr: String, isNested: Boolean): AppUpdateInfo? {
        return try {
            val root = JSONObject(jsonStr)
            val diemeObj = if (root.has("dieme")) {
                root.getJSONObject("dieme")
            } else {
                root
            }

            AppUpdateInfo(
                versionCode = diemeObj.optInt("versionCode", 0),
                versionName = diemeObj.optString("versionName", "1.0.0"),
                minSupportedVersionCode = diemeObj.optInt("minSupportedVersionCode", 1),
                releaseNotes = diemeObj.optString("releaseNotes", "New performance and feature updates."),
                downloadUrl = diemeObj.optString("downloadUrl", "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk"),
                releaseDate = diemeObj.optString("releaseDate", "")
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse update JSON", e)
            null
        }
    }

    fun shouldShowAutoPrompt(context: Context, latestVersionCode: Int): Boolean {
        // As requested: The update prompt is skippable per session, but MUST appear every time
        // the app is opened if the app has not been updated yet.
        return latestVersionCode > getCurrentVersionCode(context)
    }

    @Deprecated("Superseded by per-session skipping. Preserved for backwards compatibility.")
    fun skipUpdateFor24Hours(context: Context, latestVersionCode: Int) {
        // No-op: update reminders reappear every time the app opens until updated
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
