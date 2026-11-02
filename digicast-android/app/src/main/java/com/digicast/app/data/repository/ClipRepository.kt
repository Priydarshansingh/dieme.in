package com.digicast.app.data.repository

import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ClipMarkerEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ClipRepository @Inject constructor(
    private val dao: DigicastDao
) {
    fun getClipsForStream(streamId: String): Flow<List<ClipMarkerEntity>> =
        dao.getClipMarkersForStream(streamId)

    fun getAllClips(): Flow<List<ClipMarkerEntity>> = dao.getAllClipMarkers()

    fun getClipsForWorkspace(workspaceId: String): Flow<List<ClipMarkerEntity>> =
        if (workspaceId.isBlank()) dao.getAllClipMarkers() else dao.getClipMarkersForWorkspace(workspaceId)

    suspend fun getClipById(id: String): ClipMarkerEntity? = dao.getClipMarkerById(id)

    suspend fun getPending(): List<ClipMarkerEntity> = dao.getPendingClipMarkers()

    suspend fun createClipMarker(marker: ClipMarkerEntity) = dao.insertClipMarker(marker)

    suspend fun deleteClip(id: String) = dao.deleteClipMarker(id)

    suspend fun updateStatus(id: String, status: String) =
        dao.updateClipMarkerStatus(id, status)

    suspend fun attachFile(id: String, path: String) =
        dao.updateClipMarkerFile(id, path, "GENERATED")

    suspend fun updateTelegramStatus(id: String, telegramUrl: String, status: String = "UPLOADED") =
        dao.updateClipTelegramStatus(id, telegramUrl, status)
}
