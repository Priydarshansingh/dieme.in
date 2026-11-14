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
import com.digicast.app.data.ads.AdMobManager
import com.digicast.app.data.local.DeviceSecureStorage

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

data class GamerAvatarDto(
    val id: String,
    val name: String,
    val series: String,
    val badge: String,
    val color: String,
    val url: String,
    val description: String,
    val isDefault: Boolean = false
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
        private const val KEY_SAVED_LOGIN_EMAIL = "auth_saved_login_email"
        private const val KEY_SAVED_LOGIN_PASSWORD = "auth_saved_login_password"
        private const val KEY_HAS_WATCHED_AD = "auth_has_watched_ad"

        // All API calls go to Dieme production backend
        const val BACKEND_URL = "https://www.dieme.in"

        // Default creator session — used when user explores studio without sign-in
        val DEMO_SESSION = UserSession(
            uid = "demo-uid",
            email = "creator@digicast.app",
            displayName = "HellxShakti Studio",
            photoUrl = "",
            workspaceId = "ws-hellxshakti",
            workspaceName = "HellxShakti Studio",
            role = "owner",
            token = "creator-token",
            subscriptionStatus = "active",
            plan = "pro_creator",
            daysRemaining = 30
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

    // Isolated in-memory member list for demo session (never mixes foreign accounts)
    private val demoMembers = mutableListOf<TeamMember>()

    init {
        restoreSession()
        scope.launch {
            try {
                val cloudVault = DeviceSecureStorage.fetchVaultFromCloud(context)
                if (cloudVault != null) {
                    val cloudEmail = cloudVault.optString("email", "")
                    if (cloudEmail.isNotBlank() && prefs.getString(KEY_SAVED_LOGIN_EMAIL, "").isNullOrBlank()) {
                        prefs.edit().putString(KEY_SAVED_LOGIN_EMAIL, cloudEmail).apply()
                    }
                    val isUnlocked = cloudVault.optBoolean("hasActiveAdUnlock", false)
                    val unlockExpiresAtMs = cloudVault.optLong("unlockExpiresAtMs", 0L)
                    if (isUnlocked && unlockExpiresAtMs > System.currentTimeMillis()) {
                        prefs.edit()
                            .putBoolean(KEY_HAS_WATCHED_AD, true)
                            .putLong(KEY_ONE_DAY_PASS_EXPIRES_AT, unlockExpiresAtMs)
                            .apply()
                    }
                }
            } catch (e: Exception) {
                // Ignore background sync error
            }
        }
    }

    fun getSavedCredentials(): Pair<String, String> {
        var savedEmail = prefs.getString(KEY_SAVED_LOGIN_EMAIL, "") ?: ""
        var savedPassword = prefs.getString(KEY_SAVED_LOGIN_PASSWORD, "") ?: ""

        // If app was reinstalled, recover from hidden device secure vault
        if (savedEmail.isBlank()) {
            val vault = DeviceSecureStorage.readVaultData(context)
            if (vault != null) {
                savedEmail = vault.optString("email", "")
                if (savedEmail.isNotBlank()) {
                    prefs.edit().putString(KEY_SAVED_LOGIN_EMAIL, savedEmail).apply()
                }
            }
        }
        return Pair(savedEmail, savedPassword)
    }

    fun hasWatchedAdToUnlock(): Boolean {
        if (prefs.getBoolean(KEY_HAS_WATCHED_AD, false) && isOneDayPassActive()) return true
        val vault = DeviceSecureStorage.readVaultData(context)
        val vaultUnlock = vault?.optBoolean("hasActiveAdUnlock", false) ?: false
        val vaultExpiry = vault?.optLong("unlockExpiresAtMs", 0L) ?: 0L
        return vaultUnlock && vaultExpiry > System.currentTimeMillis()
    }

    fun markAdWatchedUnlocked() {
        val expiresAt = System.currentTimeMillis() + 24 * 60 * 60 * 1000L
        prefs.edit()
            .putBoolean(KEY_HAS_WATCHED_AD, true)
            .putLong(KEY_ONE_DAY_PASS_EXPIRES_AT, expiresAt)
            .apply()

        val lastEmail = prefs.getString(KEY_SAVED_LOGIN_EMAIL, "")
        val lastUid = prefs.getString(KEY_UID, "")
        val lastWid = prefs.getString(KEY_WORKSPACE_ID, "")
        val lastToken = prefs.getString(KEY_TOKEN, "")

        DeviceSecureStorage.saveVaultData(
            context = context,
            email = lastEmail,
            uid = lastUid,
            workspaceId = lastWid,
            token = lastToken,
            hasActiveAdUnlock = true,
            unlockExpiresAtMs = expiresAt
        )

        scope.launch {
            DeviceSecureStorage.syncVaultToCloud(
                context = context,
                email = lastEmail,
                uid = lastUid,
                workspaceId = lastWid,
                hasActiveAdUnlock = true,
                unlockExpiresAtMs = expiresAt
            )
        }
    }

    fun saveCredentials(email: String, pass: String) {
        prefs.edit()
            .putString(KEY_SAVED_LOGIN_EMAIL, email)
            .putString(KEY_SAVED_LOGIN_PASSWORD, pass)
            .apply()

        val uid = prefs.getString(KEY_UID, "")
        val wid = prefs.getString(KEY_WORKSPACE_ID, "")
        val token = prefs.getString(KEY_TOKEN, "")
        val isPassActive = isOneDayPassActive()
        val expiresAt = prefs.getLong(KEY_ONE_DAY_PASS_EXPIRES_AT, 0L)

        // Also persist securely to device vault so survives reinstallation
        DeviceSecureStorage.saveVaultData(
            context = context,
            email = email,
            uid = uid,
            workspaceId = wid,
            token = token,
            hasActiveAdUnlock = isPassActive,
            unlockExpiresAtMs = expiresAt
        )

        scope.launch {
            DeviceSecureStorage.syncVaultToCloud(
                context = context,
                email = email,
                uid = uid,
                workspaceId = wid,
                hasActiveAdUnlock = isPassActive,
                unlockExpiresAtMs = expiresAt
            )
        }
    }

    fun isPremiumUser(session: UserSession? = (_authState.value as? AuthState.SignedIn)?.session): Boolean {
        if (session == null) return false
        val status = session.subscriptionStatus.lowercase()
        val plan = session.plan.lowercase()
        val isPaidActive = (status == "active" || status == "trial") &&
                (plan != "1_day_pass") &&
                (session.daysRemaining > 0)
        return isPaidActive
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

    fun activateOneDayPass(fromAd: Boolean = false): UserSession? {
        val expiresAt = System.currentTimeMillis() + 24 * 60 * 60 * 1000L
        prefs.edit()
            .putLong(KEY_ONE_DAY_PASS_EXPIRES_AT, expiresAt)
            .putBoolean(KEY_HAS_WATCHED_AD, true)
            .apply()

        // 1. Check if user already has an active signed-in account
        val currentSession = (_authState.value as? AuthState.SignedIn)?.session

        // 2. Or check if there is a saved real account from device/prefs
        val savedEmail = prefs.getString(KEY_SAVED_LOGIN_EMAIL, "") ?: ""
        val savedUid = prefs.getString(KEY_UID, "") ?: ""
        val savedWid = prefs.getString(KEY_WORKSPACE_ID, "") ?: ""
        val savedToken = prefs.getString(KEY_TOKEN, "") ?: ""

        val session: UserSession? = if (currentSession != null && currentSession.uid != "demo-uid") {
            currentSession.copy(
                subscriptionStatus = "active",
                plan = "1_day_pass",
                daysRemaining = 1
            )
        } else if (savedEmail.isNotBlank() && savedUid.isNotBlank() && savedUid != "demo-uid") {
            // Restore the user's real registered studio account and apply the 24h pass directly
            prefs.edit().putBoolean(KEY_IS_DEMO, false).apply()
            UserSession(
                uid = savedUid,
                email = savedEmail,
                displayName = prefs.getString(KEY_NAME, savedEmail.substringBefore("@")) ?: "Creator",
                photoUrl = prefs.getString(KEY_PHOTO, "") ?: "",
                workspaceId = savedWid,
                workspaceName = prefs.getString(KEY_WORKSPACE_NAME, "Studio") ?: "Studio",
                role = prefs.getString(KEY_ROLE, "owner") ?: "owner",
                token = savedToken,
                subscriptionStatus = "active",
                plan = "1_day_pass",
                daysRemaining = 1
            )
        } else {
            // User does not have a registered account yet.
            // Do NOT sign into demo account! Persist unlock state on device and cloud vault.
            null
        }

        val targetEmail = session?.email ?: savedEmail
        val targetUid = session?.uid ?: savedUid
        val targetWid = session?.workspaceId ?: savedWid

        // Persist pass to device secure vault and sync to cloud
        DeviceSecureStorage.saveVaultData(
            context = context,
            email = targetEmail,
            uid = targetUid,
            workspaceId = targetWid,
            token = session?.token ?: savedToken,
            hasActiveAdUnlock = true,
            unlockExpiresAtMs = expiresAt
        )

        scope.launch {
            DeviceSecureStorage.syncVaultToCloud(
                context = context,
                email = targetEmail,
                uid = targetUid,
                workspaceId = targetWid,
                hasActiveAdUnlock = true,
                unlockExpiresAtMs = expiresAt
            )
        }

        if (session != null) {
            prefs.edit().putBoolean(KEY_SIGNED_OUT, false).apply()
            _authState.value = AuthState.SignedIn(session)
            scope.launch {
                syncWorkspaceData()
                if (fromAd) {
                    claimAdReward(session.uid)
                }
            }
        }
        return session
    }

    /**
     * Checks if a user (Streamer or Editor) requires 24h pass unlock.
     * Rule: Free 14-day trial for any new account.
     * After 14 days, free users without an active paid subscription must unlock 24h access once per 24 hours.
     */
    fun checkUserNeeds24hUnlock(session: UserSession): Boolean {
        // Paid active subscriptions (VIP intro_29, starter, pro, studio) have unrestricted continuous access
        val isPaidActive = (session.subscriptionStatus == "active") &&
                (session.plan != "free_trial") &&
                (session.plan != "1_day_pass") &&
                (session.daysRemaining > 0)
        if (isPaidActive) return false

        // Within 14-day free trial period: unrestricted access
        val isWithin14DayTrial = (session.subscriptionStatus == "trial" || session.plan == "free_trial") &&
                (session.daysRemaining > 0)
        if (isWithin14DayTrial) return false

        // User is free/expired: check if their 24-hour pass is currently active
        return !isOneDayPassActive()
    }

    /**
     * Deducts 50 D-Coins to unlock 24-hour studio access
     */
    suspend fun unlock24hPassWithDCoins(uid: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("uid", uid)
                put("itemType", "PASS_24H_UNLOCK")
                put("currency", "D_COIN")
                put("amount", 50)
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("$BACKEND_URL/api/wallet/spend")
                .post(body)
                .build()

            val response = okHttpClient.newCall(request).execute()
            activateOneDayPass(fromAd = false)
            Result.success(true)
        } catch (e: Exception) {
            // Offline/fallback: still activate pass so creator can work
            activateOneDayPass(fromAd = false)
            Result.success(true)
        }
    }

    /**
     * Submits UPI payment reference (UTR) directly from mobile app
     */
    suspend fun submitUpiPayment(
        workspaceId: String,
        planId: String,
        amountINR: Int,
        utrNumber: String,
        userEmail: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("workspaceId", workspaceId)
                put("planId", planId)
                put("amountINR", amountINR)
                put("utrNumber", utrNumber)
                put("userEmail", userEmail)
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("$BACKEND_URL/api/payments/submit")
                .post(body)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (response.isSuccessful) {
                // Instantly grant grace access while backend / gateway verifies
                activateOneDayPass(fromAd = false)
                Result.success(true)
            } else {
                val errBody = response.body?.string() ?: ""
                Result.failure(Exception("Submission response: ${response.code} $errBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Initializes a tracked payment session on the self-hosted UPI Gateway via digicast-web.
     * Connects orderId, dynamic QR and UPI intent for instant banking SMS/Observer auto-detection.
     */
    suspend fun createPaymentSession(
        workspaceId: String,
        planId: String,
        email: String
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val session = (_authState.value as? AuthState.SignedIn)?.session
            val body = JSONObject().apply {
                put("workspaceId", workspaceId)
                put("planId", planId)
                put("clientEmail", email)
            }.toString().toRequestBody("application/json".toMediaType())

            val reqBuilder = Request.Builder()
                .url("$BACKEND_URL/api/payments/session")
                .post(body)

            if (session?.token != null) {
                reqBuilder.addHeader("Authorization", "Bearer ${session.token}")
            }

            val response = okHttpClient.newCall(reqBuilder.build()).execute()
            val raw = response.body?.string() ?: "{}"
            if (response.isSuccessful) {
                Result.success(JSONObject(raw))
            } else {
                Result.failure(Exception("Gateway session error: ${response.code} $raw"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Instantly checks whether amount was received by the UPI Gateway or SMS observer
     */
    suspend fun checkUpiPaymentStatus(
        workspaceId: String,
        paymentId: String? = null,
        orderId: String? = null,
        utrNumber: String? = null
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val urlBuilder = StringBuilder("$BACKEND_URL/api/payments/check?workspaceId=$workspaceId")
            if (!paymentId.isNullOrBlank()) {
                urlBuilder.append("&paymentId=$paymentId")
            }
            if (!orderId.isNullOrBlank()) {
                urlBuilder.append("&orderId=$orderId")
            }
            if (!utrNumber.isNullOrBlank()) {
                urlBuilder.append("&utrNumber=$utrNumber")
            }

            val request = Request.Builder()
                .url(urlBuilder.toString())
                .get()
                .build()

            val response = okHttpClient.newCall(request).execute()
            val raw = response.body?.string() ?: "{}"
            val json = JSONObject(raw)

            if (json.optBoolean("isPaid", false) || json.optString("status") == "approved") {
                activateOneDayPass(fromAd = false)
            }

            Result.success(json)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ─── Session restore on app launch ───────────────────────────────────────

    private fun restoreSession() {
        val signedOut = prefs.getBoolean(KEY_SIGNED_OUT, false)
        val isDemo = prefs.getBoolean(KEY_IS_DEMO, false)
        var uid = prefs.getString(KEY_UID, null)
        var email = prefs.getString(KEY_EMAIL, null)
        var token = prefs.getString(KEY_TOKEN, null)
        val hasActivePass = isOneDayPassActive()

        // If app was reinstalled or prefs cleared, check device vault
        if (uid == null || token == null) {
            val vault = DeviceSecureStorage.readVaultData(context)
            if (vault != null) {
                val vUid = vault.optString("uid", "")
                val vToken = vault.optString("token", "")
                val vEmail = vault.optString("email", "")
                if (vUid.isNotBlank() && vToken.isNotBlank()) {
                    uid = vUid
                    token = vToken
                    email = vEmail
                }
            }
        }

        when {
            // Previously signed in with a real account — restore and background-sync
            // A real token always takes precedence over any stale demo flag
            !signedOut && uid != null && email != null && token != null && uid != "demo-uid" -> {
                // Clear stale demo flag if real session is present
                if (isDemo) prefs.edit().putBoolean(KEY_IS_DEMO, false).apply()
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
            // Clear any stale demo flag so real sign-in always wins
            prefs.edit().putBoolean(KEY_IS_DEMO, false).apply()

            val cleanEmail = email.replace("\\s+".toRegex(), "").trim().lowercase()
            val cleanPassword = password.trim()
            val displayName = cleanEmail.substringBefore("@")
            val body = JSONObject().apply {
                put("email", cleanEmail)
                put("password", cleanPassword)
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

            val hasActiveAdPass = hasWatchedAdToUnlock() || isOneDayPassActive()
            val rawStatus = subObj?.optString("status", "trial") ?: "trial"
            val rawPlan = subObj?.optString("plan", "free_trial") ?: "free_trial"
            val rawDays = subObj?.optInt("daysRemaining", 14) ?: 14

            val finalSubStatus = if (hasActiveAdPass && rawStatus != "active") "active" else rawStatus
            val finalPlan = if (hasActiveAdPass && rawPlan != "pro" && rawPlan != "studio") "1_day_pass" else rawPlan
            val finalDays = if (hasActiveAdPass && rawDays <= 0) 1 else rawDays

            val session = UserSession(
                uid = s.getString("uid"),
                email = s.getString("email"),
                displayName = s.optString("displayName", displayName),
                photoUrl = s.optString("photoUrl", ""),
                workspaceId = s.optString("workspaceId", ""),
                workspaceName = s.optString("workspaceName", "Studio"),
                role = s.optString("role", "owner"),
                token = s.getString("token"),
                subscriptionStatus = finalSubStatus,
                plan = finalPlan,
                daysRemaining = finalDays
            )

            saveRealSession(session)
            saveCredentials(email, password)
            _authState.value = AuthState.SignedIn(session)

            // Immediately clear any old workspace data and trigger background sync
            scope.launch {
                try {
                    dao.clearDemoStreams()
                    dao.clearDemoClips()
                    dao.clearDummyChatMessages()
                    dao.clearStreamsExceptWorkspace(session.workspaceId)
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
        scope.launch(Dispatchers.IO) {
            try {
                dao.clearAllStreams()
                dao.clearAllClips()
                dao.clearAllChatMessages()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
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

            var response = okHttpClient.newCall(request).execute()
            if (response.code == 401) {
                // Attempt automatic re-authentication if token has expired
                val (savedEmail, savedPassword) = getSavedCredentials()
                if (savedEmail.isNotBlank() && savedPassword.isNotBlank()) {
                    val loginRes = signInWithEmail(savedEmail, savedPassword)
                    if (loginRes.isSuccess) {
                        val refreshedSession = (_authState.value as? AuthState.SignedIn)?.session
                        if (refreshedSession != null) {
                            val retryReq = Request.Builder()
                                .url(url)
                                .addHeader("Authorization", "Bearer ${refreshedSession.token}")
                                .addHeader("x-user-uid", refreshedSession.uid)
                                .addHeader("x-user-email", refreshedSession.email)
                                .build()
                            response = okHttpClient.newCall(retryReq).execute()
                        }
                    }
                }
            }

            if (!response.isSuccessful) {
                _isSyncing.value = false
                val respBody = response.body?.string() ?: "{}"
                val isExpired = runCatching { JSONObject(respBody).optBoolean("isExpired", false) }.getOrDefault(false)
                
                // Never log out active premium / paid users due to temporary API or 403 response
                val isPremium = isPremiumUser(session)

                if ((response.code == 403 || isExpired) && !isPremium) {
                    _authState.value = AuthState.SignedOut
                    signOut()
                    return@withContext Result.failure(Exception("Subscription Expired: Workspace subscription or trial has ended. Mobile app access suspended."))
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
                val userObj = json.optJSONObject("user")
                if (userObj != null) {
                    val cloudPhoto = userObj.optString("photoUrl", "").ifBlank { userObj.optString("photoURL", "") }
                    if (cloudPhoto.isNotBlank() && cloudPhoto != updated.photoUrl) {
                        updated = updated.copy(photoUrl = cloudPhoto)
                        prefs.edit().putString(KEY_PHOTO, cloudPhoto).apply()
                    }
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
            } else {
                _youtubeAccount.value = null
            }

            // Cleanly isolate local database from foreign workspace records
            dao.clearStreamsExceptWorkspace(session.workspaceId)

            val isDemo = session.uid == DEMO_SESSION.uid || prefs.getBoolean(KEY_IS_DEMO, false)

            // 1. Streams
            val streamsArr = json.optJSONArray("streams")
            if (streamsArr != null && streamsArr.length() > 0) {
                val incomingStreamIds = mutableSetOf<String>()
                var hasLive = false
                for (i in 0 until streamsArr.length()) {
                    if (streamsArr.getJSONObject(i).optString("status") == "live") {
                        hasLive = true; break
                    }
                }
                for (i in 0 until streamsArr.length()) {
                    val s = streamsArr.getJSONObject(i)
                    val streamId = s.optString("id", UUID.randomUUID().toString())
                    incomingStreamIds.add(streamId)
                    val status = s.optString("status", "ended")
                    val videoId = s.optString("youtubeVideoId", streamId)
                    val resolvedThumb = s.optString("thumbnailUrl").takeIf { it.isNotEmpty() }
                        ?: s.optString("thumbnail").takeIf { it.isNotEmpty() }
                        ?: if (videoId.isNotEmpty()) "https://i.ytimg.com/vi/$videoId/hqdefault.jpg" else null

                    dao.insertStream(
                        StreamEntity(
                            id = streamId,
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

                // Delete any local streams for this workspace that are no longer in the cloud list
                val existingLocal = dao.getStreamsForWorkspaceSnapshot(session.workspaceId)
                existingLocal.forEach { local ->
                    if (local.id !in incomingStreamIds) {
                        dao.deleteStream(local.id)
                    }
                }
            } else {
                // Workspace has 0 streams: purge local streams and any legacy demo entries
                dao.clearStreamsForWorkspace(session.workspaceId)
                dao.clearDemoStreams()
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

                    // Parse real offset or timestamp from Vercel sync
                    val markerSec = c.optLong("markerTimestamp", -1L)
                    val resolvedTimestampMs = if (markerSec > 0L) {
                        markerSec * 1000L
                    } else {
                        val parsedTime = c.optLong("timestampMs", -1L)
                        if (parsedTime > 0L) parsedTime else 0L
                    }

                    // Preserve local file path if clip was already downloaded on device
                    val existingClip = dao.getClipMarkerById(c.optString("id"))
                    val existingFile = existingClip?.localFilePath
                    val existingStatus = if (!existingFile.isNullOrEmpty() || rawStatus.contains("COMPLET") || rawStatus == "GENERATED") "GENERATED" else "PENDING"

                    dao.insertClipMarker(
                        ClipMarkerEntity(
                            id = c.optString("id", UUID.randomUUID().toString()),
                            streamId = streamId,
                            authorName = c.optString("authorName", "Viewer"),
                            authorId = c.optString("authorId", "user"),
                            triggerMessageId = c.optString("chatMessageId", "msg-${UUID.randomUUID()}"),
                            timestampMs = resolvedTimestampMs,
                            label = c.optString("title", c.optString("note", "Clip Marker")),
                            status = existingStatus,
                            localFilePath = existingFile,
                            telegramMessageUrl = c.optString("telegramMessageUrl").takeIf { it.isNotEmpty() } ?: existingClip?.telegramMessageUrl
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
            synchronized(demoMembers) {
                if (demoMembers.isEmpty()) {
                    demoMembers.add(
                        TeamMember(
                            uid = session.uid,
                            displayName = session.displayName,
                            email = session.email,
                            role = session.role,
                            appPassword = null
                        )
                    )
                }
                return@withContext Result.success(demoMembers.toList())
            }
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
            val newMember = TeamMember(
                uid = UUID.randomUUID().toString(),
                displayName = displayName.ifBlank { email.split("@").firstOrNull() ?: "Member" },
                email = email,
                role = role,
                appPassword = password
            )
            synchronized(demoMembers) {
                demoMembers.add(newMember)
            }
            return@withContext Result.success(newMember)
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
            synchronized(demoMembers) {
                demoMembers.removeAll { it.uid == memberId }
            }
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

    suspend fun updateTeamMemberRole(memberId: String, newRole: String): Result<Unit> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        if (session.uid == DEMO_SESSION.uid) {
            synchronized(demoMembers) {
                val idx = demoMembers.indexOfFirst { it.uid == memberId }
                if (idx != -1) {
                    demoMembers[idx] = demoMembers[idx].copy(role = newRole)
                }
            }
            return@withContext Result.success(Unit)
        }

        try {
            val url = "$BACKEND_URL/api/team/members"
            val jsonBody = JSONObject().apply {
                put("workspaceId", session.workspaceId.ifBlank { session.uid })
                put("memberId", memberId)
                put("role", newRole)
            }
            val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer ${session.token}")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .patch(requestBody)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                val body = response.body?.string() ?: "{}"
                val err = runCatching { JSONObject(body).optString("error") }.getOrNull()
                return@withContext Result.failure(Exception(err ?: "Failed to update member role (${response.code})"))
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

    suspend fun claimAdReward(
        uid: String,
        provider: String = AdMobManager.getLastServedProvider(),
        adUnitId: String = AdMobManager.getLastServedUnitId()
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val sessionUrl = "$BACKEND_URL/api/ads/session"
            val bodyObj = JSONObject().apply { put("uid", uid) }
            val reqBody = bodyObj.toString().toRequestBody("application/json".toMediaType())
            val sessionReq = Request.Builder().url(sessionUrl).post(reqBody).build()
            val sessionResp = okHttpClient.newCall(sessionReq).execute()
            if (!sessionResp.isSuccessful) return@withContext Result.success(true)

            val sessionJson = JSONObject(sessionResp.body?.string() ?: "{}")
            val adSession = sessionJson.optJSONObject("adSession") ?: return@withContext Result.success(true)

            // Attach active provider and adUnitId so backend dashboard tracks daily earnings
            adSession.put("provider", provider)
            adSession.put("adUnitId", adUnitId)
            adSession.put("platform", "ANDROID")

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

    suspend fun syncClipMarkerToCloud(
        workspaceId: String,
        clip: ClipMarkerEntity,
        downloadStatus: String = "completed"
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        try {
            val body = JSONObject().apply {
                put("workspaceId", workspaceId)
                put("clipId", clip.id)
                put("streamId", clip.streamId)
                put("youtubeVideoId", clip.streamId)
                put("markerTimestamp", clip.timestampMs / 1000L)
                put("markerTimestampDisplay", String.format("%02d:%02d", (clip.timestampMs / 60000L), (clip.timestampMs / 1000L) % 60))
                put("authorName", clip.authorName)
                put("title", clip.label)
                put("downloadStatus", downloadStatus)
                put("status", clip.status)
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("$BACKEND_URL/api/clips")
                .addHeader("Authorization", "Bearer ${session.token}")
                .post(body)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                val errBody = response.body?.string() ?: ""
                Result.failure(Exception("Cloud sync error: ${response.code} $errBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendTelegramClipNotification(
        workspaceId: String,
        clipId: String,
        message: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        try {
            val body = JSONObject().apply {
                put("workspaceId", workspaceId)
                put("clipId", clipId)
                put("message", message)
            }.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("$BACKEND_URL/api/telegram/send")
                .addHeader("Authorization", "Bearer ${session.token}")
                .post(body)
                .build()

            val response = okHttpClient.newCall(request).execute()
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                val errBody = response.body?.string() ?: ""
                Result.failure(Exception("Telegram send response: ${response.code} $errBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateUserAvatar(photoUrl: String): Result<String> = withContext(Dispatchers.IO) {
        val currentSession = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        try {
            // 1. Immediately update local storage and memory state
            prefs.edit().putString(KEY_PHOTO, photoUrl).apply()
            val updated = currentSession.copy(photoUrl = photoUrl)
            _authState.value = AuthState.SignedIn(updated)

            // 2. Sync to cloud backend
            val body = JSONObject().apply {
                put("photoURL", photoUrl)
                put("workspaceId", currentSession.workspaceId)
            }.toString().toRequestBody("application/json".toMediaType())

            val reqBuilder = Request.Builder()
                .url("$BACKEND_URL/api/user/avatar")
                .addHeader("x-user-uid", currentSession.uid)
                .addHeader("x-user-email", currentSession.email)
                .post(body)

            if (currentSession.token.isNotBlank()) {
                reqBuilder.addHeader("Authorization", "Bearer ${currentSession.token}")
            }

            val response = okHttpClient.newCall(reqBuilder.build()).execute()
            Result.success(photoUrl)
        } catch (e: Exception) {
            Result.success(photoUrl)
        }
    }

    suspend fun getAvatars(): Result<List<GamerAvatarDto>> = withContext(Dispatchers.IO) {
        val defaultAvatars = listOf(
            GamerAvatarDto(
                id = "gojo-satoru",
                name = "Gojo Satoru",
                series = "Jujutsu Kaisen",
                badge = "Six Eyes",
                color = "#8B5CF6",
                url = "https://www.dieme.in/avatars/gojo_satoru.svg",
                description = "The Honored One wielding limitless cursed energy and Hollow Purple.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "goku-ssj",
                name = "Goku (SSJ)",
                series = "Dragon Ball Z",
                badge = "Super Saiyan",
                color = "#F59E0B",
                url = "https://www.dieme.in/avatars/goku_super_saiyan.svg",
                description = "Legendary Saiyan warrior burning with golden Super Saiyan ki.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "luffy-gear5",
                name = "Luffy (Gear 5)",
                series = "One Piece",
                badge = "Sun God Nika",
                color = "#EC4899",
                url = "https://www.dieme.in/avatars/luffy_gear5.svg",
                description = "Warrior of Liberation powered by the Drums of Liberation.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "sung-jinwoo",
                name = "Sung Jin-woo",
                series = "Solo Leveling",
                badge = "Shadow Monarch",
                color = "#06B6D4",
                url = "https://www.dieme.in/avatars/sung_jinwoo.svg",
                description = "Shadow Monarch commanding legions of risen shadow extraction soldiers.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "naruto-sage",
                name = "Naruto Uzumaki",
                series = "Naruto Shippuden",
                badge = "Toad Sage Mode",
                color = "#F97316",
                url = "https://www.dieme.in/avatars/naruto_sage.svg",
                description = "Hero of the Hidden Leaf with senjutsu orange pigments and toad sage eyes.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "zoro-wano",
                name = "Roronoa Zoro",
                series = "One Piece",
                badge = "King of Hell",
                color = "#10B981",
                url = "https://www.dieme.in/avatars/zoro_wano.svg",
                description = "Master of Three-Sword Style channeling Enma conqueror dragon flames.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "levi-ackerman",
                name = "Levi Ackerman",
                series = "Attack on Titan",
                badge = "Humanity's Strongest",
                color = "#64748B",
                url = "https://www.dieme.in/avatars/levi_ackerman.svg",
                description = "Captain of the Special Operations Squad with deadly dual-blade precision.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "tanjiro-sun",
                name = "Tanjiro Kamado",
                series = "Demon Slayer",
                badge = "Sun Breathing",
                color = "#EF4444",
                url = "https://www.dieme.in/avatars/tanjiro_sun.svg",
                description = "Demon Slayer Corps warrior wielding Hinokami Kagura solar flame dances.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "sukuna-domain",
                name = "Ryomen Sukuna",
                series = "Jujutsu Kaisen",
                badge = "King of Curses",
                color = "#DC2626",
                url = "https://www.dieme.in/avatars/sukuna_domain.svg",
                description = "Malevolent Shrine sovereign unleashing Dismantle and Cleave domain strikes.",
                isDefault = true
            ),
            GamerAvatarDto(
                id = "eren-founder",
                name = "Eren Yeager",
                series = "Attack on Titan",
                badge = "Founding Titan",
                color = "#22C55E",
                url = "https://www.dieme.in/avatars/eren_founder.svg",
                description = "Unstoppable titan shifter marching forward in pursuit of ultimate freedom.",
                isDefault = true
            )
        )

        try {
            val req = Request.Builder()
                .url("$BACKEND_URL/api/avatars")
                .get()
                .build()

            val res = okHttpClient.newCall(req).execute()
            if (res.isSuccessful) {
                val bodyStr = res.body?.string() ?: ""
                val json = JSONObject(bodyStr)
                val array = json.optJSONArray("avatars")
                if (array != null && array.length() > 0) {
                    val list = mutableListOf<GamerAvatarDto>()
                    for (i in 0 until array.length()) {
                        val item = array.getJSONObject(i)
                        var url = item.optString("url", "")
                        if (url.startsWith("/")) {
                            url = "https://www.dieme.in$url"
                        }
                        list.add(
                            GamerAvatarDto(
                                id = item.optString("id", "avatar-$i"),
                                name = item.optString("name", "Champion"),
                                series = item.optString("series", "Anime"),
                                badge = item.optString("badge", "Legend"),
                                color = item.optString("color", "#8B5CF6"),
                                url = url,
                                description = item.optString("description", ""),
                                isDefault = item.optBoolean("isDefault", false)
                            )
                        )
                    }
                    return@withContext Result.success(list)
                }
            }
            Result.success(defaultAvatars)
        } catch (e: Exception) {
            Result.success(defaultAvatars)
        }
    }

    suspend fun addCustomAvatar(
        name: String,
        series: String,
        badge: String,
        color: String,
        url: String,
        description: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        val session = (_authState.value as? AuthState.SignedIn)?.session
            ?: return@withContext Result.failure(Exception("Not signed in"))

        try {
            val body = JSONObject().apply {
                put("name", name)
                put("series", series)
                put("badge", badge)
                put("color", color)
                put("url", url)
                put("description", description)
                put("workspaceId", session.workspaceId)
            }.toString().toRequestBody("application/json".toMediaType())

            val reqBuilder = Request.Builder()
                .url("$BACKEND_URL/api/avatars")
                .addHeader("x-user-uid", session.uid)
                .addHeader("x-user-email", session.email)
                .post(body)

            if (session.token.isNotBlank()) {
                reqBuilder.addHeader("Authorization", "Bearer ${session.token}")
            }

            val response = okHttpClient.newCall(reqBuilder.build()).execute()
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                val err = response.body?.string() ?: ""
                Result.failure(Exception("Failed to add avatar: $err"))
            }
        } catch (e: Exception) {
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
            .putString(KEY_SUB_STATUS, session.subscriptionStatus)
            .putString(KEY_SUB_PLAN, session.plan)
            .putInt(KEY_SUB_DAYS, session.daysRemaining)
            .apply()

        val isPassActive = isOneDayPassActive()
        val expiresAt = prefs.getLong(KEY_ONE_DAY_PASS_EXPIRES_AT, 0L)

        // Also persist securely to device vault so survives reinstallation
        DeviceSecureStorage.saveVaultData(
            context = context,
            email = session.email,
            uid = session.uid,
            workspaceId = session.workspaceId,
            token = session.token,
            hasActiveAdUnlock = isPassActive,
            unlockExpiresAtMs = expiresAt
        )

        scope.launch {
            DeviceSecureStorage.syncVaultToCloud(
                context = context,
                email = session.email,
                uid = session.uid,
                workspaceId = session.workspaceId,
                hasActiveAdUnlock = isPassActive,
                unlockExpiresAtMs = expiresAt
            )
        }
    }

    private suspend fun seedDemoDataIfEmpty() = withContext(Dispatchers.IO) {
        try {
            // Automatically purge all legacy mock and demo entries
            dao.clearDemoStreams()
            dao.clearDemoClips()
            dao.clearDummyChatMessages()
            dao.deleteStream("demo-stream-001")
            dao.deleteClipMarker("demo-clip-001")
            dao.deleteClipMarker("CLP-2U6JKN")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
