package com.digicast.app.data.remote

import com.digicast.app.data.remote.models.LiveBroadcastListResponse
import com.digicast.app.data.remote.models.LiveChatMessageListResponse
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface YouTubeApiService {

    @GET("liveBroadcasts")
    suspend fun getLiveBroadcasts(
        @Header("Authorization") bearerToken: String,
        @Query("part") part: String = "snippet,status",
        @Query("broadcastStatus") broadcastStatus: String = "active",
        @Query("mine") mine: Boolean = true
    ): LiveBroadcastListResponse

    @GET("liveChat/messages")
    suspend fun getLiveChatMessages(
        @Header("Authorization") bearerToken: String,
        @Query("liveChatId") liveChatId: String,
        @Query("part") part: String = "snippet,authorDetails",
        @Query("pageToken") pageToken: String? = null,
        @Query("maxResults") maxResults: Int = 200
    ): LiveChatMessageListResponse
}
