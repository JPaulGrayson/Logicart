# Bidirectional Features Implementation Plan

**Date:** December 23, 2025  
**Status:** Planned  
**Priority:** Medium  

---

## Overview

This plan covers three features that require bidirectional communication between LogiGo Studio and remote applications (like VisionLoop):

1. **Remote Mode Pause/Resume** - Breakpoints actually pause remote execution
2. **Visual Handshake** - Click flowchart node → highlight DOM element (and vice versa)
3. **Self Healing Loop** - Automatic reconnection and error recovery

---

## Shared Architecture: Bidirectional Command Channel

### Current State (One-Way)
```
VisionLoop ──POST /checkpoint──> LogiGo Server ──SSE──> LogiGo Studio
```

### Required State (Two-Way)
```
VisionLoop <──WebSocket──> LogiGo Server <──WebSocket──> LogiGo Studio
         (commands)              (state sync)           (UI controls)
```

### Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| **WebSocket** | Real-time, bidirectional | More complex, connection management |
| **Long Polling** | Simpler, HTTP-based | Higher latency, more requests |
| **Server-Sent Events + POST** | Uses existing SSE | Asymmetric, two channels to manage |

**Recommendation:** WebSocket for real-time control with SSE fallback for read-only viewers.

---

## Feature 1: Remote Mode Pause/Resume

### Goal
When a breakpoint is set in LogiGo, the remote app actually pauses execution at that checkpoint.

### Implementation Steps

1. **Server: Add WebSocket endpoint**
   - `ws://logigo/api/remote/control/:sessionId`
   - Handles: `SET_BREAKPOINT`, `REMOVE_BREAKPOINT`, `RESUME`, `STEP`

2. **Server: Breakpoint state management**
   ```typescript
   interface SessionBreakpoints {
     sessionId: string;
     breakpoints: Set<string>; // checkpoint IDs
     pausedAt: string | null;  // currently paused checkpoint
     waitingForResume: boolean;
   }
   ```

3. **Remote.js: Connect to WebSocket**
   ```javascript
   const ws = new WebSocket(LOGIGO_URL.replace('http', 'ws') + '/api/remote/control/' + SESSION_ID);
   ws.onmessage = (event) => {
     const cmd = JSON.parse(event.data);
     if (cmd.type === 'SET_BREAKPOINT') breakpoints.add(cmd.id);
     if (cmd.type === 'RESUME') resumeExecution();
   };
   ```

4. **Remote.js: Async checkpoint with pause**
   ```javascript
   window.checkpoint = async function(id, variables) {
     // Send checkpoint
     await fetch(LOGIGO_URL + '/api/remote/checkpoint', {...});
     
     // Check if breakpoint is set
     if (breakpoints.has(id)) {
       await waitForResume(); // Blocks until RESUME command
     }
   };
   ```

5. **Studio UI: Send commands**
   - Right-click "Add Breakpoint" → sends `SET_BREAKPOINT` via WebSocket
   - "Resume" button → sends `RESUME` command
   - "Step" button → sends `STEP` command (resume + pause at next)

### Files to Modify
- `server/routes.ts` - Add WebSocket endpoint
- `server/routes.ts` - Update remote.js bootstrap script
- `client/src/pages/RemoteMode.tsx` - Connect UI to WebSocket commands

---

## Feature 2: Visual Handshake

### Goal
- Click flowchart node → Highlight corresponding DOM element in remote app
- Hover DOM element → Highlight flowchart node in LogiGo

### Implementation Steps

1. **Checkpoint payload enhancement**
   ```typescript
   interface CheckpointPayload {
     id: string;
     variables: Record<string, any>;
     domSelector?: string;  // CSS selector of related element
     domRect?: DOMRect;     // Bounding box for overlay
   }
   ```

2. **Remote.js: DOM element tracking**
   ```javascript
   window.checkpoint = function(id, variables, options) {
     const payload = { id, variables };
     
     if (options?.element) {
       payload.domSelector = generateSelector(options.element);
       payload.domRect = options.element.getBoundingClientRect();
     }
     // ... send checkpoint
   };
   ```

