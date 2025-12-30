# LogiGo - Code-to-Flowchart Visualization Tool

## Overview
LogiGo is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application uses AST analysis to parse JavaScript functions and renders them as interactive graphs using React Flow. Key ambitions include supporting bi-directional editing (flowchart changes update code) and leveraging Blueprint Schemas for AI-driven code generation. The project aims to provide a robust platform for visual code understanding and debugging.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend employs a workbench-style IDE with a 2-panel, flowchart-first layout. It features a "Technical, Clean, Blueprint-like" aesthetic, dark mode, blue accent, JetBrains Mono font for code, and Inter for UI. Resizable panels are used for flexible workspace configuration, with layout presets (50/50, 30/70, Flow Only) and hierarchical navigation via breadcrumbs and zoom presets.

### Technical Implementations
LogiGo is built with React 18+, TypeScript, Vite, React Router (wouter), TanStack Query, and Tailwind CSS v4. Core libraries include `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, and shadcn/ui.
The system supports a three-tier hybrid model:
- **Static Mode**: Instant flowchart generation from pasted code via Acorn parsing.
- **Live Mode**: Runtime overlay showing execution data from instrumented code.
- **Blueprint Schema**: Future support for AI-generated JSON blueprints.

Parsing and interpretation involve Acorn for AST analysis, converting JavaScript AST into flowchart nodes and edges. An interpreter provides step-by-step JavaScript execution tracking state, variables, and call stack.

Cross-Replit Communication (Remote Mode) enables external Replit apps to send checkpoint data for real-time visualization via SSE and a WebSocket control channel for bidirectional debugging (remote breakpoints, pause/resume/step).

The `logigo-embed` package offers an embeddable React component for visualization, while `logigo-vite-plugin` provides build-time instrumentation for Live Mode. The `logigo-core` NPM package is a standalone runtime library for manual checkpoint instrumentation.

The application features Zero-Code Auto-Discovery for automatic scanning and instrumentation of global functions from `<script>` tags, and a Zero-Code Reverse Proxy for instrumenting any web application.

Advanced features include Ghost Diff for visualizing code changes, Hierarchical Views for managing large codebases, and an Algorithm Examples Library.

### Feature Specifications
- **Model Arena**: Compares code generation and debugging advice from OpenAI GPT-4o, Gemini 3 Flash, Claude Opus 4.5, and Grok 4, with side-by-side code/flowchart views and similarity analysis. A "Chairman Model" synthesizes AI responses into a unified verdict. Arena sessions are saved to PostgreSQL.
- **BYOK (Bring Your Own Key)**: User-controlled API key management for AI models, stored in localStorage.
- **Undo/Redo**: HistoryManager singleton with keyboard shortcuts (Ctrl+Z/Ctrl+Y) and toolbar buttons.
- **Enhanced Sharing**: Database-backed sharing of flowcharts via unique URLs.
- **Agent API**: `POST /api/agent/analyze` endpoint for programmatic code analysis returning nodes, edges, complexity, and flow structure.
- **MCP Server (Model Context Protocol)**: Exposes LogiGo's code analysis capabilities to AI agents via the MCP standard, offering tools like `analyze_code`, `get_complexity`, `explain_flow`, `find_branches`, and `count_paths`.

## External Dependencies

### Database
- PostgreSQL
- Drizzle ORM
- @neondatabase/serverless

### UI Libraries
- Radix UI
- shadcn/ui
- @xyflow/react
- PrismJS
- react-simple-code-editor

### Parsing & AST
- acorn
- @jridgewell/trace-mapping

### Form & Validation
- react-hook-form
- @hookform/resolvers
- zod

### Utilities
- class-variance-authority
- clsx
- tailwind-merge
- date-fns
- nanoid

### Fonts
- Google Fonts (JetBrains Mono, Inter)

### Session Management
- connect-pg-simple