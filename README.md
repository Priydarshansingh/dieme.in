 # Dieme — Stream Intelligence & Highlight Delivery Platform

Official open-source distribution repository for Dieme extensions, companion mobile releases, and stream asset packages.

- **Web Portal:** [https://www.dieme.in](https://www.dieme.in)
- **Documentation:** [HOW_TO_USE.md](HOW_TO_USE.md)
- **Dieme Live Studio App:** [`download/digicast-app-latest.apk`](download/digicast-app-latest.apk)
- **Dg-Images AI Companion App:** [`download/dg-images-latest.apk`](download/dg-images-latest.apk)

---

## Overview

Dieme is an integrated stream intelligence platform designed for YouTube live broadcasters and video editing teams. It captures chat-triggered stream markers, indexes broadcast moments in real time, and handles on-device trimming so editors receive clips without waiting for multi-hour stream archives to process. It pairs with the **Dg-Images** companion app for on-device AI thumbnail generation and inpainting.

```
YouTube Live Broadcast
        │
        ├──> Nightbot / Stream Chat (!clip marker)
        │            │
        │            ▼
        │     Dieme Webhook API (Indexed Timestamps)
        │            │
        ▼            ▼
Dieme Live Studio App (Android) <───> Dg-Images AI Companion (Android)
        │                                     │
        ├──> Local Hardware Video Trimming     └──> Local Inpainting & Canvas
        └──> Direct MP4 & Telegram Delivery
```

---

## Official Android Applications

Dieme provides two official native Android applications that work together seamlessly on your device.

| Application | Role | Version | Format | Size | Direct Download |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dieme Live Studio** | Core Stream & Clip Companion | `v1.0.0` | `.apk` | ~43 MB | [📥 Download Dieme APK](download/digicast-app-latest.apk) |
| **Dg-Images AI Studio** | Local AI Thumbnail Companion | `v1.0.0` | `.apk` | ~22 MB | [📥 Download Dg-Images APK](download/dg-images-latest.apk) |

### Key Capabilities

#### 1. Dieme Live Studio (`com.digicast.app`)
- **Chat Capture:** Listens to live chat commands (`!clip`) and marks exact broadcast timestamps.
- **On-Device Trimming:** Uses device hardware acceleration to extract 1080p60 clips without consuming cloud rendering quotas.
- **Sovereign Payment Verification:** Integrated with UPI payment observation for instant membership upgrades and pass management.
- **Telegram Dispatch:** Auto-forwards rendered clips directly to designated Telegram editor groups.

#### 2. Dg-Images AI Thumbnail Studio (`com.digicast.dgimages`)
- **Local AI Daemon:** Runs on device port 5488 to provide AI inpainting and thumbnail generative services directly to Dieme Studio.
- **ChatGPT Canvas Integration:** Automated authenticated session runner for iterative prompt revisions.
- **Pinpoint Coordinate Revisions:** Inpaints marked regions while preserving existing typography, logos, and channel branding.
- **Direct 1080p Export:** Saves finalized thumbnails directly to device gallery (`Downloads/Dieme/Thumbnails`).

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
│   ├── digicast-app-latest.apk    # Dieme Live Studio companion APK (~43 MB)
│   └── dg-images-latest.apk       # Dg-Images AI thumbnail studio APK (~22 MB)
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
