package com.digicast.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastBorder
import com.digicast.app.ui.theme.DigicastCardSurface
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastSunsetCoral
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun SparklineWaveCard(
    title: String,
    subtitle: String,
    trendPercent: String = "+4.93%",
    isPositiveTrend: Boolean = true,
    highlightBadgeText: String = "2h 12m",
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(AppleDarkEdgeCardBrush)
            .border(1.dp, AppleSpecularBorder, RoundedCornerShape(24.dp))
            .padding(18.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header Row: Title on left, Trend pill on right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = title,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = subtitle,
                        color = Color.White.copy(alpha = 0.75f),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Normal
                    )
                }

                // Trend badge (Apple pill)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                    modifier = Modifier
                        .background(
                            Color.White.copy(alpha = 0.15f),
                            RoundedCornerShape(9999.dp)
                        )
                        .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(9999.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowDropUp,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = trendPercent,
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Highlight Tooltip Tag
            Box(
                modifier = Modifier
                    .padding(start = 56.dp)
                    .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = highlightBadgeText,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Smooth Bezier Curve Canvas
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
            ) {
                val w = size.width
                val h = size.height

                // Wave Path
                val path = Path().apply {
                    moveTo(0f, h * 0.55f)
                    cubicTo(w * 0.15f, h * 0.45f, w * 0.25f, h * 0.70f, w * 0.38f, h * 0.72f)
                    cubicTo(w * 0.50f, h * 0.74f, w * 0.65f, h * 0.30f, w * 0.82f, h * 0.35f)
                    cubicTo(w * 0.90f, h * 0.38f, w * 0.95f, h * 0.45f, w, h * 0.40f)
                }

                // Fill gradient underneath
                val fillPath = Path().apply {
                    addPath(path)
                    lineTo(w, h)
                    lineTo(0f, h)
                    close()
                }

                drawPath(
                    path = fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.25f),
                            Color.Transparent
                        )
                    )
                )

                // Glowing stroke
                drawPath(
                    path = path,
                    color = Color.White,
                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                )

                // Highlight point at active marker
                val pointX = w * 0.38f
                val pointY = h * 0.72f
                drawCircle(
                    color = Color.White,
                    radius = 4.dp.toPx(),
                    center = Offset(pointX, pointY)
                )
                drawCircle(
                    color = Color.White.copy(alpha = 0.4f),
                    radius = 7.dp.toPx(),
                    center = Offset(pointX, pointY)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Month labels on X axis
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep").forEach { m ->
                    Text(
                        text = m,
                        color = DigicastSlate.copy(alpha = 0.6f),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}
