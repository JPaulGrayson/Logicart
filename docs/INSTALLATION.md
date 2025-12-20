# LogiGo Installation Guide

Add LogiGo visualization to your JavaScript projects to see your code as interactive flowcharts.

## What is LogiGo?

LogiGo transforms your JavaScript code into step-by-step flowchart visualizations. It helps you:
- Understand complex control flow at a glance
- Debug by watching execution step-by-step
- Learn algorithms visually
- Share code explanations with others

## Choose Your Platform

- [Replit](#replit) - Full integration with Replit Agent
- [VS Code](#vs-code) - Extension for Visual Studio Code
- [Cursor](#cursor) - Extension for Cursor IDE
- [Antigravity](#antigravity) - Native Antigravity integration

---

## Replit

### Quick Install (Replit Agent)

The easiest way to add LogiGo to your Replit project is to ask your Replit Agent. Copy and paste the following into your Agent chat:

```
Install LogiGo to visualize my code execution. Follow these steps:

1. Run: npm install logigo-core

2. Add this checkpoint helper to my main server file:

const LogiGo = {
  async checkpoint(nodeId, options = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};

3. Add checkpoints to key functions like this:

async function myFunction(data) {
  await LogiGo.checkpoint('function:start', {
    variables: { inputData: data }
  });

  // ... existing code ...

  await LogiGo.checkpoint('function:complete', {
    variables: { result: 'success' }
  });
}
```

### Manual Install (Replit)

#### Step 1: Install the Package

In your Replit shell, run:

```bash
npm install logigo-core
```

#### Step 2: Add the Checkpoint Helper

Add this code near the top of your main server file (e.g., `routes.ts`, `index.ts`, or `server.ts`):

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

#### Step 3: Add Checkpoints to Your Code

Insert `LogiGo.checkpoint()` calls at key points in your code:

```javascript
async function processOrder(order) {
  // Checkpoint at the start
  await LogiGo.checkpoint('order:start', {
    variables: { orderId: order.id, items: order.items.length }
  });

  // Validate order
  await LogiGo.checkpoint('order:validate', {
    variables: { status: 'validating' }
  });
  
  const isValid = validateOrder(order);
  
  if (!isValid) {
    await LogiGo.checkpoint('order:invalid', {
      variables: { error: 'Validation failed' }
    });
    return { success: false };
  }

  // Process payment
  await LogiGo.checkpoint('order:payment', {
    variables: { amount: order.total }
  });
  
  const payment = await processPayment(order);

  // Complete
  await LogiGo.checkpoint('order:complete', {
    variables: { success: true, transactionId: payment.id }
  });
  
  return { success: true, payment };
}
```

#### Step 4: Run and Watch

Start your application. You'll see checkpoint logs in the console:

```
[LogiGo] order:start { "orderId": "abc123", "items": 3 }
[LogiGo] order:validate { "status": "validating" }
[LogiGo] order:payment { "amount": 99.99 }
[LogiGo] order:complete { "success": true, "transactionId": "txn_456" }
```

### Checkpoint Best Practices

#### Naming Convention

Use hierarchical names for organized debugging:

```javascript
// Format: section:action or section:action:detail
await LogiGo.checkpoint('auth:login:start');
await LogiGo.checkpoint('auth:login:validate');
await LogiGo.checkpoint('auth:login:success');

await LogiGo.checkpoint('api:request:users');
await LogiGo.checkpoint('api:response:success');

await LogiGo.checkpoint('loop:iteration', { variables: { i: currentIndex } });
```

#### What to Track

Include useful debugging information:

```javascript
await LogiGo.checkpoint('process:item', {
  variables: {
    index: i,                    // Current position
    itemId: item.id,             // Identifier
    status: 'processing',        // Current state
    remaining: total - i,        // Progress info
    elapsedMs: Date.now() - start // Timing
  }
});
```

#### Loop Instrumentation

```javascript
async function processItems(items) {
  await LogiGo.checkpoint('batch:start', {
    variables: { totalItems: items.length }
  });

  for (let i = 0; i < items.length; i++) {
    await LogiGo.checkpoint('batch:item', {
      variables: { 
        index: i, 
        itemId: items[i].id,
        progress: `${i + 1}/${items.length}`
      }
    });

    await processItem(items[i]);
  }

  await LogiGo.checkpoint('batch:complete', {
    variables: { processedCount: items.length }
  });
}
```

### Client-Side Overlay (Optional)

To add the visual LogiGo overlay to your frontend:

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

  // ... rest of your app
}
```

### Verification Checklist (Replit)

- [ ] `logigo-core` appears in package.json
- [ ] Checkpoint helper is added to server file
- [ ] At least one `LogiGo.checkpoint()` call exists in your code
- [ ] Console shows `[LogiGo]` logs when the instrumented code runs
- [ ] Logs include the checkpoint ID and variables

---

## VS Code

> **Coming Soon** - This section will be completed by Antigravity with tested installation procedures.

### Prerequisites

<!-- Antigravity: Add VS Code prerequisites here -->

### Installation Steps

<!-- Antigravity: Add step-by-step installation for VS Code extension -->

### Configuration

<!-- Antigravity: Add configuration options -->

### Verification Checklist

<!-- Antigravity: Add verification steps -->

### Troubleshooting

<!-- Antigravity: Add common issues and solutions -->

---

## Cursor

> **Coming Soon** - This section will be completed by Antigravity with tested installation procedures.

### Prerequisites

<!-- Antigravity: Add Cursor prerequisites here -->

### Installation Steps

<!-- Antigravity: Add step-by-step installation for Cursor -->

### Configuration

<!-- Antigravity: Add configuration options -->

### Verification Checklist

<!-- Antigravity: Add verification steps -->

### Troubleshooting

<!-- Antigravity: Add common issues and solutions -->

---

## Antigravity

> **Coming Soon** - This section will be completed by Antigravity with native integration procedures.

### Prerequisites

<!-- Antigravity: Add prerequisites here -->

### Installation Steps

<!-- Antigravity: Add step-by-step installation -->

### Click-to-Source Navigation

<!-- Antigravity: Document the click-to-source feature -->

### Webview Integration

<!-- Antigravity: Document webview setup -->

### Verification Checklist

<!-- Antigravity: Add verification steps -->

### Troubleshooting

<!-- Antigravity: Add common issues and solutions -->

---

## Troubleshooting (General)

### Package Not Found

If `npm install logigo-core` fails:
- Check your internet connection
- Try `npm cache clean --force` then reinstall
- Verify you're in the correct project directory

### Checkpoints Not Logging

If you don't see `[LogiGo]` in the console:
- Verify the checkpoint helper code is added
- Check that your instrumented code is actually being executed
- Look for JavaScript errors that might be preventing execution

### TypeScript Errors

If you get type errors with the checkpoint helper:
```typescript
const LogiGo = {
  async checkpoint(nodeId: string, options: { variables?: Record<string, any> } = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};
```

---

## Getting Help

- **LogiGo Studio**: Paste your code into LogiGo Studio to see the flowchart visualization
- **Documentation**: See the in-app Help dialog for keyboard shortcuts and features
- **Examples**: Try the built-in algorithm examples to learn LogiGo patterns

---

## Next Steps

Once installed, you can:
1. Add checkpoints to your key functions
2. Run your code and watch the logs
3. Paste instrumented code into LogiGo Studio for flowchart visualization
4. Use the step-through controls to debug visually
