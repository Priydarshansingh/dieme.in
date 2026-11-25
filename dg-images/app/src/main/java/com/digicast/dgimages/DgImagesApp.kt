package com.digicast.dgimages

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.digicast.dgimages.service.DgImagesService

class DgImagesApp : Application() {

    companion object {
        const val CHANNEL_ID = "dg_images_daemon_channel"
        lateinit var instance: DgImagesApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()

        // Attempt to start daemon foreground service safely (deferred if restricted by Android 14+ background launch)
        try {
            val serviceIntent = Intent(this, DgImagesService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            android.util.Log.w("DgImagesApp", "Foreground service start deferred: ${e.message}")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Dg-Images Engine Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps local thumbnail generation engine ready for Dieme Studio"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}

