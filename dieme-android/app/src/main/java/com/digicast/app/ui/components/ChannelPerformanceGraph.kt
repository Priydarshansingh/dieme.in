package com.digicast.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.NorthEast
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.data.local.entity.StreamEntity
import com.digicast.app.data.repository.YouTubeAccountInfo
import com.digicast.app.ui.theme.AppleDarkEdgeCardBrush
import com.digicast.app.ui.theme.AppleSpecularBorder
import com.digicast.app.ui.theme.DigicastElectricCyan
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite
import com.digicast.app.ui.utils.MetricFormatter
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

/**
 * Standard preset periods for channel performance filtering
 */
enum class ChannelGraphPeriod(val label: String, val days: Int) {
    DAYS_7("7 Days", 7),
    DAYS_30("30 Days", 30),
    DAYS_90("90 Days", 90)
}

/**
 * Single data point on the interactive timeline
 */
data class ChannelTimelinePoint(
    val dayName: String,       // e.g. "Mon"
    val dayOfMonth: String,    // e.g. "20 Oct"
    val fullDateLabel: String, // e.g. "Thu, 23 Oct"
    val value: Long,           // Actual channel metric count
    val trendPercent: Double,  // Growth delta compared to prior step
    val timestampMs: Long
)

/**
 * Aggregated graph model calculation
 */
data class ChannelGraphResult(
    val totalValue: Long,
    val overallGrowthPercent: Double,
    val viewsGrowthPercent: Double,
    val followersGrowthPercent: Double,
    val engagementGrowthPercent: Double,
    val points: List<ChannelTimelinePoint>,
    val yAxisSteps: List<Long>
)

/**
 * Dedicated 30-Day Monthly Insights model
 */
data class MonthlyInsightsResult(
    val monthlyViews: Long,
    val viewsGrowthPercent: Double,
    val monthlyChattersRatio: Double,
    val monthlyEngagementPercent: Double
)

