package com.digicast.app.ui.util

object EmojiParser {
    private val EMOJI_MAP = mapOf(
        ":smirking_face:" to "😏",
        ":beaming_face_with_smiling_eyes:" to "😁",
        ":grinning_face_with_smiling_eyes:" to "😄",
        ":face_with_tears_of_joy:" to "😂",
        ":rolling_on_the_floor_laughing:" to "🤣",
        ":smiling_face_with_heart_eyes:" to "😍",
        ":fire:" to "🔥",
        ":skull:" to "💀",
        ":skull_and_crossbones:" to "☠️",
        ":clapper_board:" to "🎬",
        ":movie_camera:" to "🎥",
        ":video_camera:" to "📹",
        ":sparkles:" to "✨",
        ":star:" to "⭐",
        ":star2:" to "🌟",
        ":thumbsup:" to "👍",
        ":thumbsdown:" to "👎",
        ":heart:" to "❤️",
        ":red_heart:" to "❤️",
        ":eyes:" to "👀",
        ":100:" to "💯",
        ":tada:" to "🎉",
        ":partying_face:" to "🥳",
        ":thinking_face:" to "🤔",
        ":loudly_crying_face:" to "😭",
        ":crying_face:" to "😢",
        ":sunglasses:" to "😎",
        ":raised_hands:" to "🙌",
        ":clap:" to "👏",
        ":pray:" to "🙏",
        ":trophy:" to "🏆",
        ":crown:" to "👑",
        ":rocket:" to "🚀"
    )

    private val REGEX = Regex(":[a-zA-Z0-9_+-]+:")

    fun parse(text: String): String {
        if (!text.contains(':')) return text
        return REGEX.replace(text) { matchResult ->
            EMOJI_MAP[matchResult.value] ?: matchResult.value
        }
    }
}

