# LogiGo Embeddable Studio - Design Document

**Date:** December 21, 2025  
**Purpose:** Bring full flowchart visualization into user apps

---

## Overview

The Embeddable Studio is a self-contained React component that provides the full LogiGo visualization experience as a floating panel within any React application.

## API Design

### Installation

```bash
npm install logigo-embed
# or
npx logigo-install
```

### Basic Usage (React) - Production

```jsx
import { LogiGoEmbed } from 'logigo-embed';

function App() {
  return (
    <div>
      <YourApp />
      {/* Production: Use build-generated manifest */}
      <LogiGoEmbed 
        manifestUrl="/logigo-manifest.json"
        position="bottom-right"
      />
    </div>
  );
}
```

### Auto-Initialize (Script Tag) - Production

```html
<script src="https://unpkg.com/logigo-embed"></script>
<script>
  // Production: Point to build-generated manifest
  LogiGo.init({
    manifestUrl: '/logigo-manifest.json',
    position: 'bottom-right'
  });
</script>
```

### Demo Mode (Single File, No Build)

```jsx
// DEMO ONLY: Runtime parsing for quick prototypes
<LogiGoEmbed 
  code={singleFileCode}  
  position="bottom-right"
/>
```
*Note: `code` prop is for demos/learning only. Production apps must use manifestUrl.*

---

## Configuration Options

```typescript
interface LogiGoEmbedProps {
  // === Data Source (choose ONE) ===
  
  // Option A: Build-time manifest (recommended for production)
  manifestUrl?: string;        // URL to fetch logigo-manifest.json
  manifestHash?: string;       // Expected hash for cache validation
  
  // Option B: Runtime parsing (simple/demo scenarios only)
  code?: string;               // Single-file source code to parse at runtime
  
  // === Panel Configuration ===
  
  // Panel position on screen
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Initial panel state
  defaultOpen?: boolean;
  defaultSize?: { width: number; height: number };
  
  // Feature toggles
  showVariables?: boolean;     // Show variable inspector panel (default: true)
  showControls?: boolean;      // Show play/pause/step controls (default: true)
  showMinimap?: boolean;       // Show flowchart minimap (default: false)
  showHistory?: boolean;       // Show checkpoint history panel (default: true)
  
  // Theming
  theme?: 'dark' | 'light' | 'auto';
  
  // === Callbacks ===
  onNodeClick?: (nodeId: string) => void;
  onCheckpoint?: (checkpoint: CheckpointPayload) => void;
  onBreakpointHit?: (nodeId: string) => void;
  onManifestLoad?: (manifest: LogiGoManifest) => void;
  onError?: (error: LogiGoError) => void;
  onReady?: () => void;
}
```

### Usage Examples

**Production (with manifest):**
```jsx
<LogiGoEmbed 
  manifestUrl="/logigo-manifest.json"
  manifestHash="a1b2c3d4..."
  position="bottom-right"
  onReady={() => console.log('LogiGo ready!')}
/>
```

**Script tag (standalone UMD):**
```html
<script src="https://unpkg.com/logigo-embed"></script>
<script>
  LogiGo.init({
    manifestUrl: '/logigo-manifest.json',
    position: 'bottom-right'
  });
</script>
```

**Quick demo (no build):**
```jsx
<LogiGoEmbed 
  code={`
    function sort(arr) {
      LogiGo.checkpoint('sort:start', { arr });
      // ... algorithm
    }
  `}
  position="bottom-left"
/>
```

---

## Component Architecture

