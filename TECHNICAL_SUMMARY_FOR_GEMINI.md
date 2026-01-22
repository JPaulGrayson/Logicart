# LogicArt Studio - Technical Summary for External Review

**Generated:** December 26, 2025  
**Purpose:** Comprehensive technical overview for Gemini AI review

---

## 1. Current File Structure and Organization

```
logicart-studio/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   │   └── favicon.png, opengraph.jpg, etc.
│   ├── src/
│   │   ├── components/
│   │   │   ├── arena/               # Model Arena components
│   │   │   │   └── MiniFlowchart.tsx
│   │   │   ├── ide/                 # Main IDE/Workbench components
│   │   │   │   ├── CodeEditor.tsx
│   │   │   │   ├── Flowchart.tsx
│   │   │   │   ├── DecisionNode.tsx, LabeledNode.tsx, ContainerNode.tsx
│   │   │   │   ├── ExecutionControls.tsx
│   │   │   │   ├── RuntimeOverlay.tsx
│   │   │   │   ├── VariableWatch.tsx, VariableHistory.tsx
│   │   │   │   ├── NodeEditDialog.tsx
│   │   │   │   └── ...
│   │   │   ├── ui/                  # shadcn/ui components (50+ files)
│   │   │   └── visualizers/         # Algorithm-specific visualizers
│   │   │       └── SortingVisualizer.tsx, PathfindingVisualizer.tsx, etc.
│   │   ├── contexts/
│   │   │   └── AdapterContext.tsx   # IDE adapter context
│   │   ├── hooks/
│   │   │   └── useKeyboardShortcuts.ts, use-toast.ts
│   │   ├── lib/
│   │   │   ├── adapters/            # IDE integration adapters
│   │   │   │   ├── ReplitAdapter.ts
│   │   │   │   └── StandaloneAdapter.ts
│   │   │   ├── parser.ts            # Client-side AST parser (Acorn)
│   │   │   ├── interpreter.ts       # Step-by-step JS interpreter
│   │   │   ├── ghostDiff.ts         # Code change visualization
│   │   │   ├── codePatcher.ts       # Bidirectional code patching
│   │   │   ├── features.ts          # Feature manager (premium features)
│   │   │   └── queryClient.ts       # TanStack Query setup
│   │   ├── pages/
│   │   │   ├── Workbench.tsx        # Main IDE page
│   │   │   ├── ModelArena.tsx       # 4-model comparison (Code Gen + Debug)
│   │   │   ├── RemoteMode.tsx       # Cross-Replit visualization
│   │   │   ├── EmbedDemo.tsx
│   │   │   └── ZeroClickDemo.tsx
│   │   ├── App.tsx                  # Main router
│   │   └── main.tsx                 # Entry point
│   └── index.html
│
├── server/                          # Backend Express server
│   ├── ai/
│   │   ├── index.ts                 # AI route registration + core functions
│   │   └── acorn-parser.ts          # Server-side AST parsing
│   ├── arena.ts                     # Model Arena API (4-model comparison)
│   ├── routes.ts                    # Main API routes (~2000 lines)
│   ├── storage.ts                   # IStorage interface (in-memory)
│   ├── app.ts                       # Express app setup
│   └── index-dev.ts, index-prod.ts  # Entry points
│
├── shared/                          # Shared types between client/server
│   ├── schema.ts                    # Drizzle schema (users table)
│   ├── control-types.ts             # WebSocket control messages
│   ├── grounding-types.ts           # Flowchart/grounding types
│   └── reporter-api.ts              # Reporter API types
│
├── packages/                        # Publishable NPM packages
│   ├── logicart-core/                 # Runtime library for manual instrumentation
│   ├── logicart-embed/                # Embeddable React component
│   ├── logicart-remote/               # Remote checkpoint client
│   └── logicart-vite-plugin/          # Build-time instrumentation plugin
│
├── docs/                            # Documentation
├── example/                         # Demo HTML files
├── vscode-extension/                # VS Code extension (experimental)
└── Configuration files (vite.config.ts, package.json, etc.)
```

---

## 2. Implemented Features

