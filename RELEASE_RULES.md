# Dieme Suite Release Protocol & Version Update Rules

This document establishes the mandatory protocol for version numbering, release tracking, in-app update prompts, and multi-repository synchronization across the entire Dieme ecosystem.

---

## 1. Version Numbering & Order Rules

Every release of Dieme Core (`dieme-android`), Dg-Images Companion (`dg-images`), and the Dieme Web platform (`dieme-web`) MUST strictly adhere to the following numbering rules:

1. **Semantic Versioning (`versionName`)**: Format is strictly `MAJOR.MINOR.PATCH` (e.g. `1.0.0` -> `1.1.0` -> `1.1.1` -> `1.2.0`).
   - **MAJOR**: Breaking protocol or state-machine revisions.
   - **MINOR**: New features, new screens, UI redesigns, canvas additions.
   - **PATCH**: Bug fixes, performance tuning, and hotfixes.
2. **Sequential Version Code (`versionCode`)**:
   - MUST be an integer incremented by **at least +1** for each release.
   - Version codes NEVER reset across branches or releases.
   - Both Android build scripts (`dieme-android/app/build.gradle.kts` and `dg-images/app/build.gradle.kts`) must be updated in sync.

### Release Registry Table

| Tag | Version Code | Version Name | Release Date | Highlights |
| :--- | :--- | :--- | :--- | :--- |
| `v1.0.0` | 1 | 1.0.0 | 2026-11-02 | Initial production launch of Dieme Live Studio & Dg-Images daemon. |
| `v1.1.0` | 2 | 1.1.0 | 2026-11-15 | In-app update checker, 24h snooze, Retro dot-matrix canvas mini-game, normal user ChatGPT barrier, direct UPI payment launch. |

---

## 2. Centralized Version Tracking (`version.json`)

All apps and endpoints determine update availability through `version.json`. This file is hosted simultaneously at:
- Root: `version.json`
- Next.js Web: `dieme-web/public/version.json`
- Dynamic API: `https://www.dieme.in/api/version`
- Raw GitHub Fallback: `https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/version.json`

### JSON Specification:
```json
{
  "dieme": {
    "versionCode": 2,
    "versionName": "1.1.0",
    "minSupportedVersionCode": 1,
    "releaseNotes": "• Retro dot-matrix canvas mini-game while generating thumbnails\n• Saved thumbnail history & past chat reachability\n• Native UPI gateway direct launch\n• Real-time in-app update checker with 24h snooze",
    "downloadUrl": "https://www.dieme.in/api/download/apk",
    "releaseDate": "2026-11-15",
    "publishedAt": "2026-11-15T14:00:00Z"
  },
  "dgImages": {
    "versionCode": 2,
    "versionName": "1.1.0",
    "minSupportedVersionCode": 1,
    "releaseNotes": "• Secure normal user background overlay & ChatGPT privacy barrier\n• Developer passcode bypass\n• Direct redirect to Dieme Web Thumbnail creator\n• In-app update system with 24h snooze",
    "downloadUrl": "https://www.dieme.in/api/download/thumbnail",
    "releaseDate": "2026-11-15",
    "publishedAt": "2026-11-15T14:00:00Z"
  }
}
```

---

## 3. In-App Update Engine & User Interaction Flow

Both apps (`dieme-android` and `dg-images`) implement `AppUpdateManager`:

### A. Update Detection
- When `remoteVersionCode > localVersionCode`: An update is available.
- When `remoteVersionCode <= localVersionCode`: The app is up to date ("You are on the latest version • All good").

### B. Launch Check vs. Manual Check
1. **Manual Check (Settings / Dashboard)**:
   - User taps "Check for Updates".
   - If up to date: displays "You are on the latest version • All good (vX.X.X)".
   - If update available: immediately opens the Update Dialog (bypassing any snooze timer).
2. **Automatic Launch Check**:
   - Runs silently in the background on app startup.
   - If snoozed within the last 24 hours (`currentTime - skippedTime < 24h`) for this specific `versionCode`: suppresses dialog.
   - Otherwise, pops up the Update Dialog.

### C. Update Dialog Actions
- **"Update App Now" (Primary Button)**:
  Directs user to the download endpoint (`https://www.dieme.in/api/download/apk` or `https://www.dieme.in/api/download/thumbnail`) in their default web browser.
- **"Close" (Outlined Button)**:
  Dismisses the dialog for the **current app session only**. When the app is freshly reopened, the update dialog will prompt again.
- **"Skip for 24 hours" (Small Text Button below)**:
  Saves `skipped_version = versionCode` and `skipped_time = System.currentTimeMillis()` in `SharedPreferences`. The automatic prompt is suppressed for 24 hours.

---

## 4. Multi-Repository Synchronization Protocol

Whenever code, UI, or binaries change, changes MUST be synchronized across both the monorepo and public distribution repositories.

### Repository Map
- **Monorepo (`origin`)**: `ssh://git@ssh.github.com:443/Priydarshansingh/Youtube-creators.git` (Branch: `main`)
- **Distribution Repositories (`diemein` & `digicast`)**:
  - `git@github.com:Priydarshansingh/dieme.in.git` (Branch: `main`, tracked by local `distro-final`)
  - `git@github.com:Priydarshansingh/Digicast.git` (Branch: `main`, tracked by local `distro-final`)

### Mandatory Release Execution Checklist
Whenever preparing and releasing an update:
1. **Bump Version Codes & Names**:
   - `dieme-android/app/build.gradle.kts`: bump `versionCode` and `versionName`.
   - `dg-images/app/build.gradle.kts`: bump `versionCode` and `versionName`.
   - `version.json` & `dieme-web/public/version.json` & `dieme-web/src/app/api/version/route.ts`: update version metadata and release notes.
2. **Compile Native Android APKs**:
   ```bash
   cd dieme-android && ./gradlew assembleDebug
   cd ../dg-images && ./gradlew assembleDebug
   ```
3. **Copy APKs & Package Zip Archive**:
   - Copy `app-debug.apk` to `download/dieme-app-latest.apk` and `download/digicast-app-latest.apk`.
   - Copy `dg-images` debug APK to `download/dg-images-latest.apk`.
   - Repackage `download/dieme-suite-complete.zip` with both APKs and latest `.dcast` extensions.
4. **Build & Verify Web Platform**:
   ```bash
   cd dieme-web && npm run build
   ```
5. **Commit & Push to Monorepo (`main`)**:
   ```bash
   git add -A
   git commit -m "feat(release): vX.Y.Z release with updated APKs and in-app update tracking"
   git push origin main
   ```
6. **Sync to Distribution Repositories (`distro-final` -> `diemein:main` & `digicast:main`)**:
   ```bash
   git checkout distro-final
   # Synchronize download/, version.json, and release notes
   git merge main --no-commit  # or copy release assets
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push diemein distro-final:main --tags
   git push digicast distro-final:main --tags
   git checkout main
   ```
7. **Verify GitHub Release Assets**:
   Check `https://github.com/Priydarshansingh/dieme.in/releases/latest` to confirm all APKs and zip artifacts are attached and live.
