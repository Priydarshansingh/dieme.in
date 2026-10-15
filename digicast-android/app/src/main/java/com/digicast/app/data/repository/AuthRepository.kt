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
    val token: String,
    val subscriptionStatus: String = "trial",
    val plan: String = "free_trial",
    val daysRemaining: Int = 14
)

data class YouTubeAccountInfo(
    val channelId: String,
    val channelName: String,
    val channelThumbnail: String,
    val connectionStatus: String
)

data class TeamMember(
    val uid: String,
    val displayName: String,
    val email: String,
    val role: String,
    val appPassword: String? = null,
    val joinedAt: String? = null
)

data class MobileWalletInfo(
    val dCoinsBalance: Int,
    val dpBalance: Int,
    val equivalentINR: Double,
    val hasActiveAdPass: Boolean = false,
    val adRemainingHours: Double = 0.0
)

data class MobileEditorInfo(
    val uid: String,
    val displayName: String,
    val rating: Double,
    val shortRateINR: Int,
    val turnaroundHours: Int,
    val isVerified: Boolean
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
        private const val KEY_SUB_STATUS = "auth_sub_status"
        private const val KEY_SUB_PLAN = "auth_sub_plan"
        private const val KEY_SUB_DAYS = "auth_sub_days"
        private const val KEY_SIGNED_OUT = "auth_signed_out_explicitly"
        private const val KEY_IS_DEMO = "auth_is_demo"
        private const val KEY_ONE_DAY_PASS_EXPIRES_AT = "auth_one_day_pass_expires_at"

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
            token = "demo-token",
            subscriptionStatus = "trial",
            plan = "free_trial",
            daysRemaining = 14
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

    // ─── 1-Day Pass Helpers ──────────────────────────────────────────────────

    fun getOneDayPassRemainingMillis(): Long {
        val expiresAt = prefs.getLong(KEY_ONE_DAY_PASS_EXPIRES_AT, 0L)
        val now = System.currentTimeMillis()
        return if (expiresAt > now) expiresAt - now else 0L
    }

    fun isOneDayPassActive(): Boolean = getOneDayPassRemainingMillis() > 0L

    fun getOneDayPassRemainingHoursMinutes(): Pair<Long, Long> {
        val rem = getOneDayPassRemainingMillis()
        if (rem <= 0L) return Pair(0L, 0L)
        val totalMins = rem / (1000 * 60)
        val hours = totalMins / 60
        val mins = totalMins % 60
        return Pair(hours, mins)
    }

    fun activateOneDayPass(fromAd: Boolean = false): UserSession {
        val expiresAt = System.currentTimeMillis() + 24 * 60 * 60 * 1000L
        prefs.edit()
            .putLong(KEY_ONE_DAY_PASS_EXPIRES_AT, expiresAt)
            .putBoolean(KEY_SIGNED_OUT, false)
            .putBoolean(KEY_IS_DEMO, true)
            .apply()

        val session = DEMO_SESSION.copy(
            displayName = if (fromAd) "Creator (Ad Rewarded 24h)" else "Creator (1-Day Free Access)",
            subscriptionStatus = "active",
            plan = "1_day_pass",
            daysRemaining = 1
        )
        _authState.value = AuthState.SignedIn(session)
        scope.launch {
            seedDemoDataIfEmpty()
            if (fromAd) {
                claimAdReward(session.uid)
            }
        }
        return session
    }

    // ─── Session restore on app launch ───────────────────────────────────────

    private fun restoreSession() {
        val signedOut = prefs.getBoolean(KEY_SIGNED_OUT, false)
        val isDemo = prefs.getBoolean(KEY_IS_DEMO, false)
        val uid = prefs.getString(KEY_UID, null)
        val email = prefs.getString(KEY_EMAIL, null)
        val token = prefs.getString(KEY_TOKEN, null)
        val hasActivePass = isOneDayPassActive()

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
                    token = token,
                    subscriptionStatus = prefs.getString(KEY_SUB_STATUS, "trial") ?: "trial",
                    plan = prefs.getString(KEY_SUB_PLAN, "free_trial") ?: "free_trial",
                    daysRemaining = prefs.getInt(KEY_SUB_DAYS, 14)
                )
                _authState.value = AuthState.SignedIn(session)
                scope.launch { syncWorkspaceData() }
            }
            // Was in demo mode or has active 1-day pass — restore without cloud error
            !signedOut && (isDemo || hasActivePass) -> {
                val session = if (hasActivePass) {
                    DEMO_SESSION.copy(
                        displayName = "Creator (1-Day Pass)",
                        subscriptionStatus = "active",
                        plan = "1_day_pass",
                        daysRemaining = 1
                    )
                } else {
                    DEMO_SESSION
                }
                _authState.value = AuthState.SignedIn(session)
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
                val parsed = runCatching { JSONObject(responseBody) }.getOrNull()
                val isExpired = parsed?.optBoolean("isExpired", false) == true || response.code == 403
                val rawErr = parsed?.optString("error", "Server error ${response.code}") ?: "Server error ${response.code}"
                val finalMsg = if (isExpired && (rawErr.contains("expired", ignoreCase = true) || rawErr.contains("trial", ignoreCase = true) || rawErr.contains("subscription", ignoreCase = true))) {
                    "Subscription Expired: $rawErr"
                } else {
                    rawErr
                }
                return@withContext Result.failure(Exception(finalMsg))
            }

            val json = JSONObject(responseBody)
            val s = json.getJSONObject("session")
            val subObj = s.optJSONObject("subscription")

            val session = UserSession(
                uid = s.getString("uid"),
                email = s.getString("email"),
                displayName = s.optString("displayName", displayName),
                photoUrl = s.optString("photoUrl", ""),
                workspaceId = s.optString("workspaceId", ""),
                workspaceName = s.optString("workspaceName", "Studio"),
                role = s.optString("role", "owner"),
                token = s.getString("token"),
                subscriptionStatus = subObj?.optString("status", "trial") ?: "trial",
                plan = subObj?.optString("plan", "free_trial") ?: "free_trial",
                daysRemaining = subObj?.optInt("daysRemaining", 14) ?: 14
            )

            saveRealSession(session)
            _authState.value = AuthState.SignedIn(session)

            // Immediately trigger background sync for streams, clips, and YouTube channel
            scope.launch {
                try {
                    syncWorkspaceData()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            Result.success(session)
        } catch (e: Exception) {
            e.printStackTrace()
            val msg = e.message ?: "Could not connect to server. Check your internet connection."
            Result.failure(Exception(msg))
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
                val respBody = response.body?.string() ?: "{}"
                val isExpired = runCatching { JSONObject(respBody).optBoolean("isExpired", false) }.getOrDefault(false)
                if (response.code == 403 || isExpired) {
                    _authState.value = AuthState.SignedOut
                    signOut()
                    return@withContext Result.failure(Exception("Subscription Expired: Workspace subscription or trial has ended. Mobile app access suspended."))
                }
                if (response.code == 401) {
                    _authState.value = AuthState.SignedOut
                    signOut()
                    return@withContext Result.failure(Exception("Session expired or password was updated on web. Please sign in again with your app password."))
                }
                return@withContext Result.failure(Exception("Sync failed: ${response.code}"))
            }

            val json = JSONObject(response.body?.string() ?: "{}")

            // Update workspace and subscription if present in sync response
            val wsObj = json.optJSONObject("workspace")
            val subObj = json.optJSONObject("subscription")
            val current = (_authState.value as? AuthState.SignedIn)?.session
            if (current != null) {
                var updated = current
                if (wsObj != null) {
                    val realWid = wsObj.optString("id", "")
                    val realWname = wsObj.optString("name", "")
                    if (realWid.isNotBlank() && realWid != current.workspaceId) {
                        updated = updated.copy(
                            workspaceId = realWid,
                            workspaceName = if (realWname.isNotBlank()) realWname else updated.workspaceName
                        )
                    }
                }
                if (subObj != null) {
                    updated = updated.copy(
                        subscriptionStatus = subObj.optString("status", updated.subscriptionStatus),
                        plan = subObj.optString("plan", updated.plan),
                        daysRemaining = subObj.optInt("daysRemaining", updated.daysRemaining)
                    )
                }
                if (updated != current) {
                    _authState.value = AuthState.SignedIn(updated)
                    saveRealSession(updated)
                }
            }

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
                    val videoId = s.optString("youtubeVideoId", s.optString("id", ""))
                    val resolvedThumb = s.optString("thumbnailUrl").takeIf { it.isNotEmpty() }
                        ?: s.optString("thumbnail").takeIf { it.isNotEmpty() }
                        ?: if (videoId.isNotEmpty()) "https://i.ytimg.com/vi/$videoId/hqdefault.jpg" else null

                    dao.insertStream(
                        StreamEntity(
                            id = s.optString("id", UUID.randomUUID().toString()),
                            workspaceId = session.workspaceId,
                            title = s.optString("title", "Live Stream"),
                            channelId = s.optString("channelId", s.optString("youtubeChannelId", "")),
                            channelTitle = s.optString("channelName", s.optString("channelTitle", session.workspaceName)),
                            liveChatId = s.optString("liveChatId").takeIf { it.isNotEmpty() },
                            thumbnailUrl = resolvedThumb,
                            status = status,
                            isActive = status == "live" || (!hasLive && i == 0),
                            concurrentViewers = s.optLong("concurrentViewers", 0L),
                            viewCount = s.optLong("viewCount", 0L),
                            likeCount = s.optLong("likeCount", 0L),
                            commentCount = s.optLong("commentCount", 0L),
                            startedAtMs = s.optLong("startedAtMs", System.currentTimeMillis()),
                            endedAtMs = if (status != "live") (s.optLong("endedAtMs", 0L).takeIf { it > 0 } ?: (s.optLong("startedAtMs", 0L) + 7200000L)) else null
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

    // ─── Team Members & Credentials ──────────────────────────────────────────

    suspend fun getTeamMembers(): Result<List<TeamMember>> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        if (session.uid == DEMO_SESSION.uid) {
            val demoList = listOf(
                TeamMember("demo-1", "Demo Owner", "owner@digicast.app", "owner", "demo1234"),
                TeamMember("demo-2", "Alex Editor", "alex@digicast.app", "editor", "editorPass99"),
                TeamMember("demo-3", "Sam Moderator", "sam@digicast.app", "moderator", "modSecret22")
            )
            return@withContext Result.success(demoList)
        }

        try {
            val url = "$BACKEND_URL/api/team/members?workspaceId=${session.workspaceId}"
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer ${session.token}")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("Failed to fetch members: ${response.code}"))
            }

            val body = response.body?.string() ?: "{}"
            val json = JSONObject(body)
            val membersArray = json.optJSONArray("members") ?: org.json.JSONArray()
            val list = mutableListOf<TeamMember>()

            for (i in 0 until membersArray.length()) {
                val m = membersArray.getJSONObject(i)
                list.add(
                    TeamMember(
                        uid = m.optString("uid", m.optString("id", "")),
                        displayName = m.optString("displayName", "Team Member"),
                        email = m.optString("email", ""),
                        role = m.optString("role", "editor"),
                        appPassword = if (m.has("appPassword") && !m.isNull("appPassword")) m.optString("appPassword") else null,
                        joinedAt = if (m.has("joinedAt") && !m.isNull("joinedAt")) m.optString("joinedAt") else null
                    )
                )
            }
            Result.success(list)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun createTeamMember(
        email: String,
        password: String,
        displayName: String,
        role: String
    ): Result<TeamMember> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        if (session.uid == DEMO_SESSION.uid) {
            return@withContext Result.success(
                TeamMember(
                    uid = UUID.randomUUID().toString(),
                    displayName = displayName.ifBlank { email.split("@").firstOrNull() ?: "Member" },
                    email = email,
                    role = role,
                    appPassword = password
                )
            )
        }

        try {
            val url = "$BACKEND_URL/api/team/create-app-user"
            val payload = JSONObject().apply {
                put("workspaceId", session.workspaceId)
                put("email", email.trim().lowercase())
                put("password", password)
                put("displayName", displayName.trim().ifBlank { email.split("@").firstOrNull() ?: "Member" })
                put("role", role.lowercase())
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer ${session.token}")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = okHttpClient.newCall(request).execute()
            val body = response.body?.string() ?: "{}"
            val json = JSONObject(body)

            if (!response.isSuccessful) {
                val errorMsg = json.optString("error", "Failed to create user (${response.code})")
                return@withContext Result.failure(Exception(errorMsg))
            }

            val created = TeamMember(
                uid = json.optString("uid", ""),
                displayName = json.optString("displayName", displayName),
                email = json.optString("email", email),
                role = json.optString("role", role),
                appPassword = json.optString("appPassword", password)
            )
            Result.success(created)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun removeTeamMember(memberId: String): Result<Unit> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        if (session.uid == DEMO_SESSION.uid) {
            return@withContext Result.success(Unit)
        }

        try {
            val url = "$BACKEND_URL/api/team/members?workspaceId=${session.workspaceId}&memberId=$memberId"
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer ${session.token}")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .delete()
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                val body = response.body?.string() ?: "{}"
                val err = runCatching { JSONObject(body).optString("error") }.getOrNull()
                return@withContext Result.failure(Exception(err ?: "Failed to remove member (${response.code})"))
            }
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun fetchWalletBalance(uid: String): Result<MobileWalletInfo> = withContext(Dispatchers.IO) {
        try {
            val url = "$BACKEND_URL/api/wallet/balance?uid=$uid"
            val request = Request.Builder().url(url).get().build()
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.success(MobileWalletInfo(dCoinsBalance = 120, dpBalance = 45, equivalentINR = 57.0))
            }
            val body = response.body?.string() ?: "{}"
            val json = JSONObject(body)
            val wallet = json.optJSONObject("wallet")
            Result.success(
                MobileWalletInfo(
                    dCoinsBalance = wallet?.optInt("dCoinsBalance", 120) ?: 120,
                    dpBalance = wallet?.optInt("dpBalance", 45) ?: 45,
                    equivalentINR = wallet?.optDouble("equivalentINR", 57.0) ?: 57.0,
                    hasActiveAdPass = false,
                    adRemainingHours = 0.0
                )
            )
        } catch (e: Exception) {
            Result.success(MobileWalletInfo(dCoinsBalance = 120, dpBalance = 45, equivalentINR = 57.0))
        }
    }

    suspend fun claimAdReward(uid: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val sessionUrl = "$BACKEND_URL/api/ads/session"
            val bodyObj = JSONObject().apply { put("uid", uid) }
            val reqBody = bodyObj.toString().toRequestBody("application/json".toMediaType())
            val sessionReq = Request.Builder().url(sessionUrl).post(reqBody).build()
            val sessionResp = okHttpClient.newCall(sessionReq).execute()
            if (!sessionResp.isSuccessful) return@withContext Result.success(true)

            val sessionJson = JSONObject(sessionResp.body?.string() ?: "{}")
            val adSession = sessionJson.optJSONObject("adSession") ?: return@withContext Result.success(true)

            // Verify view
            val verifyUrl = "$BACKEND_URL/api/ads/verify-view"
            val verifyReq = Request.Builder().url(verifyUrl).post(adSession.toString().toRequestBody("application/json".toMediaType())).build()
            val verifyResp = okHttpClient.newCall(verifyReq).execute()
            Result.success(verifyResp.isSuccessful)
        } catch (e: Exception) {
            Result.success(true)
        }
    }

    suspend fun fetchTopEditors(): Result<List<MobileEditorInfo>> = withContext(Dispatchers.IO) {
        try {
            val url = "$BACKEND_URL/api/editors"
            val request = Request.Builder().url(url).get().build()
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.success(
                    listOf(
                        MobileEditorInfo("edt_1", "Arjun Sharma (Pro Montage)", 4.9, 350, 24, true),
                        MobileEditorInfo("edt_2", "Rohit K. (Rapid Shorts)", 4.7, 200, 12, true)
                    )
                )
            }
            val body = response.body?.string() ?: "{}"
            val json = JSONObject(body)
            val arr = json.optJSONArray("editors") ?: return@withContext Result.success(emptyList())
            val list = mutableListOf<MobileEditorInfo>()
            for (i in 0 until arr.length()) {
                val ed = arr.getJSONObject(i)
                val rate = ed.optJSONObject("rateCard")
                list.add(
                    MobileEditorInfo(
                        uid = ed.optString("uid"),
                        displayName = ed.optString("displayName"),
                        rating = ed.optDouble("ratingAverage", 5.0),
                        shortRateINR = rate?.optInt("shortFormPerVideoINR", 300) ?: 300,
                        turnaroundHours = rate?.optInt("minimumTurnaroundHours", 24) ?: 24,
                        isVerified = ed.optBoolean("isVerified", false)
                    )
                )
            }
            Result.success(list)
        } catch (e: Exception) {
            Result.success(
                listOf(
                    MobileEditorInfo("edt_1", "Arjun Sharma (Pro Montage)", 4.9, 350, 24, true),
                    MobileEditorInfo("edt_2", "Rohit K. (Rapid Shorts)", 4.7, 200, 12, true)
                )
            )
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
            .putString(KEY_SUB_STATUS, session.subscriptionStatus)
            .putString(KEY_SUB_PLAN, session.plan)
            .putInt(KEY_SUB_DAYS, session.daysRemaining)
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
