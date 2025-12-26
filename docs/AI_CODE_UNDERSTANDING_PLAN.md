# AI Code Understanding Feature - Implementation Plan

**Date:** December 26, 2025  
**Status:** Planned  
**Priority:** High  

---

## Executive Summary

This plan introduces a set of APIs that enable AI agents (like Replit Agent) to programmatically understand code structure and execution flow before making changes. This addresses three common AI coding problems:

1. **Duplicate Code** - AI writes new code when reusable code already exists
2. **Wrong Target** - AI modifies the wrong feature when similar code structures exist
3. **Blind Changes** - AI makes changes without understanding execution paths

---

## Problem Statement

### Current AI Agent Limitations

When an AI agent works with a codebase, it typically:
- Searches for files by name or content (grep, glob)
- Reads file contents as plain text
- Makes changes based on pattern matching

**What's Missing:**
- Structural understanding of code flow
- Knowledge of which functions call which
- Ability to trace execution paths
- Detection of similar/duplicate patterns

### How LogiGo Solves This

LogiGo already has:
- AST parsing (Acorn) that understands code structure
- Flow graph generation (nodes, edges, relationships)
- Step-by-step interpreter for execution tracing
- Visual representation of code logic

**The Gap:** These capabilities are only available visually in the browser. AI agents cannot access them programmatically.

---

## Solution: Four AI-Focused APIs

### 1. Flowchart Structure API (`/api/ai/parse`)

**Purpose:** Parse code and return flowchart structure as JSON

**Use Case:** "What functions exist and what do they do?"

**Request:**
```json
POST /api/ai/parse
{
  "code": "function add(a, b) { return a + b; }",
  "options": {
    "includeSourceLocations": true,
    "summarize": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "structure": {
    "functions": [
      {
        "name": "add",
        "type": "FunctionDeclaration",
        "parameters": ["a", "b"],
        "nodeCount": 3,
        "complexity": "simple",
        "summary": "Takes two parameters and returns their sum"
      }
    ],
    "nodes": [
      { "id": "start", "type": "start", "label": "Start: add(a, b)" },
      { "id": "node_1", "type": "default", "label": "return a + b" },
      { "id": "end", "type": "end", "label": "End" }
    ],
    "edges": [
      { "source": "start", "target": "node_1" },
      { "source": "node_1", "target": "end" }
    ],
    "metadata": {
      "totalNodes": 3,
      "totalEdges": 2,
      "hasDecisions": false,
      "hasLoops": false,
      "maxDepth": 1
    }
  }
}
```

**AI Agent Usage:**
```
Before adding a new utility function, I'll check existing code structure:
> POST /api/ai/parse with the utils.js file
> Response shows a "calculateSum" function already exists
> I'll reuse it instead of writing a new one
```

---

### 2. Execution Trace API (`/api/ai/trace`)

**Purpose:** Run code through interpreter and return execution trace

**Use Case:** "What happens when X is true?"

**Request:**
```json
POST /api/ai/trace
{
  "code": "function greet(name) { if (name) { return 'Hello ' + name; } return 'Hello stranger'; }",
  "entryPoint": "greet",
  "inputs": { "name": "Alice" },
  "maxSteps": 100
}
```

**Response:**
```json
{
  "success": true,
  "trace": {
    "steps": [
      {
        "step": 1,
        "nodeId": "start",
        "label": "Start: greet(name)",
        "variables": { "name": "Alice" }
      },
      {
        "step": 2,
        "nodeId": "decision_1",
        "label": "if (name)",
        "variables": { "name": "Alice" },
        "branchTaken": "true"
      },
      {
        "step": 3,
        "nodeId": "node_2",
        "label": "return 'Hello ' + name",
        "variables": { "name": "Alice" },
        "returnValue": "Hello Alice"
      },
      {
        "step": 4,
        "nodeId": "end",
        "label": "End",
        "variables": { "name": "Alice" }
      }
    ],
    "result": "Hello Alice",
    "pathSummary": "start → decision_1 (true branch) → return statement → end",
    "executedNodes": ["start", "decision_1", "node_2", "end"],
    "skippedNodes": ["node_3"],
    "branchDecisions": [
      { "nodeId": "decision_1", "condition": "name", "result": true }
    ]
  }
}
```

