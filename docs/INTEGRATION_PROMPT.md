# LogicArt Integration Prompt

Copy and paste this prompt into any AI agent (Replit Agent, Cursor, Claude, etc.) to add LogicArt visualization to your app.

---

## The Prompt

```
Add LogicArt code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

The project name is auto-detected from your hostname. URL Parameters:
- mode=push: Disables auto-discovery (recommended for React/Vite)
- hideBadge=true: Hides the floating badge (prevents UI conflicts)

2. Create a visualization handler:
const handleVisualize = (code, name) => {
  if (window.LogicArt?.visualize) {
    window.LogicArt.visualize(code, name);
  }
};

Available methods:
- visualize(code, name) - One-shot: registers code and opens LogicArt (recommended)
- registerCode(code, name) - Just registers code without opening
- openStudio() - Opens LogicArt in a new tab

3. Call handleVisualize with CLEAN algorithm code (not framework code):

// FOR ALGORITHM VISUALIZERS (stored code strings):
handleVisualize(algorithms[selectedAlgorithm], selectedAlgorithm);

// FOR CODE EDITORS (user-typed code):
handleVisualize(editor.getValue(), 'UserCode');

// FOR APPS WITH EXISTING FUNCTIONS:
handleVisualize(myFunction.toString(), 'FunctionName');

4. Connect the handler to a "View Flowchart" or "Visualize" button in your UI.

5. TEST THE INTEGRATION:
- Open the app in the browser
- Select or enter some code
- Click the visualization button
- Verify LogicArt opens in a new tab with a CLEAN flowchart showing only algorithm logic

6. IF THE FLOWCHART SHOWS FRAMEWORK CODE (thousands of nodes):
- Verify ?mode=push&hideBadge=true are in the script URL
- Verify you're passing the raw algorithm string, not bundled code
- The app should PUSH clean code to LogicArt, not let LogicArt auto-discover

7. Report what was done and whether the integration is working.

NOTE: Every AI-generated app is unique. The key principle is "clean-in, clean-out" - push only the algorithm code you want visualized.
```

---

## Key Concepts

### Push vs Auto-Discovery
LogicArt has two modes:
- **Auto-Discovery**: Scans all scripts on the page (captures framework noise in React/Vite)
- **Push Mode** (`?mode=push`): Your app sends specific clean code via `visualize()` (recommended)

For bundled apps (React, Vue, Vite), always use **Push Mode** with `?mode=push&hideBadge=true`.

### URL Parameters
| Parameter | Values | Description |
|-----------|--------|-------------|
| `project` | string | Your project/app name (auto-detected from hostname if not set) |
| `mode` | `auto`, `push` | `push` disables auto-discovery |
| `hideBadge` | `true`, `false` | Hides the floating badge |
| `autoOpen` | `true`, `false` | Auto-open LogicArt on first checkpoint |

### The Simple Pattern
With the new `visualize()` method, integration is straightforward:
```javascript
if (window.LogicArt?.visualize) {
  window.LogicArt.visualize(code, name);
}
```

---

## API Reference

### LogicArt.openWithCode(code, name)
Creates a session and opens LogicArt with the flowchart:
```javascript
window.LogicArt.openWithCode(algorithmCode, 'BubbleSort');
```

### LogicArt.registerCode(code, name)
Register code without opening LogicArt (for deferred visualization):
```javascript
window.LogicArt.registerCode(algorithmCode, 'BubbleSort');
```

### LogicArt.openStudio()
Open the current session in LogicArt:
```javascript
window.LogicArt.openStudio();
```

---

## Troubleshooting

**Flowchart shows thousands of nodes / framework code:**
- Add CSS: `#logicart-badge { display: none !important; }`
- Ensure you're passing raw algorithm strings, not bundled code
- Use Push Mode, not Auto-Discovery

**LogicArt doesn't open:**
- Check browser console for `[LogicArt]` messages
- Verify script tag is in `<head>` before other scripts
- Use the fallback pattern (registerCode + openStudio)

**Flowchart is empty:**
- Verify the code is readable JavaScript (not minified)
- Code should contain function declarations

---

## Integration Checklist

- [ ] Script tag added to HTML `<head>`
- [ ] CSS added to hide `#logicart-badge` (for React/Vite apps)
- [ ] Handler function created with API fallback
- [ ] "Visualize" button connected to handler
- [ ] Tested: clicking button opens LogicArt with clean flowchart
