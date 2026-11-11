package com.digicast.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Index

@Entity(
    tableName = "sync_queue",
    indices = [
        Index("status")
    ]
)
data class SyncQueueEntity(
    @PrimaryKey val id: String, // UUID
    val type: String, // e.g., "CLIP_MARKER"
    val payloadJson: String, // Serialized payload to send to Firestore
    val status: String, // "PENDING", "FAILED"
    val retryCount: Int = 0,
    val createdAtMs: Long = System.currentTimeMillis()
)
