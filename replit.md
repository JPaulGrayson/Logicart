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

### UI Layout Architecture (Updated Nov 26, 2024)
- **2-Panel Flowchart-First Layout**: Maximizes flowchart visibility while maintaining full control accessibility.
- **Minimal Header**: Reduced to h-10 (~40px) with only branding elements (Logo, "LogiGo" title, Beta/Premium badges) to maximize canvas space.
- **Left Sidebar (20% default, 15-35% resizable)**:
  - Flow Tools Section (Sticky): Always visible at top with Natural Language Search (premium), Ghost Diff toggle (premium), Documentation, and Share buttons.
  - Collapsible Code Editor: Uses flex layout (`flex-1 min-h-0`) that fully collapses to release space when hidden.
  - Execution Controls: Full `ExecutionControls` component with play/pause, step forward/backward (Time Travel), reset, stop, loop toggle, and speed selector (0.25x-10x with Speed Governor).
  - Views Section: Variables panel toggle.
  - Export Section: PNG export (free), PDF export (premium).
- **Right Panel (80% default)**: Maximized flowchart canvas for primary visualization.
- **Floating Status Pill**: Top-right positioned pill (replaces flowchart header) displays view level, zoom percentage, and live execution status with minimal space usage.
- **Docked Variables Panel**: Bottom-right positioned with backdrop blur, defaults to visible to preserve always-on variable context, fully dismissible and re-toggleable.
- **Flowchart Pane Consolidation (Nov 26, 2024)**:
  - Removed Flowchart Header: Replaced h-7 header strip with floating status pill to reclaim vertical canvas space.
  - Removed React Flow Zoom Widget: Users can zoom with mouse wheel, keyboard shortcuts, or minimap for space efficiency.
  - Compact RuntimeOverlay: Icon-only buttons (h-7 w-7) for play/pause, step backward (Time Travel, premium), step forward, reset, stop; dropdown speed selector replaces button grid.
- **Total Vertical Space Gained**: ~72px (header reduced by 16px, flowchart header removed ~28px, other optimizations ~28px).
- **Responsive Design**: Sidebar overflow-y scroll, sticky Flow Tools section, flex-based code editor adapts to viewport size, all controls accessible on small/large screens.

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

### Hybrid Architecture Integration (logigo-core + LogiGo Studio)
- **Status**: IMPLEMENTED (Nov 26, 2024) - Three-tier hybrid model combining static analysis with optional runtime debugging.
- **Philosophy**: LogiGo Studio = Universal entry point (zero-friction static analysis); logigo-core = Power-user runtime debugger (instrumented code)
- **Architecture**:
  - **Tier 1: Static Mode** (Default): User pastes code → Acorn parser → Instant flowchart. No setup, no code modification required.
  - **Tier 2: Live Mode** (Premium): User runs instrumented code with `checkpoint()` calls → postMessage Reporter API → Runtime overlay on flowchart showing live execution data.
  - **Tier 3: Blueprint Schema** (Future): AI-generated JSON blueprints for perfect structure declaration.
- **Reporter API Integration**:
  - **Protocol**: `window.postMessage` handshake between Studio and logigo-core (cross-origin secure messaging).
  - **Message Types**: `logigo:handshake` (connection), `logigo:checkpoint` (execution events), `logigo:state` (variable updates), `logigo:complete/error` (status).
  - **File**: `shared/reporter-api.ts` - TypeScript interfaces for all message formats.
  - **Listener**: Workbench component passively listens for messages; stays in Static Mode if no handshake detected.
- **UI Indicators**:
  - **Status Pill**: Floating top-right pill shows "Static Mode" (blue dot) or "Live Mode" (green pulsing dot + checkpoint count).
  - **Node Highlighting**: Checkpoints auto-map to flowchart nodes via line numbers, highlighting active execution points.
  - **Seamless Fallback**: If no runtime detected, Studio operates normally in Static Mode.
- **Speed Alignment**: Updated to support 20x maximum speed (matching logigo-core@1.0.0-beta.2).
- **Integration Status**: Core infrastructure complete. Ready for logigo-core's "Library of Logic" demos (sorting algorithms, pathfinding).

### Visual Handshake & Browser Agent Integration
- **Status**: APPROVED by Antigravity team (Nov 25, 2024) - In active development.
- **Visual Handshake**: Feature that highlights DOM elements on the page when related code checkpoints execute, creating a visual connection between logic and UI.
- **Implementation**: Antigravity team implementing in `logigo-core` with enhanced `checkpoint()` API accepting `domElement` parameter.
- **Browser Agent Integration**: Planned integration with Antigravity's AI-powered browser automation to enable "AI Test Partner" debugging sessions.
- **Documentation**: See `BROWSER_AGENT_INTEGRATION.md` for full proposal and `VISUAL_HANDSHAKE_STATUS.md` for implementation tracking.

### Phase 3: Hierarchical Views Architecture
- **Status**: COMPLETED (Nov 25, 2024) - Fully implemented and tested. Enhanced Nov 26, 2024 with UX improvements.
- **Feature**: Zoom-based hierarchical views for managing large codebases with section grouping and container nodes.
- **Zoom Levels**:
  - Mile-high view (< 70% zoom): Shows only container nodes, hides detail nodes for "bird's eye" overview.
  - 1000ft view (70-130% zoom): Shows all nodes including containers and flow logic (default view).
  - 100ft detail view (> 130% zoom): Fully zoomed in with maximum detail visibility.
- **Section Detection** (Enhanced Nov 26, 2024):
  - **Priority 1**: Parser detects comment-based section markers: `// --- SECTION NAME ---`
  - **Priority 2**: Auto-detection of multiple top-level function declarations as separate sections (creates one container per function).
  - **Priority 3**: Fallback to "Global Flow" container when single function or no explicit sections exist.
  - Creates container nodes for each detected section with proper 1-indexed line number boundaries.
- **Container Nodes**:
  - Custom React Flow node type with purple gradient styling and Package icon.
  - Displays child count badge (e.g., "12 nodes").
  - Click-to-toggle collapse/expand with visual indicators (ChevronDown/ChevronRight).
  - Hover effects and cursor-pointer for clear interactivity.
  - **Global Flow Guidance** (Added Nov 26, 2024): Displays inline help text explaining how to create multiple sections using comment markers.
- **RuntimeOverlay Visual Enhancement** (Nov 26, 2024):
  - Purple gradient background (`from-purple-500/10 to-blue-500/10`) with purple border (`border-2 border-purple-500/30`).
  - Labeled header with "RUNTIME CONTROLS" text, pulsing purple dot indicator, and "(Premium)" badge.
  - Border separator below label to distinguish from control buttons.
  - Clearly distinct from flowchart nodes to prevent confusion.
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
- **Testing**: End-to-end tested with all zoom transitions, manual collapse/expand, state persistence, auto-detection, and RuntimeOverlay styling verified (Nov 26, 2024).

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