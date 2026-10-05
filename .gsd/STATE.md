# Digicast Project State

## Active Milestone: Team Management, Credential Visibility & Canvas Removal
- **Status:** Complete
- **Reference Targets:**
  - Web Team & Settings: Create `Editor` and `Admin` (and `Moderator`), store credentials in Firestore with individual Eye/EyeOff toggle buttons and copy-to-clipboard actions.
  - Android App Settings: `Owner` and `Admin` can create `Editor` and `Moderator` accounts directly, with full credential cards featuring Eye/EyeOff show/hide password buttons.
  - Unlimited Editor Creation: Support creating multiple editors with custom claims and workspace roles.
  - Clean Purge: Complete removal of legacy `design-canvas` route, static HTML, and sidebar navigation.

## Completed Tasks
- [x] **Completely Purged Design Canvas:**
  - Removed `digicast-web/src/app/(dashboard)/design-canvas/`.
  - Removed `digicast-web/public/figma-canvas.html`.
  - Removed `Design Canvas` item and `Palette` icon from `Sidebar.tsx`. Verified 0 remaining matches.
- [x] **Upgraded Backend Team & Credential APIs:**
  - `POST /api/team/create-app-user`: Supports `owner` creating `admin`, `editor`, `moderator`; and `admin` creating `editor`, `moderator`. Stores `appPassword` in `workspaces/{id}/members/{uid}` and `users/{uid}`.
  - `POST /api/team/set-owner-app-password`: Stores owner's `appPassword` in their workspace member doc for symmetric viewing.
  - `GET /api/team/members`: Returns workspace members, revealing `appPassword` securely only to `owner` and `admin`.
  - `DELETE /api/team/members`: Allows removing team members.
- [x] **Web Team & Settings UI:**
  - Upgraded `/team` page with role selector (`Editor`, `Admin`, `Moderator`), member credentials card with `Eye` / `EyeOff` hide/unhide toggle button, copy button, and delete action.
  - Added "Team Creation & Access" section to `/settings` with embedded editor/admin creation and password eye-toggle.
  - Tested: `npm run build` completed with all 34 routes compiling cleanly.
- [x] **Android Settings & Team Management:**
  - Added `TeamMember` model, `getTeamMembers()`, and `createTeamMember()` in `AuthRepository.kt`.
  - Added "TEAM ACCESS & CREDENTIALS" section in `SettingsScreen.kt` visible to `Owner` and `Admin`.
  - Added "+ Add Member" form with role picker (`Editor` / `Moderator`), Name, Email, and Password with visibility toggle.
  - Added member credentials display with **Eye / EyeOff hide/unhide toggle button** and clipboard copy button.
- [x] **Tested & Built:** Clean Gradle compilation with zero errors. Generated fresh production APK at `build output/app-debug.apk`.
