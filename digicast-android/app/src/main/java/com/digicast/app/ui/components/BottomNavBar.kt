package com.digicast.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.outlined.ContentCut
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.digicast.app.ui.navigation.Screen
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastDeepNavy
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurfaceElevated
import com.digicast.app.ui.theme.DigicastWhite

private data class NavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

@Composable
fun BottomNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    // 3 primary tabs: Home, Clips, Streams
    val items = listOf(
        NavItem(Screen.Home.route, "Home", Icons.Filled.Home, Icons.Outlined.Home),
        NavItem(Screen.Clips.route, "Clips", Icons.Filled.ContentCut, Icons.Outlined.ContentCut),
        NavItem(Screen.Streams.route, "Streams", Icons.Filled.LiveTv, Icons.Outlined.LiveTv)
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(DigicastDeepNavy)
            .navigationBarsPadding()
            .padding(start = 28.dp, end = 28.dp, bottom = 12.dp, top = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .shadow(
                    elevation = 16.dp,
                    shape = CircleShape,
                    spotColor = Color.Black.copy(alpha = 0.5f),
                    ambientColor = Color.Black.copy(alpha = 0.3f)
                ),
            shape = CircleShape,
            color = DigicastSurfaceElevated,
            border = BorderStroke(1.dp, DigicastBorder.copy(alpha = 0.9f))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEach { item ->
                    val isSelected = currentRoute == item.route

                    val activeCircleColor by animateColorAsState(
                        targetValue = if (isSelected) DigicastWhite else Color.Transparent,
                        animationSpec = tween(durationMillis = 200),
                        label = "active_circle_bg"
                    )

                    val activeIconColor by animateColorAsState(
                        targetValue = if (isSelected) DigicastDarkText else DigicastSlate,
                        animationSpec = tween(durationMillis = 200),
                        label = "active_icon_color"
                    )

                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(activeCircleColor)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                onNavigate(item.route)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                            contentDescription = item.label,
                            tint = activeIconColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }
    }
}
