# LogiGo Integration Guide

This guide documents the tested integration flow for connecting any JavaScript app to LogiGo Studio.

---

## Verified Working Flow (Tested End-to-End)

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Plain JS apps | ✅ Works | Full support with checkpoints and flowcharts |
| checkpoint() function | ✅ Works | Sends execution data to Studio in real-time |
| registerCode() | ✅ Works | Enables flowchart generation from source |
| Session auto-creation | ✅ Works | remote.js handles this automatically |
| Studio opens and displays | ✅ Works | Shows code, checkpoints, and flowchart |

### Simple 3-Step Integration

**Step 1: Add remote.js to HTML head**
```html
<script src="https://logigo-studio.replit.app/remote.js?project=MyApp&autoOpen=false"></script>
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
    .then(code => window.LogiGo.registerCode(code));
</script>
```

---

## Integration Prompt for Replit Agent

Copy this prompt and give it to Agent to integrate LogiGo:

```
Add LogiGo visualization to this project.

1. Add this script to the HTML head (before other scripts):
   <script src="https://logigo-studio.replit.app/remote.js?project=MyAppName&autoOpen=false"></script>

2. Add checkpoint() calls at important points in my JavaScript:
   - At function start: checkpoint('functionName-start', { param1, param2 })
   - At decisions: checkpoint('checking-condition', { value })
   - At function end: checkpoint('functionName-end', { result })

3. Register the source code for flowchart generation:
   <script>
     fetch('/path/to/main.js')
       .then(r => r.text())
       .then(code => window.LogiGo.registerCode(code));
   </script>

4. Add a button to open LogiGo Studio:
   <button onclick="window.LogiGo.openStudio()">Open LogiGo</button>
```

---

## Friction Points & Solutions

### 1. Need to Manually Add Checkpoints
**Problem:** Developer must add checkpoint() calls to see execution flow.

**Solution:** This is intentional - checkpoints mark the meaningful moments in code execution. Without them, LogiGo doesn't know what to visualize.

**Mitigation:** The Vite plugin (logigo-vite-plugin) can auto-instrument at build time, but requires build config changes.

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
  .then(code => window.LogiGo.registerCode(code));
```

---

## API Reference

### checkpoint(id, variables, options)
Send execution checkpoint to LogiGo:
```javascript
checkpoint('step-name', { var1: value1 });
```

### window.LogiGo.registerCode(sourceCode)
Register source code for flowchart parsing:
```javascript
window.LogiGo.registerCode(sourceString);
```

### window.LogiGo.openStudio()
Open LogiGo Studio in new tab:
```javascript
window.LogiGo.openStudio();
```

### window.LogiGo.sessionId
Get current session ID:
```javascript
console.log(window.LogiGo.sessionId);
```

### window.LogiGo.studioUrl
Get Studio URL:
```javascript
console.log(window.LogiGo.studioUrl);
```

---

## Query Parameters for remote.js

| Parameter | Default | Description |
|-----------|---------|-------------|
| project | "Remote App" | Name shown in LogiGo Studio |
| autoOpen | true | Auto-open Studio on first checkpoint |
| name | (same as project) | Alias for project |

Example:
```html
<script src="/remote.js?project=TodoApp&autoOpen=false"></script>
```

---

## Tested Reference Implementation

See `/test-app/` for a working example:
- `index.html` - Includes remote.js, registers code, has "Open LogiGo" button
- `game.js` - Number guessing game with checkpoint() calls throughout

To test:
1. Visit `/test-app/index.html`
2. Play the game (enter guesses)
3. Click "Open LogiGo Studio"
4. See checkpoints flow in real-time with flowchart

---

## Architecture Summary

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   Your App      │ ─────────────────> │   LogiGo        │
│                 │   /api/remote/     │   Server        │
│  checkpoint()   │   checkpoint       │                 │
│  registerCode() │                    │  Stores data    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ SSE Stream
                                                ▼
                                       ┌─────────────────┐
                                       │   LogiGo        │
                                       │   Studio        │
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

1. **Vite Plugin Auto-Instrumentation**: Already exists at `packages/logigo-vite-plugin/`
2. **Proxy Mode**: Works for plain JS apps, see `/proxy/`
3. **Browser Extension**: Would enable zero-code injection (not yet built)
