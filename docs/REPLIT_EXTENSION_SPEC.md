# LogiGo Replit Extension Specification

**Version:** 1.0.0-draft  
**For:** Antigravity Team  
**Date:** November 2024

## Overview

This document specifies the requirements for building a Replit Extension that enables LogiGo Studio to work with any Replit project. The extension should parallel the existing VS Code implementation, using the same `logigo-core` runtime library and Reporter API.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Replit Project                     │
│                                                                  │
│  ┌──────────────┐     ┌─────────────────────────────────────┐   │
│  │  User's Code │────▶│      LogiGo Replit Extension        │   │
│  │  (with       │     │  ┌─────────────────────────────┐    │   │
│  │  checkpoints)│     │  │     logigo-core runtime     │    │   │
│  └──────────────┘     │  │  - Checkpoint instrumentation│    │   │
│                       │  │  - Reporter API broadcast    │    │   │
│                       │  └─────────────────────────────┘    │   │
│                       └──────────────┬──────────────────────┘   │
│                                      │                          │
│                                      │ postMessage              │
│                                      │ (Reporter API)           │
│                                      ▼                          │
│                       ┌─────────────────────────────────────┐   │
│                       │       LogiGo Studio Webview         │   │
│                       │  - Flowchart visualization          │   │
│                       │  - AI-assisted code editing         │   │
│                       │  - Runtime state display            │   │
│                       └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Reporter API Contract

The extension uses the existing Reporter API (v1.0.0-beta.2) for communication. All messages follow this envelope structure:

### Message Envelope

```typescript
interface LogiGoMessage<T = any> {
  source: 'LOGIGO_CORE';
  type: string;
  payload: T;
}
```

### Required Events

#### 1. Session Start Event
Broadcast when the runtime initializes.

```typescript
type: 'LOGIGO_SESSION_START'
payload: {
  sessionId: string;      // Unique session identifier
  startTime: number;      // Unix timestamp
  url: string;            // Replit project URL or identifier
}
```

#### 2. Checkpoint Event
Broadcast when code execution hits a `LogiGo.checkpoint()` call.

```typescript
type: 'LOGIGO_CHECKPOINT'
payload: {
  id: string;                         // Checkpoint identifier (e.g., "loop:iteration:5")
  timestamp: number;                  // Unix timestamp
  timeSinceStart: number;             // Milliseconds since session start
  variables: Record<string, any>;     // Current variable state
  domElement?: string;                // Optional CSS selector for Visual Handshake
  metadata?: Record<string, any>;     // Optional additional data
}
```

### Broadcast Method

```javascript
window.postMessage({
  source: 'LOGIGO_CORE',
  type: 'LOGIGO_CHECKPOINT',
  payload: { /* ... */ }
}, '*');
```

---

## Part 2: Replit Extension Requirements

### Extension Manifest

The extension should register with Replit's extension system:

```json
{
  "name": "logigo",
  "displayName": "LogiGo Flowchart Debugger",
  "description": "Visualize code as interactive flowcharts with AI-assisted editing",
  "version": "1.0.0",
  "permissions": [
    "fs:read",
    "fs:write", 
    "session:read",
    "editor:read"
  ]
}
```

### Required Replit APIs

The extension should use these Replit Extension APIs:

```typescript
// File System Operations
window.replit.fs.readFile(path: string): Promise<string>
window.replit.fs.writeFile(path: string, content: string): Promise<void>
window.replit.fs.watchFile(path: string, callback): () => void

// Session/Editor Operations  
window.replit.session.getActiveFile(): string | null
window.replit.session.onActiveFileChange(callback): () => void
```

### Extension Responsibilities

1. **Inject logigo-core runtime** into the user's preview/webview
2. **Listen for Reporter API events** and forward to Studio
3. **Handle file sync** between Studio edits and the actual files
4. **Manage session lifecycle** (start, pause, resume, end)

---

## Part 3: IDE Adapter Interface

LogiGo Studio expects the extension to implement this interface (via message passing):

```typescript
interface IDEAdapter {
  // Initialization
  initialize(): Promise<void>;
  cleanup(): void;
  
  // File Operations
  getCurrentFileContent(): Promise<string>;
  getCurrentFilePath(): string;
  getCurrentFile(): Promise<FileInfo>;
  writeFile(content: string): Promise<void>;
  watchFileChanges(callback: FileChangeCallback): () => void;
  
  // Editor Operations
  getSelectedText(): Promise<string | null>;
  navigateToLine(line: number): void;
  highlightRange(range: Range): void;
  
  // Capability Queries
  supportsEditing(): boolean;
  hasIntegratedEditor(): boolean;
  getAdapterType(): 'replit';
}

interface FileInfo {
  path: string;
  content: string;
  language?: string;  // 'javascript', 'typescript', 'python', etc.
}

interface Range {
  start: { line: number; column: number; };
  end: { line: number; column: number; };
}
```

