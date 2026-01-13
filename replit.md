# LogicArt - Code-to-Flowchart Visualization Tool

## Overview
LogicArt (formerly LogiGo) is a bidirectional code-to-flowchart visualization tool built with React, designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It targets "Vibe Coders" who benefit from visual learning and debugging. The application uses AST analysis to parse JavaScript functions and renders them as interactive graphs using React Flow. Key ambitions include supporting bi-directional editing (flowchart changes update code) and leveraging Blueprint Schemas for AI-driven code generation. The project aims to provide a robust platform for visual code understanding and debugging.

## Recent Changes
- **January 2026**: Added platform-agnostic React preprocessing:
  - Parser automatically extracts algorithm logic from React hooks (useCallback, useMemo, useEffect)
  - Same integration works for all vibe coding platforms (Replit Agent, Antigravity, Cursor, etc.)
  - Robust brace matching handles strings, single-line comments, and multi-line comments
  - Preprocessing applied in both client-side (docs/bridge/src/parser.ts) and server-side (server/routes.ts)
- **January 2026**: Added file drop and function picker feature:
  - FileDropZone component for drag-and-drop .js/.ts file upload
  - FunctionPicker dialog shows discovered functions/classes with selection UI
  - Selective visualization: choose specific methods to visualize (wraps in minimal class stub preserving inheritance)
  - getCodeForSelection utility handles multi-line class declarations (extends, implements)
- **January 2026**: Added class-based JavaScript parsing support:
  - ClassDeclaration now creates a container for each class with all its methods
  - MethodDefinition creates containers for each method (constructor, regular, static, getters/setters)
  - Method bodies are fully parsed with control flow (if/else, loops, etc.)
  - Mixed code (classes + functions + top-level statements) all parse correctly
  - Container override mechanism ensures proper parent hierarchy in flowcharts
- **January 2026**: Comprehensive rebranding from LogiGo to LogicArt completed. Updates include:
  - All user-facing UI branding (landing page, workbench, tutorials, help dialogs)
  - HTML meta tags, OpenGraph, and Twitter cards
  - localStorage/sessionStorage keys with migration for existing users
  - CSS classes (.logicart-highlight) and file export names
  - Comment patterns now support both @logicart: (new) and @logigo: (legacy)
  - Voyai URLs updated to app=logicart (login, upgrade)
  - AppId validation accepts both 'logicart' and 'logigo' for backward compatibility
  - LOGIGO_* API constants preserved for runtime compatibility (noted in reporter-api.ts)
  - **Package renaming completed**: All package directories renamed (logicart-core, logicart-embed, logicart-remote, logicart-vite-plugin)
  - **Component renaming**: LogicArtEmbed component with backward-compatible exports (LogiGoEmbed, LogiGoEmbedProps, LogiGoManifest aliases)
  - **Runtime aliasing**: window.LogicArt added as alias while preserving window.LogiGo for backward compatibility
  - **Examples updated**: vite-demo uses new package imports and manifest URLs
  - External coordination needed: GitHub repo rename, Voyai app ID registration, npm publish for new package names

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend employs a workbench-style IDE with a 2-panel, flowchart-first layout. It features a "Technical, Clean, Blueprint-like" aesthetic, dark mode, blue accent, JetBrains Mono font for code, and Inter for UI. Resizable panels are used for flexible workspace configuration, with layout presets (50/50, 30/70, Flow Only) and hierarchical navigation via breadcrumbs and zoom presets.

