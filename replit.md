# LogiGo - Code-to-Flowchart Visualization Tool

## Overview
LogiGo is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application parses JavaScript functions using AST analysis and renders them as interactive graphs using React Flow. A key ambition is to support bi-directional editing where flowchart modifications update the source code. The project aims to provide a robust platform for visual code understanding, debugging, and potentially AI-driven code generation via Blueprint Schemas.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React 18+ with TypeScript, Vite, React Router (wouter), TanStack Query, Tailwind CSS v4.
- **UI/UX Decisions**: Workbench-style IDE with a 2-panel, flowchart-first layout. "Technical, Clean, Blueprint-like" aesthetic with dark mode, blue accent, JetBrains Mono font for code, and Inter for UI.
- **Key Libraries**: `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, shadcn/ui.
- **Design Patterns**: Resizable panel layout, custom React Flow nodes (e.g., `DecisionNode`), pluggable `IDEAdapter` for multi-IDE integration (e.g., `ReplitAdapter`), `FeatureManager` for feature flags (future Voyai integration).
- **Data Flow**: Code is parsed by Acorn, converted to FlowNodes/FlowEdges, rendered by React Flow. An interpreter highlights execution steps and displays variable states. Double-clicking nodes enables inline editing and source code patching.

### Parser & Interpreter
- **AST Parsing**: Uses Acorn (ECMAScript 2020) to convert JavaScript AST into flowchart nodes and edges, capturing source location and defining node types (`input`, `output`, `decision`, `default`).
- **Interpreter**: Step-by-step JavaScript execution engine that tracks state, variables, and call stack, supporting control flow and visualization.

### Backend
- **Server Framework**: Express.js with TypeScript, serving static files.
- **Storage**: Abstract `IStorage` with an in-memory implementation.

### Core Features & Architecture Patterns
- **Three-tier Hybrid Model**:
    - **Static Mode**: Instant flowchart from pasted code via Acorn parsing.
    - **Live Mode**: Runtime overlay showing live execution data from instrumented code using `LogiGo.checkpoint()`.
    - **Blueprint Schema (Future)**: AI-generated JSON blueprints.
- **Cross-Replit Communication (Remote Mode)**: Enables external Replit apps to send checkpoint data to LogiGo for real-time visualization via SSE and a control WebSocket channel for bidirectional debugging.
- **Bidirectional Control Protocol**: Full debugging capabilities via WebSocket control channel:
    - **Remote Breakpoints**: Set/remove/clear breakpoints from Studio UI, synced to remote app
    - **Pause/Resume/Step**: Control remote code execution from Studio sidebar
    - **Visual Handshake**: Click flowchart nodes to highlight corresponding elements in remote app
    - **Async Checkpoints**: Remote app's `checkpoint()` function pauses at breakpoints and waits for resume
    - Control message types defined in `shared/control-types.ts`
- **LogiGo Embed**: Embeddable React component (`logigo-embed`) for static (runtime parsing) and live (build-time manifest integration) visualization.
- **LogiGo Vite Plugin**: Build-time instrumentation for Live Mode, injecting `LogiGo.checkpoint()` calls and generating manifest files.
- **logigo-core NPM Package**: Standalone runtime library for manual checkpoint instrumentation and core execution control.
- **Zero-Code Auto-Discovery**: Opt-in feature to automatically scan, extract, and instrument global functions from `<script>` tags for flowchart visualization.
- **Zero-Code Reverse Proxy**: Proxies and instruments any web application (including ES module/Vite/React apps) by injecting `remote.js` and checkpoint calls for true zero-code integration.
- **Advanced Features**: Ghost Diff (visualizes code changes in flowcharts), Speed Governor, Export to Documentation, Runtime Overlay, Natural Language Search, controlled by `FeatureManager` (future Voyai licensing integration).
- **Hierarchical Views**: Manages large codebases with zoom-based views (Mile-high, 1000ft, 100ft) using section grouping and collapsible container nodes.
- **Algorithm Examples Library**: Built-in, instrumented examples for learning and testing.
- **Self-Healing Connection Loop**: Automatic reconnection and session renewal for remote connections.
- **Model Arena**: Compare code generation from 4 AI models (OpenAI GPT-4o, Gemini 3 Flash, Claude Opus 4.5, Grok 4) with side-by-side code/flowchart views and similarity analysis.
- **Debug Arena**: Get debugging advice from 4 AI models simultaneously. Describe your problem, paste error logs and code snippets, and compare solutions from different perspectives.
- **Chairman Model**: Synthesizes all 4 AI responses into a unified verdict using a configurable "chairman" model. Specialized prompts for code generation (CHAIRMAN_CODE_VERDICT_PROMPT) and debug advice (CHAIRMAN_DEBUG_VERDICT_PROMPT). Chairman preference stored in localStorage (`logigo_arena_chairman`). Verdict endpoint at `/api/arena/verdict`.
- **Arena Session History**: Saves arena sessions to PostgreSQL database for later review. Sessions include mode, prompt, results, verdict, and chairman selection. API endpoints: GET/POST `/api/arena/sessions`, GET/DELETE `/api/arena/sessions/:id`. History panel accessible via History button in Model Arena header.
- **BYOK (Bring Your Own Key)**: User-controlled API key management for open-source distribution. Keys are stored in browser localStorage and passed via HTTP headers (x-openai-key, x-gemini-key, x-anthropic-key, x-xai-key). Server-side functions accept keys from headers with environment variable fallback for development. Settings modal at `client/src/components/arena/SettingsModal.tsx`.
- **Layout Presets (V1)**: 5 layout preset buttons (50/50, 30/70, 70/30, Code Only, Flow Only) for quick workspace configuration. Uses ImperativePanelHandle refs for programmatic ResizablePanel control. Persisted to localStorage.
- **Hierarchical Navigation (V1)**: Breadcrumb navigation bar and 4 zoom preset buttons (25%, 50%, 100%, Fit) in Flowchart component for consistent navigation.
- **Undo/Redo (V1)**: HistoryManager singleton class with debounced state tracking, Ctrl+Z/Ctrl+Y keyboard shortcuts, and toolbar buttons.
- **Enhanced Sharing (V1)**: Database-backed sharing with `shares` table, POST/GET `/api/share/:id` endpoints, and ShareDialog component with title/description.
- **Arena Example Selector (V1)**: Quick examples dropdown in Model Arena for selecting common coding prompts.
- **Agent API (V1)**: REST endpoint `POST /api/agent/analyze` for programmatic code analysis returning nodes, edges, complexity, and flow structure.
- **MCP Server (Model Context Protocol)**: Exposes LogiGo's code analysis capabilities to AI agents (Replit Agent, Claude, etc.) via the MCP standard. Tools include `analyze_code`, `get_complexity`, `explain_flow`, `find_branches`, and `count_paths`. SSE transport at `/api/mcp/sse`.

## External Dependencies

### Database
- **PostgreSQL**
- **Drizzle ORM**
- **@neondatabase/serverless**

### UI Libraries
- **Radix UI**
- **shadcn/ui**
- **@xyflow/react**
- **PrismJS**
- **react-simple-code-editor**

### Build & Development Tools
- **Vite**
- **esbuild**
- **tsx**
- **@replit/vite-plugin-***
- **Rollup**

### Parsing & AST
- **acorn**
- **@jridgewell/trace-mapping**

### Form & Validation
- **react-hook-form**
- **@hookform/resolvers**
- **zod**

### Utilities
- **class-variance-authority**
- **clsx**
- **tailwind-merge**
- **date-fns**
- **nanoid**

### Fonts
- **Google Fonts** (JetBrains Mono, Inter)

### Session Management
- **connect-pg-simple**

## API Reference

### Code Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/analyze` | POST | Programmatic code analysis |
| `/api/rewrite-code` | POST | AI-powered code rewriting |

