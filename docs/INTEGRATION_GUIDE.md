# LogicArt Integration Guide

This guide documents the tested integration flow for connecting any JavaScript app to LogicArt.

---

## Verified Working Flow (Tested End-to-End)

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Plain JS apps | ✅ Works | Full support with checkpoints and flowcharts |
| checkpoint() function | ✅ Works | Sends execution data to LogicArt in real-time |
| registerCode() | ✅ Works | Enables flowchart generation from source |
| Session auto-creation | ✅ Works | remote.js handles this automatically |
| Studio opens and displays | ✅ Works | Shows code, checkpoints, and flowchart |

### Simple 3-Step Integration

**Step 1: Add remote.js to HTML head**
```html
<script src="https://logic.art/remote.js?project=MyApp&autoOpen=false"></script>
```

**Step 2: Add checkpoint() calls to key functions**
```javascript
function processOrder(order) {
  checkpoint('processOrder-start', { orderId: order.id });
  
  // Your logic...
  
  checkpoint('processOrder-end', { success: true });
}
```

**Step 3: Register source code for flowchart (optional but recommended)**
```html
<script>
  fetch('/main.js')
    .then(r => r.text())
    .then(code => window.LogicArt.registerCode(code));
</script>
```

---

## Integration Prompt for AI Agent

Copy this prompt and give it to your AI agent (Replit Agent, Cursor, Claude, etc.) to integrate LogicArt:

```
Add LogicArt visualization to this project.

1. Add this script to the HTML head (before other scripts):
   <script src="https://logic.art/remote.js?project=MyAppName&autoOpen=false"></script>

2. FIRST, scan and LIST all .tsx/.ts/.js files in src/pages/, src/components/, src/features/.
   Show me what you find before building the picker.

3. Create a ComponentPicker dropdown with those files:
   - Use friendly names (e.g., "Dashboard" not "Dashboard.tsx")
   - Store the source file path for each

4. Visualization function - fetch SOURCE files:

   const components = [
     { name: 'Dashboard', path: '/src/pages/Dashboard.tsx' },
     { name: 'Checkout', path: '/src/features/checkout/Checkout.tsx' },
   ];

   async function visualizeComponent(filePath, displayName) {
     const response = await fetch(filePath);
     const code = await response.text();
     // Use LogiGo (the runtime API name)
     const api = window.LogiGo || window.LogicArt;
     api.visualize(code, displayName);
   }

5. Add a "View Flowchart" button to an EXISTING navbar or header component.
   - Find Header.tsx, Navbar.tsx, or similar shared nav component
   - Add the button there - NOT a floating button with position:fixed
   When user selects, call visualizeComponent(selected.path, selected.name).

6. CRITICAL: Fetch SOURCE files like /src/pages/Dashboard.tsx
   NOT bundled paths like /assets/index-abc123.js

NOTE: LogicArt auto-extracts logic from React hooks (useCallback/useMemo/useEffect).
```

---

## Friction Points & Solutions

### 1. Need to Manually Add Checkpoints
**Problem:** Developer must add checkpoint() calls to see execution flow.

**Solution:** This is intentional - checkpoints mark the meaningful moments in code execution. Without them, LogicArt doesn't know what to visualize.

**Mitigation:** The Vite plugin (logicart-vite-plugin) can auto-instrument at build time, but requires build config changes.

### 2. Vite HMR Websocket Errors in Console
**Problem:** Console shows WebSocket connection errors in Replit environment.

**Solution:** These are harmless - Vite's Hot Module Replacement doesn't work across Replit's proxy, but the app still works normally.

### 3. Production Builds Are Minified
**Problem:** React/Vite production builds minify code, making flowcharts unreadable.

**Solutions:**
- Use development builds for visualization
- Use the Vite plugin to generate manifests at build time
- Keep a readable version of source code separate

### 4. Code Must Be Registered Separately
**Problem:** The flowchart needs readable source code to parse.

**Solution:** Fetch and register the source file:
```javascript
fetch('/app.js')
  .then(r => r.text())
  .then(code => window.LogicArt.registerCode(code));
```

---

## API Reference

### checkpoint(id, variables, options)
Send execution checkpoint to LogicArt (for Live Mode):
```javascript
checkpoint('step-name', { var1: value1 });
```

### window.LogicArt.visualize(code, name)
One-shot: registers code AND opens LogicArt (recommended for Static Mode):
```javascript
window.LogicArt.visualize(algorithmCode, 'My Algorithm');
```

### window.LogicArt.registerCode(code, name)
Register source code for flowchart parsing without opening LogicArt:
```javascript
window.LogicArt.registerCode(sourceString, 'Optional Name');
```

### window.LogicArt.openStudio()
Open LogicArt in new tab:
```javascript
window.LogicArt.openStudio();
```

### window.LogicArt.sessionId
Get current session ID:
```javascript
console.log(window.LogicArt.sessionId);
```

### window.LogicArt.studioUrl
Get LogicArt URL:
```javascript
console.log(window.LogicArt.studioUrl);
```

---

## Query Parameters for remote.js

| Parameter | Default | Description |
|-----------|---------|-------------|
| project | "Remote App" | Name shown in LogicArt |
| autoOpen | true | Auto-open LogicArt on first checkpoint |
| name | (same as project) | Alias for project |
| mode | "checkpoint" | Use "push" for static visualization mode |
| hideBadge | false | Set to "true" to hide the LogicArt badge overlay |

Example (Live Mode with checkpoints):
```html
<script src="https://logic.art/remote.js?project=TodoApp&autoOpen=false"></script>
```

Example (Static Mode for one-shot visualization):
```html
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>
```

---

## Tested Reference Implementation

See `/test-app/` for a working example:
- `index.html` - Includes remote.js, registers code, has "Open LogicArt" button
- `game.js` - Number guessing game with checkpoint() calls throughout

To test:
1. Visit `/test-app/index.html`
2. Play the game (enter guesses)
3. Click "Open LogicArt"
4. See checkpoints flow in real-time with flowchart

---

## Architecture Summary

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   Your App      │ ─────────────────> │   LogicArt      │
│                 │   /api/remote/     │   Server        │
│  checkpoint()   │   checkpoint       │                 │
│  registerCode() │                    │  Stores data    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ SSE Stream
                                                ▼
                                       ┌─────────────────┐
                                       │   LogicArt      │
                                       │                 │
                                       │  Displays:      │
                                       │  - Code         │
                                       │  - Flowchart    │
                                       │  - Checkpoints  │
                                       └─────────────────┘
```

---

## Next Steps for Zero-Code Experience

The current integration requires adding checkpoint() calls. Future enhancements:

1. **Vite Plugin Auto-Instrumentation**: Already exists at `packages/logicart-vite-plugin/`
2. **Proxy Mode**: Works for plain JS apps, see `/proxy/`
3. **Browser Extension**: Would enable zero-code injection (not yet built)
