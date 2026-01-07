# LogicArt Common Pitfalls

**Avoid these common mistakes when using LogicArt**

---

## 🚨 Quick Reference

| Issue | Wrong | Right |
|-------|-------|-------|
| Checkpoint IDs | `checkpoint('cp1')` | `checkpoint('auth:login:start')` |
| Array snapshots | `{ arr }` | `{ arr: [...arr] }` |
| Async checkpoints | `checkpoint()` in async | `await checkpointAsync()` |
| CSS import | Missing | `import '@xyflow/react/dist/style.css'` |

---

## 1. Checkpoint ID Naming

### ❌ Wrong: Generic IDs

```javascript
checkpoint('cp1', { data });
checkpoint('cp2', { result });
checkpoint('step1');
checkpoint('step2');
```

**Problem:**
- Hard to understand execution flow
- Difficult to debug
- No context in logs

### ✅ Right: Hierarchical IDs

```javascript
checkpoint('validation:start', { data });
checkpoint('validation:complete', { result });
checkpoint('auth:login:start');
checkpoint('auth:login:success');
```

**Benefits:**
- Clear execution flow
- Easy to search logs
- Self-documenting

---

## 2. Array and Object References

### ❌ Wrong: Passing References

```javascript
const arr = [3, 1, 2];

for (let i = 0; i < arr.length; i++) {
  checkpoint('sort:step', { arr });  // ❌ Reference!
  // ... sorting logic
}
```

**Problem:**
- All checkpoints show the **final** array state
- Can't see intermediate changes
- Debugging is impossible

### ✅ Right: Creating Snapshots

```javascript
const arr = [3, 1, 2];

for (let i = 0; i < arr.length; i++) {
  checkpoint('sort:step', { arr: [...arr] });  // ✅ Snapshot!
  // ... sorting logic
}
```

**Benefits:**
- Each checkpoint has correct state
- Can see array changes over time
- Accurate debugging

**Also applies to objects:**

```javascript
// ❌ Wrong
checkpoint('update', { user });

// ✅ Right
checkpoint('update', { user: { ...user } });
```

---

## 3. Async/Await Checkpoints

### ❌ Wrong: Using `checkpoint()` in Async Functions

```javascript
async function fetchData() {
  checkpoint('fetch:start');  // ❌ Won't support breakpoints
  
  const data = await fetch('/api/data');
  
  checkpoint('fetch:complete', { data });  // ❌ Won't support breakpoints
  return data;
}
```

**Problem:**
- Breakpoints won't work
- Execution won't pause
- Can't debug async flow

### ✅ Right: Using `checkpointAsync()`

```javascript
async function fetchData() {
  await checkpointAsync('fetch:start');  // ✅ Supports breakpoints
  
  const data = await fetch('/api/data');
  
  await checkpointAsync('fetch:complete', { data });  // ✅ Supports breakpoints
  return data;
}
```

**Benefits:**
- Breakpoints work correctly
- Can pause async execution
- Proper async debugging

---

## 4. Missing CSS Import

### ❌ Wrong: No CSS Import

```javascript
import { LogicArtEmbed } from 'logicart-embed';

function App() {
  return <LogicArtEmbed code={code} />;  // ❌ Flowchart won't render correctly
}
```

**Problem:**
- Flowchart nodes are unstyled
- Layout is broken
- Controls don't work

### ✅ Right: Import Required CSS

```javascript
import { LogicArtEmbed } from 'logicart-embed';
import '@xyflow/react/dist/style.css';  // ✅ Required!

function App() {
  return <LogicArtEmbed code={code} />;
}
```

**Benefits:**
- Proper flowchart styling
- Correct layout
- Working controls

---

## 5. Vite Plugin Configuration

### ❌ Wrong: Missing Plugin

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()]  // ❌ No LogicArt plugin
});
```

**Problem:**
- No auto-instrumentation
- No manifest generation
- Live Mode won't work

### ✅ Right: Plugin Configured

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logicartPlugin from 'logicart-vite-plugin';  // ✅ Import

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({  // ✅ Configure
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      manifestPath: 'logicart-manifest.json'
    })
  ]
});
```

**Benefits:**
- Automatic instrumentation
- Manifest generation
- Live Mode works

---

## 6. Variable Scope in Checkpoints

### ❌ Wrong: Variables Out of Scope

```javascript
function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    processItem(item);
  }
  
  // ❌ 'item' is out of scope here!
  checkpoint('process:complete', { item });
}
```

**Problem:**
- `item` is undefined
- Can't see the data
- Confusing debug output

### ✅ Right: Capture Variables in Scope

```javascript
function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    checkpoint('process:item', { item, index: i });  // ✅ In scope
    processItem(item);
  }
  
  checkpoint('process:complete', { totalItems: items.length });  // ✅ Correct data
}
```

**Benefits:**
- All variables are defined
- Clear debug output
- Accurate tracking

---

## 7. Destructured Variables

### ❌ Wrong: Destructured Variables May Not Be Captured

```javascript
function processUser({ id, name, email }) {
  // Auto-instrumentation might not capture destructured params
  checkpoint('user:process');
}
```

**Problem:**
- Destructured variables might not be captured
- Missing data in debug panel
- Incomplete tracking

### ✅ Right: Assign to Named Variables

```javascript
function processUser(user) {
  const { id, name, email } = user;
  
  checkpoint('user:process', { 
    userId: id, 
    userName: name, 
    userEmail: email 
  });
}
```

