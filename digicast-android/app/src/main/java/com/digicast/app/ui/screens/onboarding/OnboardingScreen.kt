package com.digicast.app.ui.screens.onboarding

import android.app.Activity
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import com.digicast.app.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.digicast.app.data.ads.AdMobManager
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.ui.components.DigicastLogo
import com.digicast.app.ui.screens.settings.SettingsAuthWrapperViewModel
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastNeonLime
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val authState by authRepository.authState.collectAsState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Ad playback state for fallback partner video
    var showAdDialog by remember { mutableStateOf(false) }
    var adProgress by remember { mutableFloatStateOf(0f) }
    var adSecondsLeft by remember { mutableIntStateOf(5) }

    // Preload AdMob Rewarded Ad when Onboarding loads
    LaunchedEffect(Unit) {
        AdMobManager.loadRewardedAd(context)
    }

    // Already signed in from a previous session — go directly to dashboard
    LaunchedEffect(authState) {
        if (authState is AuthState.SignedIn) {
            onComplete()
        }
    }

    Scaffold(containerColor = DigicastDeepNavy) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(10.dp))

            // Brand Logo & Stylized Name Header
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo_round),
                    contentDescription = "Digicast Studio",
                    modifier = Modifier.size(76.dp)
                )

                Image(
                    painter = painterResource(id = R.drawable.logo_text),
                    contentDescription = "DIGICAST Live",
                    modifier = Modifier
                        .height(42.dp)
                        .fillMaxWidth(0.65f),
                    contentScale = ContentScale.Fit
                )
            }

            // Sign-In Card — email and password
            Card(
                colors = CardDefaults.cardColors(),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Sign in to your Studio",
                        color = DigicastWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "Use the App Login created by your workspace owner on digicast-web.",
                        color = DigicastSlate,
                        fontSize = 12.sp,
                        lineHeight = 17.sp
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            errorMessage = null
                        },
                        label = { Text("App Email", color = DigicastSlate) },
                        leadingIcon = {
                            Icon(Icons.Default.Email, contentDescription = null, tint = DigicastAccentBlue)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = DigicastAccentBlue,
                            unfocusedBorderColor = DigicastNavy,
                            focusedTextColor = DigicastWhite,
                            unfocusedTextColor = DigicastWhite,
                            focusedContainerColor = DigicastNavy,
                            unfocusedContainerColor = DigicastNavy
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            errorMessage = null
                        },
                        label = { Text("Password", color = DigicastSlate) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = DigicastAccentBlue)
                        },
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = DigicastSlate
                                )
                            }
                        },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = DigicastAccentBlue,
                            unfocusedBorderColor = DigicastNavy,
                            focusedTextColor = DigicastWhite,
                            unfocusedTextColor = DigicastWhite,
                            focusedContainerColor = DigicastNavy,
                            unfocusedContainerColor = DigicastNavy
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = DigicastLiveRed,
                            fontSize = 12.sp
                        )
                    }

                    // Primary sign-in button
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            if (email.isBlank() || !email.contains("@")) {
                                errorMessage = "Enter a valid email address."
                                return@Button
                            }
                            if (password.isBlank()) {
                                errorMessage = "Enter your password."
                                return@Button
                            }
                            isLoading = true
                            errorMessage = null
                            scope.launch {
                                val result = authRepository.signInWithEmail(email.trim(), password)
                                isLoading = false
                                result.onSuccess {
                                    onComplete()
                                }
                                result.onFailure { err ->
                                    errorMessage = err.message ?: "Sign-in failed. Check your credentials and connection."
                                }
                            }
                        },
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = DigicastAccentBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = DigicastWhite,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Connecting...", color = DigicastWhite, fontWeight = FontWeight.Bold)
                        } else {
                            Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Sign In", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                }
            }

            // ─── Free Creator Pass / 1-Day Access Section ────────────────────
            val hasActivePass = authRepository.isOneDayPassActive()
            val (passHours, passMins) = authRepository.getOneDayPassRemainingHoursMinutes()

            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (hasActivePass) DigicastEmerald.copy(alpha = 0.12f) else DigicastCardSurface
                ),
                shape = RoundedCornerShape(18.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (hasActivePass) DigicastEmerald.copy(alpha = 0.6f) else DigicastBorder
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (hasActivePass) {
                        // Pass is already active! Show remaining time and direct continue
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(DigicastEmerald.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = DigicastEmerald,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "1-Day Studio Pass Active",
                                    color = DigicastEmerald,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "Active 1-Day Use: ${passHours}h ${passMins}m remaining",
                                    color = DigicastWhite,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Text(
                            text = "Your 24-hour full studio pass is active! All live streams, marker clips, and studio tools are unlocked.",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )

                        Button(
                            onClick = {
                                authRepository.enterDemoMode()
                                onComplete()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Continue with 1-Day Pass", color = DigicastDeepNavy, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    } else {
                        // Pass not yet active
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
                                    imageVector = Icons.Default.CardGiftcard,
                                    contentDescription = null,
                                    tint = DigicastNeonLime,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Free Pass & Demo Access",
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "No login or password needed to use the Studio",
                                    color = DigicastSlate,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Text(
                            text = "Free users: Watch 1 partner video to unlock 24-hour full studio access and earn +10 D-Coins, or jump straight into the demo.",
                            color = DigicastSlate,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )

                        // 1. Watch ad for 1-day access
                        Button(
                            onClick = {
                                val activity = context as? Activity
                                if (activity != null && AdMobManager.isAdAvailable()) {
                                    AdMobManager.showRewardedAd(
                                        activity = activity,
                                        onUserEarnedReward = {
                                            authRepository.activateOneDayPass(fromAd = true)
                                            onComplete()
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
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastNeonLime),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastDeepNavy)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Watch Ad for 1-Day Access (+10 D)",
                                color = DigicastDeepNavy,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.sp
                            )
                        }

                        // 2. Instant 1-day demo use
                        OutlinedButton(
                            onClick = {
                                authRepository.activateOneDayPass(fromAd = false)
                                onComplete()
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastSlate),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DigicastBorder),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp), tint = DigicastAccentBlue)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Activate 1-Day Free Access (Instant)", fontSize = 13.sp, color = DigicastWhite)
                        }
                    }
                }
            }

            // High-Value Sponsored Ad Simulation Dialog (Fallback while AdMob unit propagates)
            if (showAdDialog) {
                LaunchedEffect(showAdDialog) {
                    val totalTicks = 50
                    for (i in 1..totalTicks) {
                        delay(100)
                        adProgress = i / totalTicks.toFloat()
                        adSecondsLeft = 5 - (i / 10)
                    }
                    authRepository.activateOneDayPass(fromAd = true)
                    showAdDialog = false
                    onComplete()
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
                                        text = "Rewarding your studio with 24h Pass & 10 D-Coins",
                                        color = DigicastSlate,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Ad finishes in ${adSecondsLeft.coerceAtLeast(0)}s",
                                    color = DigicastSlate,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "Reward: 24h Pass",
                                    color = DigicastNeonLime,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    },
                    confirmButton = {}
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun FeatureRow(icon: ImageVector, title: String, desc: String) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(DigicastNavy, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = DigicastAccentBlue, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = DigicastWhite, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            Text(desc, color = DigicastSlate, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}