```
logigo-embed/
├── src/
│   ├── index.ts                 # Package entry point
│   ├── LogiGoEmbed.tsx          # Main component
│   ├── components/
│   │   ├── FloatingPanel.tsx    # Draggable/resizable container
│   │   ├── MiniFlowchart.tsx    # React Flow visualization
│   │   ├── VariableInspector.tsx # Variable state panel
│   │   ├── ControlBar.tsx       # Play/pause/step controls
│   │   └── MinimizedIcon.tsx    # Collapsed state button
│   ├── hooks/
│   │   ├── useParser.ts         # Code → flowchart conversion
│   │   ├── useCheckpoints.ts    # Live checkpoint handling
│   │   └── useDraggable.ts      # Panel positioning
│   ├── parser/
│   │   └── acornParser.ts       # Full AST parsing (from Studio)
│   └── styles/
│       └── embed.css            # Bundled styles
├── dist/
│   ├── logigo-embed.umd.js      # UMD bundle (script tag)
│   ├── logigo-embed.esm.js      # ESM bundle (imports)
│   └── logigo-embed.css         # Styles
└── package.json
```

---

## UI Layout

### Expanded State (Default Size: 400x300)

```
┌─────────────────────────────────────────────┐
│ LogiGo         [_] [□] [×]                  │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │         Flowchart Canvas             │   │
│  │    [Start] → [Process] → [End]       │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Variables: i=5, result="done"               │
├─────────────────────────────────────────────┤
│ [▶ Play] [⏸] [→ Step] [⟲]   Speed: [===]    │
└─────────────────────────────────────────────┘
```

### Minimized State (Floating Icon)

```
       ┌───┐
       │ ⚡│ ← Click to expand
       └───┘
```

---

## Key Features

### 1. Live Flowchart Visualization
- Uses the same React Flow renderer as LogiGo Studio
- Supports all node types: decision, loop, statement, function
- Real-time node highlighting on checkpoint execution

### 2. Variable Inspector
- Shows current variable values at each checkpoint
- Scrollable history of variable changes
- Collapsible for more flowchart space

### 3. Execution Controls
- Play/Pause: Control checkpoint progression
- Step: Advance one checkpoint at a time
- Speed slider: 0.1x to 20x speed
- Reset: Return to initial state

### 4. Panel Interactions
- Draggable: Move panel anywhere on screen
- Resizable: Expand for larger flowcharts
- Minimizable: Collapse to small icon
- Closeable: Remove panel entirely

### 5. Checkpoint Integration
- Listens for `window.LogiGo.checkpoint()` calls
- Updates flowchart highlighting in real-time
- Records variable snapshots at each checkpoint

### 6. Breakpoint Management
- Right-click nodes to toggle breakpoints
- Execution pauses at breakpoints
- Visual indicators (red dots) on breakpoint nodes
- API to programmatically manage breakpoints

### 7. Checkpoint History
- Scrollable timeline of all checkpoints
- Click to jump to any previous state
- Variable diff between checkpoints
- Forward/backward navigation

---

## Build-Time Manifest Architecture

The key insight: **runtime parsing cannot stay in sync with bundled apps**. Instead, we use a build-time instrumentation pipeline that generates a **Node Manifest** containing all flowchart metadata.

### The Problem

```
User Code → Bundler (Vite/Webpack) → Transformed Output
    ↓              ↓                        ↓
 Original      Minified             Lost line numbers,
 node IDs      variables            merged files
```

### The Solution: Node Manifest

The `logigo-install` CLI hooks into the build process and generates:
1. **Instrumented code** with stable checkpoint IDs
2. **Node manifest JSON** with flowchart structure

```
logigo-install
    ↓
┌─────────────────────────────────────────────────┐
│  Bundler Plugin (Vite/Webpack/Next)             │
│                                                 │
│  1. Parse all source files with Acorn           │
│  2. Assign stable node IDs (hash-based)         │
│  3. Inject LogiGo.checkpoint() calls            │
│  4. Generate logigo-manifest.json               │
│  5. Output instrumented bundle                  │
└─────────────────────────────────────────────────┘
    ↓                               ↓
 Instrumented Bundle          logigo-manifest.json
```

### Manifest Schema

