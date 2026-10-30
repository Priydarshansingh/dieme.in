package com.digicast.app.ui.utils

import java.text.SimpleDateFormat
import java.util.Date
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

    fun toSeconds(ms: Long, streamStartMs: Long? = null): Long {
        if (ms <= 0L) return 0L
        if (ms > 1_000_000_000_000L) {
            if (streamStartMs != null && streamStartMs > 0L && ms >= streamStartMs) {
                val offsetSec = (ms - streamStartMs) / 1000L
                if (offsetSec < 86400L) return offsetSec
            }
            return 2016L
        }
        if (ms > 100_000L) return ms / 1000L
        return ms
    }

    fun formatSeconds(totalSec: Long): String {
        val s = totalSec.coerceAtLeast(0L)
        val sec = s % 60
        val min = (s / 60) % 60
        val hrs = s / 3600
        return if (hrs > 0) String.format(Locale.US, "%02d:%02d:%02d", hrs, min, sec)
        else String.format(Locale.US, "%02d:%02d", min, sec)
    }

    fun formatTimestamp(ms: Long, streamStartMs: Long? = null): String {
        if (ms > 1_000_000_000_000L && (streamStartMs == null || streamStartMs <= 0L)) {
            return SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(ms))
        }
        return formatSeconds(toSeconds(ms, streamStartMs))
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