**Benefits:**
- All variables captured
- Complete debug data
- Reliable tracking

---

## 8. TypeScript Syntax in Static Mode

### ❌ Wrong: TypeScript-Specific Syntax

```javascript
// Pasted into LogicArt Studio
function processUser(user: User): Result {  // ❌ Type annotations
  const result: Result = {  // ❌ Type annotation
    success: true
  };
  return result;
}
```

**Problem:**
- Acorn parser only supports JavaScript
- Syntax error in flowchart
- Won't visualize

### ✅ Right: Remove TypeScript Syntax

```javascript
// Pasted into LogicArt Studio
function processUser(user) {  // ✅ No type annotation
  const result = {  // ✅ No type annotation
    success: true
  };
  return result;
}
```

**Benefits:**
- Parses correctly
- Flowchart renders
- Visualization works

**Alternative:** Use the Vite plugin for TypeScript files (it handles transpilation)

---

## 9. Backend Logging Expectations

### ❌ Wrong: Expecting Visual Flowchart

```javascript
// server.ts
const LogicArt = {
  checkpoint(nodeId, options = {}) {
    console.log(`[LogicArt] ${nodeId}`, JSON.stringify(options.variables));
  }
};

// ❌ Expecting flowchart to appear automatically
app.post('/api/order', async (req, res) => {
  LogicArt.checkpoint('order:start', { variables: req.body });
  // ...
});
```

**Problem:**
- Backend logging only outputs to console
- No automatic flowchart visualization
- Misunderstood feature

### ✅ Right: Understand Backend Logging

```javascript
// server.ts
const LogicArt = {
  checkpoint(nodeId, options = {}) {
    console.log(`[LogicArt] ${nodeId}`, JSON.stringify(options.variables));
  }
};

app.post('/api/order', async (req, res) => {
  LogicArt.checkpoint('order:start', { variables: req.body });
  // ...
});

// ✅ To see flowchart:
// 1. Copy server code
// 2. Paste into LogicArt Studio
// 3. See flowchart structure
// 4. Correlate with console logs
```

**Benefits:**
- Correct expectations
- Proper workflow
- Effective debugging

---

## 10. Manifest URL Path

### ❌ Wrong: Incorrect Manifest Path

```javascript
<LogicArtEmbed manifestUrl="logicart-manifest.json" />  // ❌ Missing leading slash
```

**Problem:**
- Manifest not found
- 404 error
- Live Mode doesn't work

### ✅ Right: Absolute Path

```javascript
<LogicArtEmbed manifestUrl="/logicart-manifest.json" />  // ✅ Leading slash
```

**Benefits:**
- Manifest loads correctly
- Live Mode works
- No 404 errors

---

## 11. Checkpoint Overload

### ❌ Wrong: Too Many Checkpoints

```javascript
function processArray(arr) {
  checkpoint('start');
  checkpoint('check-length');
  
  for (let i = 0; i < arr.length; i++) {
    checkpoint('loop-start');
    checkpoint('get-item');
    const item = arr[i];
    checkpoint('got-item');
    checkpoint('process-start');
    processItem(item);
    checkpoint('process-end');
    checkpoint('loop-end');
  }
  
  checkpoint('end');
}
```

**Problem:**
- Too many checkpoints
- Cluttered flowchart
- Hard to follow
- Performance impact

### ✅ Right: Strategic Checkpoints

```javascript
function processArray(arr) {
  checkpoint('process:start', { totalItems: arr.length });
  
  for (let i = 0; i < arr.length; i++) {
    checkpoint('process:item', { 
      index: i, 
      item: arr[i],
      progress: `${i + 1}/${arr.length}`
    });
    processItem(arr[i]);
  }
  
  checkpoint('process:complete', { processedCount: arr.length });
}
```

**Benefits:**
- Clear execution flow
- Readable flowchart
- Better performance
- Easier debugging

---

## 12. User Labels Placement

### ❌ Wrong: Label After Code

```javascript
let count = 0;
// @logicart: Initialize counter  // ❌ Label after code
```

**Problem:**
- Label won't be applied
- Node shows code instead
- Confusing flowchart

### ✅ Right: Label Before Code

```javascript
// @logicart: Initialize counter  // ✅ Label before code
let count = 0;
```

**Benefits:**
- Label appears in flowchart
- Clear node descriptions
- Better readability

---

## 🎯 Quick Checklist

Before you start using LogicArt, verify:

- [ ] Checkpoint IDs are hierarchical (`section:action:detail`)
- [ ] Arrays/objects are snapshotted (`[...arr]`, `{...obj}`)
- [ ] Async functions use `checkpointAsync()`
- [ ] CSS is imported (`import '@xyflow/react/dist/style.css'`)
- [ ] Vite plugin is configured (if using Live Mode)
- [ ] Variables are in scope when captured
- [ ] TypeScript syntax is removed (for Static Mode)
- [ ] Backend logging expectations are correct
- [ ] Manifest URL has leading slash
- [ ] Checkpoints are strategic, not excessive
- [ ] User labels are placed before code

---

## 📚 Additional Resources

- **[Getting Started Guide](GETTING_STARTED.md)** - Tutorials and workflows
- **[Installation Guide](INSTALLATION_GUIDE.md)** - Platform-specific setup
- **[API Reference](API_REFERENCE.md)** - Complete API documentation

---

**Made with ❤️ for Vibe Coders who learn by seeing**