**AI Agent Usage:**
```
User asks: "What happens when the user is not logged in?"
> POST /api/ai/trace with auth code and inputs { "user": null }
> Response shows: decision at "if (user)" took false branch → redirects to login
> I can explain: "When user is null, the code redirects to the login page"
```

---

### 3. Code Similarity API (`/api/ai/similar`)

**Purpose:** Find structurally similar code patterns in the codebase

**Use Case:** "Is there existing code that does something like this?"

**Request:**
```json
POST /api/ai/similar
{
  "targetCode": "function validateEmail(email) { return email.includes('@'); }",
  "searchIn": [
    { "path": "src/utils/validators.js", "code": "..." },
    { "path": "src/helpers/validation.js", "code": "..." }
  ],
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "path": "src/utils/validators.js",
      "functionName": "isValidEmail",
      "similarity": 0.85,
      "matchType": "structural",
      "differences": [
        "Uses regex instead of includes()",
        "Has additional null check"
      ],
      "recommendation": "Consider reusing 'isValidEmail' - it's more robust with regex validation",
      "sourceSnippet": "function isValidEmail(email) { if (!email) return false; return /^[^@]+@[^@]+$/.test(email); }"
    },
    {
      "path": "src/helpers/validation.js",
      "functionName": "checkEmail",
      "similarity": 0.72,
      "matchType": "functional",
      "differences": [
        "Returns error message instead of boolean",
        "Part of a validation object"
      ],
      "recommendation": "Different return type - may not be directly reusable"
    }
  ],
  "summary": "Found 2 similar functions. 'isValidEmail' in validators.js is the best match (85% similar) and is more robust."
}
```

**AI Agent Usage:**
```
Before writing a new validation function:
> POST /api/ai/similar with the planned code
> Response shows 85% match with existing isValidEmail
> I'll import and use the existing function instead of duplicating
```

---

### 4. Impact Analysis API (`/api/ai/impact`)

**Purpose:** Analyze what depends on a function and what would be affected by changes

**Use Case:** "What breaks if I change this?"

**Request:**
```json
POST /api/ai/impact
{
  "targetFunction": "formatDate",
  "codebase": [
    { "path": "src/utils/date.js", "code": "..." },
    { "path": "src/components/Calendar.jsx", "code": "..." },
    { "path": "src/api/events.js", "code": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "target": {
    "name": "formatDate",
    "path": "src/utils/date.js",
    "signature": "formatDate(date, format)",
    "returnType": "string"
  },
  "callers": [
    {
      "path": "src/components/Calendar.jsx",
      "function": "renderDay",
      "line": 45,
      "usage": "formatDate(day, 'MM/DD')",
      "critical": true
    },
    {
      "path": "src/api/events.js",
      "function": "createEvent",
      "line": 23,
      "usage": "formatDate(event.date, 'YYYY-MM-DD')",
      "critical": true
    }
  ],
  "dependencies": [
    {
      "name": "date-fns",
      "imported": ["format", "parse"]
    }
  ],
  "impactSummary": {
    "directCallers": 2,
    "transitiveCallers": 5,
    "riskLevel": "medium",
    "recommendation": "Changes to formatDate will affect Calendar display and API event creation. Test both after changes."
  },
  "safeChanges": [
    "Adding new format options (backwards compatible)",
    "Improving error handling"
  ],
  "riskyChanges": [
    "Changing return type",
    "Changing parameter order",
    "Removing format options"
  ]
}
```

**AI Agent Usage:**
```
User asks: "Change the date format from MM/DD to DD/MM"
> POST /api/ai/impact for formatDate function
> Response shows Calendar.jsx and events.js both use it
> I'll update formatDate AND verify both callers work correctly
```

---

## Implementation Architecture

### Critical Challenge: Runtime Compatibility

