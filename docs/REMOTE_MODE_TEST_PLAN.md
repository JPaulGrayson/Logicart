# LogiGo Remote Mode - Integration Test Plan

This guide walks through testing LogiGo's Remote Mode features with an external app (e.g., VisionLoop).

## Overview

Remote Mode enables external apps to connect to LogiGo Studio for real-time flowchart visualization and debugging. This test plan covers:

1. **Seeding** - Adding the bootstrap script to your app
2. **Self-Healing Loop** - Automatic reconnection and session recovery
3. **Visual Handshake** - Bidirectional click-to-highlight

---

## Prerequisites

- LogiGo Studio running at your Replit URL
- An external app (VisionLoop) where you can add a script tag
- Browser with developer tools for console inspection

---

## Step 1: Seed the External App

### 1.1 Add the Bootstrap Script

Add this single line to your external app's HTML:

```html
<script src="https://YOUR-LOGIGO-URL/remote.js?project=VisionLoop"></script>
```

**Options:**
| Parameter | Description | Default |
|-----------|-------------|---------|
| `project` | Session name shown in Studio | "Remote App" |
| `autoOpen` | Auto-open Studio on first checkpoint | `true` |

### 1.2 Verify Connection

Open your external app in a browser. Check the console for:

```
🔗 LogiGo Studio connected!
📊 View flowchart at: https://YOUR-LOGIGO-URL/?session=SESSION_ID
```

**Expected:**
- ✅ A floating badge appears (bottom-right): "View in LogiGo" with green dot
- ✅ Console shows connection messages

---

## Step 2: Add Checkpoints to Your Code

### 2.1 Basic Checkpoint

Add checkpoint calls at key points in your code:

```javascript
function processImage(image) {
  checkpoint('image-load', { filename: image.name });
  
  const processed = applyFilters(image);
  checkpoint('filters-applied', { filterCount: 3 });
  
  return processed;
}
```

### 2.2 Bind Elements (Optional - for Visual Handshake)

To enable element highlighting when clicking flowchart nodes:

```javascript
const uploadButton = document.getElementById('upload-btn');
LogiGo.bindElement('image-load', uploadButton);
```

### 2.3 Register Source Code (Optional)

For full flowchart visualization:

```javascript
LogiGo.registerCode(`
function processImage(image) {
  checkpoint('image-load', { filename: image.name });
  const processed = applyFilters(image);
  checkpoint('filters-applied', { filterCount: 3 });
  return processed;
}
`);
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
