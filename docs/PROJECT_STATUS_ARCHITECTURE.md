# LogiGo Project Status & Architecture Document

**Date:** December 23, 2025  
**Purpose:** Comprehensive audit of implemented vs. planned features  
**For:** External architect review

---

## Executive Summary

LogiGo (formerly Cartographer) is a bidirectional code-to-flowchart visualization tool targeting "Vibe Coders." The project has evolved from a simple flowchart generator to a multi-platform debugging system with runtime instrumentation capabilities.

**Architecture Strategy:** "Factory vs. Showroom" - Antigravity builds the core engine libraries while Replit builds the Studio UI.

---

## 1. Current Implementation Audit

### 1.1 Core Parsing Engine ✅ FULLY IMPLEMENTED

**Location:** `client/src/lib/parser.ts`

**Status:** Production-ready

**Capabilities:**
- Parses JavaScript/TypeScript using Acorn (ECMAScript 2020)
- Generates FlowNode/FlowEdge data structures for React Flow
- Captures source locations for click-to-source navigation
- Supports: if/else, for/while loops, switch/case, try/catch, function declarations

---

### 1.2 Ghost Diff ✅ FULLY IMPLEMENTED (AST-Based)

**Location:** `client/src/lib/ghostDiff.ts`

**Status:** Production-ready

**How it works:**
```typescript
// Uses AST comparison, NOT text comparison
diffTrees(oldTree: FlowNode[], newTree: FlowNode[]): DiffResult {
  // Creates signature-based matching using:
  // - Node type (if, for, return, etc.)
  // - Structural identifier (first keyword/identifier)
  // - Source line number
  
  // Returns nodes with diffStatus: 'added' | 'removed' | 'modified' | 'unchanged'
}
```

**Key Implementation Details:**
- `getNodeSignature()` creates structural fingerprints for comparison
- `nodesAreDifferent()` compares labels and types
- `applyDiffStyling()` adds CSS classes (`diff-added`, `diff-removed`, `diff-modified`)
- Baseline snapshots stored in `sessionStorage` for persistence

**Verified:** The code genuinely compares FlowNode structures, not raw text strings.

---

### 1.3 Speed Governor ⚠️ PARTIALLY IMPLEMENTED

**Locations:**
- `client/src/lib/executionController.ts` - Client-side controller
- `packages/logigo-core/src/runtime.ts` - Runtime library
- `packages/logigo-vite-plugin/src/index.ts` - Build-time injection

**Status:** Core logic exists, integration incomplete

#### Client-Side ExecutionController ✅
```typescript
class ExecutionController {
  async checkpoint(nodeId: string): Promise<void> {
    // Records checkpoint in history
    // If paused, waits for step/play
    // Calculates delay based on speed setting
  }
  
  step(): void { /* Resolves one waiting checkpoint */ }
  play(): void { /* Resumes execution */ }
  pause(): void { /* Pauses at next checkpoint */ }
  setSpeed(speed: number): void { /* 0.1x to 10x */ }
}
```

#### Runtime Library (logigo-core) ✅
```typescript
// packages/logigo-core/src/runtime.ts
class LogiGoRuntime {
  private breakpoints = new Map<string, Breakpoint>();
  
  async checkpointAsync(id, variables): Promise<void> {
    // Fire-and-forget synchronous checkpoint
    this.checkpoint(id, variables);
    
    // If breakpoint set, pause execution
    const bp = this.breakpoints.get(id);
    if (bp && bp.enabled) {
      await this.waitForResume();  // Actually pauses!
    }
  }
  
  resume(): void { /* Resolves pause promise */ }
}
```

**What's working:**
- Breakpoint registration (`setBreakpoint`, `removeBreakpoint`, `clearBreakpoints`)
- Pause/resume mechanism via Promise
- Speed-based delay calculation
- Execution history tracking

**What's NOT wired up:**
- UI controls to set breakpoints at runtime (only right-click in flowchart exists)
- Speed governor slider is client-side only, not connected to remote execution
- No visual "pause at breakpoint" indicator in Remote Mode

---

### 1.4 Overlay Injection & Communication ✅ FULLY IMPLEMENTED

**Locations:**
- `server/routes.ts` (lines 352-480) - `remote.js` bootstrap script
- `packages/logigo-core/src/runtime.ts` - postMessage API
- `shared/reporter-api.ts` - Message protocol definitions

**Communication Method:** `window.postMessage` with structured messages

