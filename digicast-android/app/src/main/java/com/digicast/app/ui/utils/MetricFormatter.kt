package com.digicast.app.ui.utils

import java.util.Locale
import java.util.concurrent.TimeUnit

object MetricFormatter {

    fun formatCount(count: Long): String {
        return when {
            count >= 1_000_000 -> String.format(Locale.US, "%.1fM", count / 1_000_000.0)
            count >= 1_000 -> String.format(Locale.US, "%.1fK", count / 1_000.0)
            else -> count.toString()
        }
    }

    fun formatDuration(startedAtMs: Long?, endedAtMs: Long? = null): String {
        if (startedAtMs == null || startedAtMs <= 0L) return "00:00"
        val end = if (endedAtMs != null && endedAtMs > startedAtMs) endedAtMs else System.currentTimeMillis()
        val elapsed = (end - startedAtMs).coerceAtLeast(0L)

        val hours = TimeUnit.MILLISECONDS.toHours(elapsed)
        val minutes = TimeUnit.MILLISECONDS.toMinutes(elapsed) % 60
        val seconds = TimeUnit.MILLISECONDS.toSeconds(elapsed) % 60

        return if (hours > 0) {
            String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format(Locale.US, "%02d:%02d", minutes, seconds)
        }
    }
}