```typescript
interface LogiGoManifest {
  version: '1.0';
  hash: string;           // SHA256 of all source files combined
  generatedAt: number;    // Unix timestamp
  
  files: {
    [path: string]: {
      checksum: string;   // SHA256 of file content
      functions: string[]; // Top-level function names
    }
  };
  
  nodes: FlowNode[];      // Precomputed flowchart nodes
  edges: FlowEdge[];      // Precomputed flowchart edges
  
  checkpoints: {
    [nodeId: string]: CheckpointMetadata;
  };
  
  breakpointDefaults?: string[];  // Suggested breakpoint node IDs
}

// Precise FlowNode schema (React Flow compatible)
interface FlowNode {
  id: string;              // Stable, deterministic ID (see hashing below)
  type: 'default' | 'decision' | 'input' | 'output' | 'container';
  position: { x: number; y: number };  // Layout position
  data: {
    label: string;         // Display text (e.g., "if (x > 0)")
    nodeType: 'statement' | 'decision' | 'loop' | 'function' | 'return';
    sourceFile: string;    // Original file path
    sourceLine: number;    // Line number in original source
    sourceColumn: number;  // Column number
    code?: string;         // Original code snippet (optional)
  };
  style?: Record<string, any>;  // Optional styling
}

// Precise FlowEdge schema (React Flow compatible)
interface FlowEdge {
  id: string;              // Format: "edge_{sourceId}_{targetId}"
  source: string;          // Source node ID
  target: string;          // Target node ID
  sourceHandle?: string;   // For decision nodes: 'true' | 'false'
  targetHandle?: string;
  type?: 'smoothstep' | 'straight' | 'step';
  label?: string;          // Edge label (e.g., "true", "false")
  animated?: boolean;      // For active execution path
}

interface CheckpointMetadata {
  file: string;
  line: number;
  column: number;
  label: string;
  type: 'statement' | 'decision' | 'loop' | 'function' | 'return';
  parentFunction: string;
  capturedVariables: string[];  // Variable names captured at this point
}
```

### Node ID Hashing Algorithm

Node IDs must be **deterministic** across builds. The algorithm:

```typescript
function generateNodeId(node: ASTNode, filePath: string): string {
  // Components for hash input
  const components = [
    filePath,                    // File path
    node.type,                   // AST node type (e.g., 'IfStatement')
    node.loc.start.line,         // Start line
    node.loc.start.column,       // Start column
    getNodeSignature(node)       // Normalized code signature
  ];
  
  // SHA256 hash, truncated to 8 chars for readability
  const hash = sha256(components.join('|')).substring(0, 8);
  
  // Human-readable prefix + hash
  // e.g., "if_a1b2c3d4", "fn_processImage_x9y8z7w6"
  const prefix = getNodePrefix(node);
  return `${prefix}_${hash}`;
}

function getNodePrefix(node: ASTNode): string {
  switch (node.type) {
    case 'FunctionDeclaration': return `fn_${node.id.name}`;
    case 'IfStatement': return 'if';
    case 'ForStatement': return 'for';
    case 'WhileStatement': return 'while';
    case 'ReturnStatement': return 'return';
    default: return 'stmt';
  }
}

function getNodeSignature(node: ASTNode): string {
  // Normalize the AST to ignore whitespace/formatting
  // This ensures same logic = same ID even with reformatting
  return JSON.stringify(normalizeAST(node));
}
```

**Example IDs:**
```
fn_processImage_a1b2c3d4   → function processImage()
if_x9y8z7w6               → if (condition)
for_m3n4o5p6              → for loop
return_q7r8s9t0           → return statement
```

### Instrumentation Algorithm

The bundler plugin performs three steps per file:

**Step 1: AST Traversal & Node Extraction**

