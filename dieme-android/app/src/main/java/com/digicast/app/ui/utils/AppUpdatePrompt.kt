package com.digicast.app.ui.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.digicast.app.ui.components.AppUpdateDialog
import com.digicast.app.util.AppUpdateInfo
import com.digicast.app.util.AppUpdateManager
import com.digicast.app.util.UpdateCheckResult

@Composable
fun AppUpdatePrompt() {
    val context = LocalContext.current
    var pendingUpdate by remember { mutableStateOf<AppUpdateInfo?>(null) }
    var dismissedThisSession by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (!dismissedThisSession) {
            val result = AppUpdateManager.checkForUpdates(context)
            if (result is UpdateCheckResult.UpdateAvailable) {
                if (AppUpdateManager.shouldShowAutoPrompt(context, result.updateInfo.versionCode)) {
                    pendingUpdate = result.updateInfo
                }
            }
        }
    }

    val update = pendingUpdate
    if (update != null && !dismissedThisSession) {
        AppUpdateDialog(
            updateInfo = update,
            onUpdate = {
                AppUpdateManager.launchUpdateDownload(context, update.downloadUrl)
            },
            onClose = {
                // Dismiss only for this session; next fresh launch will prompt again
                dismissedThisSession = true
                pendingUpdate = null
            },
            onSkip24Hours = {
                // Snooze for 24 hours in SharedPreferences
                AppUpdateManager.skipUpdateFor24Hours(context, update.versionCode)
                dismissedThisSession = true
                pendingUpdate = null
            }
        )
    }
}
