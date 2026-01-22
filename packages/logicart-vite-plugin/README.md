# logicart-vite-plugin

Vite plugin for LogicArt build-time code instrumentation and flowchart generation.

## Installation

```bash
npm install logicart-vite-plugin --save-dev
```

## Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logicartPlugin from 'logicart-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({
      manifestPath: 'logicart-manifest.json',
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
| `manifestPath` | `string` | `'logicart-manifest.json'` | Output path for manifest |
| `autoInstrument` | `boolean` | `true` | Automatically inject checkpoints |
| `captureVariables` | `boolean` | `true` | Capture local variables |

## How It Works

1. **Build-time Instrumentation**: The plugin parses your JavaScript/TypeScript code using Acorn and injects `LogicArt.checkpoint()` calls at strategic points.

2. **Manifest Generation**: Generates a JSON manifest containing:
   - Flowchart nodes and edges
   - Checkpoint metadata (file, line, column)
   - Variable capture configuration

3. **Runtime Injection**: Injects the LogicArt runtime into your HTML, enabling real-time visualization.

## Output

The plugin generates:
- `logicart-manifest.json` - Flowchart data and checkpoint metadata
- `logicart-runtime.js` - Browser runtime for checkpoint handling

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
