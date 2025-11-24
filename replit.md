# LogiGo - Code-to-Flowchart Visualization Tool

## Overview

LogiGo is a bidirectional code-to-flowchart visualization tool built with React. It allows developers to visualize JavaScript code execution as interactive flowcharts, step through code execution, and understand control flow patterns. The application parses JavaScript functions using AST analysis and renders them as interactive graphs using React Flow, with plans to support bi-directional editing where changes to the flowchart update the source code.

**Core Purpose**: Transform JavaScript code into visual control flow diagrams that can be interactively executed and debugged step-by-step.

**Target Users**: "Vibe Coders" who prefer visual learning and debugging of code logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**:
- React 18+ with TypeScript
- Vite as build tool and development server
- React Router (wouter) for client-side routing
- TanStack Query for server state management
- Tailwind CSS v4 with custom design system

**Component Structure**:
The application follows a workbench-style IDE layout with three primary panels:
1. **Code Editor** (left): Monaco-style editor with syntax highlighting via PrismJS
2. **Flowchart Visualizer** (center): React Flow canvas displaying control flow graph
3. **Variable Watch** (right): Real-time variable state during execution

**Key Libraries**:
- `@xyflow/react` (React Flow) for graph visualization and interaction
- `acorn` for JavaScript AST parsing
- `react-simple-code-editor` with PrismJS for code editing
- Radix UI for accessible component primitives
- shadcn/ui component system with custom "LogiGo" theme

**Design Pattern**: The application uses a resizable panel layout with React Flow for node-based visualization. Custom node types (DecisionNode) handle conditional logic rendering with diamond shapes.

### Parser & Interpreter Engine

**AST Parsing** (`client/src/lib/parser.ts`):
- Uses Acorn parser with ECMAScript 2020 support and location tracking
- Converts JavaScript AST into flowchart nodes and edges
- Maps AST nodes to unique IDs for bidirectional navigation
- Captures source location data (line/column) for code-to-graph mapping

**Node Types**:
- `input`: Function entry points (blue)
- `output`: Return statements (red)
- `decision`: Conditional branches (yellow, diamond-shaped)
- `default`: Regular statements (gray)

**Interpreter** (`client/src/lib/interpreter.ts`):
- Step-by-step JavaScript execution engine
- Tracks execution state: variables, call stack, current node
- Supports control flow: conditionals, returns, function calls
- Future support planned for loops and complex expressions

**Execution States**: `idle`, `running`, `paused`, `completed`, `error`

### Styling & Theming

