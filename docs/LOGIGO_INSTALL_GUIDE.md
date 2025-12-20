# LogiGo Installation Guide for Replit Agent

Copy this entire message and paste it into your Replit Agent chat to add LogiGo visualization to your app.

---

## Instructions for Replit Agent

Please install LogiGo to visualize my code execution flow. Follow these steps:

### Step 1: Install the Package

Run this command:
```bash
npm install logigo-core
```

### Step 2: Add the LogiGo Helper

Add this code near the top of my main server file (e.g., routes.ts, index.ts, or server.ts):

```javascript
// LogiGo checkpoint helper for execution visualization
const LogiGo = {
  async checkpoint(nodeId, options = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};
```

### Step 3: Add Checkpoints to Key Functions

Find the main functions in my code and add checkpoints at important steps. Use this pattern:

```javascript
async function myFunction(data) {
  // Checkpoint at the start
  await LogiGo.checkpoint('function:start', {
    variables: { inputData: data }
  });

  // ... existing code ...

  // Checkpoint before important operations
  await LogiGo.checkpoint('function:processing', {
    variables: { status: 'processing', itemCount: items.length }
  });

  // ... more code ...

  // Checkpoint at the end
  await LogiGo.checkpoint('function:complete', {
    variables: { result: 'success' }
  });
}
```

### Checkpoint Naming Convention

Use hierarchical names like:
- `loop:start`, `loop:iteration`, `loop:complete`
- `api:request`, `api:response`, `api:error`
- `db:query`, `db:result`
- `process:step1`, `process:step2`

### What to Track in Variables

Include useful debugging info:
- Current iteration numbers
- Input/output values
- Status strings
- Error messages
- Timing information

### Example: Adding Checkpoints to a Loop

Before:
```javascript
async function processItems(items) {
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}
```

After:
```javascript
async function processItems(items) {
  await LogiGo.checkpoint('process:start', {
    variables: { totalItems: items.length }
  });

  for (let i = 0; i < items.length; i++) {
    await LogiGo.checkpoint('process:item', {
      variables: { index: i, itemId: items[i].id }
    });

    const result = await processItem(items[i]);
    results.push(result);
  }

  await LogiGo.checkpoint('process:complete', {
    variables: { processedCount: results.length }
  });

  return results;
}
```

---

## After Installation

When I run my app, I'll see checkpoint logs in the console like:
```
[LogiGo] process:start { "totalItems": 5 }
[LogiGo] process:item { "index": 0, "itemId": "abc123" }
[LogiGo] process:item { "index": 1, "itemId": "def456" }
[LogiGo] process:complete { "processedCount": 5 }
```

This helps me understand exactly how my code executes step by step.

---

## Optional: Client-Side Overlay

If I want a visual overlay in my frontend, add this to my main React component:

```javascript
import LogiGoOverlay from 'logigo-core';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const overlay = new LogiGoOverlay({ 
      speed: 1.0,
      debug: true,
      position: 'bottom-right'
    });
    overlay.init();
    return () => overlay.destroy();
  }, []);

  // ... rest of app
}
```
