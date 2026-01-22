# LogicArt Project Status & Architecture Document

**Generated:** December 27, 2025  
**Purpose:** Reality check before building advanced "Grounding" features

---

## 1. Current Implementation Audit

### Fully Implemented Features ✅

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Code-to-Flowchart Parser** | ✅ Working | `client/src/lib/parser.ts` | Acorn-based AST parsing, converts JS to flowchart nodes/edges |
| **React Flow Visualization** | ✅ Working | `client/src/components/ide/Flowchart.tsx` | Custom nodes (decision, input, output), edge routing |
| **Step-by-Step Interpreter** | ✅ Working | `client/src/lib/interpreter.ts` | Executes code, tracks variables, highlights current node |
| **Speed Governor** | ✅ Working | `client/src/components/ide/ExecutionControls.tsx` | Play/pause, speed presets (1x-100x), loop control |
| **Remote Mode (SSE + WebSocket)** | ✅ Working | `server/routes.ts` | Bidirectional communication with external Replit apps |
| **Breakpoints** | ✅ Working | `shared/control-types.ts` | Set/remove/clear breakpoints, synced to remote apps |
| **Algorithm Examples Library** | ✅ Working | `client/src/components/ide/Examples.tsx` | Built-in instrumented examples |
| **Undo/Redo** | ✅ Working | `client/src/lib/historyManager.ts` | Ctrl+Z/Y, debounced state tracking |
| **Layout Presets** | ✅ Working | `client/src/pages/Workbench.tsx` | 50/50, 30/70, 70/30, Code Only, Flow Only |
| **Sharing** | ✅ Working | `server/routes.ts`, DB | Database-backed with title/description |
| **Model Arena** | ✅ Working | `client/src/pages/ModelArena.tsx` | 4-model comparison (OpenAI, Gemini, Claude, Grok) |
| **Debug Arena** | ✅ Working | `client/src/pages/ModelArena.tsx` | Multi-model debugging advice |
| **Chairman Verdict** | ✅ Working | `/api/arena/verdict` | Synthesizes AI responses into unified verdict |
| **MCP Server** | ✅ Working | `server/mcp.ts` | 5 tools for AI agent integration |
| **Agent API** | ✅ Working | `/api/agent/analyze` | REST endpoint for programmatic analysis |

### Fully Implemented (Verified & Enhanced) ✅

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Ghost Diff** | ✅ Working | `client/src/lib/ghostDiff.ts` | AST-aware comparison, CSS classes (`diff-added`, `diff-removed`, `diff-modified`), UI toggle in Workbench |
| **Natural Language Search** | ✅ Working | `client/src/lib/naturalLanguageSearch.ts`, `client/src/components/ide/NaturalLanguageSearch.tsx` | Pattern matching for "show conditionals", "find loops", etc. Premium feature. |
| **Grounding Context** | ✅ Working | `packages/logicart-core/src/grounding.ts`, `shared/grounding-types.ts` | Full `generateGroundingContext()` implementation with tests |
| **Visual Handshake** | ✅ Working | `shared/control-types.ts`, `client/src/pages/Workbench.tsx` | Click flowchart node → highlight DOM in remote app. Amber ring feedback in Studio. 3s fallback timeout. |

### Partially Implemented Features ⚠️

| Feature | Status | Location | What Works | What's Missing |
|---------|--------|----------|------------|----------------|
| **Zero-Code Reverse Proxy** | ⚠️ Basic | `server/routes.ts` | Proxy route exists | Full ES module/Vite app instrumentation incomplete |

### Planned/Unimplemented Features ❌

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Export to Documentation** | ❌ Placeholder | Listed in replit.md | No implementation |
| **Blueprint Schema** | ❌ Future | Documented only | AI-generated JSON blueprints concept |

---

