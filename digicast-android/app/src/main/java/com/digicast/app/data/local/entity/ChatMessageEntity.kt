package com.digicast.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "chat_messages",
    foreignKeys = [
        ForeignKey(
            entity = StreamEntity::class,
            parentColumns = ["id"],
            childColumns = ["streamId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("streamId"), Index("publishedAtMs")]
)
data class ChatMessageEntity(
    @PrimaryKey val id: String,
    val streamId: String,
    val authorDisplayName: String,
    val authorChannelId: String,
    val messageText: String,
    val publishedAtMs: Long,
    val isSuperChat: Boolean = false,
    val superChatAmountMicros: Long = 0,
    val superChatCurrency: String? = null,
    val isMembershipEvent: Boolean = false,
    val rawJson: String? = null,
    val createdAtMs: Long = System.currentTimeMillis()
)
