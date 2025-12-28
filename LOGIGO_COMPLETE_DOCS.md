# LogiGo Complete Documentation

> Combined documentation for LogiGo Studio - Code-to-Flowchart Visualization

---

# Part 1: Overview

Transform JavaScript code into interactive, step-by-step flowcharts. Built for visual learners and "Vibe Coders" who want to understand code execution at a glance.

## What is LogiGo?

LogiGo Studio is a bidirectional code-to-flowchart visualization tool that:

- **Parses JavaScript** into flowchart nodes using AST analysis
- **Visualizes execution** with step-by-step highlighting
- **Tracks variables** showing values at each step
- **Supports breakpoints** for debugging complex logic

## Quick Start

### Option 1: Use LogiGo Studio (No Installation)

1. Open LogiGo Studio at your deployed URL
2. Paste any JavaScript function into the code editor
3. The flowchart appears automatically
4. Use keyboard shortcuts to step through:
   - `Space` or `K` - Play/Pause
   - `S` - Step Forward
   - `R` - Reset

### Option 2: Embed in Your React App

```bash
npm install logigo-embed
```

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  const code = `
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
  `;

  return <LogiGoEmbed code={code} theme="dark" />;
}
```

### Option 3: Build-Time Instrumentation (Live Mode)

For real-time variable tracking during execution:

```bash
npm install logigo-vite-plugin --save-dev
npm install logigo-embed
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logigoPlugin from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logigoPlugin({
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      manifestPath: 'logigo-manifest.json'
    })
  ]
});
```

Then add the embed component to your app:

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <LogiGoEmbed
      manifestUrl="/logigo-manifest.json"
      showVariables={true}
      theme="dark"
    />
  );
}
```

## NPM Packages

| Package | Description | Install |
|---------|-------------|---------|
| logigo-core | Runtime library for checkpoint-based debugging | `npm install logigo-core` |
| logigo-embed | React component for flowchart visualization | `npm install logigo-embed` |
| logigo-vite-plugin | Vite plugin for build-time instrumentation | `npm install logigo-vite-plugin --save-dev` |

## Features

### Static Mode
- Paste code, see flowchart instantly
- No installation required
- Works with any JavaScript function

### Live Mode (with Vite Plugin)
- Real-time variable tracking
- Checkpoint-based execution visualization
- HMR-aware session sync
- Queue overflow protection (5000 limit)
- Deferred serialization for performance

### Debug Panel
- Current step indicator
- Variable inspector with live values
- Call stack visualization
- Checkpoint history navigation

### Model Arena
- Compare code generation from 4 AI models (GPT-4o, Gemini, Claude, Grok)
- Debug advice from multiple perspectives
- Chairman verdict synthesis

### Sharing
- Generate shareable URLs
- Database-backed with view counts
- Include title and description

## API Reference

### logigo-core

```javascript
import { checkpoint, checkpointAsync, LogiGoRuntime } from 'logigo-core';

// Synchronous checkpoint
checkpoint('step_1', { myVar: value });

// Async checkpoint (supports breakpoints)
await checkpointAsync('step_2', { data });

// Full runtime control
const runtime = new LogiGoRuntime({ manifestHash: 'abc123' });
runtime.setBreakpoint('critical_point', true);
runtime.resume();
```

### logigo-embed

```jsx
<LogiGoEmbed
  code={jsCode}              // Static mode
  manifestUrl="/manifest.json" // OR Live mode
  theme="dark"
  showVariables={true}
  showHistory={false}
  position="bottom-right"
  onNodeClick={(id) => console.log(id)}
/>
```

### logigo-vite-plugin

```javascript
logigoPlugin({
  include: ['src/**/*.tsx'],
  exclude: ['**/*.test.*'],
  manifestPath: 'logigo-manifest.json',
  autoInstrument: true,
  captureVariables: true
})
```

## User Labels

Add human-readable labels to flowchart nodes with `// @logigo:` comments:

```javascript
// @logigo: Initialize counter
let count = 0;

// @logigo: Check if empty
if (items.length === 0) {
  // @logigo: Return early
  return null;
}

// @logigo: Process each item
for (const item of items) {
  count++;
}
```

Labeled nodes show a blue indicator dot. Hover to see original code.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `S` | Step Forward |
| `B` | Step Backward |
| `R` | Reset |
| `F` | Fullscreen |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Development

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run db:push    # Push schema changes