The existing parser (`client/src/lib/parser.ts`) and interpreter (`client/src/lib/interpreter.ts`) are **browser-only ESM modules** that:
- Use Vite path aliases (e.g., `@/lib/...`)
- Import React-specific types
- Are not compiled for Node.js runtime

**Solution: Server-Side Parser Implementation**

Rather than attempting to share browser code, we'll create a **new server-side implementation** using the same Acorn library:

```
shared/
├── flow-types.ts          # FlowNode, FlowEdge interfaces (shared)

server/ai/
├── acorn-parser.ts        # Server-side AST → flowchart (pure Node)
├── trace-executor.ts      # Sandboxed code execution
├── similarity.ts          # Structural comparison algorithms
└── call-graph.ts          # Dependency analysis from AST
```

**Why this approach:**
1. Acorn is already a dependency and works in both Node and browser
2. The core parsing logic is simple (~200 lines) - duplicating is acceptable
3. Avoids complex build configuration to share browser modules
4. Server version can be optimized for batch processing (no reactivity needed)

### Algorithm Details

**Similarity Detection:**
```typescript
function calculateSimilarity(a: FlowNode[], b: FlowNode[]): number {
  // 1. Compare node type distribution (if/for/function calls)
  // 2. Compare graph topology (depth, branching factor)
  // 3. Compare identifier patterns (function/variable names)
  // Weighted average → similarity score 0-1
}
```

