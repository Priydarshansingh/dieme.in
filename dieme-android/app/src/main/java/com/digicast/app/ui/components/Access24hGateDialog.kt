package com.digicast.app.ui.components

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.net.URLEncoder

data class GatePricingPlan(
    val id: String,
    val name: String,
    val priceINR: Int,
    val dpCost: Int,
    val dCoinsCost: Int,
    val durationLabel: String,
    val badge: String,
    val color: Color
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
    val clipboardManager = LocalClipboardManager.current
    val scope = rememberCoroutineScope()

    var walletInfo by remember { mutableStateOf<MobileWalletInfo?>(null) }
    var isLoadingWallet by remember { mutableStateOf(true) }
    var isDeductingCoins by remember { mutableStateOf(false) }
    var showScannerView by remember { mutableStateOf(initialShowScanner) }

    // UPI submission & Gateway state
    var selectedPlanId by remember { mutableStateOf("intro_29") }
    var utrInput by remember { mutableStateOf("") }
    var isSubmittingPayment by remember { mutableStateOf(false) }
    var paymentMessage by remember { mutableStateOf<String?>(null) }

    // Authoritative Sovereign Gateway Session state
    var activePaymentId by remember { mutableStateOf<String?>(null) }
    var activeOrderId by remember { mutableStateOf<String?>(null) }
    var gatewayUpiString by remember { mutableStateOf<String?>(null) }
    var isCreatingGatewaySession by remember { mutableStateOf(false) }
    var secondsRemaining by remember { mutableIntStateOf(300) } // 5-minute active gateway window
    var sessionRefreshTrigger by remember { mutableIntStateOf(0) }
    var isObserverVerified by remember { mutableStateOf(false) }

    // Live Gateway Session Initializer & 5-Minute Window Manager
    LaunchedEffect(showScannerView, selectedPlanId, sessionRefreshTrigger) {
        if (!showScannerView) return@LaunchedEffect
        isCreatingGatewaySession = true
        secondsRemaining = 300
        val targetWid = session.workspaceId.ifEmpty { session.uid }
        val res = authRepository.createPaymentSession(targetWid, selectedPlanId, session.email)
        res.onSuccess { json ->
            activePaymentId = json.optString("paymentId").ifBlank { null }
            activeOrderId = json.optString("orderId").ifBlank { null }
            gatewayUpiString = json.optString("upiDeepLink").ifBlank { null }
        }
        isCreatingGatewaySession = false

        while (secondsRemaining > 0) {
            delay(1000)
            secondsRemaining--
        }
    }

    // Live SMS & Bank Observer Polling: Instantly detects when money hits the receiving bank
    LaunchedEffect(showScannerView, activePaymentId, activeOrderId) {
        if (!showScannerView) return@LaunchedEffect
        val targetWid = session.workspaceId.ifEmpty { session.uid }
        while (true) {
            delay(3500)
            val checkRes = authRepository.checkUpiPaymentStatus(
                workspaceId = targetWid,
                paymentId = activePaymentId,
                orderId = activeOrderId
            )
            checkRes.onSuccess { json ->
                if (json.optBoolean("isPaid", false) || json.optString("status") == "approved") {
                    isObserverVerified = true
                    Toast.makeText(context, "🎉 Bank payment verified! Studio access unlocked.", Toast.LENGTH_LONG).show()
                    onUnlocked()
                    return@LaunchedEffect
                }
            }
        }
    }

    val plans = remember {
        listOf(
            GatePricingPlan(
                id = "intro_29",
                name = "VIP Pass",
                priceINR = 29,
                dpCost = 29,
                dCoinsCost = 290,
                durationLabel = "30 Days",
                badge = "FIRST MONTH VIP",
                color = Color(0xFFEC4899)
            ),
            GatePricingPlan(
                id = "starter",
                name = "1 Month Pass",
                priceINR = 149,
                dpCost = 149,
                dCoinsCost = 1490,
                durationLabel = "30 Days",
                badge = "STANDARD",
                color = Color(0xFF0284C7)
            ),
            GatePricingPlan(
                id = "pro",
                name = "3 Month Quarter",
                priceINR = 499,
                dpCost = 499,
                dCoinsCost = 4990,
                durationLabel = "90 Days",
                badge = "POPULAR",
                color = DigicastEmerald
            ),
            GatePricingPlan(
                id = "studio",
                name = "1 Year Annual",
                priceINR = 999,
                dpCost = 999,
                dCoinsCost = 9990,
                durationLabel = "365 Days",
                badge = "BEST VALUE",
                color = Color(0xFF7C3AED)
            )
        )
    }

    val selectedPlan = plans.find { it.id == selectedPlanId } ?: plans.first()
    val upiVpa = "dkigicast@ptyes"

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
            dismissOnBackPress = onDismiss != null,
            dismissOnClickOutside = onDismiss != null,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = DigicastDeepNavy
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                if (onDismiss != null) {
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(16.dp)
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(DigicastCardSurface)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = DigicastWhite, modifier = Modifier.size(20.dp))
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Spacer(modifier = Modifier.height(10.dp))

                // Brand & Icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                listOf(DigicastElectricCyan.copy(alpha = 0.25f), Color.Transparent)
                            )
                        )
                        .border(1.5.dp, DigicastElectricCyan.copy(alpha = 0.5f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = DigicastElectricCyan,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Title & Subtitle
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "24-Hour Studio Access",
                        color = DigicastWhite,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Your 14-day free trial has completed. To continue clipping, streaming, and editing today, unlock 24-hour access:",
                        color = DigicastSlate,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                }

                // User Balance Pill
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(DigicastCardSurface)
                        .border(1.dp, DigicastBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.MonetizationOn,
                        contentDescription = null,
                        tint = Color(0xFFFBBF24),
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Your Balance: ${currentDCoins} D-Coins",
                        color = DigicastWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "(Needs 50 D)",
                        color = if (hasSufficientCoins) DigicastEmerald else Color(0xFFF87171),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // ─── IF USER HAS COINS (>= 50 D-COINS) ─────────────────────────
                if (hasSufficientCoins && !showScannerView) {
                    // Option 1: Watch Ad (Free)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(DigicastNeonLime.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.PlayArrow,
                                        contentDescription = null,
                                        tint = DigicastNeonLime,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text("Option 1: Watch Partner Video", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("Free • 100% video completion unlocks 24 hours", color = DigicastSlate, fontSize = 11.sp)
                                }
                            }

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
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Watch Ad & Unlock Access", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }

                    // Option 2: Pay 50 D-Coins
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFBBF24).copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFFBBF24).copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MonetizationOn,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text("Option 2: Pay 50 D-Coins", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("Deduct 50 D-Coins from your current balance (${currentDCoins} D)", color = DigicastSlate, fontSize = 11.sp)
                                }
                            }

                            Button(
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
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFBBF24)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                if (isDeductingCoins) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = DigicastDeepNavy)
                                } else {
                                    Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Pay 50 D-Coins & Unlock (24h)", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }
                    }

                    // Shortcut to Plans/Scanner
                    Text(
                        text = "Or Upgrade to VIP Unlimited Pass (No ads forever) →",
                        color = DigicastElectricCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clickable { showScannerView = true }
                            .padding(8.dp)
                    )
                }

                // ─── IF USER HAS < 50 D-COINS OR CLICKS SCANNER ───────────────
                if (!hasSufficientCoins || showScannerView) {
                    // Option 1: Watch Ad (Always Available)
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
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp), tint = DigicastDeepNavy)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Watch Partner Ad (Free 24h Access)", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }

                    // Option 2: Plans & UPI Scanner Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(DigicastElectricCyan.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.QrCode,
                                        contentDescription = null,
                                        tint = DigicastElectricCyan,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text("Upgrade Passes & UPI Scanner", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("Unlimited live streams, zero ads, priority telegram alerts", color = DigicastSlate, fontSize = 11.sp)
                                }
                            }

                            // Plan Selection Chips
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                plans.forEach { p ->
                                    val isSelected = p.id == selectedPlanId
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(if (isSelected) p.color.copy(alpha = 0.15f) else DigicastDeepNavy)
                                            .border(
                                                1.5.dp,
                                                if (isSelected) p.color else DigicastBorder,
                                                RoundedCornerShape(12.dp)
                                            )
                                            .clickable { selectedPlanId = p.id }
                                            .padding(horizontal = 14.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(p.name, color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                                Text(
                                                    text = p.badge,
                                                    color = p.color,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Black
                                                )
                                            }
                                            Text(
                                                text = "${p.durationLabel} • ${p.dpCost} DP • ${p.dCoinsCost} D-Coins",
                                                color = DigicastSlate,
                                                fontSize = 11.sp
                                            )
                                        }

                                        Text(
                                            text = "₹${p.priceINR}",
                                            color = if (isSelected) p.color else DigicastWhite,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 17.sp
                                        )
                                    }
                                }
                            }

                            // Authoritative Sovereign Gateway UPI Link & Deep Links
                            val upiAmountFormatted = String.format(java.util.Locale.US, "%.2f", selectedPlan.priceINR.toDouble())
                            val cleanNote = URLEncoder.encode("Dieme ${selectedPlan.name} ${activeOrderId ?: ""}".trim(), "UTF-8")
                            val fallbackUpiString = "upi://pay?pa=$upiVpa&pn=Dieme&am=$upiAmountFormatted&cu=INR&tn=$cleanNote"
                            val effectiveUpiString = gatewayUpiString ?: fallbackUpiString

                            val phonepeIntentUri = effectiveUpiString.replace("upi://pay", "phonepe://pay")
                            val gpayIntentUri = effectiveUpiString.replace("upi://pay", "gpay://upi/pay")
                            val paytmIntentUri = effectiveUpiString.replace("upi://pay", "paytmmp://pay")

                            val timerM = secondsRemaining / 60
                            val timerS = secondsRemaining % 60
                            val timerStr = String.format(java.util.Locale.US, "%02d:%02d", timerM, timerS)

                            fun openUpiApp(targetUri: String, packageName: String? = null) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUri)).apply {
                                        if (!packageName.isNullOrBlank()) {
                                            setPackage(packageName)
                                        }
                                    }
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    try {
                                        val genericIntent = Intent(Intent.ACTION_VIEW, Uri.parse(effectiveUpiString))
                                        context.startActivity(genericIntent)
                                    } catch (e2: Exception) {
                                        clipboardManager.setText(AnnotatedString(upiVpa))
                                        Toast.makeText(context, "UPI ID copied: $upiVpa. Open your UPI app and paste.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            }

                            // 1. Live Gateway Status Bar with Active Timer
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0x18000000), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color(0x20FFFFFF), RoundedCornerShape(10.dp))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(DigicastEmerald))
                                    Text(
                                        text = if (isCreatingGatewaySession) "Connecting Gateway..." else "Sovereign Gateway Active",
                                        color = DigicastWhite,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                if (secondsRemaining <= 0) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Color(0xFFEF4444).copy(alpha = 0.2f))
                                            .border(1.dp, Color(0xFFEF4444), RoundedCornerShape(6.dp))
                                            .clickable { sessionRefreshTrigger++ }
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = "🔄 Expired • Refresh",
                                            color = Color(0xFFF87171),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                } else {
                                    Text(
                                        text = "⏱ $timerStr",
                                        color = if (secondsRemaining < 60) Color(0xFFF87171) else DigicastEmerald,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            // 2. 1-Tap Direct UPI Buttons (Avoids PhonePe Gallery Scan restriction!)
                            Card(
                                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                                border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Icon(Icons.Default.Bolt, contentDescription = null, tint = DigicastEmerald, modifier = Modifier.size(18.dp))
                                        Text("1-Tap Direct Payment (No Screenshot Needed)", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                    Text(
                                        text = "Tap your app below to pay directly on this phone. Avoids PhonePe screenshot & gallery scan limits.",
                                        color = DigicastSlate,
                                        fontSize = 11.sp
                                    )

                                    // Direct App Launchers: PhonePe, GPay, Paytm
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { openUpiApp(phonepeIntentUri, "com.phonepe.app") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF5F259F)),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f).height(42.dp),
                                            contentPadding = PaddingValues(horizontal = 4.dp)
                                        ) {
                                            Text("PhonePe", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = { openUpiApp(gpayIntentUri, "com.google.android.apps.nbu.paisa.user") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F1F1F)),
                                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33FFFFFF)),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f).height(42.dp),
                                            contentPadding = PaddingValues(horizontal = 4.dp)
                                        ) {
                                            Text("GPay", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = { openUpiApp(paytmIntentUri, "net.one97.paytm") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF002970)),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f).height(42.dp),
                                            contentPadding = PaddingValues(horizontal = 4.dp)
                                        ) {
                                            Text("Paytm", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    // Other Apps & Copy VPA
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedButton(
                                            onClick = { openUpiApp(effectiveUpiString) },
                                            border = androidx.compose.foundation.BorderStroke(1.dp, DigicastElectricCyan.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f).height(38.dp)
                                        ) {
                                            Icon(Icons.Default.CreditCard, contentDescription = null, modifier = Modifier.size(14.dp), tint = DigicastElectricCyan)
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Other Apps", color = DigicastElectricCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = {
                                                clipboardManager.setText(AnnotatedString(upiVpa))
                                                Toast.makeText(context, "UPI ID copied: $upiVpa", Toast.LENGTH_SHORT).show()
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = DigicastDeepNavy),
                                            border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(0.9f).height(38.dp)
                                        ) {
                                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp), tint = DigicastWhite)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Copy VPA", color = DigicastWhite, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            // 3. Dynamic Gateway QR Code Image (for PC / other phone scanning)
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color.White)
                                    .padding(14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                val qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${URLEncoder.encode(effectiveUpiString, "UTF-8")}"
                                AsyncImage(
                                    model = qrUrl,
                                    contentDescription = "UPI QR Code",
                                    modifier = Modifier.size(170.dp)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Scan to Pay ₹$upiAmountFormatted EXACT",
                                    color = Color.Black,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "VPA: $upiVpa",
                                    color = Color.DarkGray,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                                if (!activeOrderId.isNullOrBlank()) {
                                    Text(
                                        text = "Session Order: $activeOrderId",
                                        color = Color(0xFF0B63E5),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            // 4. Live Instant SMS / Bank Credit Observer Indicator
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(DigicastEmerald.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                                    .border(1.dp, DigicastEmerald.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = DigicastEmerald
                                )
                                Column {
                                    Text(
                                        text = "Auto-Verification Listening",
                                        color = DigicastEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "System app & bank credit observer will unlock automatically once payment is received.",
                                        color = DigicastSlate,
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            // Open Web Gateway with 8-Minute Live Timer
                            OutlinedButton(
                                onClick = {
                                    try {
                                        val webGatewayUrl = "https://www.dieme.in/pricing"
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webGatewayUrl))
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Could not open browser", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, DigicastElectricCyan.copy(alpha = 0.6f)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(44.dp)
                            ) {
                                Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp), tint = DigicastElectricCyan)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Open Web Gateway (Live Checkout)", color = DigicastElectricCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }

                            // UTR Input & Submission Box
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Enter UPI Reference / 12-Digit UTR:", color = DigicastWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                OutlinedTextField(
                                    value = utrInput,
                                    onValueChange = { utrInput = it.take(20) },
                                    placeholder = { Text("e.g. 428901234567", color = DigicastSlate, fontSize = 12.sp) },
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = DigicastElectricCyan,
                                        unfocusedBorderColor = DigicastBorder,
                                        focusedTextColor = DigicastWhite,
                                        unfocusedTextColor = DigicastWhite
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Button(
                                    onClick = {
                                        val cleanUtr = utrInput.trim()
                                        if (cleanUtr.length < 6) {
                                            Toast.makeText(context, "Please enter a valid UPI transaction reference / UTR", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }
                                        scope.launch {
                                            isSubmittingPayment = true
                                            paymentMessage = null
                                            val res = authRepository.submitUpiPayment(
                                                workspaceId = session.workspaceId.ifEmpty { session.uid },
                                                planId = selectedPlan.id,
                                                amountINR = selectedPlan.priceINR,
                                                utrNumber = cleanUtr,
                                                userEmail = session.email
                                            )
                                            isSubmittingPayment = false
                                            if (res.isSuccess) {
                                                Toast.makeText(context, "✅ Payment Submitted! 24h grace access unlocked.", Toast.LENGTH_LONG).show()
                                                onUnlocked()
                                            } else {
                                                paymentMessage = res.exceptionOrNull()?.message ?: "Failed to submit."
                                            }
                                        }
                                    },
                                    enabled = !isSubmittingPayment && utrInput.isNotBlank(),
                                    colors = ButtonDefaults.buttonColors(containerColor = DigicastEmerald),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(46.dp)
                                ) {
                                    if (isSubmittingPayment) {
                                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = DigicastDeepNavy)
                                    } else {
                                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Submit UTR & Unlock", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }

                                paymentMessage?.let {
                                    Text(text = it, color = Color(0xFFF87171), fontSize = 11.sp)
                                }

                                // Send Proof via Telegram
                                Button(
                                    onClick = {
                                        val tgUrl = "https://t.me/YT_digicast?start=pay_${session.workspaceId}_${selectedPlan.id}"
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(tgUrl))
                                        context.startActivity(intent)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF229ED9)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(42.dp)
                                ) {
                                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp), tint = DigicastWhite)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Send Slip to Telegram Bot (@YT_digicast)", color = DigicastWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            if (hasSufficientCoins && showScannerView) {
                                Text(
                                    text = "← Back to D-Coin & Ad options",
                                    color = DigicastSlate,
                                    fontSize = 11.sp,
                                    modifier = Modifier
                                        .clickable { showScannerView = false }
                                        .padding(4.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }
}
}