#### Message Protocol:
```typescript
// Reporter API (Runtime -> Studio)
interface LogiGoMessage {
  source: 'LOGIGO_CORE';
  type: 'LOGIGO_SESSION_START' | 'LOGIGO_CHECKPOINT' | 'LOGIGO_ERROR';
  payload: CheckpointPayload | SessionStartPayload;
}

// Control API (Studio -> Runtime)
interface ControlMessage {
  source: 'LOGIGO_STUDIO';
  type: 'LOGIGO_JUMP_TO_LINE' | 'LOGIGO_WRITE_FILE' | 'LOGIGO_REQUEST_FILE';
  payload: JumpToLinePayload | WriteFilePayload;
}
```

#### Bootstrap Script (`remote.js`):
```javascript
// Auto-creates session, exposes window.checkpoint()
window.checkpoint = function(id, variables, options) {
  // Sends POST to /api/remote/checkpoint
  // Auto-opens LogiGo on first checkpoint (zero-click)
};

window.LogiGo = {
  checkpoint: window.checkpoint,
  sessionId: SESSION_ID,
  viewUrl: VIEW_URL,
  openNow: function() { /* Opens LogiGo manually */ },
  registerCode: function(code) { /* Registers source for flowchart */ }
};
```

**Verified:** The overlay uses `fetch()` for cross-origin reliability, not global variables.

---

### 1.5 Visual Handshake (DOM Highlighting) ❌ NOT IMPLEMENTED

**Status:** Planned but no code exists

**What was envisioned:**
- Click flowchart node → Highlight corresponding DOM element
- Hover DOM element → Highlight flowchart node

**Current state:**
- `domElement` field exists in `CheckpointPayload` interface
- No code to actually highlight or query DOM elements
- No CSS injection for visual overlay on user's page

---

### 1.6 Grounding Layer (AI Context Export) ❌ NOT IMPLEMENTED

**Status:** Not started

**What was envisioned:**
- Export JSON blueprint of flowchart structure for AI context
- Include node relationships, variable states, execution paths
- Format optimized for LLM consumption

**Current state:**
- No export endpoints
- No JSON schema defined
- No AI-specific formatting

---

## 2. Architecture Overview

### 2.1 Package Structure

```
logigo/
├── client/                    # React Studio UI (Replit)
│   └── src/
│       ├── lib/
│       │   ├── parser.ts      # AST → FlowNode conversion
│       │   ├── ghostDiff.ts   # Change visualization
│       │   ├── interpreter.ts # Step-through execution
│       │   └── executionController.ts
│       └── pages/
│           ├── Workbench.tsx  # Main IDE view
│           └── RemoteMode.tsx # Cross-Replit visualization
│
├── packages/
│   ├── logigo-core/           # Runtime library (Antigravity)
│   │   └── src/runtime.ts     # Checkpoint API
│   ├── logigo-embed/          # Embeddable React component
│   │   └── src/LogiGoEmbed.tsx
│   ├── logigo-vite-plugin/    # Build-time instrumentation
│   │   └── src/instrumenter.ts
│   └── logigo-remote/         # Remote mode client helper
│
├── vscode-extension/          # VS Code/Antigravity extension
│   ├── src/
│   │   ├── extension.ts       # Activation, commands
│   │   ├── parser.ts          # Standalone parser
│   │   └── webview/           # Embedded Studio UI
│   └── logigo-1.0.0.vsix      # Pre-built extension
│
├── server/
│   └── routes.ts              # Remote Mode API, remote.js
│
└── shared/
    └── reporter-api.ts        # Message protocol types
```

### 2.2 Data Flow

```
┌─────────────────┐    postMessage    ┌─────────────────┐
│  User's App     │ ───────────────── │  LogiGo Studio  │
│  (with checkpoints)                 │  (Workbench/    │
│                 │                   │   RemoteMode)   │
│  LogiGo.checkpoint()                │                 │
│       ↓         │                   │                 │
│  runtime.ts     │                   │  parser.ts      │
│       ↓         │                   │       ↓         │
│  postMessage()  │ ─── SSE ────────→ │  FlowNode[]     │
└─────────────────┘                   │       ↓         │
                                      │  React Flow     │
                                      └─────────────────┘
```

### 2.3 Remote Mode Architecture

```
┌─────────────────┐     POST /checkpoint    ┌─────────────────┐
│  External Repl  │ ──────────────────────→ │  LogiGo Server  │
│  (user's app)   │                         │  (Express)      │
│                 │                         │                 │
│  <script src=   │                         │  RemoteSession  │
│   "remote.js">  │                         │   - checkpoints │
│                 │                         │   - sseClients  │
│  checkpoint()   │                         │                 │
└─────────────────┘                         └────────┬────────┘
                                                     │ SSE
                                                     ↓
                                            ┌─────────────────┐
                                            │  LogiGo Studio  │
                                            │  RemoteMode.tsx │
                                            │                 │
                                            │  - Live flowchart
                                            │  - Timeline view
                                            │  - Trace view
                                            └─────────────────┘
```

