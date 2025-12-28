# LogiGo Studio - Code-to-Flowchart Visualization

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
| [logigo-core](./packages/logigo-core) | Runtime library for checkpoint-based debugging | `npm install logigo-core` |
| [logigo-embed](./packages/logigo-embed) | React component for flowchart visualization | `npm install logigo-embed` |
| [logigo-vite-plugin](./packages/logigo-vite-plugin) | Vite plugin for build-time instrumentation | `npm install logigo-vite-plugin --save-dev` |

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
| `B` | Step Backward (Premium) |
| `R` | Reset |
| `F` | Fullscreen |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Documentation

- [Getting Started](./docs/GETTING_STARTED.md) - Quick start guide
- [Installation Guide](./docs/INSTALLATION_GUIDE.md) - Multi-platform setup (VS Code, Cursor, Replit, etc.)
- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Remote mode and cross-app debugging

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

## License

MIT License

---

**Made for Vibe Coders who learn by seeing**
