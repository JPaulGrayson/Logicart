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
- **Design Patterns**: Resizable panel layout, custom React Flow nodes (e.g., `DecisionNode`), pluggable `IDEAdapter` for multi-IDE integration (e.g., `ReplitAdapter`), `FeatureManager` for premium features.
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
    - **Live Mode (Premium)**: Runtime overlay showing live execution data from instrumented code using `LogiGo.checkpoint()`.
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
- **Premium Features**: Ghost Diff (visualizes code changes in flowcharts), Speed Governor, Export to Documentation, Runtime Overlay, Natural Language Search, controlled by a `FeatureManager`.
- **Hierarchical Views**: Manages large codebases with zoom-based views (Mile-high, 1000ft, 100ft) using section grouping and collapsible container nodes.
- **Algorithm Examples Library**: Built-in, instrumented examples for learning and testing.
- **Self-Healing Connection Loop**: Automatic reconnection and session renewal for remote connections.
- **Model Arena**: Compare code generation from 4 AI models (OpenAI GPT-5, Gemini, Claude, Grok) with side-by-side code/flowchart views and similarity analysis.

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