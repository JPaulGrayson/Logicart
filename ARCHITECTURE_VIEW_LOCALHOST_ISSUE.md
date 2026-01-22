# LogicArt Architecture View - localhost Issue

**Date:** January 15, 2026  
**Environment:** Turai-v1 running locally on macOS

---

## Issue Summary

The Architecture View feature returns **HTTP 400** when testing from localhost.

### Console Log:
```
[LogiGo] Architecture view: 43 files from http://localhost:5001/api/source
Failed to load resource: the server responded with a status of 400 ()
[LogiGo] Failed to build architecture: - "HTTP 400"
```

---

## Root Cause Analysis

### The Flow:
1. Browser calls `LogicArt.openArchitecture("http://localhost:5001/api/source", files)`
2. LogicArt's **remote.js** sends request to **logic.art/api/agent/scan-project**
3. LogicArt's server (hosted on Replit) tries to fetch files from the `sourceUrl`
4. **FAILS** - LogicArt's server cannot reach `http://localhost:5001` (private network)

### Why It Works on Replit, Not Localhost:

| Environment | sourceUrl | Can LogicArt server reach it? |
|-------------|-----------|-------------------------------|
| **Replit-hosted Turai** | `https://turai.replit.app/api/source` | ✅ Yes (public URL) |
| **Localhost Turai** | `http://localhost:5001/api/source` | ❌ No (private network) |

---

## What We Verified

1. **The /api/source endpoint works locally:**
   ```bash
   curl "http://localhost:5001/api/source?file=src/App.tsx"
   # Successfully returns: import { useState, useEffect, useRef } from 'react'; ...
   ```

2. **Both query param and wildcard formats supported:**
   - ✅ `/api/source?file=src/App.tsx` (LogicArt format)
   - ✅ `/api/source/src/App.tsx` (legacy format)

3. **The issue is network accessibility**, not the endpoint implementation.

---

## Questions for Replit Team

1. **Is this expected behavior?** Should Architecture View only work for publicly-accessible apps?

2. **Could the client-side alternative help?**
   - `openArchitectureWithCode(filesData)` fetches files client-side then sends contents
   - This avoids the server-to-server fetch issue
   - Should FlowchartButton use this method for localhost compatibility?

3. **Is there a recommended development workflow?**
   - Use ngrok to expose localhost?
   - Always test on Replit?
   - Something else?

---

## Suggested Solutions

### Option A: Use `openArchitectureWithCode()` for localhost
Modify FlowchartButton to:
1. Fetch files client-side first (client → localhost works)
2. Call `openArchitectureWithCode({ "file.tsx": contents, ... })`
3. Skip the server-to-server URL fetch

### Option B: Detect localhost and show instructions
If sourceUrl is localhost, show: "Architecture View requires a public URL. Deploy to Replit or use ngrok."

### Option C: Add localhost detection to LogicArt
Have remote.js detect localhost URLs and automatically switch to client-side fetching.

---

## Files Modified During Investigation

### Turai-v1 (local):
- `server/routes.ts` - Added query parameter format support for `/api/source`

### LogiGo (local):
- Updated to `logicart.git` remote (was pointing to old `LogiGo.git`)
- Synced 46 new commits from Replit

---

**Awaiting guidance from Replit team on preferred solution.**
