# LogicArt Integration Prompt

Copy and paste this prompt into any AI agent (Replit Agent, Cursor, Claude, etc.) to add LogicArt visualization to your app.

---

## The Prompt

```
Add LogicArt code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

2. Scan my project structure and create a COMPONENT PICKER:
   - Find all pages, features, and major components
   - Build a dropdown or modal with friendly names (not file paths)
   - Map each name to its source file path

3. Create a visualization handler that fetches SOURCE FILES (not bundled code):

// Component picker data - populate by scanning project structure
const components = {
  'Home Page': '/src/pages/HomePage.tsx',
  'User Profile': '/src/features/user/Profile.tsx',
  'Search': '/src/components/Search.tsx'
  // ... add all major components
};

// Fetch source file and visualize
async function visualizeComponent(name) {
  const filePath = components[name];
  const response = await fetch(filePath);
  const code = await response.text();
  
  if (window.LogicArt?.visualize) {
    window.LogicArt.visualize(code, name);
  }
}

4. Add a "View Flowchart" button that opens the component picker.
   When user selects a component, call visualizeComponent(selectedName).

5. TEST THE INTEGRATION:
- Click "View Flowchart" button
- Select a component from the picker
- Verify LogicArt opens showing that component's logic as a flowchart

6. IF THE FLOWCHART SHOWS BUNDLED/FRAMEWORK CODE:
- Make sure you're fetching SOURCE files (e.g., /src/pages/Home.tsx)
- NOT bundled output (e.g., /assets/index-abc123.js)

NOTE: LogicArt automatically extracts algorithm logic from React hooks 
(useCallback, useMemo, useEffect) - just pass the whole component file.
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
