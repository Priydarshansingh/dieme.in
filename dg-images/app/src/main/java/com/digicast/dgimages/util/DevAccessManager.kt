package com.digicast.dgimages.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object DevAccessManager {

    private const val PREFS_NAME = "dgimages_dev_access_prefs"
    private const val KEY_DEV_ENABLED = "key_dev_access_enabled"

    // Developer authorization passcodes & owner emails
    private val DEV_PASSCODES = setOf(
        "diemedev2026",
        "dieme786",
        "pskishnawat133@gmail.com"
    )

    private val _hasDevAccess = MutableStateFlow(false)
    val hasDevAccess: StateFlow<Boolean> = _hasDevAccess.asStateFlow()

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        _hasDevAccess.value = prefs.getBoolean(KEY_DEV_ENABLED, false)
    }

    fun verifyAndUnlock(context: Context, input: String): Boolean {
        val clean = input.trim().lowercase()
        val isValid = DEV_PASSCODES.contains(clean) || clean.contains("diemedev") || clean == "pskishnawat133@gmail.com"
        if (isValid) {
            setDevAccess(context, true)
            return true
        }
        return false
    }

    fun setDevAccess(context: Context, enabled: Boolean) {
        _hasDevAccess.value = enabled
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_DEV_ENABLED, enabled).apply()
    }
}
