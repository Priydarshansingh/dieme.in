 # Dieme — Stream Intelligence & Highlight Delivery Platform

Official open-source distribution repository for Dieme extensions, companion mobile releases, and stream asset packages.

- **Web Portal:** [https://www.dieme.in](https://www.dieme.in)
- **Documentation:** [HOW_TO_USE.md](HOW_TO_USE.md)
- **Android App:** [`download/digicast-app-latest.apk`](download/digicast-app-latest.apk)

---

## Overview

Dieme is an integrated stream intelligence platform designed for YouTube live broadcasters and video editing teams. It captures chat-triggered stream markers, indexes broadcast moments in real time, and handles on-device trimming so editors receive clips without waiting for multi-hour stream archives to process.

```
YouTube Live Broadcast
        │
        ├──> Nightbot / Stream Chat (!clip marker)
        │            │
        │            ▼
        │     Dieme Webhook API (Indexed Timestamps)
        │            │
        ▼            ▼
Dieme Companion App (Android)
        │
        ├──> Local Hardware-Accelerated Video Extraction
        └──> Direct MP4 Export & Telegram Delivery
```

---

## Android Companion App

The companion app runs on Android devices to handle stream monitoring, clip rendering, and direct editor forwarding.

| Asset | Version | Format | Size | Download |
| :--- | :--- | :--- | :--- | :--- |
| **Dieme Studio Companion** | `v1.0.0 (Latest)` | `.apk` | ~42 MB | [📥 Download Latest APK](download/digicast-app-latest.apk) |

### Key Capabilities
- **Chat Capture:** Listens to live chat commands (`!clip`) and marks exact broadcast timestamps.
- **On-Device Trimming:** Uses device hardware acceleration to extract 1080p60 clips without consuming cloud rendering quotas.
- **Sovereign Payment Verification:** Integrated with UPI payment observation for instant membership upgrades and pass management.
- **Telegram Dispatch:** Auto-forwards rendered clips directly to designated Telegram editor groups.

---

## Extension Modules (`.dcast`)

Dieme supports modular extensions for creators who require specialized stream extraction or encoding workflows.

| Package | Identifier | Version | Description |
| :--- | :--- | :--- | :--- |
| **YouTube Downloader** | `com.digicast.ext.youtubedl` | `1.0.0` | Extracts live stream video and audio up to 4K resolution. |
| **FFmpeg Trimmer** | `com.digicast.ext.ffmpeg` | `1.0.0` | Frame-accurate, lossless cutter for rapid MP4 export. |
| **Clip Engine Suite** | `com.digicast.ext.clipengine` | `1.0.0` | Integrated bundle combining extraction and trimming pipelines. |
| **DGImages Bridge** | `com.digicast.ext.dgimages` | `1.0.0` | Hardware canvas engine for automated thumbnail generation. |

Full installation details and file association steps are documented in [HOW_TO_USE.md](HOW_TO_USE.md).

---

## Repository Structure

```
├── download/
│   └── digicast-app-latest.apk    # Latest stable Android companion APK
├── extensions/
│   ├── com.digicast.ext.clipengine.dcast
│   ├── com.digicast.ext.dgimages.dcast
│   ├── com.digicast.ext.ffmpeg.dcast
│   └── com.digicast.ext.youtubedl.dcast
├── extensions.json                # Public extension catalog registry
├── HOW_TO_USE.md                  # Extension installation & setup guide
└── README.md                      # Platform overview & public specifications
```

---

## Security & Verification

- All published binaries in this repository are compiled directly from source and verified for distribution.
- Extensions execute locally on the creator's device and do not transmit video streams or credentials to external clusters.
- For platform terms and privacy guidelines, refer to [https://www.dieme.in/privacy](https://www.dieme.in/privacy).

---

## License

This repository is distributed under the Open Creator Community License. See individual module headers for specific component licensing.