```typescript
function instrumentFile(code: string, filePath: string): InstrumentResult {
  const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
  const nodes: FlowNode[] = [];
  const checkpoints: CheckpointMetadata[] = [];
  const edgeBuilder = new EdgeBuilder();
  
  // Recursive AST visitor
  function visit(node: ASTNode, parentId: string | null, context: VisitContext) {
    switch (node.type) {
      case 'FunctionDeclaration':
      case 'ArrowFunctionExpression': {
        const id = generateNodeId(node, filePath);
        nodes.push(createFlowNode(id, 'function', node, filePath));
        checkpoints.push(createCheckpointMeta(id, node, filePath));
        
        // Visit function body
        edgeBuilder.connect(parentId, id);
        visit(node.body, id, { ...context, currentFunction: id });
        break;
      }
      
      case 'IfStatement': {
        const id = generateNodeId(node, filePath);
        nodes.push(createFlowNode(id, 'decision', node, filePath));
        checkpoints.push(createCheckpointMeta(id, node, filePath));
        
        edgeBuilder.connect(parentId, id);
        
        // True branch
        const trueId = visit(node.consequent, id, context);
        edgeBuilder.connect(id, trueId, 'true');
        
        // False branch (if exists)
        if (node.alternate) {
          const falseId = visit(node.alternate, id, context);
          edgeBuilder.connect(id, falseId, 'false');
        }
        break;
      }
      
      case 'ForStatement':
      case 'WhileStatement': {
        const id = generateNodeId(node, filePath);
        nodes.push(createFlowNode(id, 'loop', node, filePath));
        checkpoints.push(createCheckpointMeta(id, node, filePath));
        
        edgeBuilder.connect(parentId, id);
        
        // Loop body
        const bodyId = visit(node.body, id, context);
        edgeBuilder.connect(id, bodyId, 'loop');
        edgeBuilder.connect(bodyId, id, 'continue');  // Back edge
        break;
      }
      
      // ... handle other node types
    }
  }
  
  visit(ast, null, { currentFunction: null });
  
  return {
    nodes,
    edges: edgeBuilder.getEdges(),
    checkpoints,
    instrumentedCode: injectCheckpoints(code, ast, checkpoints)
  };
}
```

**Step 2: Edge Generation Rules**

```typescript
class EdgeBuilder {
  private edges: FlowEdge[] = [];
  private edgeId = 0;
  
  connect(sourceId: string | null, targetId: string, label?: string) {
    if (!sourceId) return;
    
    this.edges.push({
      id: `edge_${this.edgeId++}`,
      source: sourceId,
      target: targetId,
      type: 'smoothstep',
      label: label,
      animated: false
    });
  }
  
  getEdges(): FlowEdge[] {
    return this.edges;
  }
}

// Edge creation rules:
// 1. Sequential statements: source → target (no label)
// 2. If statements: decision → consequent ('true'), decision → alternate ('false')
// 3. Loops: loop → body ('loop'), body → loop ('continue')
// 4. Function calls: caller → function, function → return point
// 5. Return statements: return → function exit
```

**Step 3: Layout Computation (Dagre)**

```typescript
import dagre from 'dagre';

function computeLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes with estimated dimensions
  nodes.forEach(node => {
    const width = node.data.label.length * 8 + 40;  // Estimate based on label
    const height = 40;
    g.setNode(node.id, { width, height });
  });
  
  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  // Run layout
  dagre.layout(g);
  
  // Apply positions to nodes
  return nodes.map(node => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 }
    };
  });
}
```

**Step 4: Checkpoint Injection**

```typescript
function injectCheckpoints(
  code: string, 
  ast: ASTNode, 
  checkpoints: CheckpointMetadata[]
): string {
  const edits: CodeEdit[] = [];
  
  checkpoints.forEach(cp => {
    // Generate checkpoint call
    const checkpointCall = `await LogiGo.checkpoint('${cp.id}', { ${
      cp.capturedVariables.map(v => `${v}: ${v}`).join(', ')
    } });\n`;
    
    // Insert at beginning of statement
    edits.push({
      position: { line: cp.line, column: cp.column },
      insert: checkpointCall
    });
  });
  
  // Apply edits in reverse order (bottom to top) to preserve positions
  return applyEdits(code, edits.sort((a, b) => b.position.line - a.position.line));
}
```

### Runtime Contract: MANIFEST_HASH & Session Alignment

**How MANIFEST_HASH is Generated:**

