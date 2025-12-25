# LogiGo Remote Mode - Integration Test Plan

This guide walks through testing LogiGo's Remote Mode features with an external app (e.g., VisionLoop).

## Overview

Remote Mode enables external apps to connect to LogiGo Studio for real-time flowchart visualization and debugging. This test plan covers:

1. **Seeding** - Adding the Vite plugin for automatic checkpoint injection
2. **Self-Healing Loop** - Automatic reconnection and session recovery
3. **Visual Handshake** - Bidirectional click-to-highlight

---

## Prerequisites

- LogiGo Studio running at your Replit URL
- An external Vite-based app (VisionLoop) 
- Browser with developer tools for console inspection

---

## Step 1: Seed VisionLoop (One Script Tag!)

### 1.1 Add ONE Script Tag

Add this single line to your app's HTML:

```html
<script src="https://YOUR-LOGIGO-URL/remote.js?project=VisionLoop"></script>
```

### 1.2 What Happens Automatically

When the page loads:
1. **Connection established** - Session created with Studio
2. **Badge appears** - Floating "View in LogiGo" badge in bottom-right
3. **Tip shown in console** - How to enable auto-discovery

### 1.3 Enable Instrumentation (Opt-In)

**For Vite/React apps (ES modules)** - run this in browser console:

```javascript
LogiGo.enableModuleInstrumentation()
```

Then **reload the page**. This will:
- ✅ Register a Service Worker that intercepts module requests
- ✅ Automatically inject checkpoints into your app's functions
- ✅ Send checkpoints to Studio as functions execute

**For traditional script apps** - run this instead:

```javascript
LogiGo.enableAutoDiscovery()
```

This scans `<script>` tags and wraps global functions.

### 1.4 Verify Connection

Open your app in a browser. Check the console for:

```
🔗 LogiGo Studio connected!
📊 View flowchart at: https://YOUR-LOGIGO-URL/?session=SESSION_ID
[LogiGo] Tip: Call LogiGo.enableAutoDiscovery() to auto-wrap global functions
```

After calling `enableAutoDiscovery()`:
```
[LogiGo] Auto-discovery enabled. Source code will be sent to Studio for visualization.
[LogiGo] Registered 3 script(s) for flowchart visualization
[LogiGo] Auto-wrapped 5 global function(s)
```

**Expected:**
- ✅ Floating badge appears (bottom-right): "View in LogiGo" with green dot
- ✅ Console shows connection messages
- ✅ After enabling auto-discovery, function checkpoints fire when code executes

---

## Alternative: Vite Plugin (Optional, for Build-Time Instrumentation)

For more granular control, you can use the Vite plugin instead:

