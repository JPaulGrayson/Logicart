# LogicArt Quick Reference Card

**Print this for your desk!**

---

## 🎯 Which Method Should I Use?

```
📖 Just visualize code?
   → Static Mode (paste into Studio)

🔧 React app?
   → npm install logicart-embed

🏗️ Vite project?
   → npm install logicart-vite-plugin

🐛 Node.js server?
   → Copy checkpoint helper (no npm)

🎯 Fine control?
   → npm install logicart-core
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `K` | Play/Pause |
| `S` | Step Forward |
| `B` | Step Backward |
| `R` | Reset |
| `F` | Fullscreen |
| `?` | Help |

---

## 📝 Checkpoint Best Practices

### ✅ DO

```javascript
// Hierarchical IDs
checkpoint('auth:login:start');

// Snapshot arrays
checkpoint('sort', { arr: [...arr] });

// Use async for async functions
await checkpointAsync('fetch:data');

// Add user labels
// @logicart: Initialize counter
let count = 0;
```

### ❌ DON'T

```javascript
// Generic IDs
checkpoint('cp1');

// Reference arrays
checkpoint('sort', { arr });

// Sync in async functions
checkpoint('fetch:data');

// Label after code
let count = 0;
// @logicart: Initialize counter
```

---

## 🔧 Quick Install

### Static Mode
```
1. Open LogiGo Studio
2. Paste code
3. Press Space
```

### React Embed
```bash
npm install logicart-embed
```
```javascript
import { LogicArtEmbed } from 'logicart-embed';
import '@xyflow/react/dist/style.css';

<LogicArtEmbed code={code} theme="dark" />
```

### Vite Plugin
```bash
npm install logicart-vite-plugin --save-dev
```
```javascript
// vite.config.js
import logicartPlugin from 'logicart-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({
      include: ['src/**/*.tsx']
    })
  ]
});
```

### Backend Logging
```javascript
const LogicArt = {
  checkpoint(nodeId, options = {}) {
    const vars = options.variables || {};
    console.log(`[LogicArt] ${nodeId}`, JSON.stringify(vars, null, 2));
  }
};
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Module not found | `rm -rf node_modules && npm install` |
| Syntax Error | Remove TypeScript syntax |
| No variables | Check `captureVariables: true` |
| CSS not loading | `import '@xyflow/react/dist/style.css'` |
| Manifest 404 | Use `/logicart-manifest.json` (leading slash) |

---

## 📚 Checkpoint ID Conventions

```
section:action:detail

auth:login:start
auth:login:validate
auth:login:success

api:request:users
api:response:success

process:start
process:item
process:complete

loop:start
loop:iteration
loop:complete
```

---

## 🎨 User Labels

```javascript
// @logicart: Your label here
<code statement>
```

**Example:**
```javascript
// @logicart: Initialize counter
let count = 0;

// @logicart: Check if empty
if (items.length === 0) {
  // @logicart: Return zero
  return 0;
}
```

**Visual:** Blue dot on labeled nodes

---

## 📦 Package Comparison

| Package | Use Case |
|---------|----------|
| logicart-core | Manual checkpoints, runtime control |
| logicart-embed | React component for visualization |
| logicart-vite-plugin | Build-time auto-instrumentation |

---

## 🔗 Links

- **Docs**: [Getting Started](docs/GETTING_STARTED.md)
- **Install**: [Installation Guide](docs/INSTALLATION_GUIDE.md)
- **API**: [API Reference](docs/API_REFERENCE.md)
- **Pitfalls**: [Common Pitfalls](docs/COMMON_PITFALLS.md)
- **GitHub**: [github.com/JPaulGrayson/LogiGo](https://github.com/JPaulGrayson/LogiGo)

---

## 💡 Pro Tips

1. **Use descriptive checkpoint IDs** - `auth:login:start` not `cp1`
2. **Snapshot arrays** - `{ arr: [...arr] }` not `{ arr }`
3. **Label your code** - `// @logicart: Initialize counter`
4. **Set strategic breakpoints** - Before complex logic
5. **Check the Debug Panel** - See variables in real-time

---

**Made with ❤️ for Vibe Coders who learn by seeing**

---

## 🖨️ Print Instructions

1. Save this file as PDF
2. Print single-sided
3. Laminate for durability
4. Keep at your desk!
