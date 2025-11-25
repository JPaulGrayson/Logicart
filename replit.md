# LogiGo - Code-to-Flowchart Visualization Tool

## Overview

LogiGo is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application parses JavaScript functions using AST analysis and renders them as interactive graphs using React Flow, with a key ambition to support bi-directional editing where flowchart modifications update the source code.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18+ with TypeScript, Vite, React Router (wouter), TanStack Query, Tailwind CSS v4.
- **Component Structure**: Workbench-style IDE layout with Code Editor (PrismJS), Flowchart Visualizer (React Flow), and Variable Watch panels.
- **Key Libraries**: `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, shadcn/ui.
- **Design Pattern**: Resizable panel layout with custom React Flow nodes (e.g., `DecisionNode` for conditionals).

### Parser & Interpreter Engine
- **AST Parsing**: Uses Acorn (ECMAScript 2020) to convert JavaScript AST into flowchart nodes and edges, capturing source location for bidirectional navigation. Defines node types: `input`, `output`, `decision`, `default`.
- **Interpreter**: Step-by-step JavaScript execution engine that tracks state, variables, and call stack, supporting control flow for conditionals and returns.

### Styling & Theming
- **Custom Theme**: "Technical, Clean, Blueprint-like" aesthetic with dark mode, blue accent, JetBrains Mono font for code, and Inter for UI.
- **CSS Architecture**: Tailwind CSS with custom theme tokens and utility classes.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, handling static file serving and Vite middleware in development.
- **Storage Interface**: Abstract `IStorage` with an in-memory implementation (`MemStorage`); Drizzle ORM schema defined for future PostgreSQL integration.

### Data Flow Architecture
- **Code → Graph Pipeline**: User code is parsed via Acorn, converted to FlowNodes/FlowEdges, and rendered by React Flow.
- **Execution → Visualization**: Interpreter prepares execution steps, highlights the current node, and displays variable state.
- **Graph → Code**: Double-clicking nodes allows inline editing, patching the source code, and triggering re-parsing.

### IDE Adapter Architecture
- **Pluggable Adapter Pattern**: `IDEAdapter` interface for multi-IDE integration, with `StandaloneAdapter` and `ReplitAdapter` implementations.
- **Replit Integration**: Uses Replit Extension APIs for file operations and editor integration.

### Premium Features Architecture
- **Tiered Distribution**: Free tier (core visualization) and Premium tier (advanced runtime features).
- **Feature Flag System**: `FeatureManager` class controls access to premium features like Ghost Diff (visualizes code changes), Speed Governor (extended execution speeds), Export to Documentation (PDF export), Runtime Overlay (floating controls), and Natural Language Search (querying flowchart nodes).
- **Implementation**: Features conditionally rendered, using tree-based diffing, pattern matching for search, and specific UI components.

### Multi-Platform Extension Support
- **VS Code Extension**: Built for VS Code and Antigravity, supporting native webview integration, auto-refresh on file changes, and click-to-source navigation.

### NPM Package Architecture (logigo-core)
- **Dual Distribution Model**: Standalone NPM package (`logigo-core`) for injectable overlay mode alongside Replit workbench mode.
- **Package Structure**: Single-package approach with UMD and ESM builds via Rollup.
- **Core Modules**:
  - `runtime.js`: ExecutionController with Promise-based checkpoint system, pause/step/play controls, speed governor (0.25x-10x).
  - `overlay.js`: Injectable floating UI with inline styles, SVG icons, position system (top-left/right, bottom-left/right).
  - `parser.js`: Lightweight AST parser for overlay mode.
  - `differ.js`: Ghost Diff engine for tree comparison (added/modified/deleted/unchanged nodes).
- **Global API**: Exposes `window.LogiGo.checkpoint()` for checkpoint-based debugging in any web application.
- **Build Targets**: UMD (browser script tag), ESM (modern bundlers), with source maps.
- **Integration Status**: Phase 1 complete (ahead of schedule), published as `logigo-core` NPM package.

### Visual Handshake & Browser Agent Integration
- **Status**: APPROVED by Antigravity team (Nov 25, 2024) - In active development.
- **Visual Handshake**: Feature that highlights DOM elements on the page when related code checkpoints execute, creating a visual connection between logic and UI.
- **Implementation**: Antigravity team implementing in `logigo-core` with enhanced `checkpoint()` API accepting `domElement` parameter.
- **Browser Agent Integration**: Planned integration with Antigravity's AI-powered browser automation to enable "AI Test Partner" debugging sessions.
- **Documentation**: See `BROWSER_AGENT_INTEGRATION.md` for full proposal and `VISUAL_HANDSHAKE_STATUS.md` for implementation tracking.

### Phase 3: Hierarchical Views Architecture
- **Status**: COMPLETED (Nov 25, 2024) - Fully implemented and tested.
- **Feature**: Zoom-based hierarchical views for managing large codebases with section grouping and container nodes.
- **Zoom Levels**:
  - Mile-high view (< 70% zoom): Shows only container nodes, hides detail nodes for "bird's eye" overview.
  - 1000ft view (70-130% zoom): Shows all nodes including containers and flow logic (default view).
  - 100ft detail view (> 130% zoom): Fully zoomed in with maximum detail visibility.
- **Section Detection**:
  - Parser detects comment-based section markers: `// --- SECTION NAME ---`
  - Creates container nodes for each detected section with proper 1-indexed line number boundaries.
  - Fallback: Automatically creates "Global Flow" container when no section markers exist.
- **Container Nodes**:
  - Custom React Flow node type with purple gradient styling and Package icon.
  - Displays child count badge (e.g., "12 nodes").
  - Click-to-toggle collapse/expand with visual indicators (ChevronDown/ChevronRight).
  - Hover effects and cursor-pointer for clear interactivity.
- **State Management**:
  - Collapse state persisted in `node.data.collapsed` and `node.data.isChildOfCollapsed`.
  - State preserved across zoom changes using React Flow's `getNodes()` API.
  - Visibility computation combines zoom-based hiding with manual collapse state.
- **Performance Optimizations**:
  - Uses React Flow's `onMove`/`onMoveEnd` events instead of polling for zoom detection.
  - Separated `fitView` logic to only run when graph topology changes (not on zoom).
  - Prevents viewport reset during user zoom/pan interactions.
- **UI Elements**:
  - Header displays current view level and zoom percentage (e.g., "Mile-High (65%)").
  - Container nodes styled with `bg-gradient-to-br from-purple-500/10 to-blue-500/10` and `border-2 border-purple-500/30`.
  - Status text shows "Expanded • Click to toggle" or "Collapsed • Click to toggle".
- **Testing**: End-to-end tested with all zoom transitions, manual collapse/expand, and state persistence verified.

## External Dependencies

### Database
- **Drizzle ORM**: Schema definition.
- **@neondatabase/serverless**: PostgreSQL client (prepared).
- **PostgreSQL**: Database (prepared).

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
- **Rollup**: NPM package bundler for `logigo-core` (UMD + ESM builds).

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
- **connect-pg-simple**: PostgreSQL session store (prepared).