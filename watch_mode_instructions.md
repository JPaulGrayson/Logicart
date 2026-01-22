# Implementation Plan: LogicArt File Sync & Watch Mode

We are enabling a "Bi-directional Sync" workflow where the Replit Agent can edit the flowchart data on disk, and the frontend updates automatically without a page reload.

## 1. Backend: File Storage & Status
**Goal:** Replace/Augment the database storage with a local JSON file that acts as the "Source of Truth" for Vibe Coding.

**Actions (`server/server.ts` or `server/routes.ts`):**

1.  **Define the File Path:**
    * Store the main flowchart data at: `data/flowchart.json`.
    * Ensure the `data/` directory exists on startup.

2.  **Update `/save` Endpoint:**
    * When saving, write the JSON content to `data/flowchart.json` (fs.writeFileSync).

3.  **Update `/load` Endpoint:**
    * Read from `data/flowchart.json`. If it doesn't exist, return a default empty chart.

4.  **Create `/status` Endpoint (The Watcher):**
    * **Method:** `GET /api/file/status`
    * **Logic:** Return the `mtimeMs` (Last Modified Timestamp) of `data/flowchart.json`.
    * **Response:** `{ "lastModified": 17098234... }`

## 2. Frontend: The `useWatchFile` Hook
**Goal:** A React hook that polls the server for file changes and updates the state automatically.

**Actions (`client/src/hooks/useWatchFile.ts`):**

1.  **Create the Hook:**
    ```typescript
    import { useState, useEffect } from 'react';

    export function useWatchFile(onUpdate: (data: any) => void) {
      const [lastKnownTime, setLastKnownTime] = useState(0);

      useEffect(() => {
        const interval = setInterval(async () => {
          try {
            // 1. Check if file has changed on server
            const statusRes = await fetch('/api/file/status');
            const { lastModified } = await statusRes.json();

            // 2. If server file is newer than what we have, fetch data
            if (lastModified > lastKnownTime) {
              console.log("File changed externally! Reloading...");
              const dataRes = await fetch('/api/arena/history'); // or your load endpoint
              const newData = await dataRes.json();
              
              setLastKnownTime(lastModified);
              onUpdate(newData);
            }
          } catch (err) {
            console.error("Watch mode error:", err);
          }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
      }, [lastKnownTime, onUpdate]);
    }
    ```

## 3. Frontend: Integration
**Actions (`App.tsx`):**

1.  **Import & Use:**
    * Import `useWatchFile`.
    * Pass your state setter (e.g., `setFlowchartData`) to the hook.
    * *Note:* Ensure this doesn't overwrite unsaved work by adding a simple check (e.g., only update if the user hasn't typed in the last 5 seconds, or just show a "Data Updated: Click to Refresh" toast notification if you want to be safe). For V1, auto-updating is fine.

## 4. Usage Test (For the Agent)
Once implemented, verify by running this manually in the Replit Shell:
`echo '{"nodes": [{"id": "1", "text": "Agent Created Node"}]}' > data/flowchart.json`

The UI should update to show this node within 2 seconds.