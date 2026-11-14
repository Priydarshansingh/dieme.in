package com.digicast.app.ui.screens.settings

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.digicast.app.data.repository.GamerAvatarDto
import com.digicast.app.data.repository.UserSession
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastAmber
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastSurfaceFloating
import com.digicast.app.ui.theme.DigicastWhite

// Helper to parse hex color safely
fun parseHexColor(hex: String, defaultColor: Color = DigicastElectricCyan): Color {
    return try {
        val clean = hex.removePrefix("#")
        val parsed = clean.toLong(16)
        if (clean.length == 6) {
            Color(parsed or 0xFF000000)
        } else {
            Color(parsed)
        }
    } catch (_: Exception) {
        defaultColor
    }
}

/**
 * Bento Card showcasing the Avatar selection with horizontal scroll on the main Settings screen.
 */
@Composable
fun DuolingoAvatarStudioBentoCard(
    session: UserSession,
    isPremium: Boolean = true,
    onEquipAvatar: (url: String, name: String) -> Unit,
    onOpenUpgrade: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DigicastCardSurface),
        border = BorderStroke(1.dp, DigicastBorder)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(DigicastAccentBlue.copy(alpha = 0.2f))
                            .border(1.dp, DigicastAccentBlue.copy(alpha = 0.4f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Palette,
                            contentDescription = null,
                            tint = DigicastElectricCyan,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "Avatar",
                                color = DigicastWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (!isPremium) {
                                Box(
                                    modifier = Modifier
                                        .background(DigicastAmber.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 5.dp, vertical = 2.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Lock,
                                            contentDescription = null,
                                            tint = DigicastAmber,
                                            modifier = Modifier.size(9.dp)
                                        )
                                        Text(
                                            text = "PRO",
                                            color = DigicastAmber,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.ExtraBold
                                        )
                                    }
                                }
                            }
                        }
                        Text(
                            text = "Tap to equip creator avatar directly",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(DigicastSurfaceElevated)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "1-Tap Equip",
                        color = DigicastElectricCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Horizontally swipeable 10 preview avatars
            val previewAvatars = listOf(
                Triple("Gojo", "https://www.dieme.in/avatars/gojo_satoru.svg", "#8B5CF6"),
                Triple("Goku", "https://www.dieme.in/avatars/goku_super_saiyan.svg", "#F59E0B"),
                Triple("Luffy", "https://www.dieme.in/avatars/luffy_gear5.svg", "#EC4899"),
                Triple("Jin-woo", "https://www.dieme.in/avatars/sung_jinwoo.svg", "#06B6D4"),
                Triple("Naruto", "https://www.dieme.in/avatars/naruto_sage.svg", "#F97316"),
                Triple("Zoro", "https://www.dieme.in/avatars/zoro_wano.svg", "#10B981"),
                Triple("Levi", "https://www.dieme.in/avatars/levi_ackerman.svg", "#64748B"),
                Triple("Tanjiro", "https://www.dieme.in/avatars/tanjiro_sun.svg", "#EF4444"),
                Triple("Sukuna", "https://www.dieme.in/avatars/sukuna_domain.svg", "#DC2626"),
                Triple("Eren", "https://www.dieme.in/avatars/eren_founder.svg", "#22C55E")
            )

            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(horizontal = 2.dp, vertical = 2.dp)
            ) {
                items(previewAvatars, key = { it.first }) { (name, url, colorHex) ->
                    val isCurrent = session.photoUrl == url
                    val heroColor = parseHexColor(colorHex)

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                        modifier = Modifier.clickable {
                            onEquipAvatar(url, name)
                        }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(DigicastSurfaceElevated)
                                .border(
                                    width = if (isCurrent) 2.5.dp else 1.dp,
                                    color = if (isCurrent) DigicastEmerald else heroColor.copy(alpha = 0.5f),
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = url,
                                contentDescription = name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                            )

                            if (isCurrent) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .size(17.dp)
                                        .clip(CircleShape)
                                        .background(DigicastEmerald),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Equipped",
                                        tint = DigicastDeepNavy,
                                        modifier = Modifier.size(10.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            text = name,
                            color = if (isCurrent) DigicastEmerald else DigicastSlate,
                            fontSize = 11.sp,
                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

/**
 * Duolingo-styled gamified Avatar Picker Dialog.
 */
@Composable
fun DuolingoAvatarPickerDialog(
    currentPhotoUrl: String,
    currentDisplayName: String,
    avatars: List<GamerAvatarDto>,
    isLoading: Boolean,
    isOwnerOrAdmin: Boolean,
    isPremium: Boolean = true,
    onDismiss: () -> Unit,
    onSelectAvatar: (GamerAvatarDto) -> Unit,
    onOpenAddAvatar: () -> Unit,
    onOpenUpgrade: () -> Unit = {}
) {
    val activeAvatar = avatars.find { it.url == currentPhotoUrl }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DigicastSurfaceFloating,
        shape = RoundedCornerShape(22.dp),
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(DigicastEmerald.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = DigicastEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "STUDIO CHAMPION",
                                color = DigicastWhite,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Select your anime gamer avatar",
                                color = DigicastSlate,
                                fontSize = 11.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = DigicastSlate,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Active Champion Banner (Duolingo Style Showcase)
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = DigicastNavy,
                    border = BorderStroke(1.dp, DigicastBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Big Circular Avatar Frame
                        Box(
                            modifier = Modifier
                                .size(58.dp)
                                .clip(CircleShape)
                                .background(DigicastSurfaceElevated)
                                .border(
                                    width = 2.dp,
                                    color = if (activeAvatar != null) parseHexColor(activeAvatar.color) else DigicastElectricCyan,
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (currentPhotoUrl.isNotBlank()) {
                                AsyncImage(
                                    model = currentPhotoUrl,
                                    contentDescription = "Active Avatar",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else {
                                Text(
                                    text = currentDisplayName.take(1).uppercase(),
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 20.sp
                                )
                            }
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = activeAvatar?.name ?: currentDisplayName,
                                    color = DigicastWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Box(
                                    modifier = Modifier
                                        .background(DigicastEmerald.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 4.dp, vertical = 1.dp)
                                ) {
                                    Text(
                                        text = "ACTIVE",
                                        color = DigicastEmerald,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                            Text(
                                text = activeAvatar?.badge ?: "Custom Avatar",
                                color = if (activeAvatar != null) parseHexColor(activeAvatar.color) else DigicastElectricCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = activeAvatar?.series ?: "Studio Creator",
                                color = DigicastSlate,
                                fontSize = 10.sp
                            )
                        }
                    }
                }

                // Avatars Roster (Scrollable Horizontal Carousel / Cards)
                Text(
                    text = "AVAILABLE HEROES (${avatars.size})",
                    color = DigicastSlate,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 10.sp,
                    letterSpacing = 0.5.sp
                )

                if (isLoading && avatars.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = DigicastElectricCyan, modifier = Modifier.size(28.dp))
                    }
                } else {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        items(avatars, key = { it.id }) { avatar ->
                            val isEquipped = avatar.url == currentPhotoUrl
                            val color = parseHexColor(avatar.color)

                            Surface(
                                modifier = Modifier
                                    .width(115.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable {
                                        if (isPremium) {
                                            onSelectAvatar(avatar)
                                        } else {
                                            onDismiss()
                                            onOpenUpgrade()
                                        }
                                    },
                                shape = RoundedCornerShape(14.dp),
                                color = if (isEquipped) DigicastEmerald.copy(alpha = 0.15f) else DigicastNavy,
                                border = BorderStroke(
                                    width = if (isEquipped) 2.dp else 1.dp,
                                    color = if (isEquipped) DigicastEmerald else if (!isPremium) DigicastBorder else color.copy(alpha = 0.5f)
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    // Avatar circle with aura border
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(CircleShape)
                                            .background(DigicastSurfaceElevated)
                                            .border(1.5.dp, if (!isPremium) DigicastBorder else color, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        AsyncImage(
                                            model = avatar.url,
                                            contentDescription = avatar.name,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(CircleShape)
                                        )

                                        if (!isPremium) {
                                            Box(
                                                modifier = Modifier
                                                    .align(Alignment.BottomEnd)
                                                    .size(17.dp)
                                                    .clip(CircleShape)
                                                    .background(DigicastCardSurface)
                                                    .border(1.dp, DigicastAmber, CircleShape),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Lock,
                                                    contentDescription = "Locked",
                                                    tint = DigicastAmber,
                                                    modifier = Modifier.size(9.dp)
                                                )
                                            }
                                        }
                                    }

                                    // Name
                                    Text(
                                        text = avatar.name,
                                        color = DigicastWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        textAlign = TextAlign.Center
                                    )

                                    // Series & Badge
                                    Box(
                                        modifier = Modifier
                                            .background(color.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 4.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = avatar.badge,
                                            color = color,
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1
                                        )
                                    }

                                    // Equip / Unlock Button
                                    Surface(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(6.dp))
                                            .clickable {
                                                if (isPremium) {
                                                    onSelectAvatar(avatar)
                                                } else {
                                                    onDismiss()
                                                    onOpenUpgrade()
                                                }
                                            },
                                        shape = RoundedCornerShape(6.dp),
                                        color = if (isEquipped) DigicastEmerald else if (!isPremium) DigicastAmber.copy(alpha = 0.2f) else DigicastSurfaceElevated
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            if (isEquipped) {
                                                Icon(
                                                    imageVector = Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = DigicastWhite,
                                                    modifier = Modifier.size(10.dp)
                                                )
                                                Spacer(modifier = Modifier.width(3.dp))
                                            } else if (!isPremium) {
                                                Icon(
                                                    imageVector = Icons.Default.Lock,
                                                    contentDescription = null,
                                                    tint = DigicastAmber,
                                                    modifier = Modifier.size(10.dp)
                                                )
                                                Spacer(modifier = Modifier.width(3.dp))
                                            }
                                            Text(
                                                text = if (isEquipped) "ACTIVE" else if (!isPremium) "UNLOCK" else "EQUIP",
                                                color = if (!isPremium) DigicastAmber else DigicastWhite,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.ExtraBold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Admin Add Custom Avatar Action
                if (isOwnerOrAdmin) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { onOpenAddAvatar() },
                        color = DigicastSurfaceElevated,
                        border = BorderStroke(1.dp, DigicastBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = null,
                                tint = DigicastElectricCyan,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Add Custom Avatar (Admin)",
                                color = DigicastWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = DigicastSlate, fontWeight = FontWeight.Bold)
            }
        }
    )
}

/**
 * Dialog allowing Admin/Owner to add a custom avatar by Name, Series, Badge, URL and Accent color.
 */
@Composable
fun AddCustomAvatarDialog(
    onDismiss: () -> Unit,
    onSubmit: (name: String, series: String, badge: String, color: String, url: String, desc: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var series by remember { mutableStateOf("") }
    var badge by remember { mutableStateOf("") }
    var url by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("#8B5CF6") }
    var desc by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DigicastSurfaceFloating,
        shape = RoundedCornerShape(20.dp),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    tint = DigicastElectricCyan,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = "Add Gamer Avatar",
                    color = DigicastWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Publish a new anime or gamer avatar to your studio roster.",
                    color = DigicastSlate,
                    fontSize = 12.sp
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Character Name (e.g. Tanjiro)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = DigicastWhite,
                        unfocusedTextColor = DigicastWhite,
                        focusedBorderColor = DigicastElectricCyan,
                        unfocusedBorderColor = DigicastBorder
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = series,
                        onValueChange = { series = it },
                        label = { Text("Anime/Game") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = DigicastWhite,
                            unfocusedTextColor = DigicastWhite,
                            focusedBorderColor = DigicastElectricCyan,
                            unfocusedBorderColor = DigicastBorder
                        )
                    )
                    OutlinedTextField(
                        value = badge,
                        onValueChange = { badge = it },
                        label = { Text("Power Badge") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = DigicastWhite,
                            unfocusedTextColor = DigicastWhite,
                            focusedBorderColor = DigicastElectricCyan,
                            unfocusedBorderColor = DigicastBorder
                        )
                    )
                }

                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("Avatar Image URL (SVG/PNG/JPG)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = DigicastWhite,
                        unfocusedTextColor = DigicastWhite,
                        focusedBorderColor = DigicastElectricCyan,
                        unfocusedBorderColor = DigicastBorder
                    )
                )

                // Color picker quick pills
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val colors = listOf("#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#F97316", "#10B981")
                    colors.forEach { c ->
                        val parsed = parseHexColor(c)
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(parsed)
                                .border(
                                    width = if (color == c) 2.5.dp else 1.dp,
                                    color = if (color == c) DigicastWhite else Color.Transparent,
                                    shape = CircleShape
                                )
                                .clickable { color = c }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && url.isNotBlank()) {
                        isSubmitting = true
                        onSubmit(name.trim(), series.trim(), badge.trim(), color, url.trim(), desc.trim())
                    }
                },
                enabled = name.isNotBlank() && url.isNotBlank() && !isSubmitting,
                colors = ButtonDefaults.buttonColors(containerColor = DigicastElectricCyan),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Publish Avatar", color = DigicastNavy, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = DigicastSlate)
            }
        }
    )
}

