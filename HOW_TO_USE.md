# Dieme Extensions & Modules Guide

This guide details how to install, manage, and use official `.dcast` extensions within the Dieme creator workflow.

---

### 📦 Available Modules

1. **YouTube Stream Downloader (`com.digicast.ext.youtubedl`)**
   - High-quality video and audio extraction up to 4K resolution.
   - Extracts live stream segments directly on-device without remote servers.

2. **FFmpeg Precision Trimmer (`com.digicast.ext.ffmpeg`)**
   - Lossless, frame-accurate trimming without re-encoding quality degradation.
   - Generates compact, production-ready MP4 clips in seconds.

3. **Dieme Clip Engine Suite (`com.digicast.ext.clipengine`)**
   - End-to-end automation unifying moment detection, extraction, and trimming.

4. **DGImages Canvas Bridge (`com.digicast.ext.dgimages`)**
   - Visual telemetry rendering and thumbnail composition engine.

---

### 📲 Installation Instructions

#### Method 1: In-App Extension Catalog (Recommended)
1. Open the **Dieme** app on your Android device.
2. Go to **Settings → Extensions Catalog**.
3. Tap **Install** next to the desired module.
4. The package downloads and registers automatically.

#### Method 2: Direct File Association (`.dcast`)
1. Download any `.dcast` package from the repository's [`extensions/`](extensions/) folder or release assets.
2. Open the `.dcast` file in your Android file manager.
3. Android associates the file with the Dieme application and completes registration immediately.

---

### 🔒 Device-Bound Architecture

All Dieme extensions run locally on your device within a sandboxed execution runtime. Audio, video, and stream credentials remain on your hardware and are never routed through unverified third-party processing clusters.
