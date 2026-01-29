# LogicArt - Code-to-Flowchart Visualization Tool

## Overview
LogicArt is a bidirectional code-to-flowchart visualization tool designed to transform JavaScript code into interactive, step-by-step control flow diagrams. It aims to support "Vibe Coders" through visual learning and debugging by leveraging AST analysis to parse JavaScript functions and rendering them as interactive graphs using React Flow. The project's vision includes bi-directional editing (flowchart changes updating code) and utilizing Blueprint Schemas for AI-driven code generation, ultimately providing a robust platform for visual code understanding and debugging.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend features a workbench-style IDE with a 2-panel, flowchart-first layout. Its aesthetic is "Technical, Clean, Blueprint-like," incorporating a dark mode, blue accents, JetBrains Mono for code, and Inter for UI. The interface includes resizable panels for flexible workspace configuration, layout presets (50/50, 30/70, Flow Only), and hierarchical navigation with breadcrumbs and zoom presets.

### Technical Implementations
LogicArt is built with React 18+, TypeScript, Vite, React Router (wouter), TanStack Query, and Tailwind CSS v4. Key libraries include `@xyflow/react` for graph visualization, `acorn` for AST parsing, `react-simple-code-editor`, Radix UI, and shadcn/ui. The system operates on a three-tier hybrid model: Static Mode (instant flowchart from pasted code), Live Mode (runtime execution visualization from instrumented code), and future Blueprint Schema support for AI-generated JSON.

Parsing involves Acorn for AST analysis, converting JavaScript AST into flowchart nodes and edges, and an interpreter for step-by-step JavaScript execution tracking. Cross-Replit Communication (Remote Mode) allows external Replit apps to send checkpoint data for real-time visualization via Server-Sent Events (SSE) and a WebSocket control channel for bidirectional debugging.

The `logicart-embed` package offers an embeddable React component, while `logicart-vite-plugin` provides build-time instrumentation for Live Mode. The `logicart-core` NPM package is a standalone runtime library for manual checkpoint instrumentation. The application supports Zero-Code Auto-Discovery for global function scanning and a Zero-Code Reverse Proxy for instrumenting any web application. Advanced features include Ghost Diff for code change visualization, Hierarchical Views for large codebases, and an Algorithm Examples Library.

Additional features include:
- **Ralph Wiggum Mode**: Enables AI task planning, generating PROMPT.md, plan.md, and progress.md for persistent AI coding loops, with an export option for all artifacts.
- **Architecture View**: Visualizes component dependencies, detecting React components, handling various syntax patterns (implicit returns, ternaries, destructured props), and offering interactive drill-down to flowcharts.
- **Project Scanning**: Allows remote project scanning by specifying source URLs and file paths, building architecture graphs from external sources.
- **Advanced Parser**: Supports complex destructuring patterns (ArrayPattern, ObjectPattern, RestElement, AssignmentPattern) and class-based JavaScript parsing, including methods and inheritance.
- **React Preprocessing**: Extracts algorithm logic from React hooks (useCallback, useMemo, useEffect) for platform-agnostic integration.
- **File Drop & Function Picker**: Enables drag-and-drop file upload and selective function/class visualization.
- **Model Arena**: Compares AI model outputs (GPT-4o, Gemini, Claude, Grok) for code generation and debugging, with a "Chairman Model" synthesizing responses.
- **BYOK (Bring Your Own Key)**: User-controlled API key management for AI models.
- **Undo/Redo**: System-wide undo/redo functionality with keyboard shortcuts and toolbar buttons.
- **Enhanced Sharing**: Database-backed sharing of flowcharts via unique URLs.
- **Agent API**: `POST /api/agent/analyze` endpoint for programmatic code analysis.
- **MCP Server (Model Context Protocol)**: Exposes LogicArt's analysis capabilities to AI agents via 7 tools (`analyze_code`, `get_complexity`, `explain_flow`, `find_branches`, `count_paths`, `display_audit`, `visualize_flow`).
- **Display Audit (AI Agent Tool)**: Detects redundant component rendering paths in JSX/JS code.
- **Voyai Authentication**: JWT-based authentication via Voyai, supporting feature flags.
- **Managed AI Proxy**: For Pro users, provides server-side API key access to AI models with usage tracking.
- **Demo Mode**: Allows previewing Pro features without sign-in.
- **Headless Council CLI**: Command-line interface for AI model consultations.
- **File Sync (Replit Agent Integration)**: Bi-directional sync of flowchart data with Replit Agent, via `data/flowchart.json` and API endpoints (`GET /api/file/status`, `GET /api/file/load`, `POST /api/file/save`).
- **URL Code Parameter**: Enables external apps to open LogicArt with pre-loaded code via URL parameters (`code`, `autorun`, `popup`, `embed`).
- **Architecture URL Parameter**: Directly opens the architecture view via URL parameters (`mode=architecture`, `sourceUrl`, `files`).

### Feature Specifications
- **Quack Integration**: Agent-to-agent messaging platform for AI communication.
  - Inbox: `replit/orchestrate`
  - Fetch messages: `GET https://quack.us.com/api/inbox/replit/orchestrate`
  - Send messages: `POST https://quack.us.com/api/send`
  - Mark as read/complete: `POST https://quack.us.com/api/receive/:messageId`, `POST https://quack.us.com/api/complete/:messageId`
  - Task reception: `POST /api/task` with `{messageId, from, task, context}`

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