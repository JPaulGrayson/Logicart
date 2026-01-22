# LogicArt: Technical Specification
**Version:** 0.1 (Alpha)  
**Core Goal:** A runtime visualizer for AI-generated code that allows "Vibe Coders" to see, slow down, and debug logic flow.

## 1. Core Architecture (The Overlay)
* **Type:** Universal Library (JavaScript/Python).
* **Entry Point:** `LogicArt.init({ speed: 1.0, debug: true })`.
* **UI Injection:** The library appends a `<div>` overlay to the document body with `z-index: 9999`.
* **Communication:** Uses `window.postMessage` to talk between the User's App (The Host) and the LogicArt Toolbar (The Guest).

## 2. Visualization Engine ("Ghost Diff")
* **Data Structure:** Converting code to a Simplified AST (Abstract Syntax Tree).
    * Nodes: `{ id: "hash", type: "function|branch|loop", label: "Intent Name", code_ref: "func_name" }`
* **Diff Logic:**
    * Store `State_A` (Previous Run) and `State_B` (Current Run).
    * **Match:** By Function Name or Block Signature.
    * **Render:**
        * New Nodes: Green Border + Pulse.
        * Deleted Nodes: Red Border + 50% Opacity (Ghost).
        * Unchanged: Grey.

## 3. Execution Control ("Speed Governor")
* **Mechanism:** Async Injection.
* **The Loop:**
    * The library exposes a global `await LogicArt.checkpoint('node_id')`.
    * This function returns a `Promise` that resolves only when:
        * (A) The "Speed Timer" expires (e.g., 500ms).
        * (B) The User clicks "Next Step" (if paused).
* **Visual Handshake:**
    * When `checkpoint('btn_login')` triggers, the library searches the DOM for `id="btn_login"` and applies a temporary CSS class (`box-shadow: gold 0px 0px 10px`).

## 4. Hierarchical View (1,000 ft View)
* **Container Nodes:** Code blocks are grouped by comment regions (e.g., `// --- AUTH LOGIC ---`) into single visual containers.
* **Zoom Logic:**
    * Zoom < 50%: Show only Container Nodes (Labels).
    * Zoom > 50%: Show individual Logic Nodes (Code).

## Current Implementation Status

### ✅ Already Built (Replit Prototype)
- **Parser** (`client/src/lib/parser.ts`): AST parsing with location data
- **Interpreter** (`client/src/lib/interpreter.ts`): Step-by-step execution engine
- **Code Patcher** (`client/src/lib/codePatcher.ts`): Bi-directional code editing
- **React Flow Integration**: Visual flowchart rendering
- **Workbench UI**: Full-featured code editor with flowchart view

### 🚧 To Be Built (Antigravity Development)
1. **NPM Library Package** (`src/overlay.js`): Standalone injectable library
2. **Ghost Diff Engine** (`src/differ.js`): Visual diff between code versions
3. **Speed Governor** (`src/runtime.js`): Execution speed control with checkpoints
4. **Visual Handshake**: DOM element highlighting during execution
5. **Hierarchical Zoom**: Container-based view switching

## Architecture Decision: Dual Mode

### Mode 1: Standalone Library (New - Antigravity Build)
- **Target:** Any web app (inject via `<script>` tag or `npm install`)
- **Use Case:** Production debugging, third-party integration
- **Entry:** `LogicArt.init()` in user's code

### Mode 2: Integrated Workbench (Existing - Replit Build)
- **Target:** Replit IDE / Development Environment
- **Use Case:** Learning, prototyping, "Vibe Coding"
- **Entry:** Built-in UI with editor + flowchart

## Next Steps (Antigravity Focus)

1. **Create NPM Package Structure**
   - `src/overlay.js` - UI injection layer
   - `src/parser.js` - Lightweight AST parser (reuse existing)
   - `src/runtime.js` - Execution controller
   - `src/differ.js` - Ghost diff engine

2. **Build Minimal Example**
   - `example/index.html` - Demo page showing overlay in action
   - `example/app.js` - Sample app with LogicArt.checkpoint() calls

3. **Test Integration**
   - Verify overlay works in vanilla HTML
   - Verify it works in React/Vue apps
   - Verify it works in Replit preview window
