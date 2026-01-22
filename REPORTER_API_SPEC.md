`# LogicArt Reporter API Specification

**Version:** 1.0.0-beta.2
**Status:** Final Draft
**Target Audience:** LogicArt Studio Team (Replit)

## 📡 Overview
The Reporter API streams real-time execution data from the user's application (running `logicart-core`) to external tools like the LogicArt Studio.

Communication happens via `window.postMessage`. The Studio should listen for these messages on the `window` object.

## 📨 Message Protocol

All messages sent by LogicArt Core follow this standard envelope:

```typescript
interface LogicArtMessage {
  source: 'LOGICART_CORE';
  type: string; // Event type (see below)
  payload: any; // Event data
}
```

### 1. Checkpoint Event (`LOGICART_CHECKPOINT`)
Fired whenever `LogicArt.checkpoint()` is executed in the user's code.

**Payload Schema:**
```typescript
interface CheckpointPayload {
  id: string;          // The unique ID of the checkpoint (e.g., "sort:swap")
  timestamp: number;   // Unix timestamp (ms)
  timeSinceStart: number; // Time in ms since the session started
  
  // Context Data
  variables: Record<string, any>; // Snapshot of variables at this point
  domElement?: string; // CSS selector of the highlighted element (if any)
  metadata?: Record<string, any>; // Any extra metadata passed to checkpoint()
}
```

**Example JSON:**
```json
{
  "source": "LOGICART_CORE",
  "type": "LOGICART_CHECKPOINT",
  "payload": {
    "id": "astar:process",
    "timestamp": 1716928301234,
    "timeSinceStart": 450,
    "variables": {
      "x": 12,
      "y": 7,
      "fScore": 15.5
    },
    "domElement": "#cell-12-7",
    "metadata": {
      "color": "#f1c40f"
    }
  }
}
```

### 2. Session Start Event (`LOGICART_SESSION_START`)
Fired when the page loads or `LogicArt.reset()` is called.

**Payload Schema:**
```typescript
interface SessionStartPayload {
  sessionId: string;
  startTime: number;
  url: string;
}
```

## 🛠️ Implementation Guide for Studio

To listen for these events in the LogicArt Studio, use the following code:

```javascript
window.addEventListener('message', (event) => {
  // 1. Security Check: Ensure message is from trusted source
  // (In development, you might accept all, but in prod, check origin)
  
  const data = event.data;
  
  // 2. Protocol Check
  if (data?.source !== 'LOGICART_CORE') return;
  
  // 3. Handle Events
  switch (data.type) {
    case 'LOGICART_CHECKPOINT':
      handleCheckpoint(data.payload);
      break;
      
    case 'LOGICART_SESSION_START':
      resetVisualization();
      break;
  }
});

function handleCheckpoint(payload) {
  console.log(`📍 Reached ${payload.id}`, payload.variables);
  
  // TODO: Highlight the corresponding node in the Flowchart
  // TODO: Update the "Live Variables" panel
}
```

## 🔄 The "Handshake" (Future Phase)
Currently, `logicart-core` broadcasts events blindly. In the future, we will implement a handshake where the Studio sends a `LOGICART_STUDIO_HELLO` message, and Core replies with `LOGICART_CORE_ACK` to establish a two-way control channel (allowing the Studio to Pause/Play the user's app).`
