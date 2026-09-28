package com.digicast.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ForeignKey
import androidx.room.Index

@Entity(
    tableName = "clip_markers",
    foreignKeys = [
        ForeignKey(
            entity = StreamEntity::class,
            parentColumns = ["id"],
            childColumns = ["streamId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("streamId"),
        Index("status")
    ]
)
data class ClipMarkerEntity(
    @PrimaryKey val id: String, // UUID
    val streamId: String,
    val authorName: String,
    val authorId: String,
    val triggerMessageId: String, // ID of the "!clip" message
    val timestampMs: Long, // When the !clip command was received
    val label: String, // Optional label for the clip
    val status: String, // "PENDING", "GENERATING", "UPLOADED", "FAILED"
    val localFilePath: String? = null,
    val telegramMessageUrl: String? = null
)