**POST /api/agent/analyze**
```json
// Request
{ "code": "function example() { ... }", "language": "javascript" }

// Response
{
  "summary": { "nodeCount": 5, "complexityScore": 3, "entryPoint": "example" },
  "flow": [...],
  "nodes": 5,
  "edges": 4,
  "complexity": 3,
  "language": "javascript"
}
```

### Documentation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docs` | GET | List all available documentation files |
| `/api/docs/:file` | GET | Get documentation file content as JSON |
| `/docs/:slug` | GET | View documentation as styled HTML page |

**Available documentation slugs:** `getting-started`, `installation`, `api-reference`, `common-pitfalls`, `quick-reference`, `integration`, `vibe-coder-guide`

### Sharing
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/share` | POST | Create a new share |
| `/api/share/:id` | GET | Retrieve a share by ID |

**POST /api/share**
```json
// Request
{ "code": "...", "title": "My Algorithm", "description": "Optional description" }

// Response
{ "id": "abc12345", "url": "/s/abc12345" }
```

### Model Arena
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/arena/generate` | POST | Generate code from 4 AI models |
| `/api/arena/debug` | POST | Get debug advice from 4 AI models |
| `/api/arena/verdict` | POST | Get chairman verdict on results |
| `/api/arena/sessions` | GET/POST | List or save arena sessions |
| `/api/arena/sessions/:id` | GET/DELETE | Get or delete a session |

