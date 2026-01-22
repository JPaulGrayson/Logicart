# LogicArt Live Mode - Status & Questions for Antigravity

**Date:** December 20, 2025  
**Context:** VisionLoop integration test revealed gap between expected and delivered experience

---

## What We Tested

A user installed LogicArt into VisionLoop (a separate Replit project) following the INSTALLATION_GUIDE.md instructions. The Replit Agent added checkpoint calls to `processNextIteration()`.

**Expected:** Visual flowchart debugging experience  
**Actual:** Console logs only - no visualization

---

## What Exists (Built & Working)

### 1. Reporter API - Sender Side (logicart-core)
**File:** `src/reporter.js`, `src/runtime.js`

The LogicArtReporter class captures checkpoints and broadcasts via `window.postMessage`:

```javascript
// src/runtime.js - checkpoint() calls reporter.recordCheckpoint()
if (this.reporter) {
  this.reporter.recordCheckpoint({
    nodeId,
    metadata,
    domElement: metadata.domElement
  });
}
```

### 2. Reporter API - Receiver Side (LogicArt Studio)
**File:** `client/src/pages/Workbench.tsx`

LogicArt Studio listens for postMessage events:

```javascript
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'LOGICART_CORE') return;
  
  if (event.data.type === 'LOGICART_CHECKPOINT') {
    // Highlight node, update variables panel
  }
});
```

### 3. Message Protocol Spec
**File:** `REPORTER_API_SPEC.md`, `shared/reporter-api.ts`

Fully specified message format:
- `LOGICART_SESSION_START` - Session begins
- `LOGICART_CHECKPOINT` - Checkpoint fired
- Payload includes: id, timestamp, variables, domElement

### 4. Static Mode (Works)
Users can paste code into LogicArt Studio and see the flowchart immediately.

---

## The Gap: Cross-Project Communication

### The Problem

`window.postMessage` only works **within the same browser window/tab**.

- VisionLoop runs in: `https://visionloop.replit.app`
- LogicArt Studio runs in: `https://logicart-studio.replit.app`

They are **different origins in different tabs**. The postMessage events from VisionLoop never reach LogicArt Studio.

### What the User Expected

After adding checkpoints to VisionLoop:
1. Open LogicArt Studio
2. See VisionLoop's execution flow visualized in real-time
3. Watch the flowchart animate as iterations process

### What Actually Happened

1. Checkpoints log to VisionLoop's console
2. LogicArt Studio shows nothing (no connection)
3. User must manually paste code into Studio for any visualization

---

## Possible Solutions

### Option A: logicart-core Overlay in VisionLoop Frontend

**How it works:**
- VisionLoop's React frontend imports `logicart-core`
- The `LogicArtOverlay` renders a floating visual panel directly in VisionLoop
- No cross-tab communication needed

**Pros:**
- Works today with existing code
- Self-contained - no external dependencies
- User sees visualization right where they're working

**Cons:**
- Only works for apps with a frontend
- Backend-only apps (pure Node.js) can't use this
- Separate from the full LogicArt Studio experience

### Option B: WebSocket/Server Bridge

**How it works:**
- VisionLoop sends checkpoints to a bridge server
- LogicArt Studio connects to the same bridge
- Server relays checkpoints from VisionLoop → Studio

**Pros:**
- Works for any app (frontend or backend)
- Full LogicArt Studio experience
- Could support multiple apps connecting simultaneously

**Cons:**
- Requires additional infrastructure
- More complex setup
- Latency considerations

### Option C: Shared Iframe/Webview Approach

**How it works:**
- LogicArt Studio embedded as an iframe in VisionLoop
- postMessage works between parent and iframe (same window)

**Pros:**
- Uses existing postMessage code
- No server infrastructure

**Cons:**
- Significant UX change
- May not work well for all apps
- Security considerations with iframes

### Option D: Browser Extension

**How it works:**
- Browser extension captures checkpoints from any tab
- Relays them to LogicArt Studio tab

**Pros:**
- Works across tabs
- No app changes needed

**Cons:**
- Requires extension installation
- Browser-specific implementations

---

## Questions for Antigravity

1. **Was cross-project Live Mode ever intended to work?**
   - Or was the design always: overlay in same app OR paste code into Studio?

2. **Which solution path should we pursue?**
   - Option A (overlay in frontend) is ready today
   - Option B (WebSocket bridge) needs new infrastructure
   - Other ideas?

3. **For VisionLoop specifically:**
   - VisionLoop has a React frontend - should we add the logicart-core overlay there?
   - Or is VisionLoop meant to demonstrate backend-only integration?

4. **Documentation update:**
   - Should INSTALLATION_GUIDE.md clarify that:
     - Backend checkpoints = console logging only
     - For visual debugging: use overlay in frontend OR paste code into Studio

5. **Who should implement what?**
   - Replit team: Update documentation, Studio improvements
   - Antigravity team: logicart-core enhancements, bridge infrastructure

---

## Current State Summary

| Component | Status | Location |
|-----------|--------|----------|
| Static Mode | Working | LogicArt Studio |
| Reporter API (sender) | Built | src/reporter.js |
| Reporter API (receiver) | Built | Workbench.tsx |
| postMessage protocol | Specified | REPORTER_API_SPEC.md |
| Cross-tab communication | Not working | (architecture gap) |
| logicart-core overlay | Built | npm package |
| VisionLoop frontend overlay | Not installed | (could add) |

---

## Immediate Next Steps (Pending Decision)

1. **If Option A (overlay):** Add logicart-core overlay to VisionLoop's React frontend
2. **If Option B (bridge):** Design WebSocket bridge architecture
3. **Either way:** Update INSTALLATION_GUIDE.md to set correct expectations

---

## Files Referenced

- `src/reporter.js` - Reporter class (has git merge conflict markers)
- `src/runtime.js` - ExecutionController with checkpoint()
- `client/src/pages/Workbench.tsx` - Studio's message listener
- `shared/reporter-api.ts` - Type definitions
- `REPORTER_API_SPEC.md` - Full protocol spec
- `docs/INSTALLATION_GUIDE.md` - User-facing installation docs