### Technical Implementations
LogicArt is built with React 18+, TypeScript, Vite, React Router (wouter), TanStack Query, and Tailwind CSS v4. Core libraries include `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, and shadcn/ui.
The system supports a three-tier hybrid model:
- **Static Mode**: Instant flowchart generation from pasted code via Acorn parsing.
- **Live Mode**: Runtime overlay showing execution data from instrumented code.
- **Blueprint Schema**: Future support for AI-generated JSON blueprints.

Parsing and interpretation involve Acorn for AST analysis, converting JavaScript AST into flowchart nodes and edges. An interpreter provides step-by-step JavaScript execution tracking state, variables, and call stack.

Cross-Replit Communication (Remote Mode) enables external Replit apps to send checkpoint data for real-time visualization via SSE and a WebSocket control channel for bidirectional debugging (remote breakpoints, pause/resume/step).

The `logicart-embed` package (formerly logigo-embed) offers an embeddable React component for visualization, while `logicart-vite-plugin` provides build-time instrumentation for Live Mode. The `logicart-core` NPM package is a standalone runtime library for manual checkpoint instrumentation. Package directories renamed; npm publish needed to claim new package names.

The application features Zero-Code Auto-Discovery for automatic scanning and instrumentation of global functions from `<script>` tags, and a Zero-Code Reverse Proxy for instrumenting any web application.

Advanced features include Ghost Diff for visualizing code changes, Hierarchical Views for managing large codebases, and an Algorithm Examples Library.

### Feature Specifications
- **Model Arena**: Compares code generation and debugging advice from OpenAI GPT-4o, Gemini 3 Flash, Claude Opus 4.5, and Grok 4, with side-by-side code/flowchart views and similarity analysis. A "Chairman Model" synthesizes AI responses into a unified verdict. Arena sessions are saved to PostgreSQL (founder-tier required).
- **BYOK (Bring Your Own Key)**: User-controlled API key management for AI models, stored in localStorage.
- **Undo/Redo**: HistoryManager singleton with keyboard shortcuts (Ctrl+Z/Ctrl+Y) and toolbar buttons.
- **Enhanced Sharing**: Database-backed sharing of flowcharts via unique URLs.
- **Agent API**: `POST /api/agent/analyze` endpoint for programmatic code analysis returning nodes, edges, complexity, and flow structure.
- **MCP Server (Model Context Protocol)**: Exposes LogicArt's code analysis capabilities to AI agents via the MCP standard, offering 7 tools: `analyze_code`, `get_complexity`, `explain_flow`, `find_branches`, `count_paths`, `display_audit`, and `visualize_flow`. Claude Code integration via `.mcp.json` config file or `claude mcp add logicart --transport sse http://localhost:5001/api/mcp/sse`. The `visualize_flow` tool opens a browser with the interactive flowchart (essential for terminal-based environments).
- **Display Audit (AI Agent Tool)**: Detects when multiple code paths render the same component, helping AI agents avoid creating redundant display logic. Available via MCP tool `display_audit` and REST endpoint `POST /api/agent/display-audit`. Analyzes JSX/JS code and flags when >2 different places render the same component. Severity thresholds: 3 render points = info, 4-5 = warning, 6+ = critical. Returns structured findings with component names, line numbers, and consolidation suggestions. Uses acorn-jsx for JSX parsing.
- **Voyai Authentication**: JWT-based authentication via Voyai (voyai.org). Users can sign in via the header button. Protected routes (arena sessions) require founder tier. Token handled via URL param extraction and localStorage persistence. Feature flags supported: `history_database`, `rabbit_hole_rescue`, `github_sync`, `managed_allowance`.
- **Managed AI Proxy**: Pro users with `managed_allowance` feature get server-side API key access for AI models (OpenAI, Gemini, Anthropic, xAI). Usage tracked per-user with monthly auto-reset. Endpoints: `GET /api/ai/usage` (current usage), `POST /api/ai/proxy` (proxied AI calls). Credit Meter UI shows "X/Y" format with remaining credits tooltip. Returns 402 when quota exhausted.
- **Demo Mode**: Allows users to preview all Pro features without signing in. Toggle via "Try Demo" button in header. Simulates founder-tier user with all features enabled (history_database, rabbit_hole_rescue, github_sync, managed_allowance: 100). Persists across page reloads via localStorage. Exits cleanly and restores any existing Voyai session.
- **Headless Council CLI**: Command-line interface for AI model consultations. Usage: `npx tsx scripts/ask-council.ts --mode code --prompt "Your question"` or `npx tsx scripts/ask-council.ts -i` for interactive mode. Requires API keys via environment variables.
- **File Sync (Replit Agent Integration)**: Bi-directional sync system for Replit Agent collaboration. The system stores flowchart data in `data/flowchart.json`. API endpoints: `GET /api/file/status` (returns lastModified timestamp), `GET /api/file/load`, `POST /api/file/save`. The frontend `useWatchFile` hook polls for changes every 2 seconds and auto-updates when external edits are detected. User code changes (typing, undo/redo, samples, node edits) are automatically persisted to the file.
- **URL Code Parameter (External App Integration)**: Enables external apps (VibePost, Cursor, Windsurf, etc.) to open LogicArt with pre-loaded code. URL format: `/?code=<urlEncodedCode>&autorun=true&popup=true`. Supports both URL-encoded (simple) and base64-encoded (legacy) formats. Parameters: `code` (required) - the JavaScript code to visualize; `autorun` (optional) - auto-starts flowchart playback; `popup` (optional) - applies minimal "Flow Only" layout; `embed` (optional) - hides header for clean fullscreen view with code editor and flowchart side-by-side with resizable divider. URL is cleaned after loading to prevent reload issues (except embed parameter which persists).

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
- acorn-jsx
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

### Authentication
- jsonwebtoken (JWT verification for Voyai integration)