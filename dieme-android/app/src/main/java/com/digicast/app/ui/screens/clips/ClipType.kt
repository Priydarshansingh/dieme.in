package com.digicast.app.ui.screens.clips

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.SentimentSatisfied
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import com.digicast.app.ui.theme.DigicastAccentBlue
import com.digicast.app.ui.theme.DigicastEmerald
import com.digicast.app.ui.theme.DigicastLiveRed
import com.digicast.app.ui.theme.DigicastSunsetCoral

enum class ClipType(
    val id: String,
    val title: String,
    val color: Color,
    val icon: ImageVector
) {
    HIGHLIGHT("highlight", "Highlight", DigicastEmerald, Icons.Default.Star),
    CLUTCH("clutch", "Clutch", DigicastSunsetCoral, Icons.Default.Bolt),
    FUNNY("funny", "Funny", DigicastAccentBlue, Icons.Default.SentimentSatisfied),
    KILLSTREAK("killstreak", "Killstreak", DigicastLiveRed, Icons.Default.Speed),
    CHAT_SPIKE("chat", "Chat Spike", Color(0xFFA855F7), Icons.Default.Forum),
    CUSTOM("custom", "Custom", Color(0xFF94A3B8), Icons.Default.ContentCut);

    companion object {
        fun fromLabel(label: String, triggerId: String = ""): ClipType {
            val upper = label.uppercase()
            return when {
                upper.contains("CLUTCH") -> CLUTCH
                upper.contains("FUNNY") -> FUNNY
                upper.contains("KILL") || upper.contains("STREAK") -> KILLSTREAK
                upper.contains("CHAT") || triggerId.contains("chat") -> CHAT_SPIKE
                upper.contains("CUSTOM") -> CUSTOM
                upper.contains("HIGHLIGHT") -> HIGHLIGHT
                else -> HIGHLIGHT
            }
        }
    }
}

