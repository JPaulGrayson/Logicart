# LogiGo - Runtime Code Visualizer for Vibe Coders

A lightweight, injectable JavaScript library that visualizes code execution flow in real-time. Perfect for debugging AI-generated code and understanding complex logic.

## 🚀 Quick Start

### Option 1: Direct Script Tag
```html
<script src="https://unpkg.com/logigo/dist/logigo.min.js"></script>
<script>
  new LogiGoOverlay({ speed: 1.0, debug: true }).init();
</script>
```

### Option 2: NPM Install
```bash
npm install logigo-core
```

```javascript
import LogiGoOverlay from 'logigo-core';
new LogiGoOverlay({ speed: 1.0 }).init();
```

## 📖 Usage

### Basic Example
```javascript
async function myFunction() {
  await LogiGo.checkpoint('step1');
  console.log('Step 1');
  
  await LogiGo.checkpoint('step2');
  console.log('Step 2');
}
```

### With DOM Highlighting
```html
<button id="login_button">Login</button>

<script>
  async function handleLogin() {
    await LogiGo.checkpoint('login_button'); // Highlights the button!
    // Login logic here
  }
</script>
```

## 🎮 Controls

The LogiGo overlay provides:
- **Play/Pause**: Control execution flow
- **Step**: Execute one checkpoint at a time
- **Speed Slider**: Adjust execution speed (0.1x to 20.0x)
- **Reset**: Start over from the beginning

## 🎨 Features

### ✅ Phase 1: Core Overlay (COMPLETE)
- [x] Floating toolbar injection
- [x] Play/Pause/Step/Reset controls
- [x] Speed governor (0.1x - 20.0x)
- [x] **Visual Handshake** (DOM element highlighting)
- [x] Checkpoint API

### ✅ Phase 2: Speed Governor & Reporter (COMPLETE)
- [x] Execution controller class
- [x] Promise-based checkpoint system
- [x] **Reporter API** for Browser Agent integration
- [x] Real-time event subscription

### ✅ Phase 3: Ghost Diff (COMPLETE)
- [x] AST diffing engine
- [x] Visual diff rendering (Red/Green/Ghost)
- [x] Side-by-side comparison

## 🛠️ API Reference

### LogiGoOverlay

```javascript
const overlay = new LogiGoOverlay(options);
overlay.init();
```

**Options:**
- `speed` (number): Initial execution speed (default: 1.0)
- `debug` (boolean): Enable debug logging (default: false)
- `position` (string): Overlay position - 'bottom-right', 'bottom-left', 'top-right', 'top-left' (default: 'bottom-right')

### Visual Handshake (DOM Highlighting)

Highlight UI elements as your code executes:

```javascript
await LogiGo.checkpoint('step_1', {
  domElement: '#my-button',  // Selector or HTMLElement
  color: 'gold',             // Highlight color (default: gold)
  duration: 2000,            // Duration in ms (default: 2000)
  intensity: 'medium'        // low | medium | high
});
```

### Reporter API (Browser Agent Integration)

Subscribe to checkpoint events for AI analysis or automated testing:

```javascript
// Get the reporter instance
const reporter = LogiGo.reporter;

// Subscribe to events
reporter.onCheckpoint((entry) => {
  console.log('Checkpoint hit:', entry.id);
  console.log('DOM Element:', entry.domElement);
  console.log('Variables:', entry.variables);
});

// Export full report
const report = reporter.exportReport();
```

## 🧪 Running the Demos

1. Clone this repository
2. Open the examples in your browser:

### 📚 Library of Logic (New!)
- **[Pathfinding (A*)](example/library/pathfinding.html)** - Interactive A* search with grid visualization.
- **[Sorting Algorithms](example/library/sorting.html)** - Bubble, Quick, and Merge sort visualizers.

### Core Demos
- `example/complete_demo.html` - Full integration demo
- `example/visual_handshake.html` - **Visual Handshake Demo**
- `example/reporter_demo.html` - **Reporter API Demo**
- `example/ghost_diff.html` - Ghost Diff Demo

## 📚 Documentation

- [Technical Specification](./SPEC.md)
- [Integration Guide](./LOGIGO_INTEGRATION.md)

## 🤝 Contributing

LogiGo is in active development. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **Concept**: Gemini AI
- **Development**: Antigravity (Google DeepMind)
- **Prototype**: Replit AI

---

**Made with ❤️ for Vibe Coders everywhere**