### MCP Server (Model Context Protocol)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mcp/sse` | GET | SSE connection for MCP transport |
| `/api/mcp/messages` | POST | Handle MCP tool calls |

**Available MCP Tools:**
| Tool | Description |
|------|-------------|
| `analyze_code` | Parse code and return flowchart structure with nodes, edges, and complexity |
| `get_complexity` | Get complexity score with explanation and refactoring recommendations |
| `explain_flow` | Natural language description of code control flow |
| `find_branches` | List all conditional branches with their conditions |
| `count_paths` | Count unique execution paths for test coverage planning |

**MCP Configuration:**
```json
{
  "mcpServers": {
    "logigo": {
      "url": "https://your-logigo-instance/api/mcp/sse",
      "transport": "sse"
    }
  }
}
```

## Key Files

### Frontend
| File | Purpose |
|------|---------|
| `client/src/pages/Workbench.tsx` | Main IDE workspace with code editor and flowchart |
| `client/src/pages/ModelArena.tsx` | AI model comparison interface |
| `client/src/components/ide/Flowchart.tsx` | React Flow visualization with zoom controls |
| `client/src/components/ide/ShareDialog.tsx` | Share creation dialog |
| `client/src/lib/parser.ts` | Acorn-based JavaScript parser |
| `client/src/lib/historyManager.ts` | Undo/redo state management |

### Backend
| File | Purpose |
|------|---------|
| `server/routes.ts` | Express API endpoints |
| `server/storage.ts` | Database storage interface |
| `server/mcp.ts` | MCP server for agent integration |
| `shared/schema.ts` | Drizzle ORM schema definitions |

### Database Tables
| Table | Purpose |
|-------|---------|
| `arena_sessions` | Saved Model Arena sessions |
| `shares` | Shared flowcharts with metadata |

## V1 Feature Details

### Layout Presets
- **Location:** Sidebar → Layout section
- **Presets:** 50/50, 30/70, 70/30, Code Only, Flow Only
- **Storage:** localStorage key `logigo-layout-preset`
- **Implementation:** Uses `ImperativePanelHandle.resize()` for programmatic control

### Zoom Presets
- **Location:** Flowchart toolbar
- **Presets:** 25%, 50%, 100%, Fit
- **Implementation:** Uses React Flow's `zoomTo()` and `fitView()` APIs

### Undo/Redo
- **Keyboard:** Ctrl+Z (undo), Ctrl+Y (redo)
- **Debounce:** 1 second delay before saving state
- **Location:** Sidebar → History section
- **Implementation:** HistoryManager singleton in `client/src/lib/historyManager.ts`

### Enhanced Sharing
- **Flow:** Click Share → Enter title/description → Create → Copy URL
- **URL Format:** `/s/{8-char-hex-id}`
- **Tracking:** View count incremented on each access

### Arena Example Selector
- **Location:** Model Arena → Code Generation → Quick examples dropdown
- **Examples:** Find Duplicates, Debounce, Binary Search, LRU Cache, Email Validator, Fibonacci

## Development Commands

```bash
npm run dev        # Start development server
npm run db:push    # Push schema changes to database
npm run build      # Production build
```

## NPM Packages

LogiGo includes three standalone npm packages in the `packages/` directory:

| Package | Description | Build Command |
|---------|-------------|---------------|
| `logigo-core` | Runtime library with checkpoint, breakpoint, and grounding support | `cd packages/logigo-core && npm run build` |
| `logigo-embed` | Embeddable React flowchart visualization component | `cd packages/logigo-embed && npm run build` |
| `logigo-vite-plugin` | Vite plugin for build-time code instrumentation | `cd packages/logigo-vite-plugin && npm run build` |

### Package Testing

All packages verified working (December 28, 2025):
- ✅ All builds pass with correct ES module exports
- ✅ Split-brain runtime bug fixed (deferred serialization, queue overflow protection)
- ✅ E2E test confirms flowchart rendering with 10 nodes, 2 decision nodes
- ✅ Interpreter executes with variable tracking (`arr`, `i`, `j` visible in Debug Panel)

### Publishing to npm

Each package has complete metadata (author, repository, homepage) and README documentation ready for `npm publish`.