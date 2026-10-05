---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Team Management with Role-Based Access, Credential Storage & Canvas Removal

## Objective
Implement end-to-end team creation and credential management across both Web and Android app. Web allows creating Admin and Editor; Android allows Owner and Admin to create Editor and Moderator. Securely store credentials in Firestore with visibility toggles (hide/unhide password) on both platforms, allow unlimited editor creation, and completely purge the legacy design-canvas code.

## Context
Load these files for context:
- GSD-STYLE.md
- digicast-web/src/app/api/team/create-app-user/route.ts
- digicast-web/src/app/api/team/set-owner-app-password/route.ts
- digicast-web/src/app/(dashboard)/team/page.tsx
- digicast-web/src/app/(dashboard)/settings/page.tsx
- digicast-web/src/components/layout/Sidebar.tsx
- digicast-android/app/src/main/java/com/digicast/app/ui/screens/settings/SettingsScreen.kt
- digicast-android/app/src/main/java/com/digicast/app/data/repository/AuthRepository.kt

## Tasks

<task type="auto" effort="low">
  <name>Completely purge design-canvas from web codebase</name>
  <files>
    digicast-web/src/app/(dashboard)/design-canvas/page.tsx
    digicast-web/public/figma-canvas.html
    digicast-web/src/components/layout/Sidebar.tsx
  </files>
  <action>
    1. Delete `digicast-web/src/app/(dashboard)/design-canvas/page.tsx`.
    2. Delete `digicast-web/public/figma-canvas.html`.
    3. In `digicast-web/src/components/layout/Sidebar.tsx`, remove the `{ href: '/design-canvas', label: 'Design Canvas', icon: Palette }` nav item and remove the `Palette` import.
    AVOID: Leaving orphaned routes or dead links in navigation.
    USE: Clean file deletion and clean nav items array.
  </action>
  <verify>
    grep -rn "design-canvas" digicast-web/ returns zero matches.
  </verify>
  <done>
    Design canvas page, static html, and sidebar navigation are completely removed.
  </done>
</task>

<task type="auto" effort="medium">
  <name>Upgrade Backend APIs for Team Member and Credential Management</name>
  <files>
    digicast-web/src/app/api/team/create-app-user/route.ts
    digicast-web/src/app/api/team/set-owner-app-password/route.ts
    digicast-web/src/app/api/team/members/route.ts
  </files>
  <action>
    1. Update `/api/team/create-app-user/route.ts`:
       - Allow Owner to create `admin`, `editor`, and `moderator`.
       - Allow Admin to create `editor` and `moderator`.
       - Save `appPassword: password` directly into the member document in `workspaces/{workspaceId}/members/{uid}` and update `users/{uid}`.
       - Allow multiple editors to be created without limits.
    2. Update `/api/team/set-owner-app-password/route.ts`:
       - Save `appPassword: password` into the owner's member document so the owner's password can be viewed with eye toggle.
    3. Create `/api/team/members/route.ts`:
       - GET: Returns all members in `workspaces/{workspaceId}/members`. Include `appPassword` if the caller is Owner or Admin so credentials can be inspected.
       - DELETE: Allows removing team members.
    AVOID: Exposing passwords to unauthenticated users or lower-privileged roles.
    USE: Strict token verification and role checks.
  </action>
  <verify>
    Check API routes compile with Next.js build: cd digicast-web && npm run build
  </verify>
  <done>
    Backend properly persists passwords in member docs, permits Admin and Owner delegation, and provides GET /api/team/members.
  </done>
</task>

<task type="auto" effort="medium">
  <name>Upgrade Web Dashboard Team & Settings Pages with Credential Visibility</name>
  <files>
    digicast-web/src/app/(dashboard)/team/page.tsx
    digicast-web/src/app/(dashboard)/settings/page.tsx
  </files>
  <action>
    1. In `digicast-web/src/app/(dashboard)/team/page.tsx`:
       - Update form with Role Selector: `Editor` or `Admin` (and `Moderator`).
       - For every member in the list, display a dedicated Credential badge:
         - Email (with copy button)
         - Password with Eye / EyeOff toggle button to hide/unhide the password, plus one-click copy button.
       - Add owner credential card showing their own password with hide/unhide toggle.
    2. In `digicast-web/src/app/(dashboard)/settings/page.tsx`:
       - Add a "Team Access & Permissions" section linking to Team management or embedded quick creation for Admin and Editor.
    AVOID: Hardcoding role to 'editor'.
    USE: Dynamic role selection and individual eye-toggle state map per member.
  </action>
  <verify>
    cd digicast-web && npm run build
  </verify>
  <done>
    Web dashboard allows creating Admin & Editor, displays credentials with eye hide/unhide button, and supports multiple editors.
  </done>
</task>

<task type="auto" effort="high">
  <name>Implement Team Management & Credential Visibility in Android Settings</name>
  <files>
    digicast-android/app/src/main/java/com/digicast/app/data/repository/AuthRepository.kt
    digicast-android/app/src/main/java/com/digicast/app/ui/screens/settings/SettingsScreen.kt
  </files>
  <action>
    1. In `AuthRepository.kt`:
       - Add `TeamMember` data class: `(uid, displayName, email, role, appPassword, joinedAt)`.
       - Add `fetchWorkspaceMembers(workspaceId)`: Calls `$BACKEND_URL/api/team/members?workspaceId=...` and queries Firestore `workspaces/{workspaceId}/members`.
       - Add `createTeamMember(email, password, displayName, role, workspaceId)`: Calls `$BACKEND_URL/api/team/create-app-user`.
    2. In `SettingsScreen.kt`:
       - If current user is `owner` or `admin`:
         - Render "TEAM ACCESS & CREDENTIALS" section.
         - Show "+ Add Team Member" dialog or expandable card:
           - Input fields for Email, Password (with eye toggle), Display Name.
           - Role selector: `Editor` or `Moderator` (or `Admin` if Owner).
           - "Create Member" action button with loading indicator.
         - Render list of all Workspace Members:
           - Member name, email, and role badge (`OWNER`, `ADMIN`, `EDITOR`, `MODERATOR`).
           - Credentials row showing Password with an **Eye / EyeOff icon button** to show/hide the plain password, and a copy button to copy it.
       - Allow creating multiple editors seamlessly.
    AVOID: Allowing non-privileged roles (like editor) to see or create other members' credentials.
    USE: Clean compose state with toggled password visibility per member.
  </action>
  <verify>
    ./gradlew assembleDebug copyDebugApkToBuildOutput in digicast-android
  </verify>
  <done>
    Android app allows Owner and Admin to create Editor and Moderator, stores and displays credentials in Settings with hide/unhide password toggle button.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] `design-canvas` is completely removed from web app.
- [ ] Web allows creating Editor and Admin with stored credentials.
- [ ] Android allows Owner/Admin to create Editor and Moderator with stored credentials.
- [ ] Credentials on both Web and Android show password with Hide/Unhide eye button.
- [ ] Multiple editors can be created without restrictions.
- [ ] Both Next.js web build and Android Gradle build pass cleanly.

## Success Criteria
- [ ] Web build succeeds (`npm run build`).
- [ ] Android debug APK builds and copies to `build output/app-debug.apk`.
- [ ] Changes committed and pushed to git repository.