```typescript
// In bundler plugin, at end of build:
function finalizeManifest(manifest: LogiGoManifest): string {
  // Compute hash of all source file checksums
  const allChecksums = Object.values(manifest.files)
    .map(f => f.checksum)
    .sort()
    .join('|');
  
  manifest.hash = sha256(allChecksums);
  return manifest.hash;
}

// Write to output
const MANIFEST_HASH = finalizeManifest(manifest);
writeFileSync('dist/logigo-manifest.json', JSON.stringify(manifest));

// Also inject hash into the runtime bundle:
const runtimeInit = `
  window.__LOGIGO_MANIFEST_HASH__ = '${MANIFEST_HASH}';
  window.__LOGIGO_MANIFEST_URL__ = '/logigo-manifest.json';
`;
injectAtBundleStart(runtimeInit);
```

**How Runtime Emits MANIFEST_READY:**

```typescript
// Injected at bundle start by the bundler plugin:
(function logigoInit() {
  // Read hash/URL from injected globals
  const MANIFEST_HASH = window.__LOGIGO_MANIFEST_HASH__;
  const MANIFEST_URL = window.__LOGIGO_MANIFEST_URL__;
  
  // Emit manifest ready event
  window.postMessage({
    source: 'LOGIGO_CORE',
    type: 'LOGIGO_MANIFEST_READY',
    payload: {
      manifestUrl: `${MANIFEST_URL}?v=${MANIFEST_HASH}`,
      manifestHash: MANIFEST_HASH,
      sessionId: crypto.randomUUID()  // Unique per page load
    }
  }, '*');
})();
```

**Session ID Alignment:**

```typescript
// Sessions are page-load scoped:
// - Each page load gets a new sessionId
// - All checkpoints in that session reference the same manifestHash
// - If hot reload changes code, a new MANIFEST_READY is emitted with new hash

// Embed validates alignment:
function handleCheckpoint(payload: CheckpointPayload) {
  if (payload.manifestVersion !== currentManifest.hash) {
    // Manifest has changed - need to reload
    console.warn('[LogiGo] Manifest version mismatch, session may be stale');
    // Optionally: refetch manifest and re-render flowchart
  }
  
  // Continue processing checkpoint
  highlightNode(payload.id);
}
```

### Reporter API Extensions

```typescript
// New message type: Manifest Ready
interface ManifestReadyMessage {
  source: 'LOGIGO_CORE';
  type: 'LOGIGO_MANIFEST_READY';
  payload: {
    manifestUrl: string;     // URL to fetch manifest JSON
    manifestHash: string;    // For cache validation
    sessionId: string;
  }
}

// Enhanced Checkpoint message
interface CheckpointMessage {
  source: 'LOGIGO_CORE';
  type: 'LOGIGO_CHECKPOINT';
  payload: {
    id: string;
    manifestVersion: string;  // Must match current manifest
    timestamp: number;
    variables: Record<string, any>;
    domElement?: string;
  }
}
```

### Reporter Event Ordering & Flow

The runtime emits events in a specific order that the embed must handle:

```
App Startup
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  1. LOGIGO_MANIFEST_READY                           │
│     - First event on page load                      │
│     - Contains manifestUrl and manifestHash         │
│     - Embed fetches and caches manifest             │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  2. LOGIGO_SESSION_START                            │
│     - Emitted when instrumented code begins         │
│     - Signals embed to reset state                  │
│     - Contains sessionId and startTime             │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  3. LOGIGO_CHECKPOINT (repeated)                    │
│     - Emitted for each checkpoint() call            │
│     - Contains nodeId, manifestVersion, variables   │
│     - Embed highlights node, records history        │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  4. LOGIGO_SESSION_END (optional)                   │
│     - Emitted when execution completes              │
│     - Embed shows "Execution complete" state        │
└─────────────────────────────────────────────────────┘
```

### Runtime Manifest Serving

The bundler plugin handles manifest hosting:

