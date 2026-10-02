package com.digicast.app.data.repository

import android.content.Context
import android.content.SharedPreferences
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
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
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

data class YouTubeAccountInfo(
    val channelId: String,
    val channelName: String,
    val channelThumbnail: String,
    val connectionStatus: String
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
        private const val KEY_SIGNED_OUT = "auth_signed_out_explicitly"
        private const val KEY_IS_DEMO = "auth_is_demo"

        // All API calls go to Vercel-hosted digicast-web backend
        const val BACKEND_URL = "https://digicast-web.vercel.app"

        // Demo session — used when user skips sign-in
        val DEMO_SESSION = UserSession(
            uid = "demo-uid",
            email = "demo@digicast.app",
            displayName = "Demo Studio",
            photoUrl = "",
            workspaceId = "demo-workspace",
            workspaceName = "Demo Studio",
            role = "owner",
            token = "demo-token"
        )
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val scope = CoroutineScope(Dispatchers.IO)

    private val _authState = MutableStateFlow<AuthState>(AuthState.SignedOut)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    private val _youtubeAccount = MutableStateFlow<YouTubeAccountInfo?>(null)
    val youtubeAccount: StateFlow<YouTubeAccountInfo?> = _youtubeAccount.asStateFlow()

    init {
        restoreSession()
    }

    // ─── Session restore on app launch ───────────────────────────────────────

    private fun restoreSession() {
        val signedOut = prefs.getBoolean(KEY_SIGNED_OUT, false)
        val isDemo = prefs.getBoolean(KEY_IS_DEMO, false)
        val uid = prefs.getString(KEY_UID, null)
        val email = prefs.getString(KEY_EMAIL, null)
        val token = prefs.getString(KEY_TOKEN, null)

        when {
            // Previously signed in with a real account — restore and background-sync
            !signedOut && !isDemo && uid != null && email != null && token != null -> {
                val session = UserSession(
                    uid = uid,
                    email = email,
                    displayName = prefs.getString(KEY_NAME, email.substringBefore("@")) ?: "User",
                    photoUrl = prefs.getString(KEY_PHOTO, "") ?: "",
                    workspaceId = prefs.getString(KEY_WORKSPACE_ID, uid) ?: uid,
                    workspaceName = prefs.getString(KEY_WORKSPACE_NAME, "Studio") ?: "Studio",
                    role = prefs.getString(KEY_ROLE, "owner") ?: "owner",
                    token = token
                )
                _authState.value = AuthState.SignedIn(session)
                scope.launch { syncWorkspaceData() }
            }
            // Was in demo mode — restore demo without syncing cloud
            !signedOut && isDemo -> {
                _authState.value = AuthState.SignedIn(DEMO_SESSION)
                scope.launch { seedDemoDataIfEmpty() }
            }
            // Signed out or first launch — show onboarding
            else -> {
                _authState.value = AuthState.SignedOut
            }
        }
    }

    // ─── Sign in with email (calls /api/mobile/login on Vercel) ──────────────

    /**
     * Signs in using the email the Creator/Editor registered on digicast-web.
     * The Vercel backend resolves the workspace automatically.
     * On success, automatically fetches all workspace data from /api/mobile/sync.
     */
    suspend fun signInWithEmail(email: String, password: String): Result<UserSession> = withContext(Dispatchers.IO) {
        try {
            val displayName = email.substringBefore("@")
            val body = JSONObject().apply {
                put("email", email)
                put("password", password)
                put("displayName", displayName)
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("$BACKEND_URL/api/mobile/login")
                .post(body)
                .build()

            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: "{}"

            if (!response.isSuccessful) {
                val errMsg = runCatching {
                    JSONObject(responseBody).optString("error", "Server error ${response.code}")
                }.getOrDefault("Server error ${response.code}")
                return@withContext Result.failure(Exception(errMsg))
            }

            val json = JSONObject(responseBody)
            val s = json.getJSONObject("session")

            val session = UserSession(
                uid = s.getString("uid"),
                email = s.getString("email"),
                displayName = s.optString("displayName", displayName),
                photoUrl = s.optString("photoUrl", ""),
                workspaceId = s.optString("workspaceId", ""),
                workspaceName = s.optString("workspaceName", "Studio"),
                role = s.optString("role", "owner"),
                token = s.getString("token")
            )

            saveRealSession(session)
            _authState.value = AuthState.SignedIn(session)

            // Immediately fetch all workspace data after sign-in
            syncWorkspaceData()

            Result.success(session)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(Exception("Could not connect to server. Check your internet connection."))
        }
    }

    // ─── Demo mode (no account needed) ───────────────────────────────────────

    fun enterDemoMode() {
        prefs.edit()
            .putBoolean(KEY_SIGNED_OUT, false)
            .putBoolean(KEY_IS_DEMO, true)
            .apply()
        _authState.value = AuthState.SignedIn(DEMO_SESSION)
        scope.launch { seedDemoDataIfEmpty() }
    }

    // ─── Sign out ─────────────────────────────────────────────────────────────

    fun signOut() {
        prefs.edit().clear()
            .putBoolean(KEY_SIGNED_OUT, true)
            .apply()
        _authState.value = AuthState.SignedOut
        _youtubeAccount.value = null
    }

    // ─── Sync workspace data from Vercel (/api/mobile/sync) ──────────────────

    /**
     * Fetches live streams, clip markers and YouTube account data from the
     * Vercel-hosted digicast-web backend and stores them in local Room DB.
     * Demo-mode users skip this call entirely.
     */
    suspend fun syncWorkspaceData(): Result<String> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        // Don't hit the cloud for demo sessions
        if (session.uid == DEMO_SESSION.uid) {
            return@withContext Result.success("Demo mode — no sync needed")
        }

        _isSyncing.value = true
        try {
            val url = "$BACKEND_URL/api/mobile/sync?workspaceId=${session.workspaceId}"
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer ${session.token}")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                _isSyncing.value = false
                return@withContext Result.failure(Exception("Sync failed: ${response.code}"))
            }

            val json = JSONObject(response.body?.string() ?: "{}")

            // 0. Extract connected YouTube channel info
            val ytObj = json.optJSONObject("youtubeAccount")
            if (ytObj != null) {
                _youtubeAccount.value = YouTubeAccountInfo(
                    channelId = ytObj.optString("channelId", ""),
                    channelName = ytObj.optString("channelName", ""),
                    channelThumbnail = ytObj.optString("channelThumbnail", ""),
                    connectionStatus = ytObj.optString("connectionStatus", "connected")
                )
            }

            // 1. Streams
            val streamsArr = json.optJSONArray("streams")
            if (streamsArr != null && streamsArr.length() > 0) {
                var hasLive = false
                for (i in 0 until streamsArr.length()) {
                    if (streamsArr.getJSONObject(i).optString("status") == "live") {
                        hasLive = true; break
                    }
                }
                for (i in 0 until streamsArr.length()) {
                    val s = streamsArr.getJSONObject(i)
                    val status = s.optString("status", "ended")
                    dao.insertStream(
                        StreamEntity(
                            id = s.optString("id", UUID.randomUUID().toString()),
                            workspaceId = session.workspaceId,
                            title = s.optString("title", "Live Stream"),
                            channelId = s.optString("channelId", s.optString("youtubeChannelId", "")),
                            channelTitle = s.optString("channelName", s.optString("channelTitle", session.workspaceName)),
                            liveChatId = s.optString("liveChatId").takeIf { it.isNotEmpty() },
                            thumbnailUrl = s.optString("thumbnailUrl").takeIf { it.isNotEmpty() },
                            status = status,
                            isActive = status == "live" || (!hasLive && i == 0),
                            startedAtMs = s.optLong("startedAtMs", System.currentTimeMillis()),
                            endedAtMs = if (status != "live") s.optLong("startedAtMs", 0L) + 7200000L else null
                        )
                    )
                }
            } else {
                // No cloud streams yet — insert a placeholder so HomeScreen isn't empty
                val sid = "stream-${session.workspaceId}"
                if (dao.getStreamById(sid) == null) {
                    dao.insertStream(
                        StreamEntity(
                            id = sid,
                            workspaceId = session.workspaceId,
                            title = "${session.workspaceName} Broadcast",
                            channelId = "",
                            channelTitle = session.workspaceName,
                            liveChatId = null,
                            thumbnailUrl = null,
                            status = "live",
                            isActive = true,
                            startedAtMs = System.currentTimeMillis(),
                            endedAtMs = null
                        )
                    )
                }
            }

            // 2. Clip markers
            val clipsArr = json.optJSONArray("clips")
            if (clipsArr != null) {
                for (i in 0 until clipsArr.length()) {
                    val c = clipsArr.getJSONObject(i)
                    val streamId = c.optString("streamId", "stream-${session.workspaceId}")
                    if (dao.getStreamById(streamId) == null) {
                        dao.insertStream(
                            StreamEntity(
                                id = streamId,
                                workspaceId = session.workspaceId,
                                title = "${session.workspaceName} Stream",
                                channelId = "", channelTitle = session.workspaceName,
                                liveChatId = null, thumbnailUrl = null,
                                status = "live", isActive = true,
                                startedAtMs = System.currentTimeMillis(), endedAtMs = null
                            )
                        )
                    }
                    val rawStatus = c.optString("downloadStatus", "PENDING").uppercase()
                    dao.insertClipMarker(
                        ClipMarkerEntity(
                            id = c.optString("id", UUID.randomUUID().toString()),
                            streamId = streamId,
                            authorName = c.optString("authorName", "Viewer"),
                            authorId = c.optString("authorId", "user"),
                            triggerMessageId = c.optString("chatMessageId", "msg-${UUID.randomUUID()}"),
                            timestampMs = System.currentTimeMillis(),
                            label = c.optString("title", c.optString("note", "Clip Marker")),
                            status = if (rawStatus.contains("COMPLET")) "GENERATED" else "PENDING",
                            localFilePath = null,
                            telegramMessageUrl = null
                        )
                    )
                }
            }

            _isSyncing.value = false
            Result.success("Synced successfully")
        } catch (e: Exception) {
            _isSyncing.value = false
            e.printStackTrace()
            Result.failure(e)
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private fun saveRealSession(session: UserSession) {
        prefs.edit()
            .putBoolean(KEY_SIGNED_OUT, false)
            .putBoolean(KEY_IS_DEMO, false)
            .putString(KEY_UID, session.uid)
            .putString(KEY_EMAIL, session.email)
            .putString(KEY_NAME, session.displayName)
            .putString(KEY_PHOTO, session.photoUrl)
            .putString(KEY_WORKSPACE_ID, session.workspaceId)
            .putString(KEY_WORKSPACE_NAME, session.workspaceName)
            .putString(KEY_ROLE, session.role)
            .putString(KEY_TOKEN, session.token)
            .apply()
    }

    private suspend fun seedDemoDataIfEmpty() = withContext(Dispatchers.IO) {
        try {
            if (dao.getStreamById("demo-stream-001") != null) return@withContext
            dao.insertStream(
                StreamEntity(
                    id = "demo-stream-001",
                    workspaceId = "demo-workspace",
                    title = "Demo Live Broadcast",
                    channelId = "demo-channel",
                    channelTitle = "Demo Studio",
                    liveChatId = "demo-chat",
                    thumbnailUrl = null,
                    status = "live",
                    isActive = true,
                    startedAtMs = System.currentTimeMillis() - 2700000L,
                    endedAtMs = null
                )
            )
            dao.insertClipMarker(
                ClipMarkerEntity(
                    id = "demo-clip-001",
                    streamId = "demo-stream-001",
                    authorName = "DemoViewer",
                    authorId = "demo-user",
                    triggerMessageId = "demo-msg-001",
                    timestampMs = System.currentTimeMillis() - 600000L,
                    label = "Incredible moment !clip",
                    status = "GENERATED",
                    localFilePath = null,
                    telegramMessageUrl = null
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
