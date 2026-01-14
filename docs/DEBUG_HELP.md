# LogicArt Flowchart Display Bug - Help Needed

## Problem Description
When remote code is sent to LogicArt via the remote session API, the code appears correctly in the **Editor panel** (left side), but the **Flowchart panel** (right side) does not update to show the parsed flowchart of that code.

Instead, the flowchart shows a generic "GLOBAL FLOW" container with placeholder nodes like "Start" and "Add // --- NAME --- for sections".

## What We See
- **Editor**: Shows the correct code (e.g., `QAModal` React component with TypeScript)
- **Flowchart**: Shows "GLOBAL FLOW" with generic nodes, NOT the parsed control flow of the QAModal function

## Code Flow Overview

### 1. Remote Session Connection
When a user connects with `?session=<id>`, the Workbench component:
1. Fetches session info from `/api/remote/session/:id`
2. Opens SSE connection to `/api/remote/stream/:id`
3. When code arrives, calls `adapter.writeFile(code)`

### 2. The `adapter.writeFile()` Call
Located in `client/src/lib/adapters/StandaloneAdapter.ts`:

```typescript
writeFile(code: string): void {
  this.code = code;
  this.listeners.forEach(listener => listener(code));
}
```

### 3. Workbench Subscribes to Adapter
In `Workbench.tsx`, around line 172:

```typescript
useEffect(() => {
  const unsubscribe = adapter.subscribe((newCode) => {
    // This is where code updates are received
    setCode(newCode);
    // ... parsing logic
  });
  return unsubscribe;
}, [adapter]);
```

### 4. Parsing Flow
When code changes, there's parsing logic that should:
1. Parse the code using Acorn AST parser
2. Convert AST to flowchart nodes/edges
3. Update `flowData` state which renders the flowchart

### 5. What We Tried
We added these lines when remote code arrives:

```typescript
setCurrentAlgorithm(null);
setActiveVisualizer(null);
setShowVisualization(false);
```

The theory was that `currentAlgorithm` being set to an example ID (like "bubble-sort") was causing the flowchart to show the example instead of the remote code. But the problem persists.

## Key State Variables

| Variable | Purpose |
|----------|---------|
| `code` | The source code string displayed in editor |
| `flowData` | `{ nodes: Node[], edges: Edge[] }` for React Flow |
| `currentAlgorithm` | ID of selected example (null if custom code) |
| `parseReady` | Boolean indicating if code was parsed successfully |

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Workbench.tsx` | Main component (~3700 lines) |
| `client/src/lib/adapters/StandaloneAdapter.ts` | Manages code state |
| `docs/bridge/src/parser.ts` | AST parsing logic |
| `client/src/contexts/AdapterContext.tsx` | Provides adapter to components |

## Questions to Investigate

1. When `adapter.writeFile()` is called with remote code, is the adapter's `subscribe` callback being triggered?

2. Is the parsing logic running when code updates from remote?

3. Is `flowData` being updated with new nodes/edges, or is it still holding old data?

4. Is there a disconnect between `code` state and what gets parsed into the flowchart?

5. Is there conditional rendering logic that shows a different flowchart based on some other state we haven't considered?

## How to Reproduce

1. Open LogicArt workbench
2. Have an example loaded (e.g., select "Bubble Sort" from Examples dropdown)
3. Connect a remote session that sends React/TypeScript code
4. Observe: Editor shows the new code, but flowchart doesn't update

## Relevant Code Sections to Examine

### Workbench.tsx - Remote Code Handler (lines ~507-520)
```typescript
eventSource.addEventListener('code_update', (e) => {
  const { code: newCode, name } = JSON.parse(e.data);
  if (newCode) {
    adapter.writeFile(newCode);
    setCurrentAlgorithm(null);
    setActiveVisualizer(null);
    setShowVisualization(false);
    toast.info(name ? `Loaded: ${name}` : 'Code updated from remote app');
  }
});
```

### Workbench.tsx - Adapter Subscribe (look for useEffect with adapter.subscribe)

### Workbench.tsx - FlowData rendering (look for ReactFlow component and what data it receives)

## Screenshot Reference
The attached screenshot shows:
- Left panel: QAModal TypeScript/React code loaded correctly
- Right panel: "GLOBAL FLOW" with "Start" node - NOT the parsed QAModal function
