# LogiGo Studio - Files for @logigo/bridge Integration

This document contains the key files from LogiGo Studio that Antigravity needs for `@logigo/bridge` integration.

## 1. Reporter API Types (`shared/reporter-api.ts`)

These are our current message protocol types for Studio ↔ Runtime communication.

```typescript
/**
 * Reporter API Type Definitions
 * 
 * Protocol for communication between LogiGo Studio (static analyzer)
 * and logigo-core (runtime debugger) via window.postMessage
 * 
 * Based on Antigravity's Reporter API Specification v1.0.0-beta.2
 */

// Message Envelope (all messages from logigo-core follow this structure)
export interface LogiGoMessage<T = any> {
  source: 'LOGIGO_CORE';
  type: string;
  payload: T;
}

// Event Types
export const LOGIGO_CHECKPOINT = 'LOGIGO_CHECKPOINT' as const;
export const LOGIGO_SESSION_START = 'LOGIGO_SESSION_START' as const;

// Checkpoint Event Payload
export interface CheckpointPayload {
  id: string;
  timestamp: number;
  timeSinceStart: number;
  variables: Record<string, any>;
  domElement?: string;
  metadata?: Record<string, any>;
}

// Session Start Event Payload
export interface SessionStartPayload {
  sessionId: string;
  startTime: number;
  url: string;
}

// Typed Message Types
export type CheckpointMessage = LogiGoMessage<CheckpointPayload> & {
  type: typeof LOGIGO_CHECKPOINT;
};

export type SessionStartMessage = LogiGoMessage<SessionStartPayload> & {
  type: typeof LOGIGO_SESSION_START;
};

export type ReporterMessage = CheckpointMessage | SessionStartMessage;

// Runtime Mode State (Studio internal state)
export interface RuntimeState {
  isConnected: boolean;
  mode: 'static' | 'live';
  lastHeartbeat?: number;
  checkpointCount: number;
  sessionId?: string;
  sessionStartTime?: number;
  currentCheckpoint?: CheckpointPayload;
}

// Message validator
export function isLogiGoMessage(message: any): message is LogiGoMessage {
  return (
    message &&
    typeof message === 'object' &&
    message.source === 'LOGIGO_CORE' &&
    typeof message.type === 'string' &&
    'payload' in message
  );
}

// Message type guards
export function isCheckpoint(message: LogiGoMessage): message is CheckpointMessage {
  return message.type === LOGIGO_CHECKPOINT;
}

export function isSessionStart(message: LogiGoMessage): message is SessionStartMessage {
  return message.type === LOGIGO_SESSION_START;
}
```

---

## 2. Parser Types & Features (`client/src/lib/parser.ts`)

Our parser has several features that should be merged into `@logigo/bridge`:

### Key Types

```typescript
export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container'; 
  data: { 
    label: string;
    description?: string;
    sourceData?: SourceLocation;      // Maps node back to source code
    children?: string[];               // For container nodes: IDs of child nodes
    collapsed?: boolean;               // For container nodes: collapse state
    zoomLevel?: 'mile-high' | '1000ft' | '100ft'; // Visibility at different zoom levels
  };
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
  className?: string;
  style?: { width: number; height: number };
  parentNode?: string;                 // For nodes inside containers
  extent?: 'parent';                   // For React Flow - keep nodes inside parent
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: 'smoothstep' | 'default';
  style?: any;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeMap: Map<string, string>;        // Maps "line:column" to nodeId (for highlighting)
}
```

### Key Features to Preserve

1. **Container/Section Detection**
   - Explicit section markers via comments: `// --- SECTION NAME ---`
   - Auto-detection of top-level function declarations
   - Fallback to "Global Flow" container when no sections detected

2. **Source Location Mapping**
   - `nodeMap: Map<string, string>` maps `"line:column"` → `nodeId`
   - Used for flowchart node highlighting during algorithm visualization
   - Enables "jump to source" and "highlight active line" features

3. **Node Types**
   - `input` - Start nodes (green)
   - `output` - Return/end nodes (red)
   - `decision` - If/while/for conditions (diamond shape)
   - `default` - Regular statements
   - `container` - Section groupings for hierarchical views

4. **Loop Handling**
   - Proper `break` and `continue` edge routing
   - Back-edges with dashed animation
   - For-loop update nodes for continue semantics

5. **Dagre Layout**
   - Uses `dagre` library for automatic node positioning
   - Configurable spacing for different node types

### Suggested Control Messages (for bi-directional editing)

```typescript
// Control messages for IDE integration (extend Reporter API)
export const LOGIGO_JUMP_TO_LINE = 'LOGIGO_JUMP_TO_LINE' as const;
export const LOGIGO_WRITE_FILE = 'LOGIGO_WRITE_FILE' as const;
export const LOGIGO_READ_FILE = 'LOGIGO_READ_FILE' as const;

export interface JumpToLinePayload {
  file: string;
  line: number;
  column?: number;
}

export interface WriteFilePayload {
  path: string;
  content: string;
}

export interface ReadFilePayload {
  path: string;
}
```

---

## 3. IFileSystem Interface (for Option A: Webview Server)

We're ready to integrate this interface for bi-directional editing:

```typescript
interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}
```

Our AI-assisted node editing feature (`NodeEditDialog.tsx`) will use this to patch source code when users edit flowchart nodes.

---

## Questions for Antigravity

1. Should the `nodeMap` (line:column → nodeId mapping) be part of the bridge output, or should Studio compute it separately?

2. For container nodes, do you want to preserve our section detection logic (comment markers + function auto-detect)?

3. The `dagre` layout is currently done client-side. Should this move to the bridge, or stay in Studio?

---

*Generated for @logigo/bridge integration - LogiGo Studio Team*