**Call Graph Analysis:**
```typescript
function buildCallGraph(ast: Node): CallGraph {
  // Walk AST looking for:
  // - CallExpression nodes → record caller/callee
  // - FunctionDeclaration → register available functions
  // - ImportDeclaration → track external dependencies
  // Return: Map<functionName, { callers: [], callees: [] }>
}
```

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent (Replit)                        │
│                                                                 │
│  "Before I add this function, let me check for similar code"   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LogiGo AI APIs (/api/ai/*)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  /parse  │  │  /trace  │  │ /similar │  │ /impact  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       ▼             ▼             ▼             ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Core LogiGo Libraries                   │       │
│  │                                                      │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │       │
│  │  │ AST Parser  │  │ Interpreter │  │  Analyzer   │  │       │
│  │  │  (Acorn)    │  │ (Step-by-   │  │ (Similarity │  │       │
│  │  │             │  │  step exec) │  │  & Impact)  │  │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Code Organization

```
shared/
├── flow-types.ts          # FlowNode, FlowEdge type definitions

server/
├── routes.ts              # Add AI API routes
├── ai/
│   ├── index.ts           # Route handlers for /api/ai/*
│   ├── acorn-parser.ts    # Server-side AST → flowchart
│   ├── trace-executor.ts  # Sandboxed JavaScript execution
│   ├── similarity.ts      # Structural comparison algorithm
│   └── call-graph.ts      # Dependency/impact analysis
```

Note: Server-side implementations are standalone (not sharing browser code) to avoid runtime compatibility issues.

---

## Implementation Phases

### Phase 1: Parse API (Foundation)
**Effort:** 3-4 hours

1. Create shared `flow-types.ts` with FlowNode/FlowEdge interfaces
2. Implement `server/ai/acorn-parser.ts` - pure Acorn AST → flowchart
3. Create `/api/ai/parse` endpoint
4. Add function summary generation (extract function signatures, params)
5. Include metadata (complexity score, node count, decision count)

**Deliverable:** AI can query code structure as JSON

### Phase 2: Trace API (Execution)
**Effort:** 4-5 hours

1. Implement `server/ai/trace-executor.ts` - sandboxed JS execution
2. Create safe execution environment (vm2 or Function constructor)
3. Add step recording with variable snapshots
4. Create `/api/ai/trace` endpoint
5. Generate path summary and branch decisions

**Deliverable:** AI can trace execution paths

**Note:** Trace execution is security-sensitive. Must sandbox untrusted code carefully.

### Phase 3: Similar API (Pattern Matching)
**Effort:** 4-5 hours

1. Create `/api/ai/similar` endpoint
2. Build flowchart comparison algorithm
3. Implement structural similarity scoring
4. Add functional similarity (what it does vs how)
5. Generate recommendations

**Deliverable:** AI can find duplicate/similar code

### Phase 4: Impact API (Dependencies)
**Effort:** 4-5 hours

1. Create `/api/ai/impact` endpoint
2. Build call graph analyzer
3. Track function references across files
4. Calculate impact scores
5. Generate safe/risky change recommendations

**Deliverable:** AI understands change impact

---

## Integration with Replit Agent

### Workflow: Before Making Changes

```
1. User asks: "Add a function to validate phone numbers"

2. AI Agent thinks:
   - Let me check if similar validation exists
   - POST /api/ai/similar with phone validation pattern
   
3. API Response:
   - Found "validatePhone" in src/validators.js (92% match)
   
4. AI Agent:
   - "I found an existing validatePhone function. Would you like me to use it or create a new one?"
```

### Workflow: Explaining Code Paths

```
1. User asks: "What happens when a user clicks checkout?"

2. AI Agent:
   - Let me trace the checkout flow
   - POST /api/ai/trace with checkout handler and sample inputs
   
3. API Response:
   - Trace shows: validateCart → calculateTotal → processPayment → sendConfirmation
   
4. AI Agent:
   - "When checkout is clicked, the code:
     1. Validates the cart items
     2. Calculates the total with tax
     3. Processes payment via Stripe
     4. Sends confirmation email"
```

### Workflow: Safe Refactoring

```
1. User asks: "Rename the formatDate function to formatDateTime"

2. AI Agent:
   - Let me check what uses this function
   - POST /api/ai/impact for formatDate
   
3. API Response:
   - Used in: Calendar.jsx, EventCard.jsx, api/events.js
   
4. AI Agent:
   - "I'll rename formatDate to formatDateTime and update all 3 files that use it:
     - Calendar.jsx (line 45)
     - EventCard.jsx (line 12)
     - api/events.js (line 23)"
```

---

## API Authentication & Rate Limiting

### Security Considerations

```typescript
// Rate limiting for AI APIs
const AI_API_LIMITS = {
  parse: { requests: 100, window: '1m' },
  trace: { requests: 50, window: '1m' },   // More expensive
  similar: { requests: 30, window: '1m' }, // Most expensive
  impact: { requests: 30, window: '1m' }
};

// Request validation
interface AIRequest {
  code: string;           // Max 100KB
  options?: object;
  apiKey?: string;        // Optional for authenticated requests
}
```

### Timeout Handling

```typescript
// Execution timeouts
const TIMEOUTS = {
  parse: 5000,     // 5 seconds
  trace: 10000,    // 10 seconds (execution can be slow)
  similar: 15000,  // 15 seconds (comparing multiple files)
  impact: 15000    // 15 seconds (analyzing call graph)
};
```

---

## Success Metrics

### Quantitative
- API response time < 2 seconds for typical requests
- Parse accuracy matches visual flowchart output
- Trace accuracy matches step-by-step execution

### Qualitative
- AI agent makes fewer duplicate code errors
- AI agent correctly identifies similar patterns
- AI agent warns before modifying widely-used functions

---

## Future Enhancements

1. **Caching** - Cache parsed structures for unchanged files
2. **Incremental Updates** - Only re-parse changed code sections
3. **Language Support** - Extend beyond JavaScript to TypeScript, Python
4. **Integration Hooks** - Pre-change hooks that automatically run impact analysis
5. **Learning** - Track which similar code suggestions were accepted/rejected

---

## Appendix: Existing Code to Reuse

### Parser (client/src/lib/parser.ts)
- `parseCodeToFlow(code)` - Returns nodes and edges
- Already handles functions, decisions, loops

### Interpreter (client/src/lib/interpreter.ts)
- Step-by-step execution with variable tracking
- Breakpoint support (useful for limiting trace length)

### Reporter API (shared/reporter-api.ts)
- JSON export structure (can be adapted)
- Checkpoint format (model for trace steps)

---

*Document created by LogiGo Agent - December 26, 2025*
