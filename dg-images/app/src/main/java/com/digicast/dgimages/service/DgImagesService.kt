package com.digicast.dgimages.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import androidx.core.app.NotificationCompat
import com.digicast.dgimages.DgImagesApp
import com.digicast.dgimages.MainActivity
import com.digicast.dgimages.browser.ChatGptSessionManager
import com.digicast.dgimages.browser.ChatGptWebAdapter
import com.digicast.dgimages.server.DgImagesHttpDaemon

class DgImagesService : Service() {

    companion object {
        private const val TAG = "DgImagesService"
        private const val NOTIF_ID = 1001
    }

    private var daemon: DgImagesHttpDaemon? = null
    private var webView: WebView? = null
    private var webAdapter: ChatGptWebAdapter? = null
    private var windowManager: WindowManager? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "🚀 DgImagesService starting background daemon and WebView session...")

        // Acquire partial wake lock to prevent CPU sleep during long AI generation tasks
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DgImages:DaemonWakeLock").apply {
                acquire(24 * 60 * 60 * 1000L) // 24 hours
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not acquire wake lock: ${e.message}")
        }

        // Initialize background WebView engine on Main Looper
        Handler(Looper.getMainLooper()).post {
            setupBackgroundWebView()
        }

        daemon = DgImagesHttpDaemon(this, 5488)
        daemon?.start()
    }

    private fun setupBackgroundWebView() {
        try {
            if (ChatGptSessionManager.activeAdapter != null) {
                this.webAdapter = ChatGptSessionManager.activeAdapter
                this.webView = webAdapter?.webView
                Log.i(TAG, "✅ Reusing existing ChatGptWebAdapter from ChatGptSessionManager")
                return
            }

            val wv = WebView(this)
            this.webView = wv

            // Measure and layout headless WebView in memory (no overlay window required)
            wv.measure(
                View.MeasureSpec.makeMeasureSpec(1080, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(1920, View.MeasureSpec.EXACTLY)
            )
            wv.layout(0, 0, 1080, 1920)
            Log.i(TAG, "✅ In-memory headless WebView prepared at 1080x1920")

            val adapter = ChatGptWebAdapter(
                context = this,
                webView = wv,
                onStateChanged = { status ->
                    Log.i(TAG, "ChatGPT state: $status")
                    updateNotification("127.0.0.1:5488 • $status")
                },
                onResultCaptured = { res ->
                    Log.i(TAG, "ChatGPT result captured: ${res.take(50)}")
                },
                onAuthRequired = {
                    Log.w(TAG, "ChatGPT authentication required")
                    updateNotification("⚠️ Sign-in required in Dg-Images")
                }
            )

            this.webAdapter = adapter
            ChatGptSessionManager.activeAdapter = adapter
            Log.i(TAG, "✅ Background ChatGptWebAdapter successfully registered to ChatGptSessionManager")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing background WebView: ${e.message}", e)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildForegroundNotification("127.0.0.1:5488 • Ready for Dieme Studio")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(NOTIF_ID, notification)
            }
        } else {
            startForeground(NOTIF_ID, notification)
        }

        return START_STICKY
    }

    private fun buildForegroundNotification(status: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, DgImagesApp.CHANNEL_ID)
            .setContentTitle("Dg-Images Background Engine Active")
            .setContentText(status)
            .setSmallIcon(android.R.drawable.ic_menu_gallery)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(status: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        manager?.notify(NOTIF_ID, buildForegroundNotification(status))
    }

    override fun onDestroy() {
        try {
            if (windowManager != null && webView != null) {
                windowManager?.removeView(webView)
            }
        } catch (_: Exception) {}
        try {
            wakeLock?.release()
        } catch (_: Exception) {}
        daemon?.stop()
        super.onDestroy()
    }

    private val binder = object : android.os.Binder() {}
    override fun onBind(intent: Intent?): IBinder {
        Log.i(TAG, "🔗 onBind called from client app - ensuring daemon is active on port 5488")
        if (daemon == null) {
            daemon = DgImagesHttpDaemon(this, 5488)
            daemon?.start()
            Log.i(TAG, "🟢 DgImagesHttpDaemon started on port 5488 via onBind")
        }
        return binder
    }
}
