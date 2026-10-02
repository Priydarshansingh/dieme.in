package com.digicast.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "streams")
data class StreamEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val title: String,
    val channelId: String,
    val channelTitle: String,
    val liveChatId: String?,
    val thumbnailUrl: String?,
    val status: String, // "live", "upcoming", "ended"
    val isActive: Boolean = true,
    val concurrentViewers: Long = 0L,
    val viewCount: Long = 0L,
    val likeCount: Long = 0L,
    val commentCount: Long = 0L,
    val startedAtMs: Long?,
    val endedAtMs: Long?,
    val createdAtMs: Long = System.currentTimeMillis(),
    val updatedAtMs: Long = System.currentTimeMillis()
)