# Build packages
cd packages/logigo-core && npm run build
cd packages/logigo-embed && npm run build
cd packages/logigo-vite-plugin && npm run build
```

## Architecture

```
LogiGo Studio
├── client/                 # React frontend
│   ├── src/pages/         # Workbench, Model Arena
│   ├── src/components/    # IDE, Flowchart, Debug Panel
│   └── src/lib/           # Parser, History Manager
├── server/                 # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database interface
│   └── mcp.ts             # MCP server for AI agents
├── packages/
│   ├── logigo-core/       # Runtime library
│   ├── logigo-embed/      # React component
│   └── logigo-vite-plugin/# Vite build plugin
└── shared/
    └── schema.ts          # Drizzle ORM schema
```

---

# Part 2: Manual Setup Instructions

Step-by-step guide for adding LogiGo visualization to your JavaScript projects.

---

## Option 1: Static Mode (No Installation)

Use LogiGo Studio directly without installing anything:

1. Open LogiGo Studio
2. Paste your JavaScript function into the code editor
3. The flowchart renders automatically
4. Use controls to step through execution

**Best for:** Quick visualization, code reviews, learning algorithms

---

## Option 2: Embed Component (React Apps)

Add the LogiGo flowchart component to your React application.

### Step 1: Install the Package

```bash
npm install logigo-embed
```

### Step 2: Add Required CSS

```jsx
import '@xyflow/react/dist/style.css';
```

### Step 3: Use the Component

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function CodeViewer() {
  const code = `
    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
  `;

  return (
    <LogiGoEmbed
      code={code}
      theme="dark"
      position="bottom-right"
      defaultOpen={true}
    />
  );
}
```

### Verification Checklist

- [ ] `logigo-embed` appears in package.json
- [ ] CSS import is present
- [ ] Component renders without errors
- [ ] Flowchart displays nodes for your code

---

## Option 3: Live Mode (Vite Projects)

For real-time variable tracking during code execution.

### Step 1: Install Packages

```bash
npm install logigo-vite-plugin --save-dev
npm install logigo-embed
```