---

## 3. Feature Gap Analysis

| Feature | Spec Status | Code Status | Notes |
|---------|-------------|-------------|-------|
| **Core Parsing** | ✅ Complete | ✅ Working | Acorn-based, full AST support |
| **Flowchart Rendering** | ✅ Complete | ✅ Working | React Flow with custom nodes |
| **Ghost Diff** | ✅ Complete | ✅ Working | AST-based, not text-based |
| **Speed Governor** | ✅ Complete | ⚠️ Partial | Logic exists, UI integration incomplete |
| **Breakpoints** | ✅ Complete | ⚠️ Partial | Right-click works, no runtime integration |
| **Visual Handshake** | 📝 Planned | ❌ None | No DOM highlighting code |
| **Grounding Layer** | 📝 Planned | ❌ None | No AI export functionality |
| **Remote Mode SSE** | ✅ Complete | ✅ Working | Cross-Replit communication |
| **Debug with AI Panel** | ✅ Complete | ✅ Working | Prompt generation, Ghost Diff integration |
| **VS Code Extension** | ✅ Complete | ✅ Working | Pre-built .vsix available |
| **Embed Component** | ✅ Complete | ✅ Working | Static mode working |
| **Vite Plugin** | ✅ Complete | ✅ Working | Build-time instrumentation |

---

## 4. VS Code / Antigravity Extension Status

**Location:** `vscode-extension/`

**Status:** ✅ FULLY BUILT - Ready for distribution

### What's Included:
- `extension.ts` - Activation, command registration
- `parser.ts` - Standalone JavaScript parser (same as client)
- `webview/` - Embedded flowchart UI
- `logigo-1.0.0.vsix` - Pre-packaged extension

### Capabilities:
- Webview panel with flowchart visualization
- Click-to-source navigation
- File watcher for live updates
- Works on: VS Code, Google Antigravity, Cursor, Windsurf

### Distribution Targets:
| Platform | Registry | Status |
|----------|----------|--------|
| VS Code | Marketplace | Ready to publish |
| Antigravity | Open VSX | Ready to publish |
| Cursor | Direct install | .vsix available |

---

## 5. Antigravity Collaboration Summary

### Division of Labor:
- **Antigravity (Factory):** `logigo-core`, `@logigo/bridge` concepts, VS Code extension, runtime instrumentation
- **Replit (Showroom):** Studio UI, Remote Mode, user-facing features

### Key Antigravity Contributions:
1. **Synchronous Checkpoints:** Recommended `checkpoint()` as fire-and-forget with optional `checkpointAsync()` for step debugging
2. **Hash-Based Node IDs:** Algorithm for stable node identification across code changes
3. **Package Distribution Strategy:** ESM + UMD + separate plugin packages
4. **Focus Mode Concept:** Show just the current function's flowchart

### Pending Questions for Antigravity:
1. What hooks are available for `antigravity.execution.onExecutionStart`?
2. Can we get `antigravity.ai.onCodeGeneration` for auto-show on AI changes?
3. Should we implement the full `@logigo/bridge` library or continue with postMessage?

---

## 6. Recommendations for Next Steps

### Priority 1: Complete Speed Governor Integration
- Wire up ExecutionController to Remote Mode UI
- Add speed slider to Remote Mode
- Sync breakpoint state between client and runtime

### Priority 2: Implement Grounding Layer
- Define JSON schema for flowchart export
- Add `/api/export/grounding` endpoint
- Include: nodes, edges, variables, execution path, source mappings

### Priority 3: Visual Handshake (Optional)
- Inject CSS for DOM element highlighting
- Add `data-logigo-checkpoint` attributes to instrumented elements
- Implement hover synchronization

---

## 7. Files to Review

For verification, examine these key files:

| Feature | Primary File | Secondary |
|---------|--------------|-----------|
| Ghost Diff Logic | `client/src/lib/ghostDiff.ts` | - |
| Speed Governor | `client/src/lib/executionController.ts` | `packages/logigo-core/src/runtime.ts` |
| Remote Mode API | `server/routes.ts` (lines 133-500) | - |
| Message Protocol | `shared/reporter-api.ts` | - |
| VS Code Extension | `vscode-extension/src/extension.ts` | `vscode-extension/src/parser.ts` |
| Debug with AI | `client/src/pages/Workbench.tsx` (lines 2267-2410) | - |

---

*Document generated by LogiGo Replit Agent - December 23, 2025*