**Vite (development):**
```javascript
// Plugin serves manifest from memory during dev
export function logigoVitePlugin() {
  let manifest: LogiGoManifest;
  
  return {
    name: 'logigo',
    
    // Generate manifest during build
    transform(code, id) {
      if (shouldInstrument(id)) {
        const result = instrumentFile(code, id);
        updateManifest(manifest, result.nodes, result.checkpoints);
        return result.code;
      }
    },
    
    // Serve manifest via dev server
    configureServer(server) {
      server.middlewares.use('/logigo-manifest.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(manifest));
      });
    },
    
    // Write manifest to output during build
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'logigo-manifest.json',
        source: JSON.stringify(manifest)
      });
    }
  };
}
```

**Production (static hosting):**
```
dist/
├── index.html
├── assets/
│   └── main.js              # Instrumented bundle
└── logigo-manifest.json     # Manifest file
```

### Cache Invalidation

The manifest hash enables cache-busting:

```typescript
// Runtime: Emit manifest ready with hash
window.postMessage({
  source: 'LOGIGO_CORE',
  type: 'LOGIGO_MANIFEST_READY',
  payload: {
    manifestUrl: '/logigo-manifest.json?v=' + MANIFEST_HASH,
    manifestHash: MANIFEST_HASH,
    sessionId: generateSessionId()
  }
}, '*');

// Embed: Check hash before using cached manifest
if (cachedManifest && cachedManifest.hash === payload.manifestHash) {
  // Use cached manifest
  useManifest(cachedManifest);
} else {
  // Fetch new manifest
  const manifest = await fetch(payload.manifestUrl).then(r => r.json());
  cacheManifest(manifest);
  useManifest(manifest);
}
```

### Embed Initialization Flow

```typescript
// 1. Load manifest at startup
const manifest = await fetch('/logigo-manifest.json').then(r => r.json());

// 2. Render flowchart from manifest
setNodes(manifest.nodes);
setEdges(manifest.edges);

// 3. Listen for runtime events
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'LOGIGO_CORE') return;
  
  switch (event.data.type) {
    case 'LOGIGO_MANIFEST_READY':
      // Hot reload: fetch new manifest if hash changed
      if (event.data.payload.manifestHash !== currentHash) {
        reloadManifest(event.data.payload.manifestUrl);
      }
      break;
      
    case 'LOGIGO_CHECKPOINT':
      const { id, manifestVersion, variables } = event.data.payload;
      
      // Validate checkpoint matches current manifest
      if (manifestVersion !== manifest.version) {
        console.warn('[LogiGo] Manifest version mismatch, reloading...');
        reloadManifest();
        return;
      }
      
      // Highlight node and record history
      setActiveNodeId(id);
      addToHistory({ id, variables, timestamp: Date.now() });
      
      // Check breakpoints
      if (breakpoints.has(id)) {
        pause();
      }
      break;
  }
});
```

### Bundler Adapters

**Vite Plugin:**
```javascript
// vite.config.js
import logigo from 'logigo-embed/vite';

export default {
  plugins: [
    logigo({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      manifestPath: 'public/logigo-manifest.json'
    })
  ]
}
```

**Webpack Plugin:**
```javascript
// webpack.config.js
const LogiGoPlugin = require('logigo-embed/webpack');

module.exports = {
  plugins: [
    new LogiGoPlugin({
      include: /src\/.*\.(ts|tsx)$/,
      manifestPath: 'dist/logigo-manifest.json'
    })
  ]
}
```

### Fallback Mode (No Build Integration)

For quick prototyping without bundler integration:

```jsx
<LogiGoEmbed 
  code={singleFileCode}  // Parse at runtime (simple case)
  manifestUrl={null}     // Skip manifest loading
/>
```

This works for:
- Single-file scripts pasted into the embed
- Quick demos and learning scenarios
- LogiGo Studio's "paste code" feature

---

## Implementation Strategy

### Phase 1: Extract Core Components
1. Copy `Flowchart.tsx` from Studio
2. Strip non-essential features (Ghost Diff, premium features)
3. Create lightweight `MiniFlowchart` version

### Phase 2: Build Floating Panel
1. Create draggable container using CSS transforms
2. Add resize handles
3. Implement minimize/maximize states

