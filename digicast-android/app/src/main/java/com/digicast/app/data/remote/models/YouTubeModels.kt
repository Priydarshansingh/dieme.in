package com.digicast.app.data.remote.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LiveBroadcastListResponse(
    val items: List<LiveBroadcastItem>? = null,
    val nextPageToken: String? = null
)

@JsonClass(generateAdapter = true)
data class LiveBroadcastItem(
    val id: String,
    val snippet: BroadcastSnippet,
    val status: BroadcastStatus? = null
)

@JsonClass(generateAdapter = true)
data class BroadcastSnippet(
    val title: String,
    val description: String? = null,
    val channelId: String,
    val channelTitle: String? = null,
    val liveChatId: String? = null,
    val actualStartTime: String? = null,
    val scheduledStartTime: String? = null,
    val thumbnails: Thumbnails? = null
)

@JsonClass(generateAdapter = true)
data class BroadcastStatus(
    val lifeCycleStatus: String
)

@JsonClass(generateAdapter = true)
data class Thumbnails(
    val default: ThumbnailItem? = null,
    val medium: ThumbnailItem? = null,
    val high: ThumbnailItem? = null
)

@JsonClass(generateAdapter = true)
data class ThumbnailItem(
    val url: String,
    val width: Int? = null,
    val height: Int? = null
)

@JsonClass(generateAdapter = true)
data class LiveChatMessageListResponse(
    val items: List<LiveChatMessageItem>? = null,
    val nextPageToken: String? = null,
    val pollingIntervalMillis: Long? = 3000,
    val offlineAt: String? = null
)

@JsonClass(generateAdapter = true)
data class LiveChatMessageItem(
    val id: String,
    val snippet: MessageSnippet,
    val authorDetails: MessageAuthorDetails
)

@JsonClass(generateAdapter = true)
data class MessageSnippet(
    val type: String,
    val liveChatId: String,
    val authorChannelId: String,
    val publishedAt: String,
    val displayMessage: String? = null,
    val textMessageDetails: TextMessageDetails? = null,
    val superChatDetails: SuperChatDetails? = null
)

@JsonClass(generateAdapter = true)
data class TextMessageDetails(
    val messageText: String
)

@JsonClass(generateAdapter = true)
data class SuperChatDetails(
    val amountMicros: Long,
    val currency: String,
    val amountDisplayString: String,
    val userComment: String? = null
)

@JsonClass(generateAdapter = true)
data class MessageAuthorDetails(
    val channelId: String,
    val channelUrl: String? = null,
    val displayName: String,
    val profileImageUrl: String? = null,
    val isVerified: Boolean = false,
    val isChatOwner: Boolean = false,
    val isChatSponsor: Boolean = false,
    val isChatModerator: Boolean = false
)
