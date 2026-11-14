package com.digicast.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.digicast.app.data.local.entity.ChatMessageEntity
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.local.entity.SyncQueueEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DigicastDao {

    // --- Stream ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStream(stream: StreamEntity)

    @Query("SELECT * FROM streams WHERE isActive = 1")
    fun getActiveStreams(): Flow<List<StreamEntity>>

    @Query("SELECT * FROM streams ORDER BY isActive DESC, startedAtMs DESC")
    fun getAllStreams(): Flow<List<StreamEntity>>

    @Query("SELECT * FROM streams WHERE workspaceId = :workspaceId ORDER BY isActive DESC, startedAtMs DESC")
    fun getStreamsForWorkspace(workspaceId: String): Flow<List<StreamEntity>>

    @Query("SELECT * FROM streams WHERE workspaceId = :workspaceId AND isActive = 1")
    fun getActiveStreamsForWorkspace(workspaceId: String): Flow<List<StreamEntity>>

    @Query("SELECT * FROM streams WHERE workspaceId = :workspaceId")
    suspend fun getStreamsForWorkspaceSnapshot(workspaceId: String): List<StreamEntity>

    @Query("SELECT * FROM streams WHERE id = :streamId")
    suspend fun getStreamById(streamId: String): StreamEntity?

    @Query("UPDATE streams SET isActive = 0 WHERE id = :streamId")
    suspend fun markStreamInactive(streamId: String)

    @Query("DELETE FROM streams WHERE id = :streamId")
    suspend fun deleteStream(streamId: String)

    @Query("DELETE FROM streams WHERE workspaceId != :workspaceId")
    suspend fun clearStreamsExceptWorkspace(workspaceId: String)

    @Query("DELETE FROM streams WHERE workspaceId = :workspaceId")
    suspend fun clearStreamsForWorkspace(workspaceId: String)

    @Query("DELETE FROM streams")
    suspend fun clearAllStreams()

    @Query("DELETE FROM streams WHERE id LIKE 'demo%' OR id LIKE 'stream-demo%' OR channelTitle LIKE '%Demo%' OR title LIKE '%Demo%'")
    suspend fun clearDemoStreams()

    // --- Chat Messages ---
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertChatMessages(messages: List<ChatMessageEntity>)

    @Query("SELECT * FROM chat_messages WHERE streamId = :streamId ORDER BY publishedAtMs DESC LIMIT :limit")
    fun getRecentChatMessages(streamId: String, limit: Int = 50): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM chat_messages WHERE streamId = :streamId ORDER BY publishedAtMs DESC LIMIT :limit")
    suspend fun getRecentChatMessagesSnapshot(streamId: String, limit: Int = 50): List<ChatMessageEntity>

    @Query("DELETE FROM chat_messages WHERE streamId = :streamId")
    suspend fun clearChatMessagesForStream(streamId: String)

    @Query("DELETE FROM chat_messages WHERE id LIKE 'msg_dummy_%' OR authorDisplayName LIKE '%FreeFire_Fan%'")
    suspend fun clearDummyChatMessages()

    // For local context around a clip
    @Query("SELECT * FROM chat_messages WHERE streamId = :streamId AND publishedAtMs >= :startTimeMs AND publishedAtMs <= :endTimeMs ORDER BY publishedAtMs ASC")
    suspend fun getMessagesForClipContext(streamId: String, startTimeMs: Long, endTimeMs: Long): List<ChatMessageEntity>

    // --- Clip Markers ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClipMarker(marker: ClipMarkerEntity)

    @Query("UPDATE clip_markers SET status = :status WHERE id = :id")
    suspend fun updateClipMarkerStatus(id: String, status: String)

    @Query("UPDATE clip_markers SET localFilePath = :path, status = :status WHERE id = :id")
    suspend fun updateClipMarkerFile(id: String, path: String, status: String)

    @Query("UPDATE clip_markers SET telegramMessageUrl = :telegramUrl, status = :status WHERE id = :id")
    suspend fun updateClipTelegramStatus(id: String, telegramUrl: String, status: String)

    @Query("SELECT * FROM clip_markers WHERE id = :id LIMIT 1")
    suspend fun getClipMarkerById(id: String): ClipMarkerEntity?

    @Query("SELECT * FROM clip_markers WHERE streamId = :streamId ORDER BY timestampMs DESC")
    fun getClipMarkersForStream(streamId: String): Flow<List<ClipMarkerEntity>>

    @Query("SELECT * FROM clip_markers ORDER BY timestampMs DESC")
    fun getAllClipMarkers(): Flow<List<ClipMarkerEntity>>

    @Query("SELECT c.* FROM clip_markers c INNER JOIN streams s ON c.streamId = s.id WHERE s.workspaceId = :workspaceId ORDER BY c.timestampMs DESC")
    fun getClipMarkersForWorkspace(workspaceId: String): Flow<List<ClipMarkerEntity>>

    @Query("SELECT * FROM clip_markers WHERE status = 'PENDING'")
    suspend fun getPendingClipMarkers(): List<ClipMarkerEntity>

    @Query("DELETE FROM clip_markers WHERE id = :id")
    suspend fun deleteClipMarker(id: String)

    @Query("DELETE FROM clip_markers")
    suspend fun clearAllClips()

    @Query("DELETE FROM clip_markers WHERE streamId NOT IN (SELECT id FROM streams)")
    suspend fun clearOrphanClips()

    @Query("DELETE FROM chat_messages")
    suspend fun clearAllChatMessages()

    @Query("DELETE FROM clip_markers WHERE id LIKE 'demo%' OR authorName LIKE '%Demo%'")
    suspend fun clearDemoClips()

    // --- Sync Queue ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSyncTask(task: SyncQueueEntity)

    @Query("SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY createdAtMs ASC")
    suspend fun getPendingSyncTasks(): List<SyncQueueEntity>

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun deleteSyncTask(id: String)

    @Query("UPDATE sync_queue SET retryCount = retryCount + 1, status = :status WHERE id = :id")
    suspend fun updateSyncTaskRetry(id: String, status: String)
}
