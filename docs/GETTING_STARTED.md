# LogiGo Getting Started Guide

This guide walks you through integrating LogiGo into your JavaScript projects for visual code debugging.

## Two Integration Modes

LogiGo supports two modes of operation:

### Static Mode (Recommended Start)
Copy-paste your JavaScript code into LogiGo Studio to instantly see a flowchart. No installation required.

**Best for:**
- Quick code visualization
- Learning algorithm logic
- Code reviews and documentation

### Live Mode (Advanced)
Install `logigo-core` to get real-time execution visualization with variable tracking.

**Best for:**
- Debugging complex logic
- Understanding code execution flow
- Interactive algorithm demonstrations

---

## Quick Start: Static Mode

1. Open LogiGo Studio
2. Paste your JavaScript function into the code editor
3. The flowchart appears automatically
4. Use the execution controls to step through:
   - Press `Space` or `K` to play/pause
   - Press `S` to step forward
   - Press `R` to reset

### Adding Human-Readable Labels

Use `// @logigo:` comments to add custom labels that appear in the flowchart instead of code:

```javascript
// @logigo: Initialize total
let total = 0;

// @logigo: Check if empty
if (items.length === 0) {
  // @logigo: Return early with zero
  return 0;
}

// @logigo: Sum all items
for (let i = 0; i < items.length; i++) {
  // @logigo: Add current item
  total += items[i];
}

// @logigo: Return final sum
return total;
```

Nodes with user labels show a blue dot indicator. Hover over them to see the original code.

---

## Live Mode Integration

### Step 1: Install logigo-core

```bash
npm install logigo-core
```

### Step 2: Add Checkpoints to Your Code

Import and use `LogiGo.checkpoint()` to mark execution points:

```javascript
import LogiGo from 'logigo-core';

function bubbleSort(arr) {
  LogiGo.checkpoint('sort:init', { arr: [...arr] });
  
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      LogiGo.checkpoint(`sort:compare:${j}`, {
        comparing: [j, j + 1],
        values: [arr[j], arr[j + 1]]
      });
      
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        
        LogiGo.checkpoint(`sort:swap:${j}`, {
          swapped: [j, j + 1],
          arr: [...arr]
        });
      }
    }
  }
  
  LogiGo.checkpoint('sort:complete', { arr: [...arr] });
  return arr;
}
```

### Step 3: Connect to LogiGo Studio

1. Open LogiGo Studio
2. Run your application
3. LogiGo Studio automatically connects and shows live execution

---

## Checkpoint API Reference

```javascript
LogiGo.checkpoint(id, payload);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique identifier for this checkpoint (e.g., `'loop:compare:5'`) |
| `payload` | object | Optional data to capture at this point |

### Checkpoint ID Conventions

Use hierarchical IDs for organized debugging:

```javascript
// Format: section:action:identifier
LogiGo.checkpoint('auth:validate:token');
LogiGo.checkpoint('sort:compare:3');
LogiGo.checkpoint('fetch:response:success');
```

### Payload Best Practices

```javascript
// Capture relevant state
LogiGo.checkpoint('loop:iteration', {
  i: currentIndex,
  current: items[currentIndex],
  remaining: items.length - currentIndex
});

// Use spread to capture array snapshots (avoid reference issues)
LogiGo.checkpoint('array:modified', {
  arr: [...myArray]  // Snapshot, not reference
});
```

---

## Visual Handshake (Optional)

Connect checkpoints to DOM elements for visual highlighting:

```javascript
LogiGo.checkpoint('sort:compare:5', {
  comparing: [5, 6]
}, {
  domElement: '#bar-5'  // CSS selector for DOM element
});
```

When this checkpoint fires, LogiGo highlights both the flowchart node AND the DOM element.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `K` | Play/Pause execution |
| `S` | Step forward |
| `B` | Step backward (Premium) |
| `R` | Reset to beginning |
| `F` | Toggle fullscreen |
| `Escape` | Exit fullscreen |
| `Ctrl/Cmd + O` | Import code file |
| `Ctrl/Cmd + S` | Export code to file |

---

## Debug Panel

The floating Debug Panel shows:
- **Current Step**: Step number and active node label
- **Variables**: Current values of all tracked variables
- **Call Stack**: Function call hierarchy
- **History**: Variable changes over time (History tab)

### Breakpoints

Right-click any flowchart node to set a breakpoint. Execution automatically pauses when reaching breakpoints.

---

## Sharing Flowcharts

Click "Share Flowchart" to generate a URL that includes your code. Recipients see the same flowchart when they open the link.

---

## Next Steps

- Explore the built-in algorithm examples (Examples dropdown)
- Try the Ghost Diff feature to visualize code changes
- Check the Help dialog (`?` button) for more shortcuts and features