## 2. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        LogicArt Studio                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Code Editor  │───▶│ Acorn Parser │───▶│ React Flow   │      │
│  │ (PrismJS)    │    │ (AST → Nodes)│    │ (Flowchart)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                   │              │
│         ▼                    ▼                   ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Interpreter  │◀──▶│ HistoryMgr   │    │ ExecutionCtl │      │
│  │ (Step exec)  │    │ (Undo/Redo)  │    │ (Speed/Loop) │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                        Server (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Remote Mode  │    │ MCP Server   │    │ Arena API    │      │
│  │ (SSE + WS)   │    │ (5 tools)    │    │ (4 models)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                   │              │
│         ▼                    ▼                   ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ PostgreSQL   │    │ AI Agents    │    │ OpenAI/etc   │      │
│  │ (Drizzle)    │    │ (External)   │    │ (LLM calls)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Code → Flowchart

```
1. User pastes code in Code Editor
         ↓
2. parser.ts: parseCodeToFlow(code)
   - Uses Acorn to generate AST (ECMAScript 2020)
   - Traverses AST nodes (FunctionDeclaration, IfStatement, etc.)
   - Creates FlowNode[] with types: input, output, decision, default
   - Creates FlowEdge[] with conditions for branches
         ↓
3. Flowchart.tsx receives nodes/edges
   - Applies dagre layout algorithm
   - Renders custom React Flow nodes
   - Connects edges with appropriate styling
         ↓
4. (Optional) Interpreter steps through code
   - ExecutionControls.tsx manages speed/pause
   - Current node highlighted in flowchart
   - Variable states displayed
```

### Remote Mode Communication

```
External Replit App                    LogicArt Studio
─────────────────                     ──────────────
      │                                     │
      │ ◀─── GET /api/mcp/sse ───────────── │  (AI Agent connects)
      │                                     │
      │ ───── SSE checkpoint ──────────────▶│  (Execution data)
      │                                     │
      │ ◀─── WS control channel ───────────▶│  (Breakpoints, pause/resume)
      │                                     │
      │ ◀─── POST /api/mcp/messages ─────── │  (Tool calls)
```

**Communication Methods:**
- **SSE (Server-Sent Events):** Checkpoints flow from remote app → Studio
- **WebSocket Control Channel:** Bidirectional debugging commands
- **postMessage:** Used by logicart-embed for iframe communication
- **Global Variables:** Legacy overlay.js uses `window.LogicArt`

### Overlay Injection (packages/logicart-embed)

```javascript
// Static Mode: Runtime parsing
<LogicArtEmbed mode="static" code={sourceCode} />

// Live Mode: Build-time instrumentation
<LogicArtEmbed mode="live" manifestUrl="/logicart-manifest.json" />
```

The embed component:
1. Parses code client-side using the same Acorn parser
2. Renders a self-contained React Flow visualization
3. Communicates with parent via postMessage for events

---

## 3. Feature Gap Analysis

### Speed Governor

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **Play/Pause** | ✅ Working | None |
| **Speed Presets** | ✅ 1x, 2x, 5x, 10x, 100x | None |
| **Loop Control** | ✅ Working | None |
| **Runaway Protection** | ⚠️ Basic | Needs step limits, async pause hooks |
| **Timeout Handling** | ⚠️ Basic | No visual timeout indicator |

**Recommendation:** Add interpreter guardrails (max steps, timeout UI)

### Ghost Diff

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **AST Comparison** | ✅ Real AST diff | None |
| **Diff Detection** | ✅ Identifies changes | None |
| **UI Display** | ✅ CSS classes applied | `diff-added`, `diff-removed`, `diff-modified` classes |
| **Toggle in UI** | ✅ Working | `showDiff` state in Workbench |

**Status:** FULLY IMPLEMENTED - Ghost Diff works end-to-end with visual highlighting

### Visual Handshake

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **Concept** | ✅ Documented | None |
| **Demo Prototype** | ✅ Working | Clean HTML demo with highlight animation |
| **WebSocket Messages** | ✅ Implemented | `HIGHLIGHT_ELEMENT`, `CONFIRM_HIGHLIGHT` in control-types.ts |
| **Workbench Integration** | ✅ Implemented | Click node → sends highlight command via WS control channel |
| **Visual Feedback in Studio** | ✅ Implemented | Amber ring with pulse animation on handshake nodes |
| **Fallback Timeout** | ✅ Implemented | 3-second auto-clear if no confirmation |
| **Session Cleanup** | ✅ Implemented | Clears handshake state on disconnect |

**Status:** FULLY IMPLEMENTED - Visual Handshake works end-to-end with bidirectional feedback

### Natural Language Search

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **Pattern Matching** | ✅ Working | Matches "conditionals", "loops", "returns", etc. |
| **Component** | ✅ Built | `client/src/components/ide/NaturalLanguageSearch.tsx` |
| **Library** | ✅ Full | `client/src/lib/naturalLanguageSearch.ts` |
| **Premium Feature** | ✅ Configured | Gated in `features.ts` |

**Status:** FULLY IMPLEMENTED - Works end-to-end

### Grounding Layer

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **Context Generation** | ✅ Full implementation | `generateGroundingContext()` in `packages/logicart-core/src/grounding.ts` |
| **Types** | ✅ Defined | `shared/grounding-types.ts` with `GroundingNode`, `GroundingContext` |
| **Tests** | ✅ Has tests | `packages/logicart-core/src/grounding.test.ts` |
| **AI Agent Integration** | ✅ MCP Server works | MCP tools can return grounding data |
| **UI Export Button** | ⚠️ Not exposed | Could add "Export Context" button |

**Status:** FULLY IMPLEMENTED - Core grounding works, UI export button could be added

### MCP Server (Just Added)

| Tool | Status | Notes |
|------|--------|-------|
| `analyze_code` | ✅ Working | Returns nodes, edges, complexity, flow |
| `get_complexity` | ✅ Working | Score + explanation + recommendations |
| `explain_flow` | ✅ Working | Natural language description |
| `find_branches` | ✅ Working | Lists conditional branches |
| `count_paths` | ✅ Working | Estimates test coverage needs |

**Current Capability:** AI agents can connect via SSE and call all 5 tools. Ready for orchestration.

---

## 4. Key Files Reference

### Frontend Core

| File | Purpose | Completeness |
|------|---------|--------------|
| `client/src/pages/Workbench.tsx` | Main IDE workspace | ✅ Complete |
| `client/src/components/ide/Flowchart.tsx` | React Flow visualization | ✅ Complete |
| `client/src/components/ide/ExecutionControls.tsx` | Speed/loop controls | ✅ Complete |
| `client/src/lib/parser.ts` | Acorn AST → FlowNodes | ✅ Complete |
| `client/src/lib/interpreter.ts` | Step-by-step execution | ✅ Complete |
| `client/src/lib/historyManager.ts` | Undo/redo state | ✅ Complete |
| `client/src/lib/ghostDiff.ts` | AST diff logic | ⚠️ Core only |
| `client/src/lib/groundingContext.ts` | Grounding export | ⚠️ Core only |

### Backend Core

| File | Purpose | Completeness |
|------|---------|--------------|
| `server/routes.ts` | API endpoints | ✅ Complete |
| `server/mcp.ts` | MCP server for AI agents | ✅ Complete |
| `server/storage.ts` | Database operations | ✅ Complete |
| `shared/schema.ts` | Drizzle ORM schema | ✅ Complete |
| `shared/control-types.ts` | WS message types | ✅ Complete |

### Overlay/Embed

| File | Purpose | Completeness |
|------|---------|--------------|
| `packages/logicart-embed/` | Embeddable component | ⚠️ Basic |
| `public/src/runtime.js` | Legacy runtime injection | ⚠️ Basic |
| `public/src/overlay.js` | Legacy overlay | ⚠️ Basic |

---

## 5. Recommended Next Steps

### Priority 1: Add UI Export for Grounding Context (Enhancement)
1. Add "Export Context" button to Workbench toolbar
2. Create `/api/grounding/export` endpoint using existing `generateGroundingContext()`
3. Save grounding sessions to database (optional)

### Priority 2: Harden Speed Governor (Stability)
1. Add max step limit (configurable)
2. Add timeout indicator in UI
3. Implement async pause hooks for interpreter

### Priority 3: Complete Zero-Code Reverse Proxy
1. Handle ES module/Vite app instrumentation
2. Add source map support for accurate line mapping

---

## 6. Database Schema Summary

```sql
-- Current Tables
arena_sessions    -- Model Arena history
shares            -- Shared flowcharts with metadata
users             -- (if auth enabled)
sessions          -- Express sessions
```

---

*This document reflects the actual state of the codebase as of December 27, 2025.*
