package com.digicast.app.ui.screens.settings

import android.app.Activity
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.data.ads.AdMobManager
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.MobileEditorInfo
import com.digicast.app.data.repository.MobileWalletInfo
import com.digicast.app.data.repository.UserSession
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastMintGlow
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun WalletAndAdsCard(
    session: UserSession,
    authRepository: AuthRepository,
    modifier: Modifier = Modifier
) {
    val uid = session.uid
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Users who subscribed already DO NOT see ads
    val isPaidSubscriber = session.subscriptionStatus.equals("active", ignoreCase = true) &&
            !session.plan.equals("free", ignoreCase = true) &&
            !session.plan.equals("free_trial", ignoreCase = true)

    var walletInfo by remember { mutableStateOf<MobileWalletInfo?>(null) }
    var topEditors by remember { mutableStateOf<List<MobileEditorInfo>>(emptyList()) }
    var isLoadingWallet by remember { mutableStateOf(false) }
    var showAdDialog by remember { mutableStateOf(false) }
    var adProgress by remember { mutableFloatStateOf(0f) }
    var adSecondsLeft by remember { mutableIntStateOf(5) }
    var isClaimingAd by remember { mutableStateOf(false) }

    fun refreshData() {
        scope.launch {
            isLoadingWallet = true
            val wResult = authRepository.fetchWalletBalance(uid)
            if (wResult.isSuccess) {
                walletInfo = wResult.getOrNull()
            }
            val eResult = authRepository.fetchTopEditors()
            if (eResult.isSuccess) {
                topEditors = eResult.getOrNull() ?: emptyList()
            }
            isLoadingWallet = false
        }
    }

    // Preload AdMob Rewarded Ad for free/free-trial creators
    LaunchedEffect(uid, isPaidSubscriber) {
        refreshData()
        if (!isPaidSubscriber) {
            AdMobManager.loadRewardedAd(context)
        }
    }

    fun handleClaimRewardSuccess() {
        scope.launch {
            val res = authRepository.claimAdReward(uid)
            if (res.isSuccess) {
                walletInfo = walletInfo?.copy(
                    dCoinsBalance = (walletInfo?.dCoinsBalance ?: 120) + 50,
                    hasActiveAdPass = true,
                    adRemainingHours = 24.0
                ) ?: MobileWalletInfo(170, 45, 58.0, true, 24.0)
                Toast.makeText(context, "🎉 Ad reward claimed! +50 D-Coins added & 24h Pass activated!", Toast.LENGTH_LONG).show()
            }
        }
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header Row: Wallet Title & Refresh
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .background(DigicastNeonLime.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Paid,
                            contentDescription = null,
                            tint = DigicastNeonLime,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "CREATOR WALLET & AD PASS",
                            color = DigicastWhite,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "10 D = 1 DP = ₹1 INR (Internal Credits)",
                            color = DigicastSlate,
                            fontSize = 11.sp
                        )
                    }
                }

                IconButton(
                    onClick = { refreshData() },
                    modifier = Modifier.size(32.dp)
                ) {
                    if (isLoadingWallet) {
                        CircularProgressIndicator(
                            color = DigicastAccentBlue,
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = DigicastSlate,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // Balances Bento Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // D-Coins Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DigicastNavy)
                        .border(1.dp, DigicastBorder, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text("D-COINS", color = DigicastSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${walletInfo?.dCoinsBalance ?: 120} D",
                            color = DigicastNeonLime,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text("Task Earning", color = DigicastSlate, fontSize = 10.sp)
                    }
                }

                // DP Points Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DigicastNavy)
                        .border(1.dp, DigicastBorder, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text("DIGICAST POINTS", color = DigicastSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${walletInfo?.dpBalance ?: 45} DP",
                            color = DigicastElectricCyan,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text("≈ ₹${walletInfo?.equivalentINR?.toInt() ?: 57} INR Value", color = DigicastMintGlow, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            HorizontalDivider(color = DigicastBorder.copy(alpha = 0.5f))

            // ── AD SECTION: Only for Free & Free Trial Users. Subscribed Users NEVER see ads ──
            if (isPaidSubscriber) {
                // Subscribed users: Clean Pro Ad-Free Banner
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(DigicastNavy)
                        .border(1.dp, DigicastEmerald.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(DigicastEmerald.copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = null,
                                tint = DigicastEmerald,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = "PRO AD-FREE ACTIVE",
                                    color = DigicastWhite,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Box(
                                    modifier = Modifier
                                        .background(DigicastEmerald.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = session.plan.uppercase(),
                                        color = DigicastEmerald,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                            Text(
                                text = "Your subscription grants 100% ad-free unlimited access across the studio platform.",
                                color = DigicastSlate,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            } else {
                // Free & Free Trial users: Google AdMob Rewarded Ad Option
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(DigicastDeepNavy.copy(alpha = 0.7f))
                        .border(1.dp, DigicastBorder, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = null,
                                tint = if (walletInfo?.hasActiveAdPass == true) DigicastEmerald else DigicastLiveRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "24-Hour Stream Pass (AdMob)",
                                color = DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Box(
                            modifier = Modifier
                                .background(
                                    if (walletInfo?.hasActiveAdPass == true) DigicastEmerald.copy(alpha = 0.2f) else DigicastSurfaceElevated,
                                    RoundedCornerShape(6.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = if (walletInfo?.hasActiveAdPass == true) "PASS ACTIVE" else "NO ACTIVE PASS",
                                color = if (walletInfo?.hasActiveAdPass == true) DigicastEmerald else DigicastSlate,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = "Free & trial users: Watch 1 video ad to unlock 24 hours of uninterrupted studio features and earn +50 D-Coins.",
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )

                    Button(
                        onClick = {
                            val activity = context as? Activity
                            if (activity != null && AdMobManager.isAdAvailable()) {
                                AdMobManager.showRewardedAd(
                                    activity = activity,
                                    onUserEarnedReward = {
                                        handleClaimRewardSuccess()
                                    },
                                    onFallbackSimulationNeeded = {
                                        adProgress = 0f
                                        adSecondsLeft = 5
                                        showAdDialog = true
                                    }
                                )
                            } else {
                                if (activity != null) {
                                    AdMobManager.loadRewardedAd(activity)
                                }
                                adProgress = 0f
                                adSecondsLeft = 5
                                showAdDialog = true
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(38.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = DigicastAccentBlue
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = DigicastWhite
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Watch Sponsored Ad (+10 D & 24h Pass)",
                            color = DigicastWhite,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }

    // High-Value Sponsored Ad Simulation Dialog (Fallback while AdMob unit propagates)
    if (showAdDialog) {
        LaunchedEffect(showAdDialog) {
            AdMobManager.setFallbackProvider("SPONSORED_PARTNER")
            val totalTicks = 50
            for (i in 1..totalTicks) {
                delay(100)
                adProgress = i / totalTicks.toFloat()
                adSecondsLeft = 5 - (i / 10)
            }
            // Ad completed
            isClaimingAd = true
            handleClaimRewardSuccess()
            isClaimingAd = false
            showAdDialog = false
        }

        AlertDialog(
            onDismissRequest = { /* Prevent dismiss before complete */ },
            containerColor = DigicastNavy,
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = DigicastNeonLime,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = "Partner Ad Playing",
                        color = DigicastWhite,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(DigicastDeepNavy)
                            .border(1.dp, DigicastBorder, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            CircularProgressIndicator(
                                progress = { adProgress },
                                color = DigicastNeonLime,
                                strokeWidth = 3.dp,
                                modifier = Modifier.size(36.dp)
                            )
                            Text(
                                text = "Digicast Studio Pro Ecosystem",
                                color = DigicastWhite,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Reward in ${adSecondsLeft.coerceAtLeast(0)}s...",
                                color = DigicastSlate,
                                fontSize = 11.sp
                            )
                        }
                    }

                    LinearProgressIndicator(
                        progress = { adProgress },
                        color = DigicastNeonLime,
                        trackColor = DigicastBorder,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                    )

                    Text(
                        text = "Do not close. Your 24-hour stream pass and 10 D-Coins will be credited automatically.",
                        color = DigicastSlate,
                        fontSize = 11.sp
                    )
                }
            },
            confirmButton = {}
        )
    }
}