### 2.1 Core Flowchart Visualization
- **AST Parsing**: Uses Acorn (ECMAScript 2020) to parse JavaScript into flowchart nodes
- **React Flow**: Renders interactive flowcharts with custom node types (Decision, Loop, Function, Action)
- **Bidirectional Editing**: Double-click nodes to edit code inline, changes patch back to source
- **Ghost Diff**: Visualizes code changes in flowcharts with added/removed/modified styling

### 2.2 Model Arena (4-Model Comparison) - **DETAILED WIRING**

**Location:** `server/arena.ts` + `client/src/pages/ModelArena.tsx`

#### Backend Architecture (`server/arena.ts`)

**Two Modes:**
1. **Code Generation** (`POST /api/arena/generate`)
2. **Debug Advisor** (`POST /api/arena/debug`)

**Models Used:**
| Provider | Model ID | SDK/Client |
|----------|----------|------------|
| OpenAI | `gpt-4o` | `openai` npm package |
| Gemini | `gemini-3-flash-preview` | `@google/genai` |
| Claude | `claude-opus-4-5-20251101` | `@anthropic-ai/sdk` |
| Grok | `grok-4` | `openai` with custom baseURL (`https://api.x.ai/v1`) |

**Parallel Execution Pattern:**
```typescript
// Code Generation
const results = await Promise.all([
  generateWithOpenAI(prompt),
  generateWithGemini(prompt),
  generateWithClaude(prompt),
  generateWithGrok(prompt)
]);

// Debug Analysis
const results = await Promise.all([
  debugWithOpenAI(fullPrompt),
  debugWithGemini(fullPrompt),
  debugWithClaude(fullPrompt),
  debugWithGrok(fullPrompt)
]);
```

**Each model function:**
- Creates its own client instance with API key from environment
- Sends prompt with system prompt (code generation or debug analysis)
- Returns `{ model, provider, code/analysis, latencyMs, error? }`
- Catches errors gracefully, returns error message instead of throwing

**Post-Processing (Code Generation only):**
1. Parse each result's code to flowchart using Acorn
2. Calculate complexity scores (node count, cyclomatic complexity)
3. Generate similarity matrix between all pairs using structure comparison

**Response Shape:**
```typescript
// Code Generation Response
{
  success: boolean,
  results: ModelResult[],       // { model, provider, code, latencyMs, error? }
  flowcharts: Record<string, ParseResult>,
  comparison: {
    similarityMatrix: Array<{ model1, model2, similarity }>,
    complexityScores: Array<{ model, complexity, nodeCount }>
  }
}

// Debug Response
{
  success: boolean,
  results: DebugResult[]  // { model, provider, analysis, latencyMs, error? }
}
```

#### Frontend Architecture (`client/src/pages/ModelArena.tsx`)

**State Management:**
- `arenaMode`: "code" | "debug" - toggles UI mode
- `results` / `debugResults`: stores model responses
- `flowcharts`: parsed flowchart data for visualization
- `viewMode`: "code" | "flowchart" - toggles result display

**API Calls via TanStack Query mutations:**
```typescript
const generateMutation = useMutation({
  mutationFn: async (prompt) => 
    apiRequest("POST", "/api/arena/generate", { prompt })
});

const debugMutation = useMutation({
  mutationFn: async ({ problem, errorLogs, codeSnippet }) =>
    apiRequest("POST", "/api/arena/debug", { problem, errorLogs, codeSnippet })
});
```

### 2.3 Remote Mode (Cross-Replit Communication)
- SSE streaming for real-time checkpoint updates
- WebSocket control channel for bidirectional debugging
- Session management with timeout/cleanup

### 2.4 Other Features
- Step-by-step interpreter with variable tracking
- Natural language search across flowchart nodes
- Algorithm examples library with visualizers
- Code export to documentation (PDF/Markdown)

---

## 3. API Keys and User Data Handling

### 3.1 API Key Management

**Current Implementation: Server-Side Environment Variables**

All API keys are stored as **Replit Secrets** (environment variables) and accessed **only on the server**:

```typescript
// server/arena.ts

// OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Claude/Anthropic
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Grok/xAI
const client = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});
```

