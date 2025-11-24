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

### Option 2: NPM Install (Coming Soon)
```bash
npm install logigo-core
```

```javascript
import LogiGo from 'logigo-core';
LogiGo.init({ speed: 1.0 });
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
- **Speed Slider**: Adjust execution speed (0.1x to 2.0x)
- **Reset**: Start over from the beginning

## 🎨 Features

### ✅ Phase 1: Core Overlay (COMPLETE)
- [x] Floating toolbar injection
- [x] Play/Pause/Step/Reset controls
- [x] Speed governor (0.1x - 2.0x)
- [x] Visual handshake (DOM element highlighting)
- [x] Checkpoint API

### 🚧 Phase 2: Speed Governor (IN PROGRESS)
- [ ] Execution controller class
- [ ] Promise-based checkpoint system
- [ ] Integration with UI controls

### 📋 Phase 3: Ghost Diff (PLANNED)
- [ ] AST diffing engine
- [ ] Visual diff rendering (Red/Green/Ghost)
- [ ] Side-by-side comparison

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

### Global API

After initialization, these methods are available on `window.LogiGo`:

```javascript
// Pause execution at a specific point
await LogiGo.checkpoint(nodeId);

// Control playback
LogiGo.play();
LogiGo.pause();
LogiGo.reset();

// Adjust speed
LogiGo.setSpeed(1.5); // 1.5x speed
```

## 🧪 Running the Demo

1. Clone this repository
2. Open `example/index.html` in your browser
3. Click the demo buttons to see LogiGo in action!

```bash
# Serve locally (optional)
python3 -m http.server 8000
# Then visit: http://localhost:8000/example/
```

## 🏗️ Architecture

LogiGo follows a "Factory vs. Showroom" model:

### Factory (This Repo - Antigravity Development)
- **Core Library**: Standalone NPM package
- **Overlay**: Injectable UI component
- **Parser**: Lightweight AST parser
- **Differ**: Ghost diff engine

### Showroom (Replit Prototype)
- **Workbench**: Full IDE integration
- **Advanced Parser**: Full AST with location data
- **Interpreter**: Step-by-step execution engine
- **Code Patcher**: Bi-directional editing

## 📚 Documentation

- [Technical Specification](./SPEC.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Gemini's Recommendations](./GEMINI_RECOMMENDATIONS.md)

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