/**
 * Clean Channel Performance Graph component.
 * Header text, category filters, and overview box have been removed.
 * Period filters (7 Days, 30 Days, 90 Days) + Calendar Date Range picker are positioned at the top.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChannelPerformanceGraph(
    streams: List<StreamEntity>,
    totalMessagesCount: Int,
    youtubeAccount: YouTubeAccountInfo? = null,
    onConnectYouTube: () -> Unit = {},
    onViewDetailsClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var selectedPeriod by remember { mutableStateOf(ChannelGraphPeriod.DAYS_7) }
    var isCalendarActive by remember { mutableStateOf(false) }
    var customDateRange by remember { mutableStateOf<Pair<Long, Long>?>(null) }
    var showDatePickerDialog by remember { mutableStateOf(false) }

    // Generate authentic timeline data from real channel streams
    val graphData = remember(streams, totalMessagesCount, selectedPeriod, isCalendarActive, customDateRange) {
        calculateChannelTimelineData(
            streams = streams,
            totalMessagesCount = totalMessagesCount,
            period = selectedPeriod,
            isCalendarActive = isCalendarActive,
            customRange = customDateRange
        )
    }

    // Always calculate 30-day monthly actual data for Key Insights (independent of top period filter)
    val monthlyInsights = remember(streams, totalMessagesCount) {
        calculateMonthlyInsightsData(streams, totalMessagesCount)
    }

    var selectedPointIndex by remember(graphData) {
        mutableIntStateOf(if (graphData.points.size > 3) 3 else (graphData.points.size - 1).coerceAtLeast(0))
    }

    val selectedPoint = graphData.points.getOrNull(selectedPointIndex)
        ?: graphData.points.lastOrNull()
        ?: ChannelTimelinePoint("Today", "Today", "Today", 0L, 0.0, System.currentTimeMillis())

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // ── 1. Top Period Filters (7 Days, 30 Days, 90 Days) + Calendar Picker ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                ChannelGraphPeriod.entries.forEach { period ->
                    val isSelected = !isCalendarActive && selectedPeriod == period
                    val pillBg by animateColorAsState(
                        targetValue = if (isSelected) Color(0xFF0F3E48) else Color(0xFF072126),
                        animationSpec = tween(180),
                        label = "period_bg"
                    )
                    val pillBorder by animateColorAsState(
                        targetValue = if (isSelected) DigicastElectricCyan else Color(0x33FFFFFF),
                        animationSpec = tween(180),
                        label = "period_border"
                    )

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(9999.dp))
                            .background(pillBg)
                            .border(1.dp, pillBorder, RoundedCornerShape(9999.dp))
                            .clickable {
                                isCalendarActive = false
                                selectedPeriod = period
                            }
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = period.label,
                            color = if (isSelected) DigicastWhite else DigicastSlate,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }

                // If Custom Calendar is selected, display selected range badge with clear button
                if (isCalendarActive && customDateRange != null) {
                    val dateFormat = SimpleDateFormat("dd MMM", Locale.US)
                    val startStr = dateFormat.format(Date(customDateRange!!.first))
                    val endStr = dateFormat.format(Date(customDateRange!!.second))

                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(9999.dp))
                            .background(Color(0xFF0F3E48))
                            .border(1.dp, DigicastElectricCyan, RoundedCornerShape(9999.dp))
                            .clickable { showDatePickerDialog = true }
                            .padding(horizontal = 12.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "$startStr – $endStr",
                            color = DigicastWhite,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear Custom Range",
                            tint = DigicastSlate,
                            modifier = Modifier
                                .size(14.dp)
                                .clickable {
                                    isCalendarActive = false
                                    selectedPeriod = ChannelGraphPeriod.DAYS_7
                                }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Calendar Icon Button (Activates DateRangePicker)
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isCalendarActive) Color(0xFF0F3E48) else Color(0xFF072126))
                    .border(
                        1.dp,
                        if (isCalendarActive) DigicastElectricCyan else Color(0x33FFFFFF),
                        RoundedCornerShape(10.dp)
                    )
                    .clickable { showDatePickerDialog = true },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarMonth,
                    contentDescription = "Select Custom Date Range",
                    tint = if (isCalendarActive) DigicastElectricCyan else DigicastSlate,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        // ── 2. Interactive Channel Performance Graph Card ─────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(AppleDarkEdgeCardBrush)
                .border(1.dp, AppleSpecularBorder, RoundedCornerShape(22.dp))
                .padding(top = 16.dp, bottom = 14.dp, start = 12.dp, end = 12.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Interactive Chart Area with Y-axis and Scrubber
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp)
                ) {
                    val containerWidth = maxWidth

                    // Render Graph Canvas
                    InteractiveLineChartCanvas(
                        points = graphData.points,
                        yAxisSteps = graphData.yAxisSteps,
                        selectedPointIndex = selectedPointIndex,
                        onPointSelected = { idx -> selectedPointIndex = idx },
                        modifier = Modifier.fillMaxSize()
                    )

                    // Scrubber Floating Tooltip Popover
                    if (graphData.points.isNotEmpty()) {
                        val numPoints = graphData.points.size
                        val chartStartPadding = 42.dp
                        val chartEndPadding = 12.dp
                        val availableWidth = containerWidth - chartStartPadding - chartEndPadding
                        val pointSpacing = if (numPoints > 1) availableWidth / (numPoints - 1) else availableWidth
                        val pointX = chartStartPadding + (pointSpacing * selectedPointIndex)

                        // Tooltip Box positioned directly above selected point
                        Box(
                            modifier = Modifier
                                .offset {
                                    val tooltipWidthPx = 130.dp.roundToPx()
                                    val targetXPx = pointX.roundToPx() - (tooltipWidthPx / 2)
                                    val clampedX = targetXPx.coerceIn(
                                        chartStartPadding.roundToPx(),
                                        (containerWidth - 140.dp).roundToPx()
                                    )
                                    IntOffset(clampedX, 8.dp.roundToPx())
                                }
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xE6061E24))
                                .border(1.dp, DigicastElectricCyan.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = selectedPoint.fullDateLabel,
                                    color = DigicastSlate,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Visibility,
                                        contentDescription = null,
                                        tint = DigicastElectricCyan,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Text(
                                        text = "${MetricFormatter.formatCount(selectedPoint.value)} Views",
                                        color = DigicastWhite,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                val trendVal = selectedPoint.trendPercent
                                val trendText = when {
                                    trendVal > 0 -> "↑ +${String.format(Locale.US, "%.1f", trendVal)}%"
                                    trendVal < 0 -> "↓ ${String.format(Locale.US, "%.1f", trendVal)}%"
                                    else -> "• 0.0%"
                                }
                                val trendColor = when {
                                    trendVal > 0 -> DigicastElectricCyan
                                    trendVal < 0 -> DigicastLiveRed
                                    else -> DigicastSlate
                                }
                                Text(
                                    text = trendText,
                                    color = trendColor,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // X-Axis Date Column Labels (Responsive 2-line layout)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 42.dp, end = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    graphData.points.forEachIndexed { index, point ->
                        val isSelected = index == selectedPointIndex
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .clickable { selectedPointIndex = index }
                                .padding(horizontal = 2.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = point.dayName,
                                color = if (isSelected) DigicastElectricCyan else DigicastSlate,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                            Text(
                                text = point.dayOfMonth,
                                color = if (isSelected) DigicastWhite else DigicastSlate.copy(alpha = 0.7f),
                                fontSize = 9.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }

        // ── 3. Key Insights Card (Strictly Monthly 30-Day Actual Data) ────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(AppleDarkEdgeCardBrush)
                .border(1.dp, AppleSpecularBorder, RoundedCornerShape(22.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                // Header Row (View Details button removed as requested)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lightbulb,
                            contentDescription = null,
                            tint = DigicastElectricCyan,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Key Insights",
                            color = DigicastWhite,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Monthly Period Badge
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(9999.dp))
                            .background(Color(0xFF0F3E48))
                            .border(1.dp, DigicastElectricCyan.copy(alpha = 0.4f), RoundedCornerShape(9999.dp))
                            .padding(horizontal = 9.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "Monthly (30D)",
                            color = DigicastElectricCyan,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // 3 Column Insights Breakdown (Strictly Monthly Actual Data)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val viewsStr = if (monthlyInsights.viewsGrowthPercent > 0) {
                        "+${String.format(Locale.US, "%.1f", monthlyInsights.viewsGrowthPercent)}%"
                    } else if (monthlyInsights.viewsGrowthPercent < 0) {
                        "${String.format(Locale.US, "%.1f", monthlyInsights.viewsGrowthPercent)}%"
                    } else {
                        "0.0%"
                    }

                    val chattersStr = if (monthlyInsights.monthlyChattersRatio > 0) {
                        "+${String.format(Locale.US, "%.1f", monthlyInsights.monthlyChattersRatio)}%"
                    } else {
                        "0.0%"
                    }

                    val engagementStr = if (monthlyInsights.monthlyEngagementPercent > 0) {
                        "+${String.format(Locale.US, "%.1f", monthlyInsights.monthlyEngagementPercent)}%"
                    } else {
                        "0.0%"
                    }

                    // Col 1: Views Increased (Monthly)
                    InsightColumnItem(
                        icon = Icons.Default.NorthEast,
                        growthValue = viewsStr,
                        label = "Views ${if (monthlyInsights.monthlyViews > 0) "(${MetricFormatter.formatCount(monthlyInsights.monthlyViews)})\n" else ""}this month",
                        modifier = Modifier.weight(1f)
                    )

                    // Col 2: Chatters / Followers (Monthly)
                    InsightColumnItem(
                        icon = Icons.Default.Group,
                        growthValue = chattersStr,
                        label = "Chatters ratio\nthis month",
                        modifier = Modifier.weight(1f)
                    )

                    // Col 3: Engagement (Monthly)
                    InsightColumnItem(
                        icon = Icons.Default.Favorite,
                        growthValue = engagementStr,
                        label = "Engagement\nthis month",
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // ── 4. YouTube Channel Connection / Status Banner ─────────────────────
        if (youtubeAccount == null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(AppleDarkEdgeCardBrush)
                    .border(1.dp, DigicastElectricCyan.copy(alpha = 0.35f), RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(DigicastLiveRed)
                            )
                            Text(
                                text = "Connect YouTube Account",
                                color = DigicastWhite,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Link your channel to import live broadcasts, viewer stats, and chat logs directly with Google YouTube API.",
                            color = DigicastSlate,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = onConnectYouTube,
                        colors = ButtonDefaults.buttonColors(containerColor = DigicastLiveRed),
                        shape = RoundedCornerShape(9999.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Connect",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF072126))
                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(16.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SmartDisplay,
                            contentDescription = null,
                            tint = DigicastLiveRed,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "${youtubeAccount.channelName} • YouTube Synced",
                            color = DigicastWhite,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        text = "Reconnect",
                        color = DigicastElectricCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable(onClick = onConnectYouTube)
                    )
                }
            }
        }
    }

    // ── 4. DateRangePicker Dialog ─────────────────────────────────────────────
    if (showDatePickerDialog) {
        ChannelDateRangePickerDialog(
            initialStartDateMs = customDateRange?.first,
            initialEndDateMs = customDateRange?.second,
            onDismissRequest = { showDatePickerDialog = false },
            onDateRangeSelected = { start, end ->
                customDateRange = Pair(start, end)
                isCalendarActive = true
            }
        )
    }
}

/**
 * Native DateRangePicker Dialog styled with Deep Teal Silk theme
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChannelDateRangePickerDialog(
    initialStartDateMs: Long?,
    initialEndDateMs: Long?,
    onDismissRequest: () -> Unit,
    onDateRangeSelected: (startDateMs: Long, endDateMs: Long) -> Unit
) {
    val dateRangePickerState = rememberDateRangePickerState(
        initialSelectedStartDateMillis = initialStartDateMs,
        initialSelectedEndDateMillis = initialEndDateMs
    )

    DatePickerDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            TextButton(
                onClick = {
                    val start = dateRangePickerState.selectedStartDateMillis
                    val end = dateRangePickerState.selectedEndDateMillis ?: start
                    if (start != null && end != null) {
                        onDateRangeSelected(start, end)
                    }
                    onDismissRequest()
                }
            ) {
                Text("Apply", color = DigicastElectricCyan, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Cancel", color = DigicastSlate)
            }
        },
        colors = DatePickerDefaults.colors(
            containerColor = Color(0xFF072126),
            titleContentColor = DigicastWhite,
            headlineContentColor = DigicastWhite,
            weekdayContentColor = DigicastSlate,
            subheadContentColor = DigicastSlate,
            yearContentColor = DigicastSlate,
            currentYearContentColor = DigicastElectricCyan,
            selectedYearContentColor = DigicastWhite,
            selectedYearContainerColor = DigicastElectricCyan,
            dayContentColor = DigicastWhite,
            selectedDayContainerColor = DigicastElectricCyan,
            selectedDayContentColor = Color(0xFF06181C),
            todayContentColor = DigicastElectricCyan,
            todayDateBorderColor = DigicastElectricCyan,
            dayInSelectionRangeContainerColor = DigicastElectricCyan.copy(alpha = 0.2f),
            dayInSelectionRangeContentColor = DigicastWhite
        )
    ) {
        DateRangePicker(
            state = dateRangePickerState,
            title = {
                Text(
                    text = "Select Date Range",
                    color = DigicastWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    modifier = Modifier.padding(start = 24.dp, top = 16.dp)
                )
            },
            headline = {
                Text(
                    text = "Track channel telemetry across custom dates",
                    color = DigicastSlate,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(start = 24.dp, bottom = 12.dp)
                )
            },
            showModeToggle = false,
            colors = DatePickerDefaults.colors(
                containerColor = Color(0xFF072126),
                titleContentColor = DigicastWhite,
                headlineContentColor = DigicastWhite,
                weekdayContentColor = DigicastSlate,
                subheadContentColor = DigicastSlate,
                yearContentColor = DigicastSlate,
                currentYearContentColor = DigicastElectricCyan,
                selectedYearContentColor = DigicastWhite,
                selectedYearContainerColor = DigicastElectricCyan,
                dayContentColor = DigicastWhite,
                selectedDayContainerColor = DigicastElectricCyan,
                selectedDayContentColor = Color(0xFF06181C),
                todayContentColor = DigicastElectricCyan,
                todayDateBorderColor = DigicastElectricCyan,
                dayInSelectionRangeContainerColor = DigicastElectricCyan.copy(alpha = 0.2f),
                dayInSelectionRangeContentColor = DigicastWhite
            )
        )
    }
}

/**
 * Single column metric item inside the Key Insights card
 */
