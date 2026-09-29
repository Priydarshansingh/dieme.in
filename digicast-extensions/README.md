# Digicast Extensions Source 🎬📦

This repository contains the source code for building official `.dcast` extensions for the Digicast ecosystem.

## Modules:
- `:clip-engine` - Native on-device video downloader and lossless FFmpeg trimmer.

## Build:
To compile and generate `.dcast` binaries:
```bash
./gradlew assembleDcast
```
Artifacts are generated in `dist/`.