---

## Part 4: Extension-to-Studio Messages

Beyond Reporter API events, the extension should send these control messages:

### File Sync Messages

```typescript
// When active file changes
{
  type: 'LOGIGO_FILE_CHANGED',
  payload: {
    path: string;
    content: string;
    language: string;
  }
}

// When file is saved externally
{
  type: 'LOGIGO_FILE_SAVED',
  payload: {
    path: string;
    content: string;
  }
}
```

### Session Control Messages

```typescript
// Extension ready
{
  type: 'LOGIGO_EXTENSION_READY',
  payload: {
    version: string;
    capabilities: string[];  // ['editing', 'runtime', 'fileSync']
  }
}

// Runtime mode toggle
{
  type: 'LOGIGO_MODE_CHANGE',
  payload: {
    mode: 'static' | 'live';
    reason?: string;
  }
}
```

---

## Part 5: Studio-to-Extension Messages

LogiGo Studio will send these commands to the extension:

```typescript
// Request file content
{
  type: 'LOGIGO_REQUEST_FILE',
  payload: { path?: string; }  // Optional, uses active file if omitted
}

// Write file changes (from AI rewrite or manual edit)
{
  type: 'LOGIGO_WRITE_FILE',
  payload: {
    path: string;
    content: string;
  }
}

// Navigate to line in editor
{
  type: 'LOGIGO_NAVIGATE',
  payload: {
    path: string;
    line: number;
    column?: number;
  }
}

// Highlight range in editor
{
  type: 'LOGIGO_HIGHLIGHT',
  payload: {
    path: string;
    range: Range;
  }
}
```

---

## Part 6: User Workflow

### First-Time Setup

1. User installs LogiGo extension from Replit Extensions
2. Extension injects connection UI in sidebar
3. User opens a JavaScript/TypeScript file
4. Extension auto-parses and shows flowchart in Studio panel

### Live Debugging Flow

1. User adds `LogiGo.checkpoint()` calls to their code
2. User runs their application in Replit
3. Extension injects logigo-core into the preview
4. Runtime broadcasts checkpoint events via Reporter API
5. Studio receives events and highlights corresponding flowchart nodes
6. User can see variable state at each checkpoint

### AI-Assisted Editing Flow

1. User double-clicks a flowchart node in Studio
2. Studio opens edit dialog with current code
3. User types natural language instructions
4. Studio calls AI endpoint to rewrite code
5. User approves changes
6. Studio sends `LOGIGO_WRITE_FILE` to extension
7. Extension writes changes to file via Replit API

---

## Part 7: Visual Handshake Integration

When a checkpoint includes a `domElement` selector, the extension should:

1. Receive the checkpoint event with `domElement: "#some-selector"`
2. Find the element in the preview iframe
3. Apply highlight styling (pulsing border, glow effect)
4. Clear highlight after 2 seconds or next checkpoint

CSS for highlight:
```css
.logigo-visual-handshake {
  outline: 3px solid #22c55e !important;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  animation: logigo-pulse 0.8s ease-in-out infinite;
}
```

---

## Part 8: Error Handling

The extension should handle these error cases:

| Scenario | Behavior |
|----------|----------|
| File read fails | Send error message to Studio, show toast to user |
| File write fails | Rollback in Studio, show error toast |
| Runtime not detected | Fall back to static mode |
| Session timeout (30s no events) | Auto-reconnect or prompt user |
| Extension API unavailable | Show "Replit Extension required" message |

---

## Part 9: Testing Checklist

Before release, verify:

- [ ] Extension loads in Replit sidebar
- [ ] Static parsing works for JS/TS files
- [ ] Double-click node opens edit dialog
- [ ] AI rewrite saves changes to file
- [ ] `LogiGo.checkpoint()` events reach Studio
- [ ] Visual Handshake highlights DOM elements
- [ ] File changes sync bidirectionally
- [ ] Extension handles missing/invalid files gracefully
- [ ] Works with Replit's preview iframe
- [ ] Performance acceptable for files up to 1000 lines

---

## Part 10: Files in This Repository

Key files Antigravity should reference:

| File | Purpose |
|------|---------|
| `shared/reporter-api.ts` | Reporter API type definitions |
| `client/src/lib/adapters/ReplitAdapter.ts` | Replit adapter implementation (Studio-side) |
| `client/src/lib/adapters/types.ts` | IDEAdapter interface |
| `client/src/pages/Workbench.tsx` | Main Studio component (event handling) |
| `client/src/lib/algorithmExamples.ts` | Example checkpoint usage patterns |

---

## Questions for Discussion

1. Should the extension auto-inject logigo-core, or require users to add it manually?
2. How should we handle multi-file projects? Parse all files or just active file?
3. Do we need offline/caching support for when Replit is slow?
4. Should checkpoints persist across page reloads?

---

## Contact

For questions about this specification, reach out to the LogiGo Studio team.
