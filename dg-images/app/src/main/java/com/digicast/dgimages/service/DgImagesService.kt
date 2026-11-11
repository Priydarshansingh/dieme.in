package com.digicast.dgimages.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.digicast.dgimages.DgImagesApp
import com.digicast.dgimages.MainActivity
import com.digicast.dgimages.server.DgImagesHttpDaemon

class DgImagesService : Service() {

    private var daemon: DgImagesHttpDaemon? = null

    override fun onCreate() {
        super.onCreate()
        daemon = DgImagesHttpDaemon(this, 5488)
        daemon?.start()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, DgImagesApp.CHANNEL_ID)
            .setContentTitle("Dg-Images Engine Active")
            .setContentText("127.0.0.1:5488 • Ready for Digicast Studio")
            .setSmallIcon(android.R.drawable.ic_menu_gallery)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(1001, notification)
            }
        } else {
            startForeground(1001, notification)
        }

        return START_STICKY
    }

    override fun onDestroy() {
        daemon?.stop()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
