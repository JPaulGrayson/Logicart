# File Sync & Watch Mode: The Invisible Thread
**Real-time synchronization between the LogicArt Studio and your local filesystem.**

---

## ⚡ Overview
**Watch Mode** is the background engine that makes LogicArt feel like a native desktop application. It monitors your code files for changes made by external tools—such as the **Replit Agent**, **Cursor**, or even a standard text editor—and updates the flowchart visualization automatically.

---

## 🛰 How it Works

The sync engine uses a high-frequency "Heartbeat" to keep the UI in lock-step with the disk:

1.  **Continuous Polling**: Every **2 seconds**, LogicArt asks the server for the "Health Status" of the underlying data file.
2.  **Timestamp Diffing**: The server checks the `lastModified` metadata of `server/data/flowchart.json`.
3.  **Hot Reload**: If the disk version is newer than the browser version, LogicArt performs a "Hot Logic Update," refreshing the code editor and flowchart without a page reload.

---

## 🤖 Partnering with AI Agents

This feature is specifically optimized for **Vibe Coding** workflows:

*   **Agent Autonomy**: When you ask an AI tool (like the Replit Agent) to "Refactor the authentication logic," it writes directly to the disk.
*   **Visual Confirmation**: You can keep the LogicArt Workbench open on a second monitor and watch the flowchart morph and grow as the AI works, providing immediate visual grounding for the AI's changes.
*   **The Bridge**: Combined with **Remote Sync**, this creates a "Triple-Sync" environment: IDE ↔ Disk ↔ LogicArt.

---

## 🛡 The "Anti-Echo" Guard

To prevent "Sync Loops" where the browser detects its own changes as external updates, LogicArt implements an **Anti-Echo Guard**:

*   **Edit Window**: When you type in the LogicArt editor, the sync engine enters a "Protected State" for **5 seconds**.
*   **Priority**: During this window, local edits take priority over disk changes, ensuring that the AI doesn't accidentally overwrite code while you are mid-sentence.

---

## 🚀 Quick Start: Syncing External Projects

You can synchronize any external project (like the **Vibe Task Manager**) with LogicArt using the `sync-to-logicart.js` utility.

### 1. The Bridge Utility
LogicArt provides a lightweight sync script (`sync-to-logicart.js`) that pipes your external source code directly into the LogicArt engine.

```bash
# Run the sync script in your project folder
node sync-to-logicart.js --file app.js --port 5001
```

### 2. Live Demo: Vibe Task Manager
For a live demonstration of this feature:
1.  Open the **Vibe Task Manager** (port 5002 if running locally).
2.  Open **LogicArt Workbench** in another window.
3.  Modify the logic in the Vibe app or its source file.
4.  Watch the LogicArt flowchart update in real-time.

---

## 🛠 Configuration & Data

The state is persisted in a standardized JSON format:

```json
{
  "nodes": [...],
  "edges": [...],
  "code": "function myLogic() { ... }"
}
```

This file is located at `server/data/flowchart.json`. Advanced users can manually edit this file or pipe it into other CI/CD processes for logic benchmarking.

---
**Code safely. Watch the flow grow.**