**Custom Theme**: "Technical, Clean, Blueprint-like" aesthetic
- Dark mode by default (Slate 900 base)
- Primary accent: Blue 500 (#3b82f6)
- Monospace font: JetBrains Mono for code
- Sans font: Inter for UI

**CSS Architecture**:
- Tailwind CSS with custom theme tokens
- CSS variables for semantic colors
- Custom utilities: `hover-elevate`, `active-elevate-2`

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- Development mode: Vite middleware integration with HMR
- Production mode: Static file serving from `dist/public`
- Logging utility with formatted timestamps

**Storage Interface**: 
- Abstract `IStorage` interface for CRUD operations
- Current implementation: In-memory storage (`MemStorage`)
- Schema defined with Drizzle ORM for future database migration
- User entity with username/password fields

**Development vs Production**:
- `server/index-dev.ts`: Vite SSR middleware for hot reload
- `server/index-prod.ts`: Serves pre-built static assets
- Separate build process: Client (Vite) + Server (esbuild)

### Data Flow Architecture

**Code → Graph Pipeline**:
1. User types code in editor
2. Debounced (500ms) parsing with Acorn
3. AST traversal creates FlowNode and FlowEdge arrays
4. React Flow renders graph with custom node components
5. Node map maintains AST-to-visual bidirectional references

**Execution → Visualization**:
1. Interpreter prepares execution steps from AST
2. Play/pause controls trigger step advancement
3. Current node highlighted in green
4. Variable state displayed in side panel
5. Call stack tracked for recursive functions

**Graph → Code (✅ Complete)**:
- Double-click nodes to edit logic inline
- Code patcher replaces AST ranges in source string
- Auto re-parse to update visualization
- isParsing guard prevents editing during debounce window

### IDE Adapter Architecture (✅ Complete)

**Pluggable Adapter Pattern** for multi-IDE integration:
- `IDEAdapter` interface defining file operations, editor integration, and lifecycle methods
- `StandaloneAdapter`: In-memory code state for standalone web usage
- `ReplitAdapter`: Integration with Replit Extension APIs
- `AdapterContext`: React context for managing adapter instances

**Replit Extension Integration**:
- Uses Replit Extension APIs: `session.getActiveFile()`, `fs.readFile()`, `fs.writeFile()`, `fs.watchFile()`

### Premium Features Architecture (✅ Complete - November 2025)

**Tiered Distribution Model**:
LogiGo implements a two-tier monetization strategy:
- **Free Tier**: Core flowchart visualization and basic execution controls
- **Premium Tier**: Advanced runtime features from Antigravity integration

**Feature Flag System** (`client/src/lib/features.ts`):
- `FeatureManager` class manages feature access based on user tier
- `FeatureFlags` interface defines available premium features
- Currently defaults to 'premium' tier for development/testing
- Ready for Voyai auth integration via monorepo architecture

**Premium Features Integrated**:
1. **Ghost Diff** (`client/src/lib/ghostDiff.ts`):
   - Visualizes code changes as styled diff nodes in flowchart
   - Tree diffing algorithm based on Antigravity's differ.js
   - Tracks added, removed, and modified nodes with color coding
   - Toggle button in header to show/hide diff visualization
   - Uses `useRef` pattern to prevent infinite render loops

2. **Speed Governor** (`client/src/lib/executionController.ts`):
   - Extended speed presets: 0.25x, 3x, 5x, 10x (vs free tier: 0.5x, 1x, 2x)
   - Centralized speed management through ExecutionController class
   - Lightning icon (⚡) indicator for premium speed options
   - Note: Full checkpoint-based pause/step system planned for future release

3. **Runtime Overlay** (Planned):
   - Floating toolbar for execution control
   - Persistent across IDE panels
   - Based on Antigravity's overlay.js component

**Implementation Details**:
- Feature flags conditionally render UI elements (ghost diff toggle, premium speed options)
- Ghost diff uses tree-based diffing with node-to-node matching via unique IDs
- Diff computation integrated into code parsing pipeline with debounce (500ms)
- Premium badge displays in header when premium features enabled
- All premium modules written in TypeScript with proper typing

**Future Integration**:
- Monorepo setup to share auth/licensing/payment code with Voyai/Turai
- Dynamic tier selection based on authenticated user subscription
- Server-side feature validation to prevent client-side bypass
- Automatic file watching with real-time sync between Replit editor and flowchart
- Bi-directional editing: Changes in flowchart update source file via `fs.writeFile()`
- Extension manifest (`public/extension.json`) with read/write-exec scopes
- Separate build configuration (`vite.extension.config.ts`) for static bundle deployment

**UI Adaptation**:
- Conditionally shows/hides code editor panel based on `adapter.hasIntegratedEditor()`
- Extension mode: No editor panel (uses Replit's native editor)
- Standalone mode: Full 3-panel layout with built-in code editor

### Minimap Behavior (✅ Fixed)

- Minimap shows fixed overview of entire flowchart (non-zoomable)
- Main canvas can zoom/pan independently
- Click/drag on minimap to navigate main view
- Viewport rectangle indicates visible area

### Planned Features (Implementation Status)

**Phase 1**: Source mapping for navigation (✅ Complete)

**Phase 2**: Step-by-step interpreter with visual state (✅ Complete)

**Phase 3**: Bi-directional editing (✅ Complete)

**Phase 4**: Multi-IDE platform support (✅ Architecture complete, Replit integration done, VS Code extension complete)

**Phase 5**: Advanced layout with `dagre`/`elkjs` for complex control flow (✅ Complete - dagre integrated)

### VS Code Extension (✅ Complete - November 2025)

**Multi-Platform Extension Support**:
- Built for VS Code, Google Antigravity, Cursor, and Windsurf
- Dual publishing to VS Code Marketplace and Open VSX Registry
- Native webview integration with file system access

**Extension Architecture** (`vscode-extension/`):
- `src/extension.ts`: Main extension entry point with file watching
- `src/parser.ts`: Standalone parser with dagre layout (no React Flow dependency)
- `src/webview/`: React-based webview UI with SVG rendering
- `build.js`: esbuild configuration for extension and webview bundles

**Key Features**:
- Command: `Cartographer: Visualize Current File`
- Editor toolbar icon for quick access
- Auto-refresh on file changes (configurable)
- Click nodes to jump to source code lines
- Real-time bidirectional sync with editor

**Publishing Targets**:
1. **VS Code Marketplace**: For VS Code and Cursor users
2. **Open VSX Registry**: For Google Antigravity users (required for Antigravity compatibility)
3. **Manual .vsix**: Direct distribution option

**Google Antigravity Context**:
- Antigravity is a VS Code fork built on Windsurf's $2.4B licensed "Cascade" technology (Google acquired July 2025)
- Uses Open VSX Registry instead of VS Code Marketplace
- Cartographer extension works natively without modification
- Perfect fit for "vibe coding" platforms emphasizing AI-assisted visual development

## External Dependencies

### Database
- **Drizzle ORM**: Schema definition and migration toolkit
- **@neondatabase/serverless**: Postgres client (configured but not yet connected)
- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable
- Note: Application currently uses in-memory storage; database integration is prepared but not active

### UI Libraries
- **Radix UI**: Headless accessible component primitives (Dialog, Dropdown, Tooltip, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **@xyflow/react**: Graph/flowchart visualization library
- **PrismJS**: Syntax highlighting for code editor
- **react-simple-code-editor**: Lightweight code editing component

### Build & Development Tools
- **Vite**: Frontend build tool with HMR and TypeScript support
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development server
- **@replit/vite-plugin-***: Replit-specific development plugins (cartographer, dev-banner, runtime-error-modal)

### Parsing & AST
- **acorn**: JavaScript parser for AST generation
- **@jridgewell/trace-mapping**: Source map utilities

### Form & Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Validation resolver integration
- **zod**: Schema validation (used with Drizzle)

### Utilities
- **class-variance-authority**: Component variant styling
- **clsx**: Conditional className utility
- **tailwind-merge**: Tailwind class merging
- **date-fns**: Date manipulation utilities
- **nanoid**: Unique ID generation

### Fonts
- **Google Fonts**: JetBrains Mono (monospace), Inter (sans-serif)

### Session Management
- **connect-pg-simple**: PostgreSQL session store (configured for future use)