### Install the Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { logigoPlugin } from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    logigoPlugin({
      autoInstrument: true,
      captureVariables: true
    })
  ]
});
```

This provides:
- ✅ Build-time instrumentation (faster runtime)
- ✅ Statement-level checkpoints (not just function entry/exit)
- ✅ Pre-computed flowchart manifest

---

## Step 2: Automatic Checkpoints (No Manual Code Required!)

### How It Works

The Vite plugin automatically instruments your code at build time. Your original code:

```javascript
function processImage(image) {
  const filename = image.name;
  const processed = applyFilters(image);
  return processed;
}
```

Becomes (after build):

```javascript
function processImage(image) {
  LogiGo.checkpoint('fn_abc123', { image });
  const filename = image.name;
  LogiGo.checkpoint('var_def456', { image, filename });
  const processed = applyFilters(image);
  LogiGo.checkpoint('var_ghi789', { image, filename, processed });
  return processed;
  LogiGo.checkpoint('ret_jkl012', { image, filename, processed });
}
```

### 2.1 Verify Auto-Instrumentation

1. Run your app
2. Execute a function
3. Watch Studio - nodes should highlight as each checkpoint fires
4. Check the Variables panel - captured variables appear automatically

### 2.2 Bind Elements (Optional - for Visual Handshake)

For click-to-highlight between Studio and your app, bind elements to checkpoint IDs:

```javascript
// The checkpoint ID comes from the manifest or console logs
const uploadButton = document.getElementById('upload-btn');
LogiGo.bindElement('fn_abc123', uploadButton);
```

### 2.3 Manual Checkpoints (Optional)

You can still add manual checkpoints for specific debugging:

```javascript
checkpoint('custom-step', { myVar: someValue });
```

---

## Step 3: Test Self-Healing Loop

### 3.1 Test Checkpoint Retry

1. Open your external app
2. Trigger a checkpoint (run your function)
3. **Simulate network issue**: In DevTools Network tab, set to "Offline"
4. Trigger another checkpoint
5. Watch console for retry messages:
   ```
   [LogiGo] Retry 1/3 in 1000ms...
   [LogiGo] Retry 2/3 in 2000ms...
   ```
6. Re-enable network
7. **Expected**: Checkpoint eventually succeeds, status dot turns green

### 3.2 Test Session Renewal

1. Open your external app and note the session ID in console
2. In a separate tab, call: `POST /api/remote/session/end` with that session ID
3. Trigger a checkpoint in your app
4. Watch console for:
   ```
   [LogiGo] Session expired (404). Attempting renewal...
   ✅ [LogiGo] Session renewed: abc12345 → def67890
   📊 New Studio URL: https://...
   ```
5. **Expected**: New session created, checkpoints continue working

### 3.3 Test Studio Reconnection

1. Open Studio with `/?session=SESSION_ID`
2. Verify "Connected: VisionLoop" badge in header
3. Restart the LogiGo server (simulates disconnect)
4. Watch Studio header for:
   - Badge changes to "Reconnecting..." with pulsing icon
   - After server restarts: "Connected: VisionLoop" returns
5. **Expected**: Studio auto-reconnects without page refresh

---

## Step 4: Test Visual Handshake

### 4.1 Studio → Remote Highlight

1. Open your external app with checkpoints
2. Open Studio in another tab with `/?session=SESSION_ID`
3. Register your code (so flowchart has nodes)
4. Click any flowchart node in Studio
5. **Expected in Remote App**:
   - If element was bound: Blue highlight overlay appears around the element
   - If no element bound: Toast notification "📍 Checkpoint: checkpoint-id"
6. **Expected in Studio Console**:
   ```
   [Visual Handshake] Sent highlight request: checkpoint-id
   ```

### 4.2 Verify Highlight Overlay

1. Bind an element to a checkpoint:
   ```javascript
   LogiGo.bindElement('upload-start', document.querySelector('.upload-btn'));
   ```
2. In Studio, click the corresponding flowchart node
3. **Expected**:
   - Element scrolls into view
   - Blue animated border appears around the element
   - Border fades after 3 seconds

### 4.3 Test Fallback Toast

1. Trigger a checkpoint WITHOUT binding an element
2. In Studio, click that node
3. **Expected**: Toast appears at top of remote app: "📍 Checkpoint: checkpoint-id"

---

## Step 5: End-to-End Flow

### Complete Integration Test

1. **Seed**: Add `<script src=".../remote.js?project=VisionLoop"></script>` to your app
2. **Register Code**: Call `LogiGo.registerCode(yourFunctionCode)`
3. **Bind Elements**: Call `LogiGo.bindElement('id', element)` for key elements
4. **Run Your App**: Trigger checkpoints by executing your function
5. **Open Studio**: Click the badge or navigate to `/?session=SESSION_ID`
6. **Verify Flowchart**: See your function visualized as a flowchart
7. **See Highlights**: Nodes highlight as checkpoints fire
8. **Click Nodes**: Studio node clicks highlight elements in your app
9. **Test Recovery**: Kill and restart server, verify auto-reconnection

---

## Verification Checklist

### Seeding
- [ ] Script loads without errors
- [ ] Badge appears in remote app
- [ ] Console shows connection messages

### Checkpoints
- [ ] `checkpoint()` calls send data to Studio
- [ ] Variables display in Studio's Debug Panel
- [ ] Flowchart nodes highlight when checkpoints fire

### Self-Healing
- [ ] Badge dot turns yellow during reconnection
- [ ] Retry messages appear in console (3 attempts)
- [ ] Session renewal creates new session on 404
- [ ] Studio reconnects after server restart

### Visual Handshake
- [ ] Clicking Studio node sends highlight command
- [ ] Bound elements show blue overlay
- [ ] Unbound checkpoints show toast fallback
- [ ] Overlay fades after 3 seconds

---

## Troubleshooting

### Badge Not Appearing
- Check script URL is correct
- Verify no CORS errors in console
- Ensure `document.body` exists when script loads

### Checkpoints Not Reaching Studio
- Check network tab for failed requests
- Verify session hasn't expired (1 hour timeout)
- Look for retry messages in console

### Visual Handshake Not Working
- Check WebSocket connection in Network tab (filter: WS)
- Verify element is bound with `LogiGo.bindElement()`
- Look for "[Control Channel] WebSocket connected" in Studio console

### Studio Not Reconnecting
- Check if session was ended (vs just disconnected)
- Look for "Max reconnection attempts reached" message
- Refresh page to create new SSE connection

---

## API Reference

### Global Functions (injected by remote.js)

```javascript
// Send a checkpoint with variables
checkpoint(id, variables, options)

// Alias for checkpoint
LogiGo.checkpoint(id, variables, options)

// Register source code for flowchart visualization
LogiGo.registerCode(codeString)

// Bind a DOM element to a checkpoint for Visual Handshake
LogiGo.bindElement(checkpointId, domElement)

// Get current connection status
LogiGo.connectionStatus() // 'connected' | 'reconnecting' | 'error'

// Manually open Studio
LogiGo.openStudio()

// Force session renewal
LogiGo.renewSession()
```

### Session Properties

```javascript
LogiGo.sessionId    // Current session UUID
LogiGo.studioUrl    // URL to open Studio with this session
LogiGo.viewUrl      // Alias for studioUrl
```
