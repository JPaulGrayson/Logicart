# LogicArt Live Mode Integration Guide

This guide explains how to integrate LogicArt Live Mode into any Vite-based Replit project.

## Overview

Live Mode provides real-time flowchart visualization during code execution. Unlike Static Mode (which only shows the code structure), Live Mode highlights nodes as they execute and displays variable values at each checkpoint.

## Integration Methods

### Method 1: Using the Vite Plugin (Recommended)

The `logicart-vite-plugin` automatically instruments your code at build time.

#### Step 1: Install the Plugin

In your Replit project, add the plugin files:

```bash
# Copy the plugin from LogicArt Studio
cp -r /path/to/logicart-studio/packages/logicart-vite-plugin ./logicart-vite-plugin
```

Or install from npm (when published):
```bash
npm install logicart-vite-plugin
```

#### Step 2: Configure Vite

Add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logicartPlugin from './logicart-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({
      include: ['src/**/*.js', 'src/**/*.ts'],
      exclude: ['node_modules/**'],
      outputDir: 'public'
    })
  ]
});
```

#### Step 3: Build Your Project

```bash
npm run build
```

This generates:
- `public/logicart-manifest.json` - Contains flowchart nodes, edges, and checkpoint metadata
- `public/logicart-runtime.js` - The runtime script that sends checkpoint data

#### Step 4: Add the Runtime Script

Add this to your HTML `<head>`:

```html
<script src="/logicart-runtime.js"></script>
```

#### Step 5: Embed LogicArtEmbed

In your React app:

```jsx
import { LogicArtEmbed } from 'logicart-embed';

function App() {
  return (
    <div>
      <LogicArtEmbed 
        manifestUrl="/logicart-manifest.json"
        position="bottom-right"
        width={600}
        height={400}
      />
      {/* Your app content */}
    </div>
  );
}
```

### Method 2: Using Remote Mode (Cross-Replit)

For projects where you can't modify the build system, use Remote Mode to send checkpoints to LogicArt Studio.

#### Step 1: Create a Session

Visit LogicArt Studio at your Replit URL and go to `/remote`. Click "Create Session" to get:
- A `sessionId` 
- A code snippet to add to your project

#### Step 2: Add the Integration Code

Add this to your project's entry point:

```javascript
const LOGICART_URL = 'https://your-logicart-studio.replit.app';
const SESSION_ID = 'your-session-id';

window.LogicArt = {
  checkpoint: async (nodeId, variables = {}) => {
    await fetch(`${LOGICART_URL}/api/remote/checkpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        nodeId,
        variables,
        timestamp: Date.now()
      })
    });
  }
};
```

#### Step 3: Add Checkpoints to Your Code

Manually add checkpoint calls:

```javascript
function bubbleSort(arr) {
  LogicArt.checkpoint('start', { arr });
  
  for (let i = 0; i < arr.length; i++) {
    LogicArt.checkpoint('outer-loop', { i, arr });
    
    for (let j = 0; j < arr.length - i - 1; j++) {
      LogicArt.checkpoint('inner-loop', { i, j, arr });
      
      if (arr[j] > arr[j + 1]) {
        LogicArt.checkpoint('swap', { a: arr[j], b: arr[j+1] });
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  
  LogicArt.checkpoint('end', { arr });
  return arr;
}
```

## Testing Your Integration

### Quick Verification

1. Open your app in the browser
2. Trigger the instrumented code (e.g., run an algorithm)
3. Watch the LogicArtEmbed component - nodes should highlight as code executes
4. Check the browser console for any errors

### What to Look For

- **Green pulsing glow** on the currently executing node
- **Variable panel** showing captured values
- **Smooth transitions** between nodes
- **Session indicator** showing "Live Mode" status

## Troubleshooting

### Checkpoints Not Firing

1. Check browser console for errors
2. Verify `logicart-runtime.js` is loaded
3. Ensure manifest hash matches the build

### Manifest Not Found

1. Run `npm run build` to generate the manifest
2. Check `public/logicart-manifest.json` exists
3. Verify the manifest URL in LogicArtEmbed props

### Variables Not Captured

1. The plugin only captures variables in scope at each checkpoint
2. Maximum 10 variables per checkpoint
3. Complex objects are serialized (may show `[Object]` for deep nesting)

## Example Projects

### Simple Counter

```javascript
// counter.js - will be auto-instrumented
function countTo(n) {
  let count = 0;
  for (let i = 1; i <= n; i++) {
    count += i;
  }
  return count;
}

countTo(10);
```

### Sorting Algorithm

```javascript
// quicksort.js
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivot = partition(arr, low, high);
    quickSort(arr, low, pivot - 1);
    quickSort(arr, pivot + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
```

## API Reference

### LogicArtEmbed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | string | - | JavaScript code for Static Mode |
| `manifestUrl` | string | - | URL to manifest.json for Live Mode |
| `position` | string | 'bottom-right' | Position of the embed overlay |
| `width` | number | 400 | Width in pixels |
| `height` | number | 300 | Height in pixels |
| `theme` | string | 'dark' | Color theme |

### LogicArt Runtime API

```javascript
// Fire a checkpoint (synchronous)
LogicArt.checkpoint(nodeId, variables);

// Fire a checkpoint with breakpoint support (async)
await LogicArt.checkpointAsync(nodeId, variables);

// Set a breakpoint
LogicArt.setBreakpoint(nodeId);

// Remove a breakpoint
LogicArt.removeBreakpoint(nodeId);

// Resume from breakpoint
LogicArt.resume();
```