@Composable
private fun InsightColumnItem(
    icon: ImageVector,
    growthValue: String,
    label: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = DigicastElectricCyan,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = growthValue,
                color = DigicastWhite,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
        Text(
            text = label,
            color = DigicastSlate,
            fontSize = 10.sp,
            lineHeight = 13.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

/**
 * Interactive Chart Canvas with Y-Axis Grid Lines, Smooth Bezier Path,
 * Gradient Fill, Glowing Markers, and Scrubber Gesture Detection.
 */
@Composable
private fun InteractiveLineChartCanvas(
    points: List<ChannelTimelinePoint>,
    yAxisSteps: List<Long>,
    selectedPointIndex: Int,
    onPointSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .pointerInput(points) {
                detectTapGestures { offset ->
                    val chartStartPx = 42.dp.toPx()
                    val chartEndPx = 12.dp.toPx()
                    val usableWidth = size.width - chartStartPx - chartEndPx
                    if (points.isNotEmpty() && usableWidth > 0) {
                        val spacing = if (points.size > 1) usableWidth / (points.size - 1) else usableWidth
                        val relX = (offset.x - chartStartPx).coerceIn(0f, usableWidth)
                        val nearestIndex = (relX / spacing).roundToInt().coerceIn(0, points.lastIndex)
                        onPointSelected(nearestIndex)
                    }
                }
            }
            .pointerInput(points) {
                detectHorizontalDragGestures { change, _ ->
                    change.consume()
                    val chartStartPx = 42.dp.toPx()
                    val chartEndPx = 12.dp.toPx()
                    val usableWidth = size.width - chartStartPx - chartEndPx
                    if (points.isNotEmpty() && usableWidth > 0) {
                        val spacing = if (points.size > 1) usableWidth / (points.size - 1) else usableWidth
                        val relX = (change.position.x - chartStartPx).coerceIn(0f, usableWidth)
                        val nearestIndex = (relX / spacing).roundToInt().coerceIn(0, points.lastIndex)
                        onPointSelected(nearestIndex)
                    }
                }
            }
    ) {
        val chartStartPx = 42.dp.toPx()
        val chartEndPx = 12.dp.toPx()
        val topPaddingPx = 16.dp.toPx()
        val bottomPaddingPx = 16.dp.toPx()

        val usableWidth = size.width - chartStartPx - chartEndPx
        val usableHeight = size.height - topPaddingPx - bottomPaddingPx

        if (points.isEmpty() || usableWidth <= 0 || usableHeight <= 0) return@Canvas

        val maxY = (yAxisSteps.maxOrNull() ?: 500L).toFloat().coerceAtLeast(1f)
        val minY = (yAxisSteps.minOrNull() ?: 0L).toFloat()

        // 1. Draw Horizontal Y-Axis Grid Lines & Native Text Numbers
        yAxisSteps.forEach { stepVal ->
            val normY = (stepVal - minY) / (maxY - minY).coerceAtLeast(1f)
            val lineY = topPaddingPx + usableHeight * (1f - normY)

            // Dashed Grid Line
            drawLine(
                color = Color(0x18FFFFFF),
                start = Offset(chartStartPx, lineY),
                end = Offset(size.width - chartEndPx, lineY),
                strokeWidth = 1.dp.toPx(),
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f)
            )

            // Y-Axis Number Label via Android native Canvas
            val textPaint = android.graphics.Paint().apply {
                color = android.graphics.Color.argb(140, 165, 196, 202)
                textSize = 9.sp.toPx()
                textAlign = android.graphics.Paint.Align.RIGHT
                typeface = android.graphics.Typeface.MONOSPACE
                isAntiAlias = true
            }
            drawContext.canvas.nativeCanvas.drawText(
                MetricFormatter.formatCount(stepVal),
                chartStartPx - 8.dp.toPx(),
                lineY + 3.dp.toPx(),
                textPaint
            )
        }

        // 2. Compute Screen Coordinates for each data point
        val spacing = if (points.size > 1) usableWidth / (points.size - 1) else usableWidth
        val coordinates = points.mapIndexed { i, pt ->
            val normVal = (pt.value.toFloat() - minY) / (maxY - minY).coerceAtLeast(1f)
            val px = chartStartPx + (i * spacing)
            val py = topPaddingPx + usableHeight * (1f - normVal)
            Offset(px, py)
        }

        // 3. Build Smooth Bezier Line Path
        val strokePath = Path()
        val fillPath = Path()

        if (coordinates.isNotEmpty()) {
            strokePath.moveTo(coordinates[0].x, coordinates[0].y)
            fillPath.moveTo(coordinates[0].x, topPaddingPx + usableHeight)
            fillPath.lineTo(coordinates[0].x, coordinates[0].y)

            for (i in 0 until coordinates.size - 1) {
                val p0 = coordinates[i]
                val p1 = coordinates[i + 1]
                val controlX = (p0.x + p1.x) / 2f
                strokePath.cubicTo(controlX, p0.y, controlX, p1.y, p1.x, p1.y)
                fillPath.cubicTo(controlX, p0.y, controlX, p1.y, p1.x, p1.y)
            }

            fillPath.lineTo(coordinates.last().x, topPaddingPx + usableHeight)
            fillPath.close()

            // 4. Draw Glowing Gradient Fill Under the Curve
            drawPath(
                path = fillPath,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        DigicastElectricCyan.copy(alpha = 0.35f),
                        DigicastElectricCyan.copy(alpha = 0.08f),
                        Color.Transparent
                    ),
                    startY = topPaddingPx,
                    endY = topPaddingPx + usableHeight
                )
            )

            // 5. Draw Radiant Teal Main Stroke Line
            drawPath(
                path = strokePath,
                color = DigicastElectricCyan,
                style = Stroke(
                    width = 2.5.dp.toPx(),
                    cap = StrokeCap.Round
                )
            )
        }

        // 6. Draw Circular Data Point Dots along the Line
        coordinates.forEachIndexed { i, coord ->
            val isSelected = i == selectedPointIndex
            if (isSelected) {
                // Vertical Dashed Scrubber Cursor Line
                drawLine(
                    color = DigicastElectricCyan.copy(alpha = 0.85f),
                    start = Offset(coord.x, topPaddingPx),
                    end = Offset(coord.x, topPaddingPx + usableHeight),
                    strokeWidth = 1.5.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 6f), 0f)
                )

                // Glowing Halo Outer Ring
                drawCircle(
                    color = DigicastElectricCyan.copy(alpha = 0.25f),
                    radius = 12.dp.toPx(),
                    center = coord
                )
                // Mid Ring
                drawCircle(
                    color = Color(0xFF06181C),
                    radius = 6.dp.toPx(),
                    center = coord
                )
                // Center Bright Dot
                drawCircle(
                    color = DigicastWhite,
                    radius = 4.dp.toPx(),
                    center = coord
                )
            } else {
                // Regular subtle data point dot
                drawCircle(
                    color = Color(0xFF06181C),
                    radius = 3.5.dp.toPx(),
                    center = coord
                )
                drawCircle(
                    color = DigicastElectricCyan.copy(alpha = 0.9f),
                    radius = 2.5.dp.toPx(),
                    center = coord
                )
            }
        }
    }
}

