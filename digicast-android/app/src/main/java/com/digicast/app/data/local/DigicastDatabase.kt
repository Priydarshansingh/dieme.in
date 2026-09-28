package com.digicast.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.local.entity.SyncQueueEntity

@Database(
    entities = [
        StreamEntity::class,
        ChatMessageEntity::class,
        ClipMarkerEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class DigicastDatabase : RoomDatabase() {
    abstract fun digicastDao(): DigicastDao
}
