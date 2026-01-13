# LogicArt Integration Prompt

Copy and paste this prompt into any AI agent (Replit Agent, Cursor, Claude, etc.) to add LogicArt visualization to your app.

---

## The Prompt

```
Add LogicArt code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

2. FIRST, scan my project and LIST all .tsx/.ts/.js files in:
   - src/pages/
   - src/components/ 
   - src/features/
   Show me what you find before building the picker.

3. Create a ComponentPicker component with a dropdown. Each option should have:
   - A friendly display name (e.g., "Tour Page" not "TourPage.tsx")
   - The source file path (e.g., "/src/pages/TourPage.tsx")

4. Visualization handler - fetch SOURCE files, not bundled code:

async function visualizeComponent(filePath, displayName) {
  const response = await fetch(filePath);
  const code = await response.text();
  // Use LogiGo (the runtime API name)
  const api = window.LogiGo || window.LogicArt;
  if (api?.visualize) {
    api.visualize(code, displayName);
  }
}

// Populate from files found in step 2:
const components = [
  { name: 'Home Page', path: '/src/pages/Home.tsx' },
  { name: 'User Profile', path: '/src/pages/Profile.tsx' },
];

5. Add a "View Flowchart" button to an EXISTING navbar or header component.
   - Find your Header.tsx, Navbar.tsx, or shared nav component
   - Add the button there - do NOT create a floating button with position:fixed
   - Floating buttons get hidden behind full-screen backgrounds
   When user selects, call visualizeComponent(selected.path, selected.name).

6. CRITICAL - Fetch SOURCE files, NOT bundled code:
   - App MUST run via dev server (npm run dev), not production
   - Fetch: /src/pages/Home.tsx or /src/features/Component.tsx  
   - NOT: /assets/index-abc123.js or /.vite/deps/...
   - If response contains "__vite" or "jsxDEV", you got bundled code - wrong!
   - Create a backend API endpoint to read files from disk if needed

7. Test: Select a component → LogicArt should open showing its flowchart.

NOTE: LogicArt auto-extracts logic from React hooks (useCallback, useMemo, useEffect).
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
