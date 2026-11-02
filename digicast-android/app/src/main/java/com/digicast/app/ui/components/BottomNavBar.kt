package com.digicast.app.ui.components

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
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
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
private val BorderColor = Color(0x33FFFFFF)

@Composable
fun BottomNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = remember {
        listOf(
            NavItem(Screen.Home.route, "Home", Icons.Filled.Home, Icons.Outlined.Home),
            NavItem(Screen.Clips.route, "Clips", Icons.Filled.LocalFireDepartment, Icons.Filled.LocalFireDepartment),
            NavItem(Screen.Streams.route, "Streams", Icons.Filled.LiveTv, Icons.Outlined.LiveTv)
        )
    }

    var lastValidIndex by remember { mutableIntStateOf(0) }
    val routeIndex = items.indexOfFirst { it.route == currentRoute }
    val selectedIndex = if (routeIndex >= 0) {
        lastValidIndex = routeIndex
        routeIndex
    } else {
        lastValidIndex
    }

    // Animated notch horizontal fraction across the bar (0.0 .. 1.0) with fluid, critically-damped spring
    val animatedFraction by animateFloatAsState(
        targetValue = (selectedIndex + 0.5f) / items.size.toFloat(),
        animationSpec = spring(
            dampingRatio = 0.85f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "notch_fraction"
    )

    val density = LocalDensity.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(DigicastDeepNavy)
            .navigationBarsPadding()
            .padding(start = 20.dp, end = 20.dp, bottom = 12.dp, top = 12.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        val barHeight = 64.dp
        val cornerRadius = 24.dp
        val circleSize = 46.dp

        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .height(barHeight)
        ) {
            val cornerRadiusPx = with(density) { cornerRadius.toPx() }
            val scoopHalfWidth = with(density) { 32.dp.toPx() }
            val scoopDepth = with(density) { 20.dp.toPx() }

            // 1. Curved Background with Animated Scooped Notch
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                val cx = w * animatedFraction

                val scoopLeft = (cx - scoopHalfWidth).coerceAtLeast(cornerRadiusPx)
                val scoopRight = (cx + scoopHalfWidth).coerceAtMost(w - cornerRadiusPx)
                val leftDelta = (cx - scoopLeft).coerceAtLeast(1f)
                val rightDelta = (scoopRight - cx).coerceAtLeast(1f)

                val path = Path().apply {
                    moveTo(cornerRadiusPx, 0f)
                    lineTo(scoopLeft, 0f)

                    // Smooth concave cubic scoop with progressive inflection
                    cubicTo(
                        x1 = cx - leftDelta * 0.55f, y1 = 0f,
                        x2 = cx - leftDelta * 0.35f, y2 = scoopDepth,
                        x3 = cx, y3 = scoopDepth
                    )
                    cubicTo(
                        x1 = cx + rightDelta * 0.35f, y1 = scoopDepth,
                        x2 = cx + rightDelta * 0.55f, y2 = 0f,
                        x3 = scoopRight, y3 = 0f
                    )

                    lineTo(w - cornerRadiusPx, 0f)
                    quadraticTo(w, 0f, w, cornerRadiusPx)
                    lineTo(w, h - cornerRadiusPx)
                    quadraticTo(w, h, w - cornerRadiusPx, h)
                    lineTo(cornerRadiusPx, h)
                    quadraticTo(0f, h, 0f, h - cornerRadiusPx)
                    lineTo(0f, cornerRadiusPx)
                    quadraticTo(0f, 0f, cornerRadiusPx, 0f)
                    close()
                }

                // Fill Apple dark-edge pill gradient (darker on outer sides, silk center)
                drawPath(path = path, brush = AppleDarkEdgePillBrush, style = Fill)
                // Specular hairline outline border
                drawPath(path = path, color = BorderColor, style = Stroke(width = with(density) { 1.dp.toPx() }))
            }

            // 2. Continuous Proximity-Faded Stationary Tab Icons
            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEachIndexed { index, item ->
                    val tabFraction = (index + 0.5f) / items.size.toFloat()
                    val distance = kotlin.math.abs(animatedFraction - tabFraction) * items.size.toFloat()
                    val iconAlpha = (distance * 1.5f).coerceIn(0f, 1f) * 0.9f
                    val iconScale = 0.85f + 0.15f * iconAlpha

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
                        if (iconAlpha > 0.05f) {
                            Icon(
                                imageVector = item.unselectedIcon,
                                contentDescription = item.label,
                                tint = Color.White.copy(alpha = iconAlpha),
                                modifier = Modifier
                                    .size(24.dp)
                                    .scale(iconScale)
                            )
                        }
                    }
                }
            }

            // 3. Continuous Sliding Active Circle Bubble with Crossfading Icon
            val activeItem = items[selectedIndex]
            val circleOffsetX = (maxWidth * animatedFraction) - (circleSize / 2)

            Box(
                modifier = Modifier
                    .offset(x = circleOffsetX, y = (-7).dp)
                    .size(circleSize)
                    .shadow(
                        elevation = 12.dp,
                        shape = CircleShape,
                        spotColor = Color.Black.copy(alpha = 0.55f),
                        ambientColor = Color.Black.copy(alpha = 0.35f)
                    )
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Crossfade(
                    targetState = activeItem,
                    animationSpec = tween(150),
                    label = "bubble_icon_crossfade"
                ) { targetItem ->
                    Icon(
                        imageVector = targetItem.selectedIcon,
                        contentDescription = targetItem.label,
                        tint = ActiveIconColor,
                        modifier = Modifier.size(25.dp)
                    )
                }
            }
        }
    }
}
