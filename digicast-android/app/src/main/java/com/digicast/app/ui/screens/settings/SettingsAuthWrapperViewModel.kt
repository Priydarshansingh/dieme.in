package com.digicast.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import com.digicast.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class SettingsAuthWrapperViewModel @Inject constructor(
    val authRepository: AuthRepository
) : ViewModel()