/**
 * Calculates authentic channel data points based on actual workspace streams
 */
private fun calculateChannelTimelineData(
    streams: List<StreamEntity>,
    totalMessagesCount: Int,
    period: ChannelGraphPeriod,
    isCalendarActive: Boolean,
    customRange: Pair<Long, Long>?
): ChannelGraphResult {
    val dayFormat = SimpleDateFormat("EEE", Locale.US)
    val monthDayFormat = SimpleDateFormat("dd MMM", Locale.US)
    val fullDateFormat = SimpleDateFormat("EEE, dd MMM", Locale.US)

    val startMs: Long
    val endMs: Long

    if (isCalendarActive && customRange != null) {
        startMs = customRange.first
        endMs = customRange.second.coerceAtLeast(startMs + 86400000L)
    } else {
        val now = System.currentTimeMillis()
        endMs = now
        startMs = now - (period.days.toLong() * 86400000L)
    }

    // Filter streams that fall within the query window
    val inRangeStreams = streams.filter {
        val t = it.startedAtMs ?: 0L
        t in startMs..endMs
    }

    val totalViews = inRangeStreams.sumOf { it.viewCount }.coerceAtLeast(0L)
    val totalLikes = inRangeStreams.sumOf { it.likeCount }.coerceAtLeast(0L)
    val totalComments = inRangeStreams.sumOf { it.commentCount }.coerceAtLeast(0L)

    // Calculate previous period for comparison
    val windowDurationMs = (endMs - startMs).coerceAtLeast(86400000L)
    val prevStartMs = startMs - windowDurationMs
    val prevEndMs = startMs
    val prevStreams = streams.filter {
        val t = it.startedAtMs ?: 0L
        t in prevStartMs..prevEndMs
    }
    val prevViews = prevStreams.sumOf { it.viewCount }.coerceAtLeast(0L)

    val viewsGrowth = if (totalViews == 0L) {
        0.0
    } else if (prevViews > 0L) {
        ((totalViews - prevViews).toDouble() / prevViews.toDouble()) * 100.0
    } else {
        100.0
    }

    // Engagement & Likes ratio
    val followersGrowth = if (totalViews > 0L) {
        (totalLikes.toDouble() / totalViews.toDouble()) * 100.0
    } else {
        0.0
    }

    val engagementGrowth = if (totalViews > 0L) {
        ((totalLikes + totalComments + totalMessagesCount).toDouble() / totalViews.toDouble()) * 100.0
    } else {
        0.0
    }

    val points = mutableListOf<ChannelTimelinePoint>()
    val stepMs = windowDurationMs / 6L

    for (i in 0..6) {
        val checkpointMs = startMs + (i * stepMs)
        val d = Date(checkpointMs)
        val dayName = dayFormat.format(d)
        val monthDay = monthDayFormat.format(d)
        val fullDate = fullDateFormat.format(d)

        // Cumulative views up to this checkpoint in the window
        val ptVal = inRangeStreams.filter { (it.startedAtMs ?: 0L) <= checkpointMs }.sumOf { it.viewCount }

        val prevPtVal = if (i > 0) {
            inRangeStreams.filter { (it.startedAtMs ?: 0L) <= (checkpointMs - stepMs) }.sumOf { it.viewCount }
        } else {
            0L
        }

        val delta = if (prevPtVal > 0L) {
            ((ptVal - prevPtVal).toDouble() / prevPtVal.toDouble()) * 100.0
        } else if (ptVal > 0L) {
            100.0
        } else {
            0.0
        }

        points.add(
            ChannelTimelinePoint(
                dayName = dayName,
                dayOfMonth = monthDay,
                fullDateLabel = fullDate,
                value = ptVal,
                trendPercent = delta,
                timestampMs = checkpointMs
            )
        )
    }

    // Calculate Y-Axis steps
    val maxPt = points.maxOfOrNull { it.value } ?: 0L
    val niceMax = when {
        maxPt <= 0L -> 100L
        maxPt <= 50L -> 50L
        maxPt <= 100L -> 100L
        maxPt <= 250L -> 250L
        maxPt <= 500L -> 500L
        maxPt <= 1000L -> 1000L
        maxPt <= 5000L -> 5000L
        else -> ((maxPt / 1000) + 1) * 1000L
    }
    val step = (niceMax / 5).coerceAtLeast(10L)
    val ySteps = (1..5).map { it * step }

    return ChannelGraphResult(
        totalValue = totalViews,
        overallGrowthPercent = viewsGrowth,
        viewsGrowthPercent = viewsGrowth,
        followersGrowthPercent = followersGrowth,
        engagementGrowthPercent = engagementGrowth,
        points = points,
        yAxisSteps = ySteps
    )
}

