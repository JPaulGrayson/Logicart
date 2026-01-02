# LogiGo API Reference

**Complete API documentation for LogiGo packages and components**

---

## 📦 Package Overview

| Package | Purpose | Version |
|---------|---------|---------|
| **logigo-core** | Runtime library for checkpoint debugging | 1.0.0 |
| **logigo-embed** | React component for flowchart visualization | 1.0.0 |
| **logigo-vite-plugin** | Vite plugin for build-time instrumentation | 1.0.0 |

---

## Table of Contents

- [logigo-core](#logigo-core)
  - [checkpoint()](#checkpoint)
  - [checkpointAsync()](#checkpointasync)
  - [LogiGoRuntime](#logigoruntime)
- [logigo-embed](#logigo-embed)
  - [LogiGoEmbed Component](#logigoembed-component)
  - [Props Reference](#props-reference)
- [logigo-vite-plugin](#logigo-vite-plugin)
  - [Plugin Configuration](#plugin-configuration)
  - [Options Reference](#options-reference)
- [User Labels](#user-labels)
- [Checkpoint ID Conventions](#checkpoint-id-conventions)
- [Type Definitions](#type-definitions)

---

## logigo-core

Runtime library for checkpoint-based debugging and execution tracking.

### Installation

```bash
npm install logigo-core
```

### Compatibility

- **Node.js**: 16+
- **React**: 16+
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+

---

### checkpoint()

Record a synchronous checkpoint during code execution.

**Signature:**
```typescript
function checkpoint(
  nodeId: string,
  variables?: Record<string, any>
): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | ✅ | Unique identifier for this checkpoint |
| `variables` | object | ❌ | Variables to capture at this point |

**Example:**

```javascript
import { checkpoint } from 'logigo-core';

function processOrder(order) {
  checkpoint('order:start', { orderId: order.id });
  
  const total = calculateTotal(order.items);
  checkpoint('order:total', { total });
  
  if (total > 1000) {
    checkpoint('order:large', { total });
    applyDiscount(order);
  }
  
  checkpoint('order:complete', { finalTotal: order.total });
  return order;
}
```

**Best Practices:**

```javascript
// ✅ Good: Descriptive IDs
checkpoint('validation:email', { email });
checkpoint('auth:login:success', { userId });

// ❌ Bad: Generic IDs
checkpoint('cp1', { data });
checkpoint('step2', { result });

// ✅ Good: Snapshot arrays
checkpoint('sort:step', { arr: [...arr] });

// ❌ Bad: Reference (will change)
checkpoint('sort:step', { arr });
```

**Returns:** `void`

---

### checkpointAsync()

Record an asynchronous checkpoint with breakpoint support.

**Signature:**
```typescript
async function checkpointAsync(
  nodeId: string,
  variables?: Record<string, any>
): Promise<void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | ✅ | Unique identifier for this checkpoint |
| `variables` | object | ❌ | Variables to capture at this point |

**Example:**

```javascript
import { checkpointAsync, LogiGoRuntime } from 'logigo-core';

const runtime = new LogiGoRuntime();
runtime.setBreakpoint('critical_point', true);

async function processData(data) {
  await checkpointAsync('process:start', { data });
  
  // Execution pauses here if breakpoint is set
  await checkpointAsync('critical_point', { data });
  
  const result = await transform(data);
  
  await checkpointAsync('process:complete', { result });
  return result;
}

// Resume execution
runtime.resume();
```

**Breakpoint Behavior:**

When a breakpoint is set on a checkpoint:
1. Execution pauses at the checkpoint
2. Variables are captured and sent to LogiGo Studio
3. Execution waits for `runtime.resume()` to be called
4. Execution continues to next checkpoint

**Returns:** `Promise<void>`

---

### LogiGoRuntime

Runtime controller for managing execution sessions, breakpoints, and checkpoints.

**Signature:**
```typescript
class LogiGoRuntime {
  constructor(options?: RuntimeOptions);
  
  // Session control
  start(): void;
  end(): void;
  
  // Checkpoints
  checkpoint(nodeId: string, variables?: Record<string, any>): void;
  
  // Breakpoints
  setBreakpoint(nodeId: string, enabled: boolean): void;
  removeBreakpoint(nodeId: string): void;
  clearBreakpoints(): void;
  
  // Execution control
  resume(): void;
}
```

**Constructor Options:**

```typescript
interface RuntimeOptions {
  manifestHash?: string;  // Hash of the manifest for session tracking
  debug?: boolean;        // Enable debug logging
}
```

**Example:**

```javascript
import { LogiGoRuntime } from 'logigo-core';

const runtime = new LogiGoRuntime({
  manifestHash: 'abc123',
  debug: true
});

// Start session
runtime.start();

// Set breakpoints
runtime.setBreakpoint('critical_point', true);
runtime.setBreakpoint('error_handler', true);

// Record checkpoints
runtime.checkpoint('init', { config });
runtime.checkpoint('processing', { data });

// Remove specific breakpoint
runtime.removeBreakpoint('error_handler');

// Clear all breakpoints
runtime.clearBreakpoints();

// Resume from breakpoint
runtime.resume();

// End session
runtime.end();
```

**Methods:**

#### `start()`
Begin a new execution session.

```javascript
runtime.start();
```

#### `end()`
End the current execution session.

```javascript
runtime.end();
```

#### `checkpoint(nodeId, variables)`
Record a checkpoint (same as standalone `checkpoint()` function).

```javascript
runtime.checkpoint('process:step', { index: i });
```

#### `setBreakpoint(nodeId, enabled)`
Enable or disable a breakpoint at a specific checkpoint.

```javascript
runtime.setBreakpoint('critical_point', true);   // Enable
runtime.setBreakpoint('critical_point', false);  // Disable
```

#### `removeBreakpoint(nodeId)`
Remove a breakpoint completely.

```javascript
runtime.removeBreakpoint('critical_point');
```

#### `clearBreakpoints()`
Remove all breakpoints.

```javascript
runtime.clearBreakpoints();
```

#### `resume()`
Resume execution from a breakpoint.

```javascript
runtime.resume();
```

---

## logigo-embed

React component for embedding flowchart visualization in your applications.

### Installation

```bash
npm install logigo-embed
```

### Required CSS

```javascript
import '@xyflow/react/dist/style.css';
```

### Compatibility

- **React**: 16+
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+

---

### LogiGoEmbed Component

Embeddable React component for flowchart visualization.

**Signature:**
```typescript
function LogiGoEmbed(props: LogiGoEmbedProps): JSX.Element
```

**Basic Example:**

```javascript
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  const code = `
    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
  `;
  
  return <LogiGoEmbed code={code} theme="dark" />;
}
```

**Advanced Example:**

```javascript
import { LogiGoEmbed } from 'logigo-embed';
import { useState } from 'react';

function AlgorithmVisualizer() {
  const [code, setCode] = useState('');
  
  const handleNodeClick = (nodeId) => {
    console.log('Clicked node:', nodeId);
  };
  
  return (
    <div>
      <textarea onChange={(e) => setCode(e.target.value)} />
      
      <LogiGoEmbed
        code={code}
        theme="dark"
        position="bottom-right"
        showVariables={true}
        showHistory={true}
        defaultOpen={true}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
```

---

### Props Reference

#### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | string | - | JavaScript code to visualize (Static Mode) |
| `manifestUrl` | string | - | URL to manifest file (Live Mode) |
| `manifestHash` | string | - | Hash of manifest for session tracking |

**Note:** Provide either `code` (Static Mode) OR `manifestUrl` (Live Mode), not both.

#### Appearance Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'dark'` \| `'light'` | `'dark'` | Color theme |
| `position` | string | `'bottom-right'` | Panel position (CSS position value) |
| `defaultOpen` | boolean | `false` | Open panel by default |

#### Feature Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showVariables` | boolean | `true` | Show variable inspector |
| `showHistory` | boolean | `false` | Show checkpoint history |
| `showCallStack` | boolean | `true` | Show call stack |

#### Event Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onNodeClick` | function | - | Callback when node is clicked |
| `onStepChange` | function | - | Callback when execution step changes |
| `onBreakpoint` | function | - | Callback when breakpoint is hit |

---

### Prop Details

#### `code`

JavaScript code to visualize in Static Mode.

```javascript
<LogiGoEmbed
  code={`
    function bubbleSort(arr) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
      return arr;
    }
  `}
/>
```

**Type:** `string`  
**Required:** Only if `manifestUrl` is not provided

---

#### `manifestUrl`

URL to the manifest file for Live Mode.

```javascript
<LogiGoEmbed manifestUrl="/logigo-manifest.json" />
```

**Type:** `string`  
**Required:** Only if `code` is not provided

**Manifest Format:**
```json
{
  "hash": "abc123",
  "nodes": [...],
  "edges": [...],
  "checkpoints": [...]
}
```

---

#### `theme`

Color theme for the flowchart.

```javascript
<LogiGoEmbed code={code} theme="dark" />
<LogiGoEmbed code={code} theme="light" />
```

**Type:** `'dark' | 'light'`  
**Default:** `'dark'`

---

#### `position`

CSS position for the floating panel.

```javascript
<LogiGoEmbed code={code} position="bottom-right" />
<LogiGoEmbed code={code} position="top-left" />
<LogiGoEmbed code={code} position="fixed" />
```

**Type:** `string`  
**Default:** `'bottom-right'`

**Common values:**
- `'bottom-right'`
- `'bottom-left'`
- `'top-right'`
- `'top-left'`
- `'fixed'` (custom positioning with CSS)

---

#### `showVariables`

Show the variable inspector in the Debug Panel.

```javascript
<LogiGoEmbed code={code} showVariables={true} />
```

**Type:** `boolean`  
**Default:** `true`

**When enabled:**
- Variables tab appears in Debug Panel
- Current variable values are displayed
- Variable types are shown

---

#### `showHistory`

Show the checkpoint history timeline.

```javascript
<LogiGoEmbed code={code} showHistory={true} />
```

**Type:** `boolean`  
**Default:** `false`

**When enabled:**
- History tab appears in Debug Panel
- Timeline of all checkpoints
- Variable changes over time

---

#### `onNodeClick`

Callback when a flowchart node is clicked.

```javascript
<LogiGoEmbed
  code={code}
  onNodeClick={(nodeId) => {
    console.log('Clicked node:', nodeId);
    // Jump to source code, highlight line, etc.
  }}
/>
```

**Type:** `(nodeId: string) => void`  
**Default:** `undefined`

**Parameters:**
- `nodeId`: Unique identifier of the clicked node

---

#### `onStepChange`

Callback when execution step changes.

```javascript
<LogiGoEmbed
  code={code}
  onStepChange={(step, totalSteps) => {
    console.log(`Step ${step} of ${totalSteps}`);
  }}
/>
```

**Type:** `(step: number, totalSteps: number) => void`  
**Default:** `undefined`

**Parameters:**
- `step`: Current step number (1-indexed)
- `totalSteps`: Total number of steps

---

#### `onBreakpoint`

Callback when a breakpoint is hit.

```javascript
<LogiGoEmbed
  code={code}
  onBreakpoint={(nodeId, variables) => {
    console.log('Breakpoint hit:', nodeId, variables);
  }}
/>
```

**Type:** `(nodeId: string, variables: Record<string, any>) => void`  
**Default:** `undefined`

**Parameters:**
- `nodeId`: Checkpoint ID where breakpoint was hit
- `variables`: Current variable values

---

## logigo-vite-plugin

Vite plugin for automatic build-time instrumentation.

### Installation

```bash
npm install logigo-vite-plugin --save-dev
```

### Compatibility

- **Vite**: 4+
- **Node.js**: 16+

---

### Plugin Configuration

Add to `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logigoPlugin from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logigoPlugin({
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/*.test.*'],
      manifestPath: 'logigo-manifest.json',
      autoInstrument: true,
      captureVariables: true
    })
  ]
});
```

---

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | string[] | `['**/*.js', '**/*.ts']` | Glob patterns for files to instrument |
| `exclude` | string[] | `['/node_modules/']` | Glob patterns for files to skip |
| `manifestPath` | string | `'logigo-manifest.json'` | Output path for manifest file |
| `autoInstrument` | boolean | `true` | Automatically inject checkpoints |
| `captureVariables` | boolean | `true` | Capture local variables at checkpoints |

---

### Option Details

#### `include`

Glob patterns for files to instrument.

```javascript
logigoPlugin({
  include: [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.jsx',
    'src/**/*.js'
  ]
})
```

**Type:** `string[]`  
**Default:** `['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx']`

**Common patterns:**
- `'src/**/*.ts'` - All TypeScript files in src/
- `'**/*.js'` - All JavaScript files
- `'src/components/**/*'` - All files in components/

---

#### `exclude`

Glob patterns for files to skip.

```javascript
logigoPlugin({
  exclude: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/dist/**'
  ]
})
```

**Type:** `string[]`  
**Default:** `['/node_modules/']`

**Common patterns:**
- `'**/node_modules/**'` - Exclude dependencies
- `'**/*.test.*'` - Exclude test files
- `'**/dist/**'` - Exclude build output

---

#### `manifestPath`

Output path for the generated manifest file.

```javascript
logigoPlugin({
  manifestPath: 'public/logigo-manifest.json'
})
```

**Type:** `string`  
**Default:** `'logigo-manifest.json'`

**Manifest structure:**
```json
{
  "hash": "abc123",
  "files": {
    "src/App.tsx": {
      "nodes": [...],
      "edges": [...],
      "checkpoints": [...]
    }
  }
}
```

---

#### `autoInstrument`

Automatically inject checkpoint calls at key points.

```javascript
logigoPlugin({
  autoInstrument: true
})
```

**Type:** `boolean`  
**Default:** `true`

**When enabled:**
- Checkpoints injected at function entries
- Checkpoints injected at control flow points (if, for, while)
- Checkpoints injected at return statements

**Example transformation:**

**Before:**
```javascript
function processOrder(order) {
  if (!order.valid) {
    return null;
  }
  return order;
}
```

**After:**
```javascript
function processOrder(order) {
  LogiGo.checkpoint('processOrder:entry', { order });
  
  if (!order.valid) {
    LogiGo.checkpoint('processOrder:invalid', { order });
    return null;
  }
  
  LogiGo.checkpoint('processOrder:return', { order });
  return order;
}
```

---

#### `captureVariables`

Capture local variables at each checkpoint.

```javascript
logigoPlugin({
  captureVariables: true
})
```

**Type:** `boolean`  
**Default:** `true`

**When enabled:**
- All local variables are captured
- Function parameters are captured
- Variable values are sent to LogiGo Studio

**When disabled:**
- Only checkpoint IDs are recorded
- No variable data is captured
- Smaller manifest file

---

## 🌉 Bridge & Model Integration

Documentation for connecting LogiGo to external AI models and IDE platforms (Cursor, VS Code).

### Model Context Protocol (MCP)

LogiGo serves as a standard MCP server, allowing any AI model (Claude 3.5, GPT-4o) to "see" and "analyze" your code structure through LogiGo's logic engine.

**Endpoint:** `http://localhost:5001/api/mcp/sse`

#### Available Tools:

| Tool | Parameters | Description |
|------|------------|-------------|
| `analyze_code` | `code: string` | Returns a full JSON map of nodes and edges. |
| `get_complexity` | `code: string` | Returns a complexity score (1-100) and refactoring advice. |
| `explain_flow` | `code: string` | Returns a natural language summary of the logic paths. |
| `find_branches` | `code: string` | Lists all conditional logic points and their current state. |

**Example (Cursor Setup):**
1. Open Cursor Settings -> Features -> MCP.
2. Add New MCP Server.
3. Type: `sse`, Name: `LogiGo`.
4. URL: `http://localhost:5001/api/mcp/sse`.

---

### Remote Mode API

Sync local IDE activity to the LogiGo Workbench in real-time.

#### `POST /api/remote/session`
Create a new telepresence session for an active file.

**Request:**
```json
{
  "name": "MyComponent.tsx",
  "code": "function start() { ... }"
}
```

**Response:**
```json
{
  "sessionId": "abc-123",
  "connectUrl": "http://localhost:5001/remote/abc-123"
}
```

#### `POST /api/remote/checkpoint`
Send a live execution event to a remote session.

```json
{
  "sessionId": "abc-123",
  "checkpoint": {
    "nodeId": "auth:success",
    "variables": { "userId": 42 }
  }
}
```

---

### Agent Bridge API

Programmatic analysis for custom Agent workflows.

#### `POST /api/agent/analyze`
High-speed structural analysis for context injection.

**Request:**
```json
{
  "code": "const x = 10;",
  "language": "javascript"
}
```

**Response:**
```json
{
  "summary": { "nodeCount": 1, "complexityScore": 0 },
  "flow": [...],
  "nodes": 1,
  "edges": 0
}
```

---

### Model Arena API

Comparative analysis and model benchmarking endpoints.

#### `POST /api/arena/generate`
Generate code across 4 specific model providers simultaneously.

**Request:**
```json
{
  "prompt": "Write a binary search."
}
```

**Response:**
```json
{
  "results": [
    { "provider": "OpenAI", "code": "...", "latencyMs": 450 },
    { "provider": "Claude", "code": "...", "latencyMs": 620 }
  ],
  "comparison": { "similarityMatrix": [...] }
}
```

#### `POST /api/arena/verdict`
Determine which model's output is superior using an LLM Chairman.

**Request:**
```json
{
  "mode": "code",
  "chairman": "openai",
  "originalPrompt": "Write a binary search.",
  "results": [...]
}
```

---

## User Labels

Add human-readable labels to flowchart nodes with `// @logigo:` comments.

### Syntax

```javascript
// @logigo: Your label here
<code statement>
```

### Examples

**Basic Labels:**

```javascript
// @logigo: Initialize counter
let count = 0;

// @logigo: Check if array is empty
if (items.length === 0) {
  // @logigo: Return zero for empty array
  return 0;
}

// @logigo: Sum all items
for (const item of items) {
  count += item.value;
}

// @logigo: Return final sum
return count;
```

**Labels in Complex Logic:**

```javascript
function processOrder(order) {
  // @logigo: Validate order data
  if (!validateOrder(order)) {
    // @logigo: Log validation failure
    console.error('Invalid order');
    
    // @logigo: Return error response
    return { success: false, error: 'Invalid order' };
  }
  
  // @logigo: Calculate order total
  const total = calculateTotal(order.items);
  
  // @logigo: Apply discount if eligible
  if (total > 100) {
    // @logigo: Reduce total by 10%
    total *= 0.9;
  }
  
  // @logigo: Process payment
  const payment = processPayment(total);
  
  // @logigo: Return success response
  return { success: true, payment };
}
```

### Visual Indicator

Labeled nodes show a **blue dot** indicator in the flowchart.

**Hover behavior:**
- Hover over a labeled node
- Tooltip shows the original code
- Label remains visible in the node

### Best Practices

```javascript
// ✅ Good: Descriptive, explains intent
// @logigo: Validate email format
if (!isValidEmail(email)) { ... }

// ❌ Bad: Just repeats the code
// @logigo: If not valid email
if (!isValidEmail(email)) { ... }

// ✅ Good: Explains business logic
// @logigo: Apply 10% discount for orders over $100
if (total > 100) { total *= 0.9; }

// ❌ Bad: Too vague
// @logigo: Discount
if (total > 100) { total *= 0.9; }
```

---

## Checkpoint ID Conventions

Use hierarchical naming for organized debugging.

### Format

```
section:action:detail
```

### Examples

**Authentication:**
```javascript
checkpoint('auth:login:start');
checkpoint('auth:login:validate');
checkpoint('auth:login:success');
checkpoint('auth:login:failure');
checkpoint('auth:logout');
```

**API Requests:**
```javascript
checkpoint('api:request:users');
checkpoint('api:response:success');
checkpoint('api:response:error');
checkpoint('api:retry:attempt', { attemptNumber });
```

**Data Processing:**
```javascript
checkpoint('process:start', { dataSize });
checkpoint('process:validate');
checkpoint('process:transform');
checkpoint('process:complete', { result });
```

**Loops:**
```javascript
checkpoint('loop:start', { totalItems });
checkpoint('loop:iteration', { index, item });
checkpoint('loop:complete', { processedCount });
```

**Error Handling:**
```javascript
checkpoint('error:caught', { error });
checkpoint('error:logged');
checkpoint('error:recovered');
```

### Best Practices

```javascript
// ✅ Good: Hierarchical, descriptive
checkpoint('order:payment:start', { amount });
checkpoint('order:payment:success', { transactionId });

// ❌ Bad: Flat, generic
checkpoint('payment1', { amount });
checkpoint('payment2', { transactionId });

// ✅ Good: Includes context
checkpoint('batch:item:process', { 
  index: i, 
  itemId: item.id,
  progress: `${i + 1}/${total}`
});

// ❌ Bad: Missing context
checkpoint('process', { i });
```

---

## Type Definitions

### TypeScript Types

```typescript
// logigo-core
declare module 'logigo-core' {
  export function checkpoint(
    nodeId: string,
    variables?: Record<string, any>
  ): void;
  
  export function checkpointAsync(
    nodeId: string,
    variables?: Record<string, any>
  ): Promise<void>;
  
  export class LogiGoRuntime {
    constructor(options?: RuntimeOptions);
    start(): void;
    end(): void;
    checkpoint(nodeId: string, variables?: Record<string, any>): void;
    setBreakpoint(nodeId: string, enabled: boolean): void;
    removeBreakpoint(nodeId: string): void;
    clearBreakpoints(): void;
    resume(): void;
  }
  
  export interface RuntimeOptions {
    manifestHash?: string;
    debug?: boolean;
  }
}

// logigo-embed
declare module 'logigo-embed' {
  export interface LogiGoEmbedProps {
    code?: string;
    manifestUrl?: string;
    manifestHash?: string;
    theme?: 'dark' | 'light';
    position?: string;
    showVariables?: boolean;
    showHistory?: boolean;
    showCallStack?: boolean;
    defaultOpen?: boolean;
    onNodeClick?: (nodeId: string) => void;
    onStepChange?: (step: number, totalSteps: number) => void;
    onBreakpoint?: (nodeId: string, variables: Record<string, any>) => void;
  }
  
  export function LogiGoEmbed(props: LogiGoEmbedProps): JSX.Element;
}

// logigo-vite-plugin
declare module 'logigo-vite-plugin' {
  export interface LogiGoPluginOptions {
    include?: string[];
    exclude?: string[];
    manifestPath?: string;
    autoInstrument?: boolean;
    captureVariables?: boolean;
  }
  
  export default function logigoPlugin(
    options?: LogiGoPluginOptions
  ): Plugin;
}
```

---

## 📚 Additional Resources

- **[Getting Started Guide](GETTING_STARTED.md)** - Tutorials and examples
- **[Installation Guide](INSTALLATION_GUIDE.md)** - Platform-specific setup
- **[GitHub Repository](https://github.com/JPaulGrayson/LogiGo)** - Source code

---

**Made with ❤️ for Vibe Coders who learn by seeing**
