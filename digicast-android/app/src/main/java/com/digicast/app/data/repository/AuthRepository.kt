package com.digicast.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.local.entity.ClipMarkerEntity
import com.digicast.app.data.local.entity.StreamEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class UserSession(
    val uid: String,
    val email: String,
    val displayName: String,
    val photoUrl: String,
    val workspaceId: String,
    val workspaceName: String,
    val role: String,
    val token: String
)

sealed class AuthState {
    object SignedOut : AuthState()
    object Loading : AuthState()
    data class SignedIn(val session: UserSession) : AuthState()
    data class Error(val message: String) : AuthState()
}

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val okHttpClient: OkHttpClient,
    private val dao: DigicastDao
) {
    companion object {
        private const val PREFS_NAME = "digicast_auth_prefs"
        private const val KEY_UID = "auth_uid"
        private const val KEY_EMAIL = "auth_email"
        private const val KEY_NAME = "auth_name"
        private const val KEY_PHOTO = "auth_photo"
        private const val KEY_WORKSPACE_ID = "auth_workspace_id"
        private const val KEY_WORKSPACE_NAME = "auth_workspace_name"
        private const val KEY_ROLE = "auth_role"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_IS_SIGNED_OUT_EXPLICITLY = "auth_signed_out_explicitly"

        // Backend URL (configurable in build / production)
        const val BACKEND_URL = "https://digicast-web.vercel.app"

        // Default creator / editor session so the app is always already signed in
        val DEFAULT_SESSION = UserSession(
            uid = "creator-primary-uid",
            email = "creator@digicast.app",
            displayName = "Digicast Creator",
            photoUrl = "",
            workspaceId = "workspace-main",
            workspaceName = "Main Creator Studio",
            role = "owner",
            token = "session-token-primary"
        )
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val scope = CoroutineScope(Dispatchers.IO)

    private val _authState = MutableStateFlow<AuthState>(AuthState.SignedIn(DEFAULT_SESSION))
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _isSyncing = MutableStateFlow<Boolean>(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    init {
        loadSavedSession()
    }

    private fun loadSavedSession() {
        val explicitlySignedOut = prefs.getBoolean(KEY_IS_SIGNED_OUT_EXPLICITLY, false)
        val uid = prefs.getString(KEY_UID, null)
        val email = prefs.getString(KEY_EMAIL, null)
        val token = prefs.getString(KEY_TOKEN, null)

        if (uid != null && email != null && token != null) {
            val session = UserSession(
                uid = uid,
                email = email,
                displayName = prefs.getString(KEY_NAME, email.substringBefore("@")) ?: "User",
                photoUrl = prefs.getString(KEY_PHOTO, "") ?: "",
                workspaceId = prefs.getString(KEY_WORKSPACE_ID, "workspace-main") ?: "workspace-main",
                workspaceName = prefs.getString(KEY_WORKSPACE_NAME, "Main Studio") ?: "Main Studio",
                role = prefs.getString(KEY_ROLE, "owner") ?: "owner",
                token = token
            )
            _authState.value = AuthState.SignedIn(session)
            // Auto fetch immediately when app opens
            scope.launch { syncWorkspaceData() }
        } else if (!explicitlySignedOut) {
            // Default to already signed-in state
            saveSession(DEFAULT_SESSION)
            _authState.value = AuthState.SignedIn(DEFAULT_SESSION)
            scope.launch {
                seedInitialDataIfEmpty()
                syncWorkspaceData()
            }
        } else {
            _authState.value = AuthState.SignedOut
        }
    }

    private fun saveSession(session: UserSession) {
        prefs.edit().apply {
            putBoolean(KEY_IS_SIGNED_OUT_EXPLICITLY, false)
            putString(KEY_UID, session.uid)
            putString(KEY_EMAIL, session.email)
            putString(KEY_NAME, session.displayName)
            putString(KEY_PHOTO, session.photoUrl)
            putString(KEY_WORKSPACE_ID, session.workspaceId)
            putString(KEY_WORKSPACE_NAME, session.workspaceName)
            putString(KEY_ROLE, session.role)
            putString(KEY_TOKEN, session.token)
            apply()
        }
    }

    private suspend fun seedInitialDataIfEmpty() = withContext(Dispatchers.IO) {
        try {
            val existing = dao.getStreamById("stream-live-demo")
            if (existing == null) {
                val demoStream = StreamEntity(
                    id = "stream-live-demo",
                    workspaceId = DEFAULT_SESSION.workspaceId,
                    title = "Live Studio Stream • YouTube Broadcast",
                    channelId = "channel-digicast",
                    channelTitle = DEFAULT_SESSION.workspaceName,
                    liveChatId = "chat-demo-101",
                    thumbnailUrl = null,
                    status = "live",
                    isActive = true,
                    startedAtMs = System.currentTimeMillis() - (1000 * 60 * 45),
                    endedAtMs = null
                )
                dao.insertStream(demoStream)

                val demoClip = ClipMarkerEntity(
                    id = "clip-demo-1",
                    streamId = "stream-live-demo",
                    authorName = "StreamViewer",
                    authorId = "user-v1",
                    triggerMessageId = "msg-demo-1",
                    timestampMs = System.currentTimeMillis() - (1000 * 60 * 12),
                    label = "Epic Clutch Moment !clip",
                    status = "GENERATED",
                    localFilePath = null,
                    telegramMessageUrl = null
                )
                dao.insertClipMarker(demoClip)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Parses the deep-link URL returned after Google OAuth on the web backend:
     * digicast://oauth?token=...&uid=...&email=...&name=...&workspaceId=...&role=...
     * Automatically syncs all workspace data upon successful sign in!
     */
    fun handleOAuthDeepLink(uri: Uri): Boolean {
        if (uri.scheme != "digicast") return false

        val token = uri.getQueryParameter("token") ?: return false
        val uid = uri.getQueryParameter("uid") ?: return false
        val email = uri.getQueryParameter("email") ?: return false
        val displayName = uri.getQueryParameter("name") ?: email.substringBefore("@")
        val photoUrl = uri.getQueryParameter("photoUrl") ?: ""
        val workspaceId = uri.getQueryParameter("workspaceId") ?: "workspace-main"
        val workspaceName = uri.getQueryParameter("workspaceName") ?: "Workspace"
        val role = uri.getQueryParameter("role") ?: "editor"

        val session = UserSession(
            uid = uid,
            email = email,
            displayName = displayName,
            photoUrl = photoUrl,
            workspaceId = workspaceId,
            workspaceName = workspaceName,
            role = role,
            token = token
        )

        saveSession(session)
        _authState.value = AuthState.SignedIn(session)

        // AUTOMATIC DATA FETCH IMMEDIATELY ON SIGN IN
        scope.launch {
            syncWorkspaceData()
        }
        return true
    }

    fun getGoogleOAuthUrl(): String {
        val currentWorkspace = prefs.getString(KEY_WORKSPACE_ID, "") ?: ""
        return "$BACKEND_URL/api/auth/mobile/google?workspaceId=$currentWorkspace"
    }

    fun resetToDefaultSignedIn() {
        saveSession(DEFAULT_SESSION)
        _authState.value = AuthState.SignedIn(DEFAULT_SESSION)
        scope.launch {
            seedInitialDataIfEmpty()
            syncWorkspaceData()
        }
    }

    fun signOut() {
        prefs.edit().putBoolean(KEY_IS_SIGNED_OUT_EXPLICITLY, true).clear().apply()
        _authState.value = AuthState.SignedOut
    }

    /**
     * Syncs workspace stream and clip data from backend directly into Room DB
     */
    suspend fun syncWorkspaceData(): Result<String> = withContext(Dispatchers.IO) {
        val currentSession = (authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("User not authenticated"))

        _isSyncing.value = true

        try {
            val syncUrl = "$BACKEND_URL/api/mobile/sync?workspaceId=${currentSession.workspaceId}"
            val request = Request.Builder()
                .url(syncUrl)
                .addHeader("Authorization", "Bearer ${currentSession.token}")
                .addHeader("x-user-uid", currentSession.uid)
                .addHeader("x-user-email", currentSession.email)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                _isSyncing.value = false
                return@withContext Result.failure(Exception("Sync error code: ${response.code}"))
            }

            val bodyString = response.body?.string() ?: "{}"
            val json = JSONObject(bodyString)

            // 1. Process active and recent streams into Room
            val streamsArray = json.optJSONArray("streams")
            if (streamsArray != null && streamsArray.length() > 0) {
                for (i in 0 until streamsArray.length()) {
                    val s = streamsArray.getJSONObject(i)
                    val streamId = s.optString("id", UUID.randomUUID().toString())
                    val title = s.optString("title", "Live Stream")
                    val channelId = s.optString("youtubeChannelId", "channel-1")
                    val channelTitle = s.optString("channelTitle", currentSession.workspaceName)
                    val status = s.optString("status", "live")
                    val isLive = status == "live"
                    val thumb = s.optString("thumbnailUrl", "")

                    val streamEntity = StreamEntity(
                        id = streamId,
                        workspaceId = currentSession.workspaceId,
                        title = title,
                        channelId = channelId,
                        channelTitle = channelTitle,
                        liveChatId = if (s.has("liveChatId") && !s.isNull("liveChatId")) s.getString("liveChatId") else null,
                        thumbnailUrl = if (thumb.isNotEmpty()) thumb else null,
                        status = status,
                        isActive = isLive,
                        startedAtMs = System.currentTimeMillis(),
                        endedAtMs = null
                    )
                    dao.insertStream(streamEntity)
                }
            } else {
                // If cloud has no live streams yet, ensure active workspace stream exists in local cache
                val activeStream = json.optJSONObject("activeStream")
                val streamId = activeStream?.optString("id") ?: "stream-live-${currentSession.workspaceId}"
                val title = activeStream?.optString("title") ?: "${currentSession.workspaceName} Live Broadcast"
                val streamEntity = StreamEntity(
                    id = streamId,
                    workspaceId = currentSession.workspaceId,
                    title = title,
                    channelId = "channel-${currentSession.workspaceId}",
                    channelTitle = currentSession.workspaceName,
                    liveChatId = null,
                    thumbnailUrl = null,
                    status = "live",
                    isActive = true,
                    startedAtMs = System.currentTimeMillis(),
                    endedAtMs = null
                )
                dao.insertStream(streamEntity)
            }

            // 2. Process clip markers into Room
            val clipsArray = json.optJSONArray("clips")
            if (clipsArray != null) {
                for (i in 0 until clipsArray.length()) {
                    val c = clipsArray.getJSONObject(i)
                    val clipId = c.optString("id", UUID.randomUUID().toString())
                    val streamId = c.optString("streamId", "stream-live-${currentSession.workspaceId}")
                    val authorName = c.optString("authorName", "Viewer")
                    val label = c.optString("title", c.optString("note", "Clip Marker"))
                    val status = c.optString("downloadStatus", "PENDING").uppercase()

                    // Ensure foreign key stream exists before inserting clip marker
                    val existingStream = dao.getStreamById(streamId)
                    if (existingStream == null) {
                        val fallbackStream = StreamEntity(
                            id = streamId,
                            workspaceId = currentSession.workspaceId,
                            title = "${currentSession.workspaceName} Live Stream",
                            channelId = "channel-main",
                            channelTitle = currentSession.workspaceName,
                            liveChatId = null,
                            thumbnailUrl = null,
                            status = "live",
                            isActive = true,
                            startedAtMs = System.currentTimeMillis(),
                            endedAtMs = null
                        )
                        dao.insertStream(fallbackStream)
                    }

                    val clipEntity = ClipMarkerEntity(
                        id = clipId,
                        streamId = streamId,
                        authorName = authorName,
                        authorId = c.optString("authorId", "user"),
                        triggerMessageId = c.optString("chatMessageId", "msg-${UUID.randomUUID()}"),
                        timestampMs = System.currentTimeMillis(),
                        label = label,
                        status = if (status.contains("COMPLET")) "GENERATED" else "PENDING",
                        localFilePath = null,
                        telegramMessageUrl = null
                    )
                    dao.insertClipMarker(clipEntity)
                }
            }

            _isSyncing.value = false
            Result.success("Sync completed successfully")
        } catch (e: Exception) {
            _isSyncing.value = false
            e.printStackTrace()
            Result.failure(e)
        }
    }
}
