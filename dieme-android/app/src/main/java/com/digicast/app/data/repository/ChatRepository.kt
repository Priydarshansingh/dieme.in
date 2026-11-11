package com.digicast.app.data.repository

import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.SyncQueueEntity
import com.squareup.moshi.Moshi
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val dao: DigicastDao,
    private val moshi: Moshi
) {
    fun getRecentMessages(streamId: String, limit: Int = 50): Flow<List<ChatMessageEntity>> {
        return dao.getRecentChatMessages(streamId, limit)
    }

    suspend fun saveMessagesAndDetectClips(
        messages: List<ChatMessageEntity>
    ): List<ClipMarkerEntity> {
        if (messages.isEmpty()) return emptyList()
        dao.insertChatMessages(messages)

        val markers = mutableListOf<ClipMarkerEntity>()
        for (msg in messages) {
            val trimmed = msg.messageText.trim()
            if (!trimmed.startsWith("!clip", ignoreCase = true)) continue

            // Case-insensitive label extraction — drop "!clip" prefix however it was typed
            val label = trimmed.substring(5).trim() // "!clip" is always 5 chars
            val marker = ClipMarkerEntity(
                id = UUID.randomUUID().toString(),
                streamId = msg.streamId,
                authorName = msg.authorDisplayName,
                authorId = msg.authorChannelId,
                triggerMessageId = msg.id,
                timestampMs = msg.publishedAtMs,
                label = label.ifBlank { "Clip" },
                status = "PENDING"
            )
            dao.insertClipMarker(marker)

            val adapter = moshi.adapter(ClipMarkerEntity::class.java)
            dao.insertSyncTask(
                SyncQueueEntity(
                    id = UUID.randomUUID().toString(),
                    type = "CLIP_MARKER",
                    payloadJson = adapter.toJson(marker),
                    status = "PENDING"
                )
            )
            markers.add(marker)
        }
        return markers
    }
}