3. **Remote.js: Inject highlight overlay**
   ```javascript
   ws.onmessage = (event) => {
     const cmd = JSON.parse(event.data);
     if (cmd.type === 'HIGHLIGHT_ELEMENT') {
       showHighlightOverlay(cmd.selector, cmd.rect);
     }
   };
   
   function showHighlightOverlay(selector, rect) {
     const overlay = document.createElement('div');
     overlay.className = 'logigo-highlight';
     overlay.style.cssText = `
       position: fixed;
       left: ${rect.left}px; top: ${rect.top}px;
       width: ${rect.width}px; height: ${rect.height}px;
       border: 3px solid #8B5CF6;
       background: rgba(139, 92, 246, 0.1);
       pointer-events: none;
       z-index: 999999;
     `;
     document.body.appendChild(overlay);
   }
   ```

4. **Studio: Click-to-highlight**
   - Click node → Extract domSelector from checkpoint data
   - Send `HIGHLIGHT_ELEMENT` command via WebSocket

5. **Remote.js: Hover reporting** (optional)
   - Track mouse over elements with `data-logigo-checkpoint` attribute
   - Send `ELEMENT_HOVER` message to highlight node in Studio

### Files to Modify
- `server/routes.ts` - Add highlight commands to WebSocket
- `server/routes.ts` - Update remote.js with overlay injection
- `client/src/pages/RemoteMode.tsx` - Node click → send highlight command
- `shared/reporter-api.ts` - Add new message types

---

## Feature 3: Self Healing Loop

### Goal
Automatic recovery from connection drops, session expiry, and transient errors.

### Implementation Steps (Can be done independently)

1. **Reconnection logic in remote.js**
   ```javascript
   let reconnectAttempts = 0;
   const MAX_RECONNECTS = 5;
   
   function connectWebSocket() {
     ws = new WebSocket(url);
     ws.onclose = () => {
       if (reconnectAttempts < MAX_RECONNECTS) {
         reconnectAttempts++;
         setTimeout(connectWebSocket, 1000 * reconnectAttempts);
       }
     };
     ws.onopen = () => { reconnectAttempts = 0; };
   }
   ```

2. **Checkpoint retry with exponential backoff**
   ```javascript
   async function sendCheckpoint(data, retries = 3) {
     try {
       await fetch(url, { body: JSON.stringify(data) });
     } catch (e) {
       if (retries > 0) {
         await sleep(1000);
         return sendCheckpoint(data, retries - 1);
       }
     }
   }
   ```

3. **Session renewal**
   - If session expires (404), automatically create new session
   - Re-register code if previously registered
   - Notify user of session change

4. **Studio: Connection status indicator**
   - Show "Reconnecting..." when connection drops
   - Show checkpoint buffer count during reconnection

### Files to Modify
- `server/routes.ts` - Update remote.js bootstrap
- `client/src/pages/RemoteMode.tsx` - Connection status UI

---

## Implementation Order

### Phase 1: WebSocket Foundation (Required for Features 1 & 2)
1. Add WebSocket endpoint to server
2. Update remote.js to connect via WebSocket
3. Test bidirectional message flow

### Phase 2: Remote Mode Pause/Resume
1. Implement breakpoint state management
2. Add async checkpoint with pause
3. Wire up Resume/Step UI buttons

### Phase 3: Visual Handshake
1. Add domSelector to checkpoint payload
2. Implement highlight overlay injection
3. Add click-to-highlight in Studio

### Phase 4: Self Healing Loop (Independent)
1. Add reconnection logic
2. Implement retry with backoff
3. Add connection status UI

---

## Effort Estimates

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| WebSocket Foundation | 2-3 hours | None |
| Remote Mode Pause | 2 hours | WebSocket |
| Visual Handshake | 2-3 hours | WebSocket |
| Self Healing Loop | 1-2 hours | None |
| **Total** | **7-10 hours** | |

---

## Testing Plan

1. **WebSocket Connection**
   - Connect from remote app, verify handshake
   - Send commands, verify receipt

2. **Pause/Resume**
   - Set breakpoint, trigger checkpoint, verify pause
   - Send resume, verify execution continues

3. **Visual Handshake**
   - Click node, verify DOM highlight appears
   - Verify highlight disappears after timeout

4. **Self Healing**
   - Kill server, verify reconnection attempts
   - Restart server, verify automatic recovery

---

*Document created by LogiGo Agent - December 23, 2025*
