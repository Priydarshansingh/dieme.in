package com.digicast.app.data.repository

import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.StreamEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StreamRepository @Inject constructor(
    private val dao: DigicastDao
) {
    fun getActiveStreams(): Flow<List<StreamEntity>> = dao.getActiveStreams()
    fun getAllStreams(): Flow<List<StreamEntity>> = dao.getAllStreams()

    suspend fun getStreamById(id: String): StreamEntity? = dao.getStreamById(id)

    suspend fun saveStream(stream: StreamEntity) = dao.insertStream(stream)

    suspend fun markInactive(streamId: String) = dao.markStreamInactive(streamId)
}
