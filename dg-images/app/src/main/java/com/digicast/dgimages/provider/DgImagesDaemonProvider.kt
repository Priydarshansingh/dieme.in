package com.digicast.dgimages.provider

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.webkit.WebView
import com.digicast.dgimages.browser.ChatGptSessionManager
import com.digicast.dgimages.browser.ChatGptWebAdapter
import com.digicast.dgimages.server.DgImagesHttpDaemon
import com.digicast.dgimages.service.DgImagesService

/**
 * Headless ContentProvider that provides guaranteed IPC lifecycle activation for Dieme Core.
 * On Android 14+ (API 34/35), querying or calling this ContentProvider loads com.digicast.dgimages
 * and starts the background HTTP daemon (port 5488) in-process without showing any UI or interrupting the user.
 */
class DgImagesDaemonProvider : ContentProvider() {

    companion object {
        private const val TAG = "DgImagesDaemonProvider"
        const val AUTHORITY = "com.digicast.dgimages.daemon"
        var activeDaemon: DgImagesHttpDaemon? = null
        var headlessWebView: WebView? = null
    }

    override fun onCreate(): Boolean {
        Log.i(TAG, "🚀 DgImagesDaemonProvider onCreate invoked - ensuring DgImages daemon and session are active")
        ensureServiceStarted()
        return true
    }

    override fun call(method: String, arg: String?, extras: Bundle?): Bundle {
        Log.i(TAG, "📞 DgImagesDaemonProvider call received: method=$method")
        ensureServiceStarted()
        return Bundle().apply {
            putBoolean("started", true)
            putInt("port", 5488)
            putLong("timestamp", System.currentTimeMillis())
        }
    }

    private fun ensureServiceStarted() {
        val ctx = context ?: return

        // 1. Ensure daemon socket is running in-process
        if (activeDaemon == null) {
            try {
                activeDaemon = DgImagesHttpDaemon(ctx.applicationContext, 5488).apply { start() }
                Log.i(TAG, "✅ In-process DgImagesHttpDaemon running on port 5488")
            } catch (e: Exception) {
                Log.w(TAG, "Error starting daemon on 5488: ${e.message}")
            }
        }

        // 2. Ensure headless WebView is mounted on Main Looper if no active adapter exists
        if (ChatGptSessionManager.activeAdapter == null) {
            Handler(Looper.getMainLooper()).post {
                try {
                    if (ChatGptSessionManager.activeAdapter == null) {
                        val appCtx = ctx.applicationContext
                        val wv = WebView(appCtx).apply {
                            measure(
                                View.MeasureSpec.makeMeasureSpec(1080, View.MeasureSpec.EXACTLY),
                                View.MeasureSpec.makeMeasureSpec(1920, View.MeasureSpec.EXACTLY)
                            )
                            layout(0, 0, 1080, 1920)
                        }
                        headlessWebView = wv
                        val adapter = ChatGptWebAdapter(
                            context = appCtx,
                            webView = wv,
                            onStateChanged = { Log.i(TAG, "Headless ChatGPT state: $it") },
                            onResultCaptured = { Log.i(TAG, "Headless result: ${it.take(30)}") },
                            onAuthRequired = { Log.w(TAG, "Headless ChatGPT auth required") }
                        )
                        ChatGptSessionManager.activeAdapter = adapter
                        Log.i(TAG, "✅ Headless WebView registered to ChatGptSessionManager from DaemonProvider")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error initializing headless WebView in DaemonProvider", e)
                }
            }
        }

        // 3. Attempt foreground service promotion if permitted by OS
        try {
            val serviceIntent = Intent(ctx, DgImagesService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(serviceIntent)
            } else {
                ctx.startService(serviceIntent)
            }
        } catch (_: Exception) {}
    }

    override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null
    override fun getType(uri: Uri): String = "vnd.android.cursor.item/vnd.com.digicast.dgimages.daemon"
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0
}
