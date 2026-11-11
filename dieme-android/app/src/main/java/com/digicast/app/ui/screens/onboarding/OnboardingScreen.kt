package com.digicast.app.ui.screens.onboarding

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.draw.clip
import androidx.compose.ui.autofill.AutofillType
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalAutofill
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import com.digicast.app.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInNew
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
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
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

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val authState by authRepository.authState.collectAsState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current

    val (savedEmail, savedPassword) = remember { authRepository.getSavedCredentials() }
    var email by remember { mutableStateOf(savedEmail) }
    var password by remember { mutableStateOf(savedPassword) }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isErrorExpanded by remember { mutableStateOf(false) }
    var showPassUnlockedPopup by remember { mutableStateOf(false) }

    // Check device verification state
    val hasRegisteredAccount = savedEmail.isNotBlank()
    var hasWatchedAd by remember { mutableStateOf(authRepository.hasWatchedAdToUnlock()) }
    val hasActivePass = authRepository.isOneDayPassActive()
    val (passHours, passMins) = authRepository.getOneDayPassRemainingHoursMinutes()

    // Sign in is strictly enabled ONLY if user has an active 24h pass or watched an ad
    val isSignInUnlocked = hasWatchedAd || hasActivePass

    // Ad playback state
    var showAdDialog by remember { mutableStateOf(false) }
    var adProgress by remember { mutableFloatStateOf(0f) }
    var adSecondsLeft by remember { mutableIntStateOf(5) }

    // Preload AdMob Rewarded Ad when Onboarding loads (never auto-show, only prefetch)
    LaunchedEffect(Unit) {
        AdMobManager.loadRewardedAd(context)
    }

    // Already signed in from a previous session — verify active pass/premium before navigating
    LaunchedEffect(authState) {
        if (authState is AuthState.SignedIn) {
            val session = (authState as AuthState.SignedIn).session
            if (authRepository.isPremiumUser(session) || authRepository.isOneDayPassActive()) {
                onComplete()
            }
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
                    contentDescription = "Dieme Studio",
                    modifier = Modifier.size(76.dp)
                )

                Text(
                    text = "Dieme",
                    color = DigicastWhite,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 32.sp,
                    letterSpacing = (-1).sp
                )
            }

            // Sign-In Card — email and password
            Card(
                colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, DigicastBorder),
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
                        fontSize = 17.sp
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            // Automatically remove accidental spaces or mobile keyboard auto-spaces
                            email = it.replace("\\s+".toRegex(), "")
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
                        val isLong = (errorMessage?.length ?: 0) > 70
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = DigicastLiveRed.copy(alpha = 0.12f),
                            border = BorderStroke(1.dp, DigicastLiveRed.copy(alpha = 0.35f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = DigicastLiveRed,
                                    modifier = Modifier.size(16.dp).padding(top = 1.dp)
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = errorMessage!!,
                                        color = DigicastLiveRed,
                                        fontSize = 11.5.sp,
                                        lineHeight = 16.sp,
                                        maxLines = if (isErrorExpanded || !isLong) Int.MAX_VALUE else 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    if (isLong) {
                                        Text(
                                            text = if (isErrorExpanded) "Show less" else "Read more",
                                            color = DigicastAccentBlue,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier
                                                .clickable { isErrorExpanded = !isErrorExpanded }
                                                .padding(top = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 1. Primary Sign-In Button (Grayed out for brand new free users until they watch ad)
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            val cleanEmail = email.replace("\\s+".toRegex(), "").trim().lowercase()
                            val cleanPassword = password.trim()

                            if (cleanEmail.isBlank()) {
                                errorMessage = "Enter a valid email address."
                                return@Button
                            }
                            if (cleanPassword.isBlank()) {
                                errorMessage = "Enter your password."
                                return@Button
                            }
                            isLoading = true
                            errorMessage = null
                            scope.launch {
                                val finalEmail = if (!cleanEmail.contains("@")) "$cleanEmail@gmail.com" else cleanEmail
                                val result = authRepository.signInWithEmail(finalEmail, cleanPassword)
                                isLoading = false
                                result.onSuccess {
                                    onComplete()
                                }
                                result.onFailure { err ->
                                    val raw = err.message ?: ""
                                    errorMessage = when {
                                        raw.contains("No account found", ignoreCase = true) || raw.contains("user-not-found", ignoreCase = true) ->
                                            "We couldn't find an account for this email. Check the spelling or ask your studio owner to add your email under Team Access."
                                        raw.contains("password", ignoreCase = true) || raw.contains("wrong-password", ignoreCase = true) ->
                                            "Incorrect password. Please verify your password or ask your studio admin to reset it."
                                        else -> "Sign-in failed. Please verify your credentials and network connection."
                                    }
                                }
                            }
                        },
                        enabled = !isLoading && isSignInUnlocked,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isSignInUnlocked) DigicastAccentBlue else DigicastNavy,
                            disabledContainerColor = DigicastNavy.copy(alpha = 0.5f),
                            disabledContentColor = DigicastSlate.copy(alpha = 0.5f)
                        ),
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
                            Icon(
                                imageVector = if (isSignInUnlocked) Icons.Default.Lock else Icons.Default.Lock,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isSignInUnlocked) "Sign In to Studio" else "Sign In (Unlock Below)",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSignInUnlocked) DigicastWhite else DigicastSlate
                            )
                        }
                    }

                    // 2. Action Button:
                    // If locked -> "Watch Ad to Unlock Access (+24h Pass)"
                    // If unlocked -> "Create Account on Digicast Web" (so anyone without an account can register on web)
                    if (!isSignInUnlocked) {
                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                val activity = context as? Activity
                                if (activity != null && AdMobManager.isAdAvailable()) {
                                    AdMobManager.showRewardedAd(
                                        activity = activity,
                                        onUserEarnedReward = {
                                            authRepository.markAdWatchedUnlocked()
                                            hasWatchedAd = true
                                            showPassUnlockedPopup = true
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
                            colors = ButtonDefaults.buttonColors(
                                containerColor = DigicastAccentBlue
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = DigicastWhite
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (hasRegisteredAccount) "Renew 24h Studio Access" else "Unlock 24h Studio Access (15s Ad)",
                                color = DigicastWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        // Unlocked: Direct to website signup for anyone who doesn't have an account yet
                        OutlinedButton(
                            onClick = {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.dieme.in/signup"))
                                context.startActivity(browserIntent)
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DigicastAccentBlue),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DigicastAccentBlue),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(18.dp), tint = DigicastAccentBlue)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Create Account on Dieme Web", color = DigicastWhite, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }

                    // Subtitle explaining verification rule
                    Text(
                        text = if (!isSignInUnlocked) {
                            "🔒 Free devices: Tap \"Watch Ad to Unlock Access\" to activate the Sign-In button and your 24h pass."
                        } else {
                            "Have an account? Sign in above. New user? Tap \"Create Account on Dieme Web\" below."
                        },
                        color = DigicastSlate,
                        fontSize = 11.sp,
                        lineHeight = 15.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp)
                    )
                }
            }

            // High-Value Sponsored Ad Simulation Dialog (Plays smoothly if AdMob network unit is buffering)
            if (showAdDialog) {
                LaunchedEffect(showAdDialog) {
                    AdMobManager.setFallbackProvider("SPONSORED_PARTNER")
                    val totalTicks = 50
                    for (i in 1..totalTicks) {
                        delay(100)
                        adProgress = i / totalTicks.toFloat()
                        adSecondsLeft = 5 - (i / 10)
                    }
                    authRepository.markAdWatchedUnlocked()
                    hasWatchedAd = true
                    showAdDialog = false
                    showPassUnlockedPopup = true
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
                                tint = DigicastAccentBlue,
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
                                        color = DigicastAccentBlue,
                                        strokeWidth = 3.dp,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Text(
                                        text = "Dieme Studio Pro Ecosystem",
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
                                    color = DigicastAccentBlue,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    },
                    confirmButton = {}
                )
            }

            // 24-Hour Access Enabled Celebration Popup
            if (showPassUnlockedPopup) {
                AlertDialog(
                    onDismissRequest = { showPassUnlockedPopup = false },
                    containerColor = DigicastNavy,
                    shape = RoundedCornerShape(20.dp),
                    icon = {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(DigicastEmerald.copy(alpha = 0.15f))
                                .border(1.5.dp, DigicastEmerald.copy(alpha = 0.4f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = DigicastEmerald,
                                modifier = Modifier.size(30.dp)
                            )
                        }
                    },
                    title = {
                        Text(
                            text = "24-Hour Access Enabled!",
                            color = DigicastWhite,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            textAlign = TextAlign.Center
                        )
                    },
                    text = {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "🎉 Your studio access has been activated for the next 24 hours.",
                                color = DigicastWhite,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "Sign in with your workspace credentials below or create a new account on web.",
                                color = DigicastSlate,
                                fontSize = 12.sp,
                                lineHeight = 16.sp,
                                textAlign = TextAlign.Center
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = { showPassUnlockedPopup = false },
                            colors = ButtonDefaults.buttonColors(containerColor = DigicastEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Text(
                                "Got It • Sign In Now",
                                color = DigicastDeepNavy,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 14.sp
                            )
                        }
                    }
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
