# LogiGo Studio

**Transform JavaScript into Interactive Flowcharts**

> 💡 **The LogiGo Promise**: Paste code → See flowchart → Step through execution  
> No configuration. No setup. Just instant visual understanding.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/JPaulGrayson/LogiGo/releases)

---

## 🎯 What is LogiGo?

LogiGo is a **code-to-flowchart visualization tool** designed for visual learners and "Vibe Coders" who understand code better when they can see it in action.

**Key Features:**
- 🎨 **Instant Visualization** - Paste JavaScript, see flowchart immediately
- ▶️ **Step-by-Step Execution** - Watch your code run node by node
- 🔍 **Variable Tracking** - See values change in real-time
- 🎯 **Breakpoint Debugging** - Pause execution at critical points
- 🤖 **AI Model Arena** - Get code help from 4 AI models simultaneously
- 🔗 **Shareable Links** - Share flowcharts with teammates

---

## 🚀 Quick Start (30 Seconds)

### Option 1: Use LogiGo Studio (No Installation)

1. **Open** [LogiGo Studio](https://logigo.studio) *(or your deployed URL)*
2. **Paste** any JavaScript function into the editor
3. **Watch** the flowchart appear automatically
4. **Press** `Space` to step through execution

**That's it!** No npm install, no configuration, no dependencies.

### Option 2: Try an Example

Click the **EXAMPLES** dropdown in LogiGo Studio and select:
- **Bubble Sort** - See sorting algorithms visualized
- **Fibonacci** - Understand recursion visually
- **Tic-Tac-Toe** - Explore game logic step-by-step

---

## 📚 Documentation

| Guide | Description | Best For |
|-------|-------------|----------|
| **[Getting Started](docs/GETTING_STARTED.md)** | Quick start, keyboard shortcuts, basic features | First-time users |
| **[Installation Guide](docs/INSTALLATION_GUIDE.md)** | Add LogiGo to your projects (Replit, VS Code, etc.) | Developers integrating LogiGo |
| **[API Reference](docs/API_REFERENCE.md)** | Complete API for packages and checkpoints | Advanced users |

---

## 🎯 Which Integration Method Should I Use?

```
START HERE: What do you want to do?
│
├─ 📖 Just visualize code to understand it
│  └─ ✅ Use LogiGo Studio (paste code, no installation)
│
├─ 🔧 Add flowcharts to my React app
│  └─ ✅ Install logigo-embed package
│
├─ 🏗️ Auto-instrument my Vite project
│  └─ ✅ Install logigo-vite-plugin
│
├─ 🐛 Debug my Node.js/Express server
│  └─ ✅ Add checkpoint helper (no package needed)
│
└─ 🎯 Fine-grained control over checkpoints
   └─ ✅ Install logigo-core and add manual checkpoints
```

**Still not sure?** See the [Installation Guide](docs/INSTALLATION_GUIDE.md) for detailed decision tree.

---

## 📦 NPM Packages

| Package | Purpose | Install |
|---------|---------|---------|
| **logigo-core** | Runtime library for checkpoint debugging | `npm install logigo-core` |
| **logigo-embed** | React component for flowchart visualization | `npm install logigo-embed` |
| **logigo-vite-plugin** | Vite plugin for build-time instrumentation | `npm install logigo-vite-plugin --save-dev` |

---

## 💻 Installation Examples

### Static Mode (No Installation)
```javascript
// Just paste this into LogiGo Studio
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
```

### React Embed Component
```bash
npm install logigo-embed
```

```javascript
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

### Vite Plugin (Auto-Instrumentation)
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

### Backend Logging (Node.js/Express)
```javascript
// Add this helper to your server file (no npm package needed)
const LogiGo = {
  checkpoint(nodeId, options = {}) {
    const vars = options.variables || {};
    console.log(`[LogiGo] ${nodeId}`, JSON.stringify(vars, null, 2));
  }
};

// Use in your routes
app.post('/api/order', async (req, res) => {
  LogiGo.checkpoint('order:start', { variables: { body: req.body } });
  
  const order = await processOrder(req.body);
  
  LogiGo.checkpoint('order:complete', { variables: { orderId: order.id } });
  res.json(order);
});
```

**💡 Tip:** Paste your server code into LogiGo Studio to see the flowchart, then correlate with console logs.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `K` | Play/Pause execution |
| `S` | Step forward |
| `B` | Step backward |
| `R` | Reset to beginning |
| `F` | Toggle fullscreen |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |

---

## 🎨 User Labels

Add human-readable labels to flowchart nodes with `// @logigo:` comments:

```javascript
// @logigo: Initialize counter
let count = 0;

// @logigo: Check if array is empty
if (items.length === 0) {
  // @logigo: Return early with zero
  return 0;
}

// @logigo: Sum all items
for (const item of items) {
  count += item.value;
}
```

**Result:** Nodes show "Initialize counter" instead of `let count = 0;`  
**Indicator:** Blue dot appears on labeled nodes (hover to see original code)

---

## 🤖 AI Model Arena

Get code generation help from **4 AI models simultaneously**:

1. Click **Model Arena** in LogiGo Studio
2. Describe what you want to build
3. See responses from:
   - **GPT-4o** (OpenAI)
   - **Gemini** (Google)
   - **Claude** (Anthropic)
   - **Grok** (xAI)
4. Get a **Chairman Verdict** synthesizing the best approach

**Use Case:** "Generate a binary search algorithm with edge case handling"

---

## 🔗 Sharing Flowcharts

1. Click **Share** button in LogiGo Studio
2. Add optional title and description
3. Copy the generated URL
4. Recipients see your flowchart with full interactivity

**Shared flowcharts include:**
- Complete source code
- Flowchart visualization
- Step-through controls
- Variable tracking

---

## 🏗️ Architecture

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

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/JPaulGrayson/LogiGo.git
cd LogiGo

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Push database schema changes
npm run db:push
```

### Building Packages

```bash
# Build all packages
cd packages/logigo-core && npm run build
cd packages/logigo-embed && npm run build
cd packages/logigo-vite-plugin && npm run build
```

---

## 🐛 Troubleshooting

### "Module not found: logigo-embed"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Flowchart shows "Syntax Error"
- LogiGo uses Acorn parser (ECMAScript 2020)
- Ensure code is valid JavaScript
- TypeScript-specific syntax may cause errors

### No variable tracking in Live Mode
- Verify Vite plugin is configured: `captureVariables: true` (default)
- Check that `logigo-manifest.json` is being generated
- Ensure `LogiGoEmbed` has `showVariables={true}`

### CSS not loading
```javascript
// Make sure this import is present
import '@xyflow/react/dist/style.css';
```

**More help:** See [Installation Guide](docs/INSTALLATION_GUIDE.md#troubleshooting)

---

## 📋 Compatibility

| Package | Version | React | Vite | Node |
|---------|---------|-------|------|------|
| logigo-core | 1.0.0 | 16+ | 4+ | 16+ |
| logigo-embed | 1.0.0 | 16+ | 4+ | 16+ |
| logigo-vite-plugin | 1.0.0 | - | 4+ | 16+ |

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## 🎓 Learn More

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Tutorials and examples
- **[Installation Guide](docs/INSTALLATION_GUIDE.md)** - Platform-specific setup
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[GitHub Issues](https://github.com/JPaulGrayson/LogiGo/issues)** - Report bugs or request features

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

Built with:
- [React Flow](https://reactflow.dev/) - Flowchart rendering
- [Acorn](https://github.com/acornjs/acorn) - JavaScript parsing
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editing
- [Drizzle ORM](https://orm.drizzle.team/) - Database management

---

**Made with ❤️ for Vibe Coders who learn by seeing**

[⭐ Star on GitHub](https://github.com/JPaulGrayson/LogiGo) | [📖 Documentation](docs/GETTING_STARTED.md) | [🐛 Report Bug](https://github.com/JPaulGrayson/LogiGo/issues)
