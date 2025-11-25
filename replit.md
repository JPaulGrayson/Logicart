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