/**
 * Calculates strictly 30-Day Monthly actual metrics from connected channel streams
 */
private fun calculateMonthlyInsightsData(
    streams: List<StreamEntity>,
    totalMessagesCount: Int
): MonthlyInsightsResult {
    val now = System.currentTimeMillis()
    val monthMs = 30L * 86400000L
    val startOfMonth = now - monthMs
    val startOfPrevMonth = now - (2L * monthMs)

    // Current Month Streams (Last 30 Days)
    val thisMonthStreams = streams.filter {
        val t = it.startedAtMs ?: 0L
        t in startOfMonth..now
    }

    // Previous Month Streams (30-60 Days Ago)
    val prevMonthStreams = streams.filter {
        val t = it.startedAtMs ?: 0L
        t in startOfPrevMonth..startOfMonth
    }

    val currentViews = thisMonthStreams.sumOf { it.viewCount }.coerceAtLeast(0L)
    val prevViews = prevMonthStreams.sumOf { it.viewCount }.coerceAtLeast(0L)

    val currentLikes = thisMonthStreams.sumOf { it.likeCount }.coerceAtLeast(0L)
    val currentComments = thisMonthStreams.sumOf { it.commentCount }.coerceAtLeast(0L)

    val viewsGrowth = if (currentViews == 0L) {
        0.0
    } else if (prevViews > 0L) {
        ((currentViews - prevViews).toDouble() / prevViews.toDouble()) * 100.0
    } else {
        100.0
    }

    val chattersRatio = if (currentViews > 0L) {
        (currentLikes.toDouble() / currentViews.toDouble()) * 100.0
    } else {
        0.0
    }

    val engagementPercent = if (currentViews > 0L) {
        ((currentLikes + currentComments + totalMessagesCount).toDouble() / currentViews.toDouble()) * 100.0
    } else {
        0.0
    }

    return MonthlyInsightsResult(
        monthlyViews = currentViews,
        viewsGrowthPercent = viewsGrowth,
        monthlyChattersRatio = chattersRatio,
        monthlyEngagementPercent = engagementPercent
    )
}
