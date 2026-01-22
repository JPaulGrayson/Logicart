# LogicArt Integration Guide

How to integrate LogicArt visualization into your projects.

---

## Integration Methods

| Method | Use Case | Installation |
|--------|----------|--------------|
| **Static Mode** | Quick visualization | None (paste into Studio) |
| **Embed Component** | React apps | `npm install logicart-embed` |
| **Vite Plugin** | Build-time instrumentation | `npm install logicart-vite-plugin` |
| **Remote Mode** | Cross-app debugging | Script tag injection |
| **Manual Checkpoints** | Fine-grained control | `npm install logicart-core` |

---

## 1. Embed Component (Recommended for React)

Add flowchart visualization directly into your React app.

### Installation

```bash
npm install logicart-embed
```

### Static Mode (Parse at Runtime)

```jsx
import { LogicArtEmbed } from 'logicart-embed';
import '@xyflow/react/dist/style.css';

function CodeViewer({ code }) {
  return (
    <LogicArtEmbed
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
import { LogicArtEmbed } from 'logicart-embed';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <LogicArtEmbed
      manifestUrl="/logicart-manifest.json"
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
npm install logicart-vite-plugin --save-dev
```

### Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logicartPlugin from 'logicart-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/*.test.*'],
      manifestPath: 'logicart-manifest.json',
      autoInstrument: true,
      captureVariables: true
    })
  ]
});
```

### What It Does

1. **Parses** your source files using Acorn
2. **Injects** `LogicArt.checkpoint()` calls at key points
3. **Generates** `logicart-manifest.json` with flowchart data
4. **Injects** runtime script into your HTML

### Output Files

```
dist/
├── logicart-manifest.json   # Flowchart nodes, edges, checkpoint metadata
└── logicart-runtime.js      # Browser runtime for checkpoint handling
```

---

## 3. Remote Mode (Cross-App Debugging)

Connect external apps to LogicArt Studio for real-time visualization.

### Add Script Tag

```html
<script src="https://your-logicart-studio.replit.app/remote.js?project=MyApp&autoOpen=false"></script>
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
    .then(code => window.LogicArt.registerCode(code));
</script>
```

### Open Studio

```javascript
window.LogicArt.openStudio();
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
npm install logicart-core
```

### Synchronous Checkpoints

```javascript
import { checkpoint } from 'logicart-core';

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
import { checkpointAsync, LogicArtRuntime } from 'logicart-core';

const runtime = new LogicArtRuntime({ manifestHash: 'abc123' });
runtime.setBreakpoint('critical_point', true);

async function processData(data) {
  await checkpointAsync('critical_point', { data });
  // Execution pauses here until runtime.resume() is called
  
  await checkpointAsync('process_complete', { result: data.processed });
}
```

### Runtime API

```javascript
const runtime = new LogicArtRuntime();

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

For server-side code where `logicart-core` cannot be used (no browser), add this logging helper directly to your code:

```typescript
// Add this helper at the top of your server file
const LogicArt = {
  checkpoint(nodeId: string, options: { variables?: Record<string, any> } = {}) {
    const vars = options.variables || {};
    console.log(`[LogicArt] ${nodeId}`, JSON.stringify(vars, null, 2));
  }
};

// Usage in your routes
app.post('/api/order', async (req, res) => {
  LogicArt.checkpoint('api:order:start', { variables: { body: req.body } });
  
  const order = await processOrder(req.body);
  
  LogicArt.checkpoint('api:order:complete', { variables: { orderId: order.id } });
  res.json(order);
});
```

This logs checkpoints to the console. To see the flowchart, paste your server code into LogicArt Studio.

**Note:** This is a standalone helper, not an import from `logicart-core`. The core package is designed for browser environments with `postMessage` support.

---

## API Reference

### checkpoint(id, variables)

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique checkpoint identifier |
| `variables` | object | Variables to capture at this point |

### LogicArtEmbed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | string | - | JavaScript code (Static Mode) |
| `manifestUrl` | string | - | Manifest URL (Live Mode) |
| `theme` | 'dark' \| 'light' | 'dark' | Color theme |
| `position` | string | 'bottom-right' | Panel position |
| `showVariables` | boolean | true | Show variable inspector |
| `showHistory` | boolean | false | Show checkpoint history |

### logicartPlugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | string[] | ['**/*.js', ...] | Files to instrument |
| `exclude` | string[] | ['**/node_modules/**'] | Files to skip |
| `manifestPath` | string | 'logicart-manifest.json' | Output path |
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
// @logicart: Initialize counter
let count = 0;

// @logicart: Check if empty
if (items.length === 0) {
  // @logicart: Return early
  return null;
}
```

Labeled nodes show a blue indicator. Hover to see original code.

---

## Architecture

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   Your App      │ ─────────────────> │   LogicArt        │
│                 │   /api/remote/     │   Server        │
│  checkpoint()   │   checkpoint       │                 │
│  registerCode() │                    │  Stores data    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ SSE Stream
                                                ▼
                                       ┌─────────────────┐
                                       │   LogicArt        │
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

1. Verify LogicArt runtime is loaded
2. Check browser console for errors
3. Ensure checkpoint code is actually executing

### Variables not showing

1. Check `captureVariables: true` in plugin config
2. Verify manifest is being generated
3. Check LogicArtEmbed has `showVariables={true}`

### TypeScript errors

Use typed checkpoint helper:

```typescript
import { checkpoint } from 'logicart-core';
// Types are included in the package
```

---

## Next Steps

- [Getting Started Guide](./docs/GETTING_STARTED.md)
- [Installation Guide](./docs/INSTALLATION_GUIDE.md)
- [Package Documentation](./packages/)
