package com.digicast.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.digicast.app.MainActivity
import com.digicast.app.R

object NotificationHelper {

    const val CHANNEL_LIVE_CAPTURE = "digicast_live_capture"
    const val CHANNEL_CLIP_EVENTS = "digicast_clip_events"
    const val NOTIFICATION_ID_CAPTURE = 1001

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_LIVE_CAPTURE,
                context.getString(R.string.channel_capture_title),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = context.getString(R.string.channel_capture_desc)
                setShowBadge(false)
            }
        )

        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_CLIP_EVENTS,
                context.getString(R.string.channel_clips_title),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.channel_clips_desc)
                enableVibration(true)
            }
        )
    }

    fun buildCaptureNotification(
        context: Context,
        streamTitle: String,
        messageCount: Int,
        clipCount: Int
    ): Notification {
        val openIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = PendingIntent.getService(
            context,
            1,
            Intent(context, LiveChatCaptureService::class.java).apply {
                action = LiveChatCaptureService.ACTION_STOP_CAPTURE
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_LIVE_CAPTURE)
            .setContentTitle("Digicast — Live chat capture")
            .setContentText("$streamTitle · $messageCount msgs · $clipCount clips")
            .setSmallIcon(R.drawable.ic_digicast_logo)
            .setOngoing(true)
            .setContentIntent(openIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    fun showClipMarkerNotification(context: Context, authorName: String, label: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val pending = PendingIntent.getActivity(
            context,
            authorName.hashCode(),
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_CLIP_EVENTS)
            .setContentTitle("New !clip marker")
            .setContentText("$authorName · $label")
            .setSmallIcon(R.drawable.ic_digicast_logo)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        manager.notify((System.currentTimeMillis() % 10000).toInt(), notification)
    }
}
