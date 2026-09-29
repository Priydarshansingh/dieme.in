# Digicast Extensions & Community Hub 🎬🚀

> **Official Extension Repository & Public Ecosystem for the Digicast Live Platform**

Welcome to the **Digicast Extensions Repository**. This repository hosts official extension packages (`.dcast`) and user guides for **Digicast** — the YouTube Creator Live Intelligence & Instant Clip Delivery Platform.

---

## 🌟 What is Digicast?

**Digicast** is an all-in-one live workflow ecosystem designed for YouTube Livestreamers, Content Creators, and their Video Editing teams. It bridges live chat interactions with on-device video rendering and instant Telegram group delivery.

Whenever you or your viewers trigger a clip moment during a livestream, Digicast retroactively captures the action and sends the highlight directly to your editing team within seconds.

---

## 👥 Who Can Use Digicast?

- 🎮 **Gaming & Esports Streamers:** Capture clutch 1v4 plays, funny fails, and epic moments without opening recording software.
- 🎙️ **Podcasters & Talk Show Creators:** Mark talking points and highlight quotes directly from chat.
- ✂️ **Video Editors & Thumbnail Designers:** Receive instant timestamped highlights with 45-second lookback replay links directly in Telegram.
- 📱 **Mobile Creators:** Process and render clips directly on mobile hardware without expensive cloud compute fees.

---

## ✨ Key Platform Features

### 1. ⚡ Zero-Quota Live Chat Detection (`!clip`)
- Seamlessly integrates with **Nightbot** and **YouTube Live Chat**.
- Viewers simply type `!clip` or `!clip triple kill combo` in chat.
- Runs with **zero YouTube API quota usage**, ensuring 24/7 reliability.

### 2. ⏪ Retroactive 45-Second Lookback Buffer
- When exciting moments happen, viewers type `!clip` *after* the action.
- Digicast automatically captures the **45 seconds leading up to the command** plus **15 seconds of creator reaction**.
- Generates a balanced 60-second highlight reel ready for YouTube Shorts / Reels / TikTok.

### 3. 🚀 Instant Telegram Relay for Editors
- Connects directly with `@digicast_bot` in your team's Telegram group.
- Delivers rich clip alerts containing:
  - Stream title and channel name
  - Clipped by author & custom note
  - Direct 1-click **YouTube Replay Jump Link** (`youtu.be/...&t=START`)

### 4. 📱 100% On-Device Processing & Video Rendering
- Uses modular on-device extensions to download and render video highlights directly on your phone or PC.
- Video files and full chat history stay **100% local and private** on your device.

### 5. 🎬 Custom High-Quality Clip Downloader
- Downloads native **1080p60 / 1440p / 4K** video streams.
- Lossless frame trimming so editors get original bitrate files with zero quality degradation.

---

## 🧩 Official Extensions Catalog

Extensions in Digicast are distributed as `.dcast` packages. They can be installed directly from the app or loaded with 1 tap.

| Extension Name | Version | Description | Package File |
|---|---|---|---|
| **YouTube Video Downloader** | `v1.0.0` | High-quality stream extraction (1080p60/4K audio & video). | [`com.digicast.ext.youtubedl.dcast`](extensions/com.digicast.ext.youtubedl.dcast) |
| **FFmpeg Video Trimmer** | `v1.0.0` | Lossless precision cutter & high-efficiency MP4 encoder. | [`com.digicast.ext.ffmpeg.dcast`](extensions/com.digicast.ext.ffmpeg.dcast) |
| **Digicast Clip Engine (Full Suite)** | `v1.0.0` | All-in-one downloader + lossless FFmpeg trimmer. | [`com.digicast.ext.clipengine.dcast`](extensions/com.digicast.ext.clipengine.dcast) |

---

## 📖 How to Use

### Step 1: Connect Your Channel
1. Open the Digicast Dashboard or App.
2. Sign in with Google and link your YouTube Channel.

### Step 2: Set Up Live Chat Command
Add the custom command to your chat bot (Nightbot):
```text
Command: !clip
Message: $(urlfetch https://digicast-web.vercel.app/api/webhooks/nightbot?workspaceId=YOUR_WORKSPACE_ID&user=$(user)&query=$(querystring))
```

### Step 3: Link Your Telegram Editor Group
1. Add `@digicast_bot` to your video editors' Telegram group.
2. Type `/chatid` to get your group ID and save it in your Digicast settings.

### Step 4: Stream and Clip!
1. Start your livestream on YouTube.
2. When something awesome happens, type `!clip <note>` in chat.
3. Your editors immediately receive the replay link in Telegram, and the clip is queued for download!

---

## 🛡️ Privacy & Security

Digicast follows a strict **Local-First** philosophy:
- Raw chat history and full stream video files **never** leave your local hardware without your permission.
- Cloud services only store lightweight metadata (clip markers and timestamps).
- Extensions run in a sandboxed, isolated container on your device.

---

## 📄 License & Credits

- **Platform:** Digicast
- **Developer:** [@livehellboy](https://t.me/livehellboy)
- **License:** MIT License