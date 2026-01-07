# Remote Sync Guide: IDE Telepresence
**Connect your local editor to LogicArt for real-time visual debugging.**

---

## 🛰 The "Telepresence" Workflow
Remote Sync (also known as "Remote Mode") allows you to stay in your favorite IDE (VS Code, Cursor) while LogicArt acts as a high-fidelity visual dashboard in the background.

---

## 🔗 Connecting your IDE

Follow these steps to establish a live link:

1.  **Open LogicArt Workbench**: Start the application on `localhost:5001`.
2.  **Toggle Remote Mode**: Click the **"Remote Mode"** toggle in the bottom-left sidebar.
3.  **Copy the Bridge URL**: A unique Session URL will be generated.
4.  **Configure IDE Extension**:
    *   Open the LogicArt extension in VS Code.
    *   Paste the Bridge URL into the "Remote Session" field.
    *   Click **"Sync"**.

---

## 👻 Ghost Projection
Once connected, LogicArt begins "Projecting" your local state into the Workbench.

*   **Real-time Logic Diff**: As you type code in VS Code, LogicArt instantly recalculates the flowchart structure.
*   **Zero-Friction Sync**: You don't need to copy-paste. The bridge handles "Hot Logic Updates" automatically.
*   **Visual Logic Mapping**: Use the LogicArt flowchart as a map to navigate complex modules. Clicking a node in LogicArt will jump your IDE cursor to that exact line.

---

## 🪞 Execution Mirroring (Live Debugging)
This is the most advanced part of the Remote Sync trilogy.

1.  **Set Breakpoints**: Set a breakpoint in your IDE (VS Code/Cursor).
2.  **Trigger Execution**: Run your local app (e.g., `npm run dev`).
3.  **Visual Handshake**: When the breakpoint is hit, the corresponding node in LogicArt will **glow red**.
4.  **Variable Spying**: Inspect the LogicArt sidebar to see a visual timeline of variable changes that occurred *leading up* to that breakpoint.

---

## 🔌 Technical Underpinnings
*   **Bridge API**: LogicArt uses a dedicated bridge service (`/api/remote`) to pipe file-change events and runtime snapshots.
*   **Latency**: Designed for sub-100ms updates on local loopback.
*   **Security**: Each session has a unique `sessionId`. Logic is only shared between your IDE and your local LogicArt instance.

---
**Code in your IDE. Visualise in the Studio. Master the flow.**
