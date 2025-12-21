# LogiGo - Code-to-Flowchart Visualization Tool

## Overview
LogiGo is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application parses JavaScript functions using AST analysis and renders them as interactive graphs using React Flow. A key ambition is to support bi-directional editing where flowchart modifications update the source code.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18+ with TypeScript, Vite, React Router (wouter), TanStack Query, Tailwind CSS v4.
- **UI Layout**: Workbench-style IDE with a 2-panel, flowchart-first layout, featuring a minimal header, resizable left sidebar, and maximized right panel for the flowchart canvas.
- **Key Libraries**: `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, shadcn/ui.
- **Design Pattern**: Resizable panel layout with custom React Flow nodes (e.g., `DecisionNode`).
- **Styling**: "Technical, Clean, Blueprint-like" aesthetic with dark mode, blue accent, JetBrains Mono font for code, and Inter for UI, using Tailwind CSS.

### Parser & Interpreter Engine
- **AST Parsing**: Uses Acorn (ECMAScript 2020) to convert JavaScript AST into flowchart nodes and edges, capturing source location. Defines node types: `input`, `output`, `decision`, `default`.
- **Interpreter**: Step-by-step JavaScript execution engine that tracks state, variables, and call stack, supporting control flow.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, handling static file serving.
- **Storage Interface**: Abstract `IStorage` with an in-memory implementation.

### Data Flow Architecture
- **Code → Graph Pipeline**: User code parsed via Acorn, converted to FlowNodes/FlowEdges, rendered by React Flow.
- **Execution → Visualization**: Interpreter prepares execution steps, highlights current node, and displays variable state.
- **Graph → Code**: Double-clicking nodes allows inline editing, patching source code, and triggering re-parsing.

### IDE Adapter Architecture
- **Pluggable Adapter Pattern**: `IDEAdapter` interface for multi-IDE integration, with `StandaloneAdapter` and `ReplitAdapter` implementations.
- **Replit Integration**: Uses Replit Extension APIs for file operations and editor integration.

### Premium Features Architecture
- **Tiered Distribution**: Free tier (core visualization) and Premium tier (advanced runtime features).
- **Feature Flag System**: `FeatureManager` class controls access to premium features like Ghost Diff, Speed Governor, Export to Documentation, Runtime Overlay, and Natural Language Search.

### Multi-Platform Extension Support
- **VS Code Extension**: Built for VS Code and Antigravity, supporting native webview integration and click-to-source navigation.

### NPM Package Architecture (logigo-core)
- **Dual Distribution Model**: Standalone NPM package (`logigo-core`) for injectable overlay mode alongside Replit workbench mode.
- **Core Modules**: `runtime.js` (execution control), `overlay.js` (injectable floating UI), `parser.js` (lightweight AST parser), `differ.js` (Ghost Diff engine).
- **Global API**: Exposes `window.LogiGo.checkpoint()` for checkpoint-based debugging.

### Embeddable Studio Architecture (logigo-embed)
- **Static Mode (Complete)**: Runtime parsing approach with self-contained parser. Visualizes JavaScript code as flowcharts immediately without build configuration.
- **Live Mode (Complete)**: Build-time manifest integration with real-time checkpoint highlighting.
- **Demo Page**: `/embed-demo` showcases the LogiGoEmbed component with position controls and example switching.
- **Distribution**: ESM (React as peer dependency) and UMD (standalone with bundled React) for maximum compatibility.
- **API**: `<LogiGoEmbed code={jsCode} />` for Static Mode, `<LogiGoEmbed manifestUrl="/logigo-manifest.json" />` for Live Mode.
- **Design Document**: See `docs/EMBED_STUDIO_DESIGN.md` for full specification.

### Vite Plugin (logigo-vite-plugin)
- **Location**: `packages/logigo-vite-plugin/`
- **Purpose**: Build-time instrumentation for Live Mode.
- **Features**:
  - Parses JavaScript/TypeScript files with Acorn
  - Generates stable node IDs using hash-based algorithm
  - Injects `LogiGo.checkpoint()` calls with scope-aware variable capture
  - Generates `logigo-manifest.json` with pre-computed flowchart nodes/edges
  - Emits `logigo-runtime.js` with full runtime API
- **Runtime API**: `LogiGo.checkpoint()`, `LogiGo.checkpointAsync()`, `LogiGo.setBreakpoint()`, `LogiGo.resume()`

### logigo-core Runtime Package
- **Location**: `packages/logigo-core/`
- **Purpose**: Standalone runtime library for manual checkpoint instrumentation.
- **API**: `checkpoint()`, `checkpointAsync()`, `createRuntime()`, breakpoint management.
- **Use Case**: For projects not using the Vite plugin, developers can manually add checkpoints.

### Cross-Replit Communication (Remote Mode)
- **Purpose**: Enables external Replit apps to send checkpoint data to LogiGo for real-time visualization.
- **API Endpoints**:
  - `POST /api/remote/session` - Create a session, returns sessionId and connectUrl
  - `POST /api/remote/checkpoint` - Send checkpoint data to a session
  - `POST /api/remote/session/end` - End a session
  - `GET /api/remote/stream/:sessionId` - SSE stream for real-time updates
- **Frontend**: `/remote` page with trace view showing linear execution of checkpoints.
- **Features**: Multiple viewers per session, auto-expiring sessions (1 hour), copy integration code button.
- **Design Document**: See `docs/CROSS_REPLIT_DESIGN.md` for full specification.

### Hybrid Architecture Integration
- **Three-tier Hybrid Model**:
    - **Static Mode (Default)**: Instant flowchart from pasted code via Acorn parsing.
    - **Live Mode (Premium)**: Runtime overlay showing live execution data from instrumented code using `LogiGo.checkpoint()`.
    - **Blueprint Schema (Future)**: AI-generated JSON blueprints.
- **Reporter API**: `window.postMessage` broadcasts from logigo-core with event types like `LOGIGO_SESSION_START` and `LOGIGO_CHECKPOINT`. Workbench listens for these messages, defaulting to Static Mode if no session is detected.

### Flowchart-Visualization Sync
- **Real-time Highlighting**: Flowchart nodes highlight with green pulsing glow during algorithm visualization playback.
- **Step-Type Mapping**: Different algorithm operations map to corresponding flowchart regions.
- **Line-Number Correlation**: Uses nodeMap to find flowchart node IDs from source code line numbers.
- **CSS Classes**: `.active-node` (green pulsing outline), `.highlighted-node` (purple outline).

### Algorithm Examples Library
- **Built-in Examples**: Pre-loaded algorithm samples with `LogiGo.checkpoint()` instrumentation for learning and testing. Includes Quick Sort, Bubble Sort, A* Pathfinder.

### Hierarchical Views Architecture
- **Zoom-based Views**: Manages large codebases with section grouping and container nodes at different zoom levels: Mile-high, 1000ft (default), 100ft detail.
- **Section Detection**: Prioritizes comment-based markers, then auto-detects top-level function declarations.
- **Container Nodes**: Custom React Flow nodes with purple gradient, child count badges, and collapse/expand functionality.

### Fullscreen Modes
- **Dual Fullscreen Modes**: Optimized for desktop/laptop presentation and focused work.
    - **Workspace Mode**: Fullscreen flowchart with floating controls.
    - **Presentation Mode**: Clean view with hidden controls (appear on hover).
- **Keyboard Shortcuts**: `F` key toggles fullscreen (Workspace mode), `Escape` exits fullscreen.

### Zoom Controls
- **Auto-fit with Minimum Zoom**: Ensures readability by clamping zoom to 70% minimum.
- **Manual Zoom Buttons**: Zoom In (+20%), Zoom Out (-20%), Auto-fit buttons.

### Ghost Diff Feature (Premium)
- **Purpose**: Visualizes code changes as highlighted "ghost" nodes in the flowchart (added, removed, modified).
- **How It Works**: Compares new flowchart nodes against an original snapshot, highlighting changes with colored glows (green, red, yellow).
- **UI Controls**: "Show/Hide Diff" and "Reset Diff" buttons.

### Breakpoints
- **Functionality**: Right-click flowchart nodes to toggle breakpoints (red dot indicator); execution pauses at breakpoints.

## External Dependencies

### Database
- **Drizzle ORM**: Schema definition.
- **@neondatabase/serverless**: PostgreSQL client.
- **PostgreSQL**: Database.

### UI Libraries
- **Radix UI**: Headless accessible components.
- **shadcn/ui**: Pre-styled component library.
- **@xyflow/react**: Graph visualization.
- **PrismJS**: Syntax highlighting.
- **react-simple-code-editor**: Code editor.

### Build & Development Tools
- **Vite**: Frontend build tool.
- **esbuild**: Server-side bundling.
- **tsx**: TypeScript execution.
- **@replit/vite-plugin-***: Replit-specific plugins.
- **Rollup**: NPM package bundler for `logigo-core`.

### Parsing & AST
- **acorn**: JavaScript parser.
- **@jridgewell/trace-mapping**: Source map utilities.

### Form & Validation
- **react-hook-form**: Form state management.
- **@hookform/resolvers**: Validation resolvers.
- **zod**: Schema validation.

### Utilities
- **class-variance-authority**: Component variant styling.
- **clsx**: Conditional className utility.
- **tailwind-merge**: Tailwind class merging.
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.

### Fonts
- **Google Fonts**: JetBrains Mono, Inter.

### Session Management
- **connect-pg-simple**: PostgreSQL session store.