### Step 2: Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logigoPlugin from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logigoPlugin({
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/*.test.*'],
      manifestPath: 'logigo-manifest.json'
    })
  ]
});
```

### Step 3: Add Embed Component

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <LogiGoEmbed
      manifestUrl="/logigo-manifest.json"
      showVariables={true}
      showHistory={true}
      theme="dark"
    />
  );
}
```

### Step 4: Build and Run

```bash
npm run dev
```

The plugin will:
1. Parse your source files
2. Inject checkpoint calls automatically
3. Generate `logigo-manifest.json`
4. Inject the runtime into your HTML

### Verification Checklist

- [ ] `logigo-vite-plugin` in devDependencies
- [ ] `logigo-embed` in dependencies
- [ ] vite.config.js includes logigoPlugin()
- [ ] Build completes without errors
- [ ] `logigo-manifest.json` is generated
- [ ] Flowchart shows with variable tracking

---

## Option 4: Manual Checkpoints (Any JavaScript)

Add checkpoint calls directly to your code for fine-grained control.

### Step 1: Install Core Library

```bash
npm install logigo-core
```

### Step 2: Add Checkpoints

```javascript
import { checkpoint } from 'logigo-core';

function processOrder(order) {
  checkpoint('order_start', { orderId: order.id });
  
  if (!order.valid) {
    checkpoint('order_invalid', { reason: 'Validation failed' });
    return null;
  }
  
  checkpoint('order_processing', { items: order.items.length });
  
  const result = calculateTotal(order);
  
  checkpoint('order_complete', { total: result.total });
  return result;
}
```

### Step 3: Connect to LogiGo Studio

Checkpoints send data via `postMessage`. Open LogiGo Studio in the same browser window to see the execution flow.

---

## Troubleshooting

### "Module not found: logigo-embed"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Flowchart shows "Syntax Error"

- LogiGo uses Acorn parser (ECMAScript 2020)
- TypeScript-specific syntax may cause errors
- Ensure code is valid JavaScript

### No variable tracking in Live Mode

- Verify the Vite plugin is configured correctly
- Check that `captureVariables: true` (default)
- Ensure the manifest file is being generated

### CSS not loading

```jsx
// Make sure this import is present
import '@xyflow/react/dist/style.css';
```

---

## File Structure

After setup, your project should look like:

```
my-project/
├── package.json
├── vite.config.js          # With logigoPlugin()
├── src/
│   ├── App.tsx             # With LogiGoEmbed
│   └── ...
└── dist/
    └── logigo-manifest.json  # Generated by plugin
```

The plugin also injects a runtime script tag into your HTML during the build process.

---

# Part 3: Integration Guide

How to integrate LogiGo visualization into your projects.

---

## Integration Methods

| Method | Use Case | Installation |
|--------|----------|--------------|
| **Static Mode** | Quick visualization | None (paste into Studio) |
| **Embed Component** | React apps | `npm install logigo-embed` |
| **Vite Plugin** | Build-time instrumentation | `npm install logigo-vite-plugin` |
| **Remote Mode** | Cross-app debugging | Script tag injection |
| **Manual Checkpoints** | Fine-grained control | `npm install logigo-core` |

---

## 1. Embed Component (Recommended for React)

Add flowchart visualization directly into your React app.

### Installation

```bash
npm install logigo-embed
```

### Static Mode (Parse at Runtime)

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function CodeViewer({ code }) {
  return (
    <LogiGoEmbed
      code={code}
      theme="dark"
      position="bottom-right"
      defaultOpen={true}
      showVariables={true}
    />
  );
}
```

### Live Mode (With Manifest)

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <LogiGoEmbed
      manifestUrl="/logigo-manifest.json"
      manifestHash="abc123"
      showVariables={true}
      showHistory={true}
      theme="dark"
    />
  );
}
```

---

## 2. Vite Plugin (Build-Time Instrumentation)

Automatically instrument your code at build time.

### Installation

```bash
npm install logigo-vite-plugin --save-dev
```

### Configuration

```javascript
// vite.config.js
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

### What It Does

1. **Parses** your source files using Acorn
2. **Injects** `LogiGo.checkpoint()` calls at key points
3. **Generates** `logigo-manifest.json` with flowchart data
4. **Injects** runtime script into your HTML

### Output Files

```
dist/
├── logigo-manifest.json   # Flowchart nodes, edges, checkpoint metadata
└── logigo-runtime.js      # Browser runtime for checkpoint handling
```

---

## 3. Remote Mode (Cross-App Debugging)

Connect external apps to LogiGo Studio for real-time visualization.

### Add Script Tag

```html
<script src="https://your-logigo-studio.replit.app/remote.js?project=MyApp&autoOpen=false"></script>
```

The `remote.js` script automatically provides a global `checkpoint` function. No import needed.

### Add Checkpoints

```javascript
// checkpoint() is available globally after remote.js loads
function processOrder(order) {
  checkpoint('order_start', { orderId: order.id });
  
  if (!order.valid) {
    checkpoint('order_invalid', { reason: 'Validation failed' });
    return null;
  }
  
  checkpoint('order_complete', { total: order.total });
  return order;
}
```

### Register Source Code (Optional)

For flowchart generation, register your source:

```html
<script>
  fetch('/app.js')
    .then(r => r.text())
    .then(code => window.LogiGo.registerCode(code));
</script>
```

### Open Studio

```javascript
window.LogiGo.openStudio();
```

### Query Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `project` | "Remote App" | Name shown in Studio |
| `autoOpen` | true | Auto-open Studio on first checkpoint |

---

## 4. Manual Checkpoints (Fine-Grained Control)

Use the core library for precise checkpoint placement.

### Installation

```bash
npm install logigo-core
```

### Synchronous Checkpoints

```javascript
import { checkpoint } from 'logigo-core';

function bubbleSort(arr) {
  checkpoint('sort_start', { arr: [...arr] });
  
  for (let i = 0; i < arr.length; i++) {
    checkpoint('outer_loop', { i });
    
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        checkpoint('swap', { i, j, arr: [...arr] });
      }
    }
  }
  
  checkpoint('sort_end', { arr });
  return arr;
}
```

### Async Checkpoints (With Breakpoints)

```javascript
import { checkpointAsync, LogiGoRuntime } from 'logigo-core';

const runtime = new LogiGoRuntime({ manifestHash: 'abc123' });
runtime.setBreakpoint('critical_point', true);

async function processData(data) {
  await checkpointAsync('critical_point', { data });
  // Execution pauses here until runtime.resume() is called
  
  await checkpointAsync('process_complete', { result: data.processed });
}
```

### Runtime API

```javascript
const runtime = new LogiGoRuntime();

runtime.start();                           // Begin session
runtime.checkpoint('id', { vars });        // Record checkpoint
runtime.setBreakpoint('id', true);         // Enable breakpoint
runtime.removeBreakpoint('id');            // Remove breakpoint
runtime.clearBreakpoints();                // Clear all
runtime.resume();                          // Continue from breakpoint
runtime.end();                             // End session
```

---

## 5. Backend Logging (Node.js)

For server-side code where `logigo-core` cannot be used (no browser), add this logging helper directly to your code:

```typescript
// Add this helper at the top of your server file
const LogiGo = {
  checkpoint(nodeId: string, options: { variables?: Record<string, any> } = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
  }
};

// Usage in your routes
app.post('/api/order', async (req, res) => {
  LogiGo.checkpoint('api:order:start', { variables: { body: req.body } });
  
  const order = await processOrder(req.body);
  
  LogiGo.checkpoint('api:order:complete', { variables: { orderId: order.id } });
  res.json(order);
});
```

This logs checkpoints to the console. To see the flowchart, paste your server code into LogiGo Studio.

**Note:** This is a standalone helper, not an import from `logigo-core`. The core package is designed for browser environments with `postMessage` support.

---

## API Reference

### checkpoint(id, variables)

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique checkpoint identifier |
| `variables` | object | Variables to capture at this point |

### LogiGoEmbed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | string | - | JavaScript code (Static Mode) |
| `manifestUrl` | string | - | Manifest URL (Live Mode) |
| `theme` | 'dark' \| 'light' | 'dark' | Color theme |
| `position` | string | 'bottom-right' | Panel position |
| `showVariables` | boolean | true | Show variable inspector |
| `showHistory` | boolean | false | Show checkpoint history |

### logigoPlugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | string[] | ['**/*.js', ...] | Files to instrument |
| `exclude` | string[] | ['**/node_modules/**'] | Files to skip |
| `manifestPath` | string | 'logigo-manifest.json' | Output path |
| `autoInstrument` | boolean | true | Auto-inject checkpoints |
| `captureVariables` | boolean | true | Capture local variables |

---

## Checkpoint ID Conventions

Use hierarchical names for organized debugging:

```javascript
// Format: section:action:detail
checkpoint('auth:login:start');
checkpoint('auth:login:validate');
checkpoint('auth:login:success');

checkpoint('api:users:fetch');
checkpoint('api:users:response');

checkpoint('loop:iteration', { i: currentIndex });
```

---

## User Labels

Add readable labels to flowchart nodes:

```javascript
// @logigo: Initialize counter
let count = 0;

// @logigo: Check if empty
if (items.length === 0) {
  // @logigo: Return early
  return null;
}
```

Labeled nodes show a blue indicator. Hover to see original code.

---

## Architecture

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   Your App      │ ─────────────────> │   LogiGo        │
│                 │   /api/remote/     │   Server        │
│  checkpoint()   │   checkpoint       │                 │
│  registerCode() │                    │  Stores data    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ SSE Stream
                                                ▼
                                       ┌─────────────────┐
                                       │   LogiGo        │
                                       │   Studio        │
                                       │                 │
                                       │  Displays:      │
                                       │  - Flowchart    │
                                       │  - Variables    │
                                       │  - Checkpoints  │
                                       └─────────────────┘
```

---

## Troubleshooting

### Checkpoints not appearing

1. Verify LogiGo runtime is loaded
2. Check browser console for errors
3. Ensure checkpoint code is actually executing

### Variables not showing

1. Check `captureVariables: true` in plugin config
2. Verify manifest is being generated
3. Check LogiGoEmbed has `showVariables={true}`

### TypeScript errors

Use typed checkpoint helper:

```typescript
import { checkpoint } from 'logigo-core';
// Types are included in the package
```

---

## Next Steps

- Add `// @logigo:` comments for custom node labels
- Use the Debug Panel to set breakpoints
- Try the Model Arena for AI-assisted code generation
- Share flowcharts with the Share button

---

**Made for Vibe Coders who learn by seeing**
