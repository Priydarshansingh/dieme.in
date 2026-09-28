package com.digicast.app.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.ContentCut
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.navigation.Screen
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastMuted
import com.digicast.app.ui.theme.DigicastNavy
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
    val items = listOf(
        NavItem(Screen.Home.route, "Home", Icons.Filled.Home, Icons.Outlined.Home),
        NavItem(Screen.Streams.route, "Streams", Icons.Filled.LiveTv, Icons.Outlined.LiveTv),
        NavItem(Screen.Clips.route, "Clips", Icons.Filled.ContentCut, Icons.Outlined.ContentCut),
        NavItem(Screen.Team.route, "Team", Icons.Filled.Group, Icons.Outlined.Group),
        NavItem(Screen.Settings.route, "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
    )

    NavigationBar(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DigicastBorder, RoundedCornerShape(0.dp)),
        containerColor = DigicastNavy,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(item.route) },
                icon = {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label,
                        tint = if (isSelected) DigicastWhite else DigicastMuted
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        fontSize = 11.sp,
                        color = if (isSelected) DigicastWhite else DigicastMuted
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = DigicastWhite,
                    selectedTextColor = DigicastWhite,
                    unselectedIconColor = DigicastMuted,
                    unselectedTextColor = DigicastMuted,
                    indicatorColor = DigicastSurfaceElevated
                )
            )
        }
    }
}
