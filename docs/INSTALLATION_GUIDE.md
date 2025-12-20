# LogiGo Installation Guide

Add LogiGo visualization to your JavaScript projects to see your code as interactive flowcharts.

## What is LogiGo?

LogiGo transforms your JavaScript code into step-by-step flowchart visualizations. It helps you:

- Understand complex control flow at a glance
- Debug by watching execution step-by-step
- Learn algorithms visually
- Share code explanations with others

## Understanding LogiGo's Two Components

LogiGo has **two distinct use cases**:

| Component | Use Case | Environment | What It Does |
|-----------|----------|-------------|--------------|
| **LogiGoOverlay** | Visual debugging | Browser/Frontend | Displays interactive overlay with play/pause controls |
| **Checkpoint Helper** | Execution logging | Server/Backend | Logs checkpoint events to console for debugging |

Choose the right one based on where your code runs:
- **Frontend apps (React, Vue, etc.)**: Use `LogiGoOverlay` from `logigo-core`
- **Backend apps (Node.js, Express, etc.)**: Use the Checkpoint Helper (no npm package needed)
- **Both**: Use both - overlay in frontend, helper in backend

---

## Choose Your Platform

- [Replit](#replit) - Full integration with Replit Agent
- [VS Code](#vs-code) - Extension for Visual Studio Code
- [Cursor](#cursor) - Extension for Cursor IDE
- [Antigravity](#antigravity) - Extension for Antigravity IDE
- [Windsurf](#windsurf) - Extension for Windsurf IDE

---

## Replit

### Quick Install (Replit Agent)

The easiest way to add LogiGo to your Replit project is to ask your Replit Agent. Copy and paste the following into your Agent chat:

```
Install LogiGo to visualize my code execution. Follow these steps:

For BACKEND/SERVER code (Node.js, Express, etc.):
Add this checkpoint helper to my main server file:

const LogiGo = {
  async checkpoint(nodeId, options = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};

For FRONTEND code (React, Vue, etc.):
1. Run: npm install logigo-core
2. Add this to my main App component:

import LogiGoOverlay from 'logigo-core';
import { useEffect } from 'react';

useEffect(() => {
  const overlay = new LogiGoOverlay({ speed: 1.0, debug: true });
  overlay.init();
  return () => overlay.destroy();
}, []);

Then add checkpoints to key functions like this:
await LogiGo.checkpoint('function:start', { variables: { data } });
```

### Manual Install - Backend/Server (Node.js)

For server-side code, you don't need the npm package. Just add the checkpoint helper:

**Step 1: Add the Checkpoint Helper**

Add this code near the top of your main server file (e.g., `routes.ts`, `index.ts`, or `server.ts`):

```typescript
// LogiGo checkpoint helper for execution visualization
const LogiGo = {
  async checkpoint(nodeId: string, options: { variables?: Record<string, any> } = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};
```

**Step 2: Add Checkpoints to Your Code**

Insert `LogiGo.checkpoint()` calls at key points in your code:

```typescript
async function processOrder(order) {
  await LogiGo.checkpoint('order:start', {
    variables: { orderId: order.id, items: order.items.length }
  });

  const isValid = validateOrder(order);
  
  if (!isValid) {
    await LogiGo.checkpoint('order:invalid', {
      variables: { error: 'Validation failed' }
    });
    return { success: false };
  }

  await LogiGo.checkpoint('order:payment', {
    variables: { amount: order.total }
  });
  
  const payment = await processPayment(order);

  await LogiGo.checkpoint('order:complete', {
    variables: { success: true, transactionId: payment.id }
  });
  
  return { success: true, payment };
}
```

**Step 3: Run and Watch**

Start your application. You'll see checkpoint logs in the console:

```
[LogiGo] order:start { "orderId": "abc123", "items": 3 }
[LogiGo] order:payment { "amount": 99.99 }
[LogiGo] order:complete { "success": true, "transactionId": "txn_456" }
```

### Manual Install - Frontend (React/Browser)

For browser-based visualization with the interactive overlay:

**Step 1: Install the Package**

```bash
npm install logigo-core
```

**Step 2: Initialize the Overlay**

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

**Step 3: Add Checkpoints**

The `LogiGo` global is automatically available after initialization:

```javascript
async function handleSubmit() {
  await LogiGo.checkpoint('form:submit', {
    domElement: '#submit-button',  // Highlights the button!
    variables: { formData }
  });
  
  // ... form handling logic
}
```

### Verification Checklist (Replit)

- [ ] Checkpoint helper is added to server file (for backend)
- [ ] `logigo-core` appears in package.json (for frontend)
- [ ] At least one `LogiGo.checkpoint()` call exists in your code
- [ ] Console shows `[LogiGo]` logs when the instrumented code runs
- [ ] Logs include the checkpoint ID and variables

---

## VS Code

### Prerequisites

- Visual Studio Code 1.85.0 or later
- A JavaScript or TypeScript project

### Installation Steps

**Option 1: Install from VSIX (Recommended)**

1. Download `logigo-1.0.0.vsix` from [GitHub Releases](https://github.com/JPaulGrayson/LogiGo/releases)
2. Open VS Code
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type: `Extensions: Install from VSIX`
5. Navigate to and select the downloaded `.vsix` file
6. Click **Install**
7. Press `Cmd+Shift+P` → type `Reload Window` → press Enter

**Option 2: Manual Installation**

If the VSIX install doesn't work, manually extract to the extensions folder:

```bash
# Find your VS Code extensions folder
# Mac: ~/.vscode/extensions/
# Windows: %USERPROFILE%\.vscode\extensions\
# Linux: ~/.vscode/extensions/

# Create the extension folder and extract
mkdir -p ~/.vscode/extensions/logigo.logigo-1.0.0
unzip logigo-1.0.0.vsix -d ~/.vscode/extensions/logigo.logigo-1.0.0
cd ~/.vscode/extensions/logigo.logigo-1.0.0
mv extension/* . && rm -rf extension
```

Then reload VS Code.

### Usage

1. Open any `.js` or `.ts` file
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `LogiGo: Visualize Current File`
4. The flowchart panel appears beside your code
5. Use the **EXAMPLES** dropdown to load sample algorithms
6. Click nodes to jump to that line in your code

### Verification Checklist

- [ ] `LogiGo: Visualize Current File` appears in Command Palette
- [ ] Flowchart panel opens when command is run
- [ ] Nodes appear for your code's control flow
- [ ] Clicking a node jumps to the corresponding line
- [ ] Selecting a different example updates the flowchart

### Troubleshooting

**"No matching commands" when typing LogiGo:**
- The extension isn't installed or activated
- Reload the window: `Cmd+Shift+P` → `Reload Window`
- Check that you have a `.js` or `.ts` file open (extension activates on these languages)

**Flowchart shows "Syntax Error":**
- Your code has a JavaScript syntax error
- LogiGo uses Acorn parser which only supports JavaScript (not TypeScript syntax)
- For TypeScript files, the parser tries to handle common patterns but complex TS may fail

---

## Cursor

### Prerequisites

- Cursor IDE (latest version)
- A JavaScript or TypeScript project

### Installation Steps

Cursor is a VS Code fork, so the installation is similar:

**Option 1: Install from VSIX**

1. Download `logigo-1.0.0.vsix` from [GitHub Releases](https://github.com/JPaulGrayson/LogiGo/releases)
2. Open Cursor
3. Press `Cmd+Shift+P` → `Extensions: Install from VSIX`
4. Select the `.vsix` file
5. Reload window

**Option 2: Manual Installation**

```bash
# Cursor extensions folder
mkdir -p ~/.cursor/extensions/logigo.logigo-1.0.0
unzip logigo-1.0.0.vsix -d ~/.cursor/extensions/logigo.logigo-1.0.0
cd ~/.cursor/extensions/logigo.logigo-1.0.0
mv extension/* . && rm -rf extension
```

Reload Cursor.

### Usage

Same as VS Code:
1. Open a `.js` or `.ts` file
2. `Cmd+Shift+P` → `LogiGo: Visualize Current File`

### Verification Checklist

- [ ] LogiGo command appears in Command Palette
- [ ] Flowchart panel opens
- [ ] Example algorithms can be loaded from dropdown

### Troubleshooting

Same as VS Code troubleshooting above.

---

## Antigravity

### Prerequisites

- Antigravity IDE (latest version)
- A JavaScript or TypeScript project

### Installation Steps

Antigravity is a VS Code fork with its own extensions folder:

**Manual Installation (Required)**

The standard VSIX installer in Antigravity may not work correctly. Use manual installation:

```bash
# Antigravity extensions folder
mkdir -p ~/.antigravity/extensions/logigo.logigo-1.0.0
unzip logigo-1.0.0.vsix -d ~/.antigravity/extensions/logigo.logigo-1.0.0
cd ~/.antigravity/extensions/logigo.logigo-1.0.0
mv extension/* . && rm -rf extension
```

Then reload Antigravity: `Cmd+Shift+P` → `Reload Window`

### Usage

1. Open a `.js` or `.ts` file
2. `Cmd+Shift+P` → `LogiGo: Visualize Current File`
3. The flowchart panel appears beside your code

### Click-to-Source Navigation

When viewing a flowchart:
- **Click any node** to jump to that line in your source code
- The editor will scroll to and highlight the corresponding line

### Verification Checklist

- [ ] Extension folder exists at `~/.antigravity/extensions/logigo.logigo-1.0.0/`
- [ ] LogiGo command appears in Command Palette after reload
- [ ] Flowchart displays when command is run
- [ ] Clicking nodes jumps to source code

### Troubleshooting

**Extension not appearing after installation:**
- Verify the folder structure: `ls ~/.antigravity/extensions/logigo.logigo-1.0.0/`
- Should contain: `package.json`, `dist/`, `icon.png`, etc.
- If you see an `extension/` subfolder, the extraction wasn't done correctly

**"Syntax Error" in flowchart:**
- Ensure your file is valid JavaScript
- TypeScript-specific syntax may cause parsing errors

---

## Windsurf

### Prerequisites

- Windsurf IDE by Codeium (latest version)
- A JavaScript or TypeScript project

### Installation Steps

Windsurf is a VS Code fork:

**Option 1: Import from Cursor**

If you have Cursor installed with LogiGo:
1. When first launching Windsurf, select "Import from Cursor"
2. LogiGo will be automatically imported

**Option 2: Manual Installation**

```bash
# Windsurf extensions folder
mkdir -p ~/.windsurf/extensions/logigo.logigo-1.0.0
unzip logigo-1.0.0.vsix -d ~/.windsurf/extensions/logigo.logigo-1.0.0
cd ~/.windsurf/extensions/logigo.logigo-1.0.0
mv extension/* . && rm -rf extension
```

Reload Windsurf.

### Verification Checklist

- [ ] LogiGo command appears in Command Palette
- [ ] Flowchart panel opens when visualizing a file

---

## Checkpoint Best Practices

### Naming Convention

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

### What to Track

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

### Loop Instrumentation

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

---

## Troubleshooting (General)

### Package Not Found

If `npm install logigo-core` fails:

1. Check your internet connection
2. Try `npm cache clean --force` then reinstall
3. Verify you're in the correct project directory

### Checkpoints Not Logging

If you don't see `[LogiGo]` in the console:

1. Verify the checkpoint helper code is added
2. Check that your instrumented code is actually being executed
3. Look for JavaScript errors that might be preventing execution

### TypeScript Errors

If you get type errors with the checkpoint helper, use the typed version:

```typescript
const LogiGo = {
  async checkpoint(nodeId: string, options: { variables?: Record<string, any> } = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
    return Promise.resolve();
  }
};
```

### Extension Installation Failed

For VS Code forks (Cursor, Antigravity, Windsurf):

1. Use manual installation method (unzip to extensions folder)
2. Verify folder structure has `package.json` at root level
3. Reload the IDE after installation

---

## Getting Help

- **LogiGo Studio**: Paste your code into LogiGo Studio to see the flowchart visualization
- **Documentation**: See the in-app Help dialog for keyboard shortcuts and features
- **Examples**: Try the built-in algorithm examples to learn LogiGo patterns
- **GitHub**: [https://github.com/JPaulGrayson/LogiGo](https://github.com/JPaulGrayson/LogiGo)

---

## Next Steps

Once installed, you can:

1. Add checkpoints to your key functions
2. Run your code and watch the logs
3. Paste instrumented code into LogiGo Studio for flowchart visualization
4. Use the step-through controls to debug visually

---

**Made with ❤️ for Vibe Coders everywhere**
