package com.digicast.app.ui.components

import android.app.Activity
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.zIndex
import com.digicast.app.data.ads.AdMobManager
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.MobileWalletInfo
import com.digicast.app.data.repository.UserSession
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.WebNavigationUtil
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class GatePricingPlan(
    val id: String,
    val name: String,
    val priceINR: Int,
    val dpCost: Int,
    val dCoinsCost: Int,
    val durationLabel: String,
    val badge: String,
    val color: Color,
    val features: String = ""
)

@Composable
fun Access24hGateDialog(
    session: UserSession,
    authRepository: AuthRepository,
    initialShowScanner: Boolean = false,
    onDismiss: (() -> Unit)? = null,
    onUnlocked: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var walletInfo by remember { mutableStateOf<MobileWalletInfo?>(null) }
    var isLoadingWallet by remember { mutableStateOf(true) }
    var isDeductingCoins by remember { mutableStateOf(false) }
    var showFreeOptions by remember { mutableStateOf(false) }

    // Dynamic ₹29 Pass: Hide if account is older than 30 days (1 month)
    val nowMs = System.currentTimeMillis()
    val accountCreatedMs = if (session.createdAtMs > 0L) session.createdAtMs else nowMs
    val accountAgeDays = (nowMs - accountCreatedMs) / (1000L * 60 * 60 * 24L)
    val isIntroEligible = accountAgeDays <= 30L && (session.plan == "free_trial" || session.plan == "free" || session.plan == "intro_29" || session.plan == "1_day_pass")

    val allPlans = remember {
        listOf(
            GatePricingPlan(
                id = "intro_29",
                name = "1st Month VIP Pass",
                priceINR = 29,
                dpCost = 29,
                dCoinsCost = 290,
                durationLabel = "30 Days Access",
                badge = "FIRST MONTH VIP",
                color = Color(0xFFEC4899),
                features = "30 Days Full Studio Access • Unlimited Live Clips • Zero Ads"
            ),
            GatePricingPlan(
                id = "starter",
                name = "1 Month Pass",
                priceINR = 149,
                dpCost = 149,
                dCoinsCost = 1490,
                durationLabel = "30 Days Access",
                badge = "STANDARD",
                color = Color(0xFF0284C7),
                features = "30 Days Studio Access • Unlimited AI Clips • Zero Ads"
            ),
            GatePricingPlan(
                id = "pro",
                name = "3 Month Quarter Pass",
                priceINR = 499,
                dpCost = 499,
                dCoinsCost = 4990,
                durationLabel = "90 Days Access",
                badge = "POPULAR",
                color = DigicastEmerald,
                features = "90 Days Full Access • Priority Cloud Rendering • Zero Ads • Unlimited Clips"
            ),
            GatePricingPlan(
                id = "studio",
                name = "1 Year Annual Pass",
                priceINR = 999,
                dpCost = 999,
                dCoinsCost = 9990,
                durationLabel = "365 Days Access",
                badge = "BEST VALUE",
                color = Color(0xFF8B5CF6),
                features = "365 Days Access • Highest Priority • Team Access • VIP Support"
            )
        )
    }

    // Filter plans dynamically based on account age
    val displayPlans = remember(isIntroEligible) {
        if (isIntroEligible) allPlans else allPlans.filter { it.id != "intro_29" }
    }

    // Default plan is strictly ₹499 (pro)
    var selectedPlanId by remember { mutableStateOf("pro") }
    if (displayPlans.none { it.id == selectedPlanId }) {
        selectedPlanId = "pro"
    }

    val selectedPlan = displayPlans.find { it.id == selectedPlanId }
        ?: displayPlans.firstOrNull { it.id == "pro" }
        ?: displayPlans.first()

    // Payment Gateway launch state
    var isLaunchingGateway by remember { mutableStateOf(false) }
    var activePaymentId by remember { mutableStateOf<String?>(null) }
    var activeOrderId by remember { mutableStateOf<String?>(null) }

    // Live SMS & Bank Observer Polling in Background: Unlocks automatically when payment confirms
    LaunchedEffect(selectedPlanId) {
        val targetWid = session.workspaceId.ifEmpty { session.uid }
        while (true) {
            delay(4000)
            if (!activePaymentId.isNullOrBlank() || !activeOrderId.isNullOrBlank()) {
                val checkRes = authRepository.checkUpiPaymentStatus(
                    workspaceId = targetWid,
                    paymentId = activePaymentId,
                    orderId = activeOrderId
                )
                checkRes.onSuccess { json ->
                    if (json.optBoolean("isPaid", false) || json.optString("status") == "approved") {
                        Toast.makeText(context, "🎉 Payment verified! Studio access unlocked.", Toast.LENGTH_LONG).show()
                        onUnlocked()
                        return@LaunchedEffect
                    }
                }
            }
        }
    }

    // Load wallet balance on mount
    LaunchedEffect(session.uid) {
        isLoadingWallet = true
        val result = authRepository.fetchWalletBalance(session.uid)
        walletInfo = result.getOrNull() ?: MobileWalletInfo(dCoinsBalance = 0, dpBalance = 0, equivalentINR = 0.0)
        isLoadingWallet = false
        // Pre-load AdMob ad
        AdMobManager.loadRewardedAd(context)
    }

    val currentDCoins = walletInfo?.dCoinsBalance ?: 0
    val hasSufficientCoins = currentDCoins >= 50

    Dialog(
        onDismissRequest = { onDismiss?.invoke() },
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = DigicastDeepNavy
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.TopCenter
            ) {
                // Scrollable Content Column
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 520.dp)
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Spacer(modifier = Modifier.height(32.dp))

                    // Brand Icon & Badge
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    listOf(DigicastEmerald.copy(alpha = 0.25f), Color.Transparent)
                                )
                            )
                            .border(1.5.dp, DigicastEmerald.copy(alpha = 0.5f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.WorkspacePremium,
                            contentDescription = null,
                            tint = DigicastEmerald,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    // Title & Subtitle
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Creator Studio Membership",
                            color = DigicastWhite,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Unlock unlimited live streaming, AI clipping, high-speed 4K exports & priority rendering:",
                            color = DigicastSlate,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            lineHeight = 18.sp
                        )
                    }

                    // Plans Cards List (Clean, selectable cards, no individual launch buttons)
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        displayPlans.forEach { p ->
                            val isSelected = p.id == selectedPlanId
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .border(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) p.color else DigicastBorder,
                                        shape = RoundedCornerShape(14.dp)
                                    )
                                    .clickable { selectedPlanId = p.id },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) p.color.copy(alpha = 0.12f) else DigicastCardSurface
                                ),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    // Plan Details
                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text(
                                                text = p.name,
                                                color = DigicastWhite,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(p.color.copy(alpha = 0.2f))
                                                    .border(1.dp, p.color.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(
                                                    text = p.badge,
                                                    color = p.color,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    letterSpacing = 0.5.sp
                                                )
                                            }
                                        }

                                        Text(
                                            text = p.features,
                                            color = DigicastSlate,
                                            fontSize = 11.sp,
                                            lineHeight = 15.sp,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    // Price & Radio Selection Indicator
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Text(
                                            text = "₹${p.priceINR}",
                                            color = if (isSelected) p.color else DigicastWhite,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 19.sp
                                        )

                                        Icon(
                                            imageVector = if (isSelected) Icons.Default.RadioButtonChecked else Icons.Default.RadioButtonUnchecked,
                                            contentDescription = if (isSelected) "Selected" else "Unselected",
                                            tint = if (isSelected) p.color else DigicastSlate,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Primary Action: Single prominent "Upgrade" button that directly launches the payment gateway
                    Button(
                        onClick = {
                            scope.launch {
                                isLaunchingGateway = true
                                try {
                                    val targetWid = session.workspaceId.ifEmpty { session.uid }
                                    val res = authRepository.createPaymentSession(targetWid, selectedPlan.id, session.email)
                                    var checkoutUrl: String? = null
                                    res.onSuccess { json ->
                                        activePaymentId = json.optString("paymentId").ifBlank { null }
                                        activeOrderId = json.optString("orderId").ifBlank { null }
                                        checkoutUrl = json.optString("gatewayCheckoutUrl").ifBlank { null }
                                    }

                                    if (checkoutUrl.isNullOrBlank()) {
                                        checkoutUrl = "https://www.dieme.in/pricing?workspaceId=$targetWid&planId=${selectedPlan.id}&direct=1"
                                    }

                                    WebNavigationUtil.launchBrowser(context, checkoutUrl!!)
                                } catch (e: Exception) {
                                    val fallbackUrl = "https://www.dieme.in/pricing?workspaceId=${session.workspaceId}&planId=${selectedPlan.id}&direct=1"
                                    WebNavigationUtil.launchBrowser(context, fallbackUrl)
                                } finally {
                                    isLaunchingGateway = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = DigicastEmerald),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        enabled = !isLaunchingGateway
                    ) {
                        if (isLaunchingGateway) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = DigicastDeepNavy, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Launching Gateway...",
                                color = DigicastDeepNavy,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = null,
                                tint = DigicastDeepNavy,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Upgrade to ${selectedPlan.name} • ₹${selectedPlan.priceINR}",
                                color = DigicastDeepNavy,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }

                    // Auto-unlock observation status note
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(DigicastEmerald)
                        )
                        Text(
                            text = "Direct secure gateway checkout • Instant bank verification",
                            color = DigicastSlate,
                            fontSize = 11.sp
                        )
                    }

                    HorizontalDivider(color = DigicastBorder.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = 4.dp))

                    // Secondary Alternative: Free 24-Hour Access Options
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = if (showFreeOptions) "Hide Free Access Options ▲" else "Need Free 24-Hour Access? Tap here ▼",
                            color = DigicastElectricCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { showFreeOptions = !showFreeOptions }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        )

                        AnimatedVisibility(visible = showFreeOptions) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(DigicastCardSurface)
                                    .border(1.dp, DigicastBorder, RoundedCornerShape(14.dp))
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Watch Ad Option
                                Button(
                                    onClick = {
                                        val activity = context as? Activity
                                        if (activity != null && AdMobManager.isAdAvailable()) {
                                            AdMobManager.showRewardedAd(
                                                activity = activity,
                                                onUserEarnedReward = {
                                                    authRepository.activateOneDayPass(fromAd = true)
                                                    Toast.makeText(context, "🎉 24-Hour Access Unlocked via Ad!", Toast.LENGTH_SHORT).show()
                                                    onUnlocked()
                                                },
                                                onFallbackSimulationNeeded = {
                                                    authRepository.activateOneDayPass(fromAd = true)
                                                    onUnlocked()
                                                }
                                            )
                                        } else {
                                            authRepository.activateOneDayPass(fromAd = true)
                                            Toast.makeText(context, "🎉 24-Hour Access Activated!", Toast.LENGTH_SHORT).show()
                                            onUnlocked()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastNeonLime),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(44.dp)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Watch Partner Ad (Free 24h Pass)", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }

                                // D-Coins Option (if >= 50 D-Coins)
                                if (hasSufficientCoins) {
                                    OutlinedButton(
                                        onClick = {
                                            scope.launch {
                                                isDeductingCoins = true
                                                val res = authRepository.unlock24hPassWithDCoins(session.uid)
                                                isDeductingCoins = false
                                                if (res.isSuccess) {
                                                    Toast.makeText(context, "🪙 50 D-Coins Deducted • 24h Pass Active!", Toast.LENGTH_SHORT).show()
                                                    onUnlocked()
                                                }
                                            }
                                        },
                                        enabled = !isDeductingCoins,
                                        border = BorderStroke(1.dp, Color(0xFFFBBF24)),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(44.dp)
                                    ) {
                                        if (isDeductingCoins) {
                                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color(0xFFFBBF24))
                                        } else {
                                            Icon(Icons.Default.MonetizationOn, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color(0xFFFBBF24))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Pay 50 D-Coins (Balance: $currentDCoins D)", color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Cross ("X") Close Button: Positioned on top with high zIndex so it reliably receives clicks and dismisses
                IconButton(
                    onClick = { onDismiss?.invoke() },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 16.dp, end = 16.dp)
                        .size(40.dp)
                        .zIndex(100f)
                        .clip(CircleShape)
                        .background(DigicastCardSurface)
                        .border(1.dp, DigicastBorder, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = DigicastWhite,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
