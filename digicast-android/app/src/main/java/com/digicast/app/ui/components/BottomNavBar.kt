package com.digicast.app.ui.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.outlined.ContentCut
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.digicast.app.ui.navigation.Screen
import com.digicast.app.ui.theme.AppleDarkEdgePillBrush
import com.digicast.app.ui.theme.DigicastDeepNavy

private data class NavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

// Deep Teal Silk Bottom Nav Bar styling
private val ActiveIconColor = Color(0xFF0B3037)
private val BarBgColor = Color(0xFF0B3037)
private val BorderColor = Color(0x33FFFFFF)

@Composable
fun BottomNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        NavItem(Screen.Home.route, "Home", Icons.Filled.Home, Icons.Outlined.Home),
        NavItem(Screen.Clips.route, "Clips", Icons.Filled.LocalFireDepartment, Icons.Filled.LocalFireDepartment),
        NavItem(Screen.Streams.route, "Streams", Icons.Filled.LiveTv, Icons.Outlined.LiveTv)
    )

    val selectedIndex = items.indexOfFirst { it.route == currentRoute }.coerceAtLeast(0)

    // Animated notch horizontal fraction across the bar (0.0 .. 1.0) with fluid spring physics
    val animatedFraction by animateFloatAsState(
        targetValue = (selectedIndex + 0.5f) / items.size.toFloat(),
        animationSpec = spring(
            dampingRatio = 0.72f,
            stiffness = Spring.StiffnessMediumLow
        ),
        label = "notch_fraction"
    )

    val density = LocalDensity.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(DigicastDeepNavy)
            .navigationBarsPadding()
            .padding(start = 24.dp, end = 24.dp, bottom = 12.dp, top = 14.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        val barHeight = 64.dp
        val cornerRadius = 28.dp
        val circleSize = 48.dp

        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .height(barHeight)
        ) {
            val totalWidthPx = constraints.maxWidth.toFloat()
            val cornerRadiusPx = with(density) { cornerRadius.toPx() }
            val scoopHalfWidth = with(density) { 38.dp.toPx() }
            val scoopDepth = with(density) { 24.dp.toPx() }

            // 1. Curved Background with Animated Scooped Notch
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                val cx = w * animatedFraction

                val path = Path().apply {
                    moveTo(cornerRadiusPx, 0f)

                    val scoopLeft = cx - scoopHalfWidth
                    val scoopRight = cx + scoopHalfWidth

                    if (scoopLeft > cornerRadiusPx) {
                        lineTo(scoopLeft, 0f)
                    }

                    // Smooth concave cubic scoop matching video
                    cubicTo(
                        x1 = cx - scoopHalfWidth * 0.55f, y1 = 0f,
                        x2 = cx - scoopHalfWidth * 0.42f, y2 = scoopDepth,
                        x3 = cx, y3 = scoopDepth
                    )
                    cubicTo(
                        x1 = cx + scoopHalfWidth * 0.42f, y1 = scoopDepth,
                        x2 = cx + scoopHalfWidth * 0.55f, y2 = 0f,
                        x3 = scoopRight, y3 = 0f
                    )

                    lineTo(w - cornerRadiusPx, 0f)
                    quadraticBezierTo(w, 0f, w, cornerRadiusPx)
                    lineTo(w, h - cornerRadiusPx)
                    quadraticBezierTo(w, h, w - cornerRadiusPx, h)
                    lineTo(cornerRadiusPx, h)
                    quadraticBezierTo(0f, h, 0f, h - cornerRadiusPx)
                    lineTo(0f, cornerRadiusPx)
                    quadraticBezierTo(0f, 0f, cornerRadiusPx, 0f)
                    close()
                }

                // Fill Apple dark-edge pill gradient (darker on outer sides, silk center)
                drawPath(path = path, brush = AppleDarkEdgePillBrush, style = Fill)
                // Outline border
                drawPath(path = path, color = BorderColor, style = Stroke(width = with(density) { 1.dp.toPx() }))
            }

            // 2. Unselected White Flat Tab Icons
            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEachIndexed { index, item ->
                    val isSelected = index == selectedIndex
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxSize()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                onNavigate(item.route)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (!isSelected) {
                            Icon(
                                imageVector = item.unselectedIcon,
                                contentDescription = item.label,
                                tint = Color.White.copy(alpha = 0.9f),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }

            // 3. Continuous Sliding Active Circle Bubble
            val activeItem = items[selectedIndex]
            val circleOffsetX = (maxWidth * animatedFraction) - (circleSize / 2)

            Box(
                modifier = Modifier
                    .offset(x = circleOffsetX, y = (-7).dp)
                    .size(circleSize)
                    .shadow(
                        elevation = 14.dp,
                        shape = CircleShape,
                        spotColor = Color.Black.copy(alpha = 0.6f),
                        ambientColor = Color.Black.copy(alpha = 0.35f)
                    )
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = activeItem.selectedIcon,
                    contentDescription = activeItem.label,
                    tint = ActiveIconColor,
                    modifier = Modifier.size(26.dp)
                )
            }
        }
    }
}
