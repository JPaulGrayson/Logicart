# logigo-vite-plugin

Vite plugin for LogiGo build-time code instrumentation and flowchart generation.

## Installation

```bash
npm install logigo-vite-plugin --save-dev
```

## Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logigoPlugin from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logigoPlugin({
      manifestPath: 'logigo-manifest.json',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/*.test.*']
    })
  ]
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | `string[]` | `['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']` | Glob patterns to instrument |
| `exclude` | `string[]` | `['**/node_modules/**', '**/*.test.*', '**/*.spec.*']` | Glob patterns to exclude |
| `manifestPath` | `string` | `'logigo-manifest.json'` | Output path for manifest |
| `autoInstrument` | `boolean` | `true` | Automatically inject checkpoints |
| `captureVariables` | `boolean` | `true` | Capture local variables |

## How It Works

1. **Build-time Instrumentation**: The plugin parses your JavaScript/TypeScript code using Acorn and injects `LogiGo.checkpoint()` calls at strategic points.

2. **Manifest Generation**: Generates a JSON manifest containing:
   - Flowchart nodes and edges
   - Checkpoint metadata (file, line, column)
   - Variable capture configuration

3. **Runtime Injection**: Injects the LogiGo runtime into your HTML, enabling real-time visualization.

## Output

The plugin generates:
- `logigo-manifest.json` - Flowchart data and checkpoint metadata
- `logigo-runtime.js` - Browser runtime for checkpoint handling

## Features

- Structural node IDs (stable across edits)
- Arrow function implicit return handling
- Queue overflow protection (5000 limit)
- Deferred serialization for performance
- HMR-aware session sync

## Peer Dependencies

- `vite >= 4.0.0`

## License

MIT
