# Quick Start Guide: Using Digicast

This guide walks you through setting up Digicast for your YouTube livestreams.

---

### 1. Requirements
- A YouTube channel with live streaming enabled.
- A Nightbot account (free, zero API cost).
- A Telegram group for your video editors.
- The Digicast Android Companion App or Web Dashboard.

---

### 2. Setting Up the `!clip` Command in Nightbot

1. Log into your [Nightbot Dashboard](https://nightbot.tv/).
2. Navigate to **Commands → Custom → Add Command**.
3. Fill in:
   - **Command:** `!clip`
   - **Message:**
     ```text
     $(urlfetch https://digicast-web.vercel.app/api/webhooks/nightbot?workspaceId=YOUR_WORKSPACE_ID&user=$(user)&query=$(querystring))
     ```
   - **Userlevel:** Everyone (or Moderator if you want mods only).
   - **Cooldown:** 5 seconds.
4. Click **Submit**.

---

### 3. Setting Up the Telegram Bot

1. Open Telegram and search for `@digicast_bot`.
2. Add `@digicast_bot` as a member to your editors' group.
3. Send the command `/chatid` in the group.
4. Copy the group ID (e.g., `-1001234567890`) and paste it into **Digicast Settings → Telegram Delivery**.

---

### 4. Installing the Clip Engine Extension (`.dcast`)

1. In the Digicast Android App, go to **Settings → Extensions Catalog**.
2. Tap **Install** next to **Digicast Clip Engine**.
3. Once installed, the app can render 1080p60/4K clips directly on your mobile device.

---

### 5. In-Stream Usage Examples

- Standard clip: `!clip`
- Custom labeled clip: `!clip insane 1v4 clutch`
- Funny moment clip: `!clip failed jump laugh`

All moments will be captured with the 45-second lookback buffer and sent to your editors automatically!