**Environment Variables Required:**
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`

**Security Considerations:**
- Keys are **never sent to the client**
- Keys are **never logged** (error handling returns generic messages)
- All AI calls go through the Express backend
- CORS is configured per-endpoint

### 3.2 User Data Handling

**Current State: Minimal User Data**

The application has a basic user schema but **does not currently use authentication**:

```typescript
// shared/schema.ts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
```

```typescript
// server/storage.ts
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  // In-memory storage only, no persistence
}
```

**No user-specific data is stored** - the users table exists but is not actively used.

---

## 4. Saving/History vs Ephemeral Generation

### 4.1 Current State: **Fully Ephemeral**

**All Arena generations are ephemeral:**
- Results exist only in React component state
- Refreshing the page clears all results
- No database storage of prompts, results, or comparisons
- No local storage persistence
- Switching between Code/Debug modes clears previous results

**Session State Flow:**
```
User Input → API Call → Results in State → Displayed
                              ↓
                    (Page refresh = gone)
```

### 4.2 Remote Mode Sessions

Remote Mode has **temporary server-side sessions** but they are also ephemeral:

```typescript
// server/routes.ts
const remoteSessions = new Map<string, RemoteSession>();

interface RemoteSession {
  id: string;
  name?: string;
  code?: string;
  checkpoints: Checkpoint[];  // Stored in memory only
  sseClients: Response[];
  // ...
}

// Auto-cleanup after 1 hour of inactivity
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
```

**Limitations:**
- Sessions stored in-memory only (lost on server restart)
- No database persistence for checkpoints
- No history of past sessions

### 4.3 What Would Be Needed for Persistence

To add saving/history, the following would need to be implemented:

1. **Database Tables:**
   ```sql
   -- Arena history
   arena_sessions (id, user_id, mode, created_at)
   arena_prompts (id, session_id, prompt_text, created_at)
   arena_results (id, prompt_id, provider, model, code/analysis, latency_ms)
   
   -- Remote mode history
   remote_sessions (id, user_id, name, code, created_at)
   remote_checkpoints (id, session_id, label, variables, line, timestamp)
   ```

2. **API Endpoints:**
   - `POST /api/arena/save` - save current results
   - `GET /api/arena/history` - list past sessions
   - `GET /api/arena/session/:id` - load a saved session

3. **User Authentication:**
   - Currently not implemented
   - Would need login/signup flow to associate history with users

---

## 5. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ModelArena.tsx                                                 │
│  ├── Mode Toggle (Code Generation / Debug Advisor)             │
│  ├── Prompt/Problem Input                                       │
│  ├── Results Display (4 cards, one per model)                  │
│  ├── View Toggle (Code / Flowchart)                            │
│  └── Comparison Analysis (complexity, similarity)              │
│                                                                 │
│  TanStack Query Mutations → fetch("/api/arena/...")            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP POST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│  arena.ts                                                       │
│  ├── POST /api/arena/generate                                   │
│  │   └── Promise.all([OpenAI, Gemini, Claude, Grok])           │
│  │       └── Parse results → flowcharts                        │
│  │       └── Calculate similarity matrix                       │
│  │                                                              │
│  └── POST /api/arena/debug                                      │
│      └── Promise.all([OpenAI, Gemini, Claude, Grok])           │
│                                                                 │
│  Environment Variables (Replit Secrets):                        │
│  ├── OPENAI_API_KEY                                            │
│  ├── GEMINI_API_KEY                                            │
│  ├── ANTHROPIC_API_KEY                                         │
│  └── XAI_API_KEY                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL AI PROVIDERS                        │
├─────────────────────────────────────────────────────────────────┤
│  api.openai.com          → GPT-4o                              │
│  generativelanguage...   → Gemini 3 Flash                      │
│  api.anthropic.com       → Claude Opus 4.5                     │
│  api.x.ai/v1             → Grok 4                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Technical Decisions

1. **Parallel Model Calls**: All 4 models called via `Promise.all()` for minimum latency
2. **Server-Side Only**: API keys never exposed to client
3. **Graceful Error Handling**: Individual model failures don't break the entire request
4. **Ephemeral State**: No persistence - simpler architecture, no data management
5. **Acorn AST Parsing**: Shared between client and server for consistency
6. **React Flow**: Industry-standard for flowchart visualization

---

*End of Technical Summary*
