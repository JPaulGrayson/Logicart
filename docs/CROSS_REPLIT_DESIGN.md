# LogicArt Cross-Replit Communication Design

## The Problem

LogicArt currently uses `window.postMessage` for real-time communication between instrumented code and the flowchart visualization. This only works when both are running in the **same browser tab/window**.

**Real-world scenario:** A user has two Replit apps:
- **App A** (e.g., "Turai" - a tour creator)
- **LogicArt** (running in a separate tab)

When App A executes instrumented code with `LogicArt.checkpoint()` calls, those messages can't reach LogicArt in a different tab. The browser's same-origin policy prevents cross-tab `postMessage` without explicit window references.

---

## The Solution: Remote Mode

Add an API-based communication layer that allows any external Replit app to send checkpoint data to LogicArt over HTTP, with real-time updates via Server-Sent Events (SSE).

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────┐          HTTP POST          ┌────────────────┐
│  │   External App  │ ──────────────────────────► │   LogicArt       │
│  │   (Turai)       │    /api/remote/checkpoint   │   Server       │
│  │                 │                              │                │
│  │  checkpoint()   │                              │  Stores in     │
│  │  checkpoint()   │                              │  session queue │
│  └─────────────────┘                              └───────┬────────┘
│                                                           │
│                                                           │ SSE Stream
│                                                           ▼
│                                                   ┌────────────────┐
│                                                   │   LogicArt       │
│                                                   │   Frontend     │
│                                                   │                │
│                                                   │  Highlights    │
│                                                   │  nodes in      │
│                                                   │  real-time     │
│                                                   └────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Design

### 1. Create Session

Before sending checkpoints, the external app creates a session and optionally sends the code to visualize.

```
POST /api/remote/session
Content-Type: application/json

{
  "code": "function fibonacci(n) { ... }",  // Optional: code to parse
  "name": "Turai Tour Generator"            // Optional: display name
}

Response:
{
  "sessionId": "abc123",
  "connectUrl": "https://logicart.replit.app/remote/abc123"
}
```

The `connectUrl` is what users open in LogicArt to see the visualization.

### 2. Send Checkpoint

As code executes, send checkpoint events:

```
POST /api/remote/checkpoint
Content-Type: application/json

{
  "sessionId": "abc123",
  "checkpoint": {
    "id": "step-1",           // Unique checkpoint identifier
    "label": "Processing tour data",
    "variables": {
      "tourName": "Paris Adventure",
      "stops": 5
    },
    "line": 42                // Optional: source line number
  }
}

Response:
{ "received": true }
```

### 3. End Session

Signal that execution is complete:

```
POST /api/remote/session/end
Content-Type: application/json

{
  "sessionId": "abc123"
}
```

### 4. SSE Stream (LogicArt Frontend)

LogicArt's frontend subscribes to real-time updates:

```
GET /api/remote/stream/:sessionId

Event stream:
event: checkpoint
data: {"id":"step-1","variables":{"tourName":"Paris"},"timestamp":1703123456789}

event: checkpoint
data: {"id":"step-2","variables":{"tourName":"Paris","validated":true}}

event: session_end
data: {}
```

---

## LogicArt UI Changes

### Remote Mode Panel

Add a new "Remote" tab/mode in LogicArt:

```
┌─────────────────────────────────────────────────────────────────┐
│  LogicArt                                    [Local] [Remote]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Remote Session: abc123                    Status: ● Connected  │
│  From: Turai Tour Generator                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              Flowchart Canvas                           │   │
│  │         (nodes highlight as checkpoints arrive)         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Variables:                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  tourName: "Paris Adventure"                            │   │
│  │  stops: 5                                               │   │
│  │  validated: true                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Copy Integration Code]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Code Generator

One-click copy of integration code for external apps:

```javascript
// Add this to your Replit app to send checkpoints to LogicArt

const LOGICART_URL = 'https://logicart.replit.app';
const SESSION_ID = 'abc123';

