package com.digicast.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.digicast.app.service.NotificationHelper
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

import com.google.android.gms.ads.MobileAds

@HiltAndroidApp
class DigicastApplication : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
        // Initialize Google Mobile Ads (AdMob)
        try {
            MobileAds.initialize(this) {}
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
