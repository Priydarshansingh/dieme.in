package com.digicast.app.data.ads

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

object AdMobManager {
    // Official Google AdMob App ID: ca-app-pub-5470934256709090~1068479518
    // User's official Google AdMob Rewarded Ad Unit ID
    const val REWARDED_AD_UNIT_ID = "ca-app-pub-5470934256709090/8839247619"

    // Official Google Sample Test Rewarded Ad Unit ID (fallback while new ad unit propagates)
    const val SAMPLE_TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"

    private const val TAG = "AdMobManager"
    private var rewardedAd: RewardedAd? = null
    private var isLoading = false

    fun loadRewardedAd(context: Context, onLoaded: (() -> Unit)? = null) {
        if (rewardedAd != null || isLoading) {
            if (rewardedAd != null) onLoaded?.invoke()
            return
        }
        isLoading = true

        val adRequest = AdRequest.Builder().build()

        // 1. Try user's production AdMob ad unit ID
        RewardedAd.load(
            context,
            REWARDED_AD_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    Log.d(TAG, "AdMob Rewarded ad loaded successfully (production unit)")
                    rewardedAd = ad
                    isLoading = false
                    onLoaded?.invoke()
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    Log.w(TAG, "Production ad unit failed to load (${loadAdError.message}). Falling back to sample test unit.")
                    // 2. Fallback to sample test unit while new AdMob unit activates on Google's network
                    RewardedAd.load(
                        context,
                        SAMPLE_TEST_AD_UNIT_ID,
                        AdRequest.Builder().build(),
                        object : RewardedAdLoadCallback() {
                            override fun onAdLoaded(testAd: RewardedAd) {
                                Log.d(TAG, "AdMob sample test rewarded ad loaded")
                                rewardedAd = testAd
                                isLoading = false
                                onLoaded?.invoke()
                            }

                            override fun onAdFailedToLoad(testError: LoadAdError) {
                                Log.e(TAG, "Both AdMob units failed: ${testError.message}")
                                rewardedAd = null
                                isLoading = false
                            }
                        }
                    )
                }
            }
        )
    }

    fun showRewardedAd(
        activity: Activity,
        onUserEarnedReward: () -> Unit,
        onFallbackSimulationNeeded: () -> Unit
    ) {
        val ad = rewardedAd
        if (ad != null) {
            ad.show(activity) { rewardItem ->
                Log.d(TAG, "User completed watching AdMob ad: ${rewardItem.amount} ${rewardItem.type}")
                onUserEarnedReward()
            }
            rewardedAd = null
            // Pre-load next ad in background
            loadRewardedAd(activity)
        } else {
            // If network ad has not finished loading or is unavailable, use interactive simulated ad player
            onFallbackSimulationNeeded()
        }
    }

    fun isAdAvailable(): Boolean = rewardedAd != null
}