async function checkpoint(id, variables = {}) {
  await fetch(`${LOGICART_URL}/api/remote/checkpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      checkpoint: { id, variables }
    })
  });
}

// Usage in your code:
checkpoint('start', { input: userInput });
// ... your code ...
checkpoint('processing', { step: 1, data: result });
// ... more code ...
checkpoint('complete', { output: finalResult });
```

---

## Session Management

Sessions are stored in-memory with auto-expiration:

```typescript
interface RemoteSession {
  id: string;
  name?: string;
  code?: string;              // Source code for flowchart generation
  flowchartData?: FlowData;   // Parsed flowchart (if code provided)
  checkpointQueue: Checkpoint[];
  sseClients: Response[];     // Connected SSE clients
  createdAt: Date;
  lastActivity: Date;
}

// Sessions expire after 1 hour of inactivity
// Max 100 active sessions per instance
```

---

## Node ID Matching Strategy

For checkpoint highlighting to work, we need to match checkpoint IDs to flowchart nodes.

### Option A: User-Defined IDs (Recommended)

Users provide meaningful checkpoint IDs that we display as labels:

```javascript
// In external app
checkpoint('validate-input', { ... });
checkpoint('process-tour', { ... });
checkpoint('save-result', { ... });
```

LogicArt shows these as a linear execution trace, highlighting each step as it arrives. This works even without source code.

### Option B: Line-Based Matching

If the external app sends `line` numbers and provides source code:

```javascript
checkpoint('step', { line: 42, variables: { ... } });
```

LogicArt matches line 42 to the corresponding flowchart node using the same line-based node IDs from the parser.

### Option C: Hybrid Approach

1. If code is provided, parse and render flowchart with line-based nodes
2. Match incoming checkpoints by line number when available
3. Fall back to sequential trace display for unmatched checkpoints

---

## Security Considerations

### Rate Limiting
- Max 100 checkpoints per second per session
- Max 10 sessions per IP address
- Checkpoint payload size limit: 10KB

### Session Isolation
- Each session has a unique random ID (UUID v4)
- No authentication required for MVP (session ID acts as bearer token)
- Future: Optional API key authentication for production use

### CORS
- Allow requests from any origin (external Replit apps have different domains)
- Validate Content-Type header

---

## Implementation Tasks

1. **Backend: Session API**
   - POST /api/remote/session (create)
   - POST /api/remote/checkpoint (send)
   - POST /api/remote/session/end (close)
   - GET /api/remote/stream/:sessionId (SSE)

2. **Backend: Session Store**
   - In-memory session storage
   - Auto-expiration after inactivity
   - Checkpoint queue per session

3. **Frontend: Remote Mode**
   - New "Remote" tab in header
   - Session connection UI
   - Integration code generator
   - SSE subscription and checkpoint handling

4. **Frontend: Trace Visualization**
   - Sequential checkpoint display
   - Variable inspector updates
   - Node highlighting (when code provided)

5. **Documentation**
   - Integration guide
   - Example code snippets
   - Troubleshooting

---

## Open Questions for Antigravity

1. **Authentication:** Should we require API keys for production use, or is session ID sufficient?

2. **Persistence:** Should sessions survive server restarts? (Currently in-memory only)

3. **Multi-user:** Should multiple LogicArt users be able to view the same remote session?

4. **Bidirectional:** Should LogicArt be able to send commands back to the external app (e.g., pause, step)?

5. **NPM Package:** Should we publish a `logicart-remote` package that external apps can install for easier integration?

---

## Comparison with Embed Approach

| Feature | Embed (logicart-embed) | Remote Mode |
|---------|---------------------|-------------|
| Setup complexity | Add React component | Copy snippet |
| Latency | Instant (same window) | ~50-100ms (HTTP) |
| Works across Replits | No (same window only) | Yes |
| Requires React | Yes | No |
| Flowchart in user's app | Yes | No (separate tab) |
| Best for | Single-app visualization | Multi-app workflows |

Both approaches complement each other. Embed is best when you want the visualization inside your app. Remote Mode is best when you have multiple apps that need to communicate with a central LogicArt instance.
