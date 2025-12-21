# LogiGo Embed - Overview for Review

## The Problem

LogiGo Studio is a code-to-flowchart visualization tool. Users paste JavaScript code, and it renders an interactive flowchart showing the control flow. We also have a "Live Mode" where users instrument their code with `LogiGo.checkpoint()` calls to see real-time execution visualization.

**The gap we discovered:** Live Mode uses `window.postMessage` to communicate between instrumented code and the Studio. This only works within the same browser window/tab. If a user is building an app in Replit (or any vibe coding platform) and wants to visualize it in LogiGo Studio running in a different tab, the messages can't cross that boundary.

**Original assumption:** Users would have LogiGo Studio open in the same project/tab as their code.

**Reality:** Vibe coders typically have their app running in one tab and want visualization tools in another.

---

## The Solution: LogiGo Embed

Instead of requiring users to open a separate Studio tab, we embed the visualization directly into their app as a floating overlay.

```
┌─────────────────────────────────────────────────────┐
│  User's App (e.g., VisionLoop)                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Their app content...                        │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  LogiGo Embed (floating panel)              │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │  Flowchart Canvas                    │    │   │
│  │  │  (nodes highlight as code executes)  │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  │  Variables: { x: 5, arr: [1,2,3] }          │   │
│  │  [Play] [Pause] [Step]                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Now the instrumented code and the visualization are in the **same window**, so `postMessage` works perfectly.

---

## Key Technical Challenge: Multi-File Bundled Apps

Simple case: User pastes a single function → we parse it → render flowchart → done.

Real case: User has a React app with 50+ files → Vite bundles it → code is transformed/minified → original line numbers are gone.

**The problem:** How do we generate a flowchart that matches the executed code when:
1. The code is split across many files
2. The bundler transforms/minifies everything
3. We can't parse the bundle at runtime (it's gibberish)

---

## Our Solution: Build-Time Manifest

Instead of parsing code at runtime, we hook into the build process:

```
User's Source Files
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  LogiGo Bundler Plugin (Vite/Webpack)               │
│                                                     │
│  For each source file:                              │
│  1. Parse with Acorn (get AST)                      │
│  2. Generate flowchart nodes/edges                  │
│  3. Assign stable node IDs (hash-based)             │
│  4. Inject LogiGo.checkpoint() calls                │
│  5. Write metadata to manifest                      │
└─────────────────────────────────────────────────────┘
        │                               │
        ▼                               ▼
  Instrumented Bundle          logigo-manifest.json
  (with checkpoints)           (flowchart structure)
```

The manifest contains:
- All flowchart nodes (pre-computed, with positions)
- All edges (connections between nodes)
- Checkpoint metadata (which node ID maps to which file/line)
- Hash for cache invalidation

---

## Node ID Stability

The trickiest part: checkpoint IDs in the running code must match node IDs in the flowchart.

**Our approach:** Deterministic hashing

```javascript
function generateNodeId(node, filePath) {
  const components = [
    filePath,                    // "src/utils/sort.ts"
    node.type,                   // "IfStatement"
    node.loc.start.line,         // 42
    node.loc.start.column,       // 4
    normalizedASTSignature(node) // Stable across reformatting
  ];
  
  const hash = sha256(components.join('|')).substring(0, 8);
  return `if_${hash}`;  // e.g., "if_a1b2c3d4"
}
```

This means:
- Same code → same node ID (even across rebuilds)
- Reformatting doesn't change IDs (normalized AST)
- Each file/line combo is unique

---

## Runtime Communication

```
┌─────────────────────────────────────────────────────┐
│  Page Load                                          │
│                                                     │
│  1. Bundle emits LOGIGO_MANIFEST_READY              │
│     → Embed fetches /logigo-manifest.json           │
│     → Renders flowchart from manifest               │
│                                                     │
│  2. User triggers instrumented code                 │
│     → LOGIGO_SESSION_START                          │
│     → Embed resets state                            │
│                                                     │
│  3. Each checkpoint() call                          │
│     → LOGIGO_CHECKPOINT { id, variables }           │
│     → Embed highlights matching node                │
│     → Records variable snapshot                     │
│                                                     │
│  4. Execution completes                             │
│     → LOGIGO_SESSION_END                            │
└─────────────────────────────────────────────────────┘
```

---

## API Design

**Production (with bundler plugin):**
```jsx
import { LogiGoEmbed } from 'logigo-embed';

function App() {
  return (
    <div>
      <MyApp />
      <LogiGoEmbed 
        manifestUrl="/logigo-manifest.json"
        position="bottom-right"
      />
    </div>
  );
}
```

**Vite config:**
```javascript
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

**Quick demo (no build integration):**
```jsx
<LogiGoEmbed 
  code={singleFileCode}  // Parse at runtime
  position="bottom-right"
/>
```

---

## Open Questions / Areas for Feedback

1. **Node ID stability:** Is the hash-based approach robust enough? Any edge cases we're missing?

2. **Bundler plugin complexity:** This requires hooks into Vite/Webpack transform pipeline. Is there a simpler approach that would work for 80% of cases?

3. **Hot reload handling:** When code changes during development, we emit a new MANIFEST_READY with updated hash. The embed refetches and re-renders. Any gotchas here?

4. **Source maps:** We're not currently using source maps (we have full access at build time). Should we integrate with source map APIs for better error correlation?

5. **Package distribution:** Planning ESM (React as peer dep) + UMD (standalone with bundled React). Anything else to consider?

6. **Async/await:** The checkpoint injection adds `await LogiGo.checkpoint(...)`. This requires functions to be async. Worth the constraint?

---

## What We've Built So Far

- **LogiGo Studio:** Full workbench with code editor, flowchart canvas, variable inspector
- **Static Mode:** Paste code → instant flowchart (working)
- **Reporter API spec:** Message format for checkpoint communication
- **logigo-core package:** Runtime library with `window.LogiGo.checkpoint()`
- **logigo-embed package (Phase 1):** Embeddable React component with runtime parsing for Static Mode

## Implementation Status

### Phase 1 (Complete)
- **LogiGoEmbed component:** Floating overlay with runtime JavaScript parsing
- **Static Mode:** Parse code on the fly, render flowchart, no build integration needed
- **Demo page:** `/embed-demo` shows component in action with position controls
- **Features:** Collapse/expand, position options, dark/light themes

### Phase 2 (Planned)
- **Bundler plugins:** Vite and Webpack integrations for build-time manifest
- **Live Mode:** Checkpoint-driven node highlighting (requires manifest for ID matching)
- **logigo-install CLI:** `npx logigo-install` to add embed to any project
- **Manifest generation:** Build-time AST analysis and checkpoint injection

### Architecture Decision: Static Mode First

We chose to implement Static Mode (runtime parsing) first because:
1. **Zero friction:** Works immediately without build configuration
2. **Covers 80% use case:** Most users want to visualize single functions/files
3. **Simpler distribution:** No bundler plugin complexity for initial adoption

Live Mode (with checkpoint highlighting) requires matching node IDs between the manifest and checkpoints. This only works with build-time manifest generation, which we're implementing in Phase 2.

---

## Full Design Document

See `docs/EMBED_STUDIO_DESIGN.md` for complete specification including:
- FlowNode/FlowEdge schemas
- Instrumentation algorithm pseudocode
- Edge generation rules
- Layout computation (Dagre)
- Cache invalidation strategy
- Session alignment logic
