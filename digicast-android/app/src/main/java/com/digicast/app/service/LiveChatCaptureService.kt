package com.digicast.app.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.ServiceCompat
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.remote.YouTubeApiService
import com.digicast.app.data.repository.ChatRepository
import com.digicast.app.data.repository.StreamRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import javax.inject.Inject

@AndroidEntryPoint
class LiveChatCaptureService : Service() {

    @Inject lateinit var youtubeApi: YouTubeApiService
    @Inject lateinit var chatRepository: ChatRepository
    @Inject lateinit var streamRepository: StreamRepository

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private var pollJob: Job? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private var isCapturing = false
    private var currentStreamId: String? = null
    private var currentStreamTitle: String = "YouTube Live"
    private var nextPageToken: String? = null
    private var capturedMessageCount = 0
    private var clipMarkerCount = 0

    companion object {
        const val ACTION_START_CAPTURE = "com.digicast.app.START_CAPTURE"
        const val ACTION_STOP_CAPTURE = "com.digicast.app.STOP_CAPTURE"
        const val EXTRA_STREAM_ID = "extra_stream_id"
        const val EXTRA_VIDEO_ID = "extra_video_id"
        const val EXTRA_CHAT_ID = "extra_chat_id"
        const val EXTRA_STREAM_TITLE = "extra_stream_title"
        const val EXTRA_CHANNEL_ID = "extra_channel_id"
        const val EXTRA_CHANNEL_TITLE = "extra_channel_title"
        const val EXTRA_WORKSPACE_ID = "extra_workspace_id"
        const val EXTRA_AUTH_TOKEN = "extra_auth_token"

        @Volatile
        var isServiceRunning = false
            private set

        fun start(
            context: Context,
            streamId: String,
            videoId: String,
            liveChatId: String,
            streamTitle: String,
            channelId: String,
            channelTitle: String,
            workspaceId: String,
            authToken: String
        ) {
            val intent = Intent(context, LiveChatCaptureService::class.java).apply {
                action = ACTION_START_CAPTURE
                putExtra(EXTRA_STREAM_ID, streamId)
                putExtra(EXTRA_VIDEO_ID, videoId)
                putExtra(EXTRA_CHAT_ID, liveChatId)
                putExtra(EXTRA_STREAM_TITLE, streamTitle)
                putExtra(EXTRA_CHANNEL_ID, channelId)
                putExtra(EXTRA_CHANNEL_TITLE, channelTitle)
                putExtra(EXTRA_WORKSPACE_ID, workspaceId)
                putExtra(EXTRA_AUTH_TOKEN, authToken)
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, LiveChatCaptureService::class.java).apply {
                action = ACTION_STOP_CAPTURE
            }
            context.startService(intent)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CAPTURE -> startCapture(intent)
            ACTION_STOP_CAPTURE -> stopCapture()
        }
        return START_STICKY
    }

    private fun startCapture(intent: Intent) {
        if (isCapturing) return

        val streamId = intent.getStringExtra(EXTRA_STREAM_ID) ?: return stopSelf()
        val chatId = intent.getStringExtra(EXTRA_CHAT_ID) ?: return stopSelf()
        val title = intent.getStringExtra(EXTRA_STREAM_TITLE) ?: "Live Stream"
        val channelId = intent.getStringExtra(EXTRA_CHANNEL_ID) ?: ""
        val channelTitle = intent.getStringExtra(EXTRA_CHANNEL_TITLE) ?: ""
        val workspaceId = intent.getStringExtra(EXTRA_WORKSPACE_ID) ?: ""
        val token = intent.getStringExtra(EXTRA_AUTH_TOKEN) ?: return stopSelf()

        isCapturing = true
        isServiceRunning = true
        currentStreamId = streamId
        currentStreamTitle = title
        capturedMessageCount = 0
        clipMarkerCount = 0
        nextPageToken = null

        acquireWakeLock()

        val notification = NotificationHelper.buildCaptureNotification(this, title, 0, 0)
        val fgsType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        } else 0
        ServiceCompat.startForeground(this, NotificationHelper.NOTIFICATION_ID_CAPTURE, notification, fgsType)

        pollJob = serviceScope.launch {
            streamRepository.saveStream(
                StreamEntity(
                    id = streamId,
                    workspaceId = workspaceId,
                    title = title,
                    channelId = channelId,
                    channelTitle = channelTitle,
                    liveChatId = chatId,
                    thumbnailUrl = null,
                    status = "live",
                    isActive = true,
                    startedAtMs = System.currentTimeMillis(),
                    endedAtMs = null
                )
            )
            runPollingLoop(streamId, chatId, token)
        }
    }

    private suspend fun runPollingLoop(
        streamId: String,
        chatId: String,
        token: String
    ) {
        var backoffMs = 2_000L
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        while (isCapturing && serviceScope.isActive) {
            try {
                val response = youtubeApi.getLiveChatMessages(
                    bearerToken = "Bearer $token",
                    liveChatId = chatId,
                    pageToken = nextPageToken
                )
                nextPageToken = response.nextPageToken
                val interval = (response.pollingIntervalMillis ?: 3_000L).coerceAtLeast(1_000L)

                val entities = response.items.orEmpty().map { item ->
                    val publishedAt = try {
                        dateFormat.parse(item.snippet.publishedAt)?.time ?: System.currentTimeMillis()
                    } catch (_: Exception) {
                        System.currentTimeMillis()
                    }
                    val text = item.snippet.displayMessage
                        ?: item.snippet.textMessageDetails?.messageText
                        ?: ""
                    ChatMessageEntity(
                        id = item.id,
                        streamId = streamId,
                        authorDisplayName = item.authorDetails.displayName,
                        authorChannelId = item.authorDetails.channelId,
                        messageText = text,
                        publishedAtMs = publishedAt,
                        isSuperChat = item.snippet.type == "superChatEvent",
                        superChatAmountMicros = item.snippet.superChatDetails?.amountMicros ?: 0,
                        superChatCurrency = item.snippet.superChatDetails?.currency,
                        isMembershipEvent = item.snippet.type.contains("membership", ignoreCase = true),
                        rawJson = null
                    )
                }

                val markers = chatRepository.saveMessagesAndDetectClips(entities)
                capturedMessageCount += entities.size
                if (markers.isNotEmpty()) {
                    clipMarkerCount += markers.size
                    markers.forEach { marker ->
                        NotificationHelper.showClipMarkerNotification(
                            this@LiveChatCaptureService,
                            marker.authorName,
                            marker.label
                        )
                    }
                }
                updateNotification()
                backoffMs = 2_000L
                delay(interval)
            } catch (_: Exception) {
                delay(backoffMs)
                backoffMs = (backoffMs * 2).coerceAtMost(30_000L)
            }
        }
    }

    private fun updateNotification() {
        val notification = NotificationHelper.buildCaptureNotification(
            this,
            currentStreamTitle,
            capturedMessageCount,
            clipMarkerCount
        )
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(NotificationHelper.NOTIFICATION_ID_CAPTURE, notification)
    }

    private fun stopCapture() {
        isCapturing = false
        isServiceRunning = false
        pollJob?.cancel()
        currentStreamId?.let { id ->
            serviceScope.launch { streamRepository.markInactive(id) }
        }
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "digicast:livechat").apply {
            setReferenceCounted(false)
            acquire(6 * 60 * 60 * 1000L)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    override fun onDestroy() {
        super.onDestroy()
        isCapturing = false
        isServiceRunning = false
        releaseWakeLock()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
