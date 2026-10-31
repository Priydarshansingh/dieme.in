package com.digicast.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastDarkText
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSurface
import com.digicast.app.ui.theme.DigicastWhite

/**
 * Custom Folder Tab Shape replicating the iconic asymmetric tab geometry
 * seen in modern mobile design system references.
 */
val FolderTabShape = GenericShape { size, _ ->
    val w = size.width
    val h = size.height
    val r = 36f            // Corner radius
    val tabW = w * 0.46f   // Tab width: approx 46% of card width
    val step = 28f         // Tab height step down to the shoulder

    // Start at top-left corner
    moveTo(r, 0f)
    // Line across tab top
    lineTo(tabW - r, 0f)
    // Curve down to shoulder
    cubicTo(
        tabW, 0f,
        tabW - 4f, step,
        tabW + r, step
    )
    // Line across right shoulder
    lineTo(w - r, step)
    // Top-right corner
    cubicTo(w, step, w, step + r, w, step + r)
    // Right edge down
    lineTo(w, h - r)
    // Bottom-right corner
    cubicTo(w, h, w - r, h, w - r, h)
    // Bottom edge left
    lineTo(r, h)
    // Bottom-left corner
    cubicTo(0f, h, 0f, h - r, 0f, h - r)
    // Left edge up
    lineTo(0f, r)
    // Top-left corner
    cubicTo(0f, 0f, r, 0f, r, 0f)
    close()
}

@Composable
fun FolderTabCard(
    value: String,
    label: String,
    icon: ImageVector,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    sublabel: String? = null,
    onClick: () -> Unit = {}
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.96f else 1.0f,
        animationSpec = spring(stiffness = 400f),
        label = "folder_card_scale"
    )

    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(FolderTabShape)
            .background(DigicastSurface)
            .background(
                Brush.verticalGradient(
                    listOf(
                        backgroundColor.copy(alpha = 0.16f),
                        Color.Transparent
                    )
                )
            )
            .border(1.dp, backgroundColor.copy(alpha = 0.35f), FolderTabShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 14.dp, vertical = 12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Tab Icon Badge
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(backgroundColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = backgroundColor,
                    modifier = Modifier.size(15.dp)
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Main Stat Value
            Text(
                text = value,
                color = DigicastWhite,
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.5).sp
            )

            // Label
            Text(
                text = label,
                color = DigicastSlate,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.1.sp
            )

            if (!sublabel.isNullOrEmpty()) {
                Text(
                    text = sublabel,
                    color = backgroundColor.copy(alpha = 0.9f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