### Phase 3: Bundle for Distribution
1. Configure Rollup for UMD/ESM builds
2. Bundle React as peer dependency
3. Include self-contained CSS

### Phase 4: Create Installer CLI
1. Framework detection (React, Vue, Next.js, etc.)
2. Automatic dependency installation
3. Code injection into entry point

---

## Global API (window.LogiGo)

```typescript
interface LogiGoGlobalAPI {
  // Initialize embedded studio
  init(options: LogiGoEmbedProps): void;
  
  // Checkpoint for execution tracking
  checkpoint(id: string, variables?: Record<string, any>): Promise<void>;
  
  // Execution control
  play(): void;
  pause(): void;
  step(): void;
  reset(): void;
  setSpeed(speed: number): void;
  
  // Panel control
  open(): void;
  close(): void;
  minimize(): void;
  maximize(): void;
  
  // Update code dynamically
  setCode(code: string): void;
  
  // Breakpoint management
  setBreakpoint(nodeId: string): void;
  removeBreakpoint(nodeId: string): void;
  clearBreakpoints(): void;
  getBreakpoints(): string[];
  
  // History navigation
  getHistory(): CheckpointRecord[];
  jumpToCheckpoint(index: number): void;
  stepBack(): void;
  stepForward(): void;
  
  // Destroy instance
  destroy(): void;
}

interface CheckpointRecord {
  index: number;
  nodeId: string;
  timestamp: number;
  variables: Record<string, any>;
}
```

---

## Packaging Strategy

### Two Distribution Modes

**1. ESM Bundle (for React apps)**
```bash
npm install logigo-embed
```
- React and ReactFlow are **peer dependencies**
- User's app already has React, no duplication
- Smaller bundle size (~150KB gzipped)

**2. UMD Bundle (for script tag)**
```html
<script src="https://unpkg.com/logigo-embed/dist/logigo-embed.umd.js"></script>
```
- React and ReactFlow are **bundled inside** (standalone)
- Works without any build system
- Larger bundle size (~400KB gzipped)
- Exports to `window.LogiGo`

### Build Configuration

```javascript
// rollup.config.js
export default [
  // ESM build (React as peer dep)
  {
    input: 'src/index.ts',
    output: { file: 'dist/logigo-embed.esm.js', format: 'esm' },
    external: ['react', 'react-dom', '@xyflow/react'],
  },
  
  // UMD build (all bundled)
  {
    input: 'src/index.standalone.ts',
    output: { 
      file: 'dist/logigo-embed.umd.js', 
      format: 'umd',
      name: 'LogiGo',
      globals: {}  // No externals
    },
    // Bundle everything including React
  }
];
```

### Runtime Detection

The standalone build injects its own React instance:

```typescript
// src/index.standalone.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogiGoEmbed } from './LogiGoEmbed';

// Create isolated React root when init() is called
window.LogiGo = {
  init(options) {
    const container = document.createElement('div');
    container.id = 'logigo-embed-root';
    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    root.render(<LogiGoEmbed {...options} />);
    
    this._root = root;
    this._container = container;
  },
  // ... other methods
};
```

---

## File Locations (in LogiGo Studio repo)

New files to create:
- `packages/logigo-embed/` - New package directory
- `packages/logigo-embed/src/LogiGoEmbed.tsx` - Main component
- `packages/logigo-embed/rollup.config.js` - Bundle config
- `packages/logigo-install/` - CLI installer

Files to reuse from Studio:
- `client/src/components/ide/Flowchart.tsx` → Strip down
- `client/src/components/ide/nodes/*.tsx` → Copy node types
- `client/src/lib/ast-to-flow.ts` → Parser logic
- `shared/reporter-api.ts` → Message types

---

## Next Steps

1. Create `packages/logigo-embed/` directory structure
2. Extract and simplify Flowchart component
3. Build FloatingPanel with drag/resize
4. Wire up checkpoint listener
5. Configure Rollup bundler
6. Test in sample app
7. Create installer CLI
