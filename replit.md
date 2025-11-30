# LogiGo - Code-to-Flowchart Visualization Tool

## Overview

LogiGo is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application parses JavaScript functions using AST analysis and renders them as interactive graphs using React Flow, with a key ambition to support bi-directional editing where flowchart modifications update the source code.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18+ with TypeScript, Vite, React Router (wouter), TanStack Query, Tailwind CSS v4.
- **UI Layout**: Workbench-style IDE with a 2-panel, flowchart-first layout. Features a minimal header, resizable left sidebar (20% default) for tools, code editor, and execution controls, and a maximized right panel for the flowchart canvas. Includes a floating status pill and a docked, dismissible variables panel.
- **Key Libraries**: `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, shadcn/ui.
- **Design Pattern**: Resizable panel layout with custom React Flow nodes (e.g., `DecisionNode`).
- **Styling**: "Technical, Clean, Blueprint-like" aesthetic with dark mode, blue accent, JetBrains Mono font for code, and Inter for UI, using Tailwind CSS.

### Parser & Interpreter Engine
- **AST Parsing**: Uses Acorn (ECMAScript 2020) to convert JavaScript AST into flowchart nodes and edges, capturing source location. Defines node types: `input`, `output`, `decision`, `default`.
- **Interpreter**: Step-by-step JavaScript execution engine that tracks state, variables, and call stack, supporting control flow.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, handling static file serving.
- **Storage Interface**: Abstract `IStorage` with an in-memory implementation, with Drizzle ORM schema defined for future PostgreSQL integration.

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

### Hybrid Architecture Integration
- **Three-tier Hybrid Model**:
    - **Static Mode (Default)**: Instant flowchart from pasted code via Acorn parsing.
    - **Live Mode (Premium)**: Runtime overlay showing live execution data from instrumented code using `LogiGo.checkpoint()`.
    - **Blueprint Schema (Future)**: AI-generated JSON blueprints.
- **Reporter API**: `window.postMessage` broadcasts from logigo-core with event types like `LOGIGO_SESSION_START` and `LOGIGO_CHECKPOINT`. Workbench listens for these messages, defaulting to Static Mode if no session is detected.
- **Visual Handshake**: Highlights DOM elements on the page when related code checkpoints execute, linking logic to UI.

### Flowchart-Visualization Sync
- **Real-time Highlighting**: Flowchart nodes highlight with green pulsing glow during algorithm visualization playback
- **Step-Type Mapping**: Different algorithm operations (init, compare, swap, complete) map to corresponding flowchart regions
- **Line-Number Correlation**: Uses nodeMap to find flowchart node IDs from source code line numbers
- **CSS Classes**: 
  - `.active-node` - Green outline with pulsing animation for currently executing code
  - `.highlighted-node` - Purple outline for user-selected or referenced nodes

### Algorithm Examples Library
- **Built-in Examples**: Pre-loaded algorithm samples for learning and testing with LogiGo checkpoints
- **Available Algorithms**:
  - **Quick Sort**: Divide-and-conquer sorting with partition visualization
  - **Bubble Sort**: Simple comparison-based sorting for beginners
  - **A* Pathfinder**: Optimal pathfinding with heuristic-based graph traversal
- **Checkpoint Instrumentation**: All examples include `LogiGo.checkpoint()` calls with:
  - Descriptive checkpoint IDs (e.g., `partition:compare:${j}`)
  - DOM element targeting for Visual Handshake (e.g., `#bar-${index}`, `#cell-${x}-${y}`)
  - Custom colors for different operations (yellow=compare, red=swap, green=complete)
  - Variable state tracking in checkpoint payloads
- **UI Integration**: Examples dropdown in sidebar with category grouping (Sorting, Pathfinding)
- **Location**: `client/src/lib/algorithmExamples.ts`

### Hierarchical Views Architecture
- **Zoom-based Views**: Manages large codebases with section grouping and container nodes.
    - **Mile-high view (< 70% zoom)**: Shows only container nodes.
    - **1000ft view (70-130% zoom)**: Shows all nodes and flow logic (default).
    - **100ft detail view (> 130% zoom)**: Maximum detail visibility.
- **Section Detection**: Prioritizes comment-based markers, then auto-detects top-level function declarations, falling back to a "Global Flow" container.
- **Container Nodes**: Custom React Flow nodes with purple gradient, child count badges, and click-to-toggle collapse/expand functionality.
- **State Management**: Collapse state persisted and preserved across zoom changes.
- **Performance Optimizations**: Uses React Flow events for zoom detection and avoids unnecessary viewport resets.

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

## Documentation

### Replit Extension Specification
- **Location**: `docs/REPLIT_EXTENSION_SPEC.md`
- **Purpose**: Technical specification for Antigravity team to build the Replit Extension
- **Contents**: Reporter API contract, IDE Adapter interface, message protocols, user workflows, testing